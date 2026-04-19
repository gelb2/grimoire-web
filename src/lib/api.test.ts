// @vitest-environment jsdom
// api.ts의 analyzeEpisode 엣지 케이스 테스트.
// AbortError/TimeoutError 사용자 친화 메시지 변환 + episodeId undefined 직렬화 + 타임아웃 설정.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("api.analyzeEpisode", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("AbortError를 '시간 초과 + 크레딧 자동 환불' 메시지로 변환한다", async () => {
    const abortErr = new Error("The operation was aborted.")
    abortErr.name = "AbortError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr))

    const { api } = await import("./api")
    await expect(
      api.analyzeEpisode("work-1", "a".repeat(50), ["consistency"]),
    ).rejects.toThrow(/2분|자동 환불/)
  })

  it("TimeoutError도 AbortError와 동일한 친화 메시지로 변환한다", async () => {
    const timeoutErr = new Error("TimeoutError: signal timed out")
    timeoutErr.name = "TimeoutError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr))

    const { api } = await import("./api")
    await expect(
      api.analyzeEpisode("work-1", "a".repeat(50), ["consistency"]),
    ).rejects.toThrow(/2분/)
  })

  it("일반 Error는 그대로 전파된다 (친화 메시지 치환 금지)", async () => {
    const normalErr = new Error("분석 실패 — 인덱싱이 완료되지 않았습니다")
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(normalErr))

    const { api } = await import("./api")
    await expect(
      api.analyzeEpisode("work-1", "a".repeat(50), ["consistency"]),
    ).rejects.toThrow("분석 실패 — 인덱싱이 완료되지 않았습니다")
  })

  it("episodeId 미지정 시 body에서 episodeId 키가 자연스럽게 제외된다", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.analyzeEpisode("work-1", "a".repeat(50), ["consistency"])

    expect(mockFetch).toHaveBeenCalled()
    const [, init] = mockFetch.mock.calls[0]
    const parsed = JSON.parse(init.body)
    expect(parsed).toMatchObject({ workId: "work-1", types: ["consistency"] })
    expect(parsed).not.toHaveProperty("episodeId")
  })

  it("episodeId 지정 시 body에 포함된다 (재분석 경로 — self-reference RAG 제외용)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.analyzeEpisode(
      "work-1",
      "a".repeat(50),
      ["consistency", "tone"],
      "episode-42",
    )

    const [, init] = mockFetch.mock.calls[0]
    const parsed = JSON.parse(init.body)
    expect(parsed.episodeId).toBe("episode-42")
    expect(parsed.types).toEqual(["consistency", "tone"])
  })

  it("AbortSignal이 설정되어 있어 120초 타임아웃이 동작한다", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.analyzeEpisode("work-1", "a".repeat(50), ["consistency"])

    const [, init] = mockFetch.mock.calls[0]
    expect(init.signal).toBeDefined()
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
