// @vitest-environment jsdom
// api.ts의 analyzeEpisode 엣지 케이스 테스트 (Q1=(a) 모드, 2026-04-24).
// 회차 ID + types만 보내는 신규 시그니처. AbortError/TimeoutError 사용자 친화 메시지 변환 + 120초 타임아웃.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("api.analyzeEpisode (Q1=(a) 에피소드 ID 모드)", () => {
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
      api.analyzeEpisode("ep-1", ["consistency"]),
    ).rejects.toThrow(/2분|자동 환불/)
  })

  it("TimeoutError도 AbortError와 동일한 친화 메시지로 변환한다", async () => {
    const timeoutErr = new Error("TimeoutError: signal timed out")
    timeoutErr.name = "TimeoutError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr))

    const { api } = await import("./api")
    await expect(
      api.analyzeEpisode("ep-1", ["consistency"]),
    ).rejects.toThrow(/2분/)
  })

  it("일반 Error는 그대로 전파된다 (친화 메시지 치환 금지)", async () => {
    const normalErr = new Error("분석 실패 — 인덱싱이 완료되지 않았습니다")
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(normalErr))

    const { api } = await import("./api")
    await expect(
      api.analyzeEpisode("ep-1", ["consistency"]),
    ).rejects.toThrow("분석 실패 — 인덱싱이 완료되지 않았습니다")
  })

  it("body에 episodeId + types만 포함된다 (workId/newEpisodeText는 보내지 않음)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.analyzeEpisode("episode-42", ["consistency", "tone"])

    expect(mockFetch).toHaveBeenCalled()
    const [, init] = mockFetch.mock.calls[0]
    const parsed = JSON.parse(init.body)
    expect(parsed.episodeId).toBe("episode-42")
    expect(parsed.types).toEqual(["consistency", "tone"])
    expect(parsed).not.toHaveProperty("workId")
    expect(parsed).not.toHaveProperty("newEpisodeText")
  })

  it("types 미지정 시 body에서 types 키가 자연스럽게 제외된다 (서버 기본값 위임)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.analyzeEpisode("ep-1")

    const [, init] = mockFetch.mock.calls[0]
    const parsed = JSON.parse(init.body)
    expect(parsed.episodeId).toBe("ep-1")
    expect(parsed).not.toHaveProperty("types")
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
    await api.analyzeEpisode("ep-1", ["consistency"])

    const [, init] = mockFetch.mock.calls[0]
    expect(init.signal).toBeDefined()
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
