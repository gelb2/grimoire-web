// @vitest-environment jsdom
// F-3 회귀 — 공유 링크 조회는 server 실제 라우트 /shared/:token
// (ContentController @Controller() @Get('shared/:token'))로 보낸다.
// 구 /episodes/shared/:token 는 존재하지 않아 404 → 공유 링크 열람 실패.

import { describe, it, expect, vi, afterEach } from "vitest"

describe("api.getSharedEpisode 라우트 (F-3)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("/shared/:token 로 GET 한다 (구 /episodes/shared 아님)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ title: "공유편" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.getSharedEpisode("tok-abc123")

    const [url] = mockFetch.mock.calls[0]
    expect(url).toBe("/api/shared/tok-abc123")
    expect(url).not.toContain("/episodes/shared")
  })
})
