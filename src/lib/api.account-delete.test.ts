// @vitest-environment jsdom
// F-2 회귀 — 본인 탈퇴는 server 실제 라우트 /authors/me(AuthorController @Delete('me'))로 보낸다.
// 구 /auth/me 는 존재하지 않아 404 → 탈퇴 플로우 death.

import { describe, it, expect, vi, afterEach } from "vitest"

describe("api.deleteMyAccount 라우트 (F-2)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("/authors/me 로 DELETE 한다 (구 /auth/me 아님)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ deleted: true, message: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("./api")
    await api.deleteMyAccount("탈퇴 사유")

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe("/api/authors/me")
    expect(url).not.toContain("/auth/me")
    expect(init.method).toBe("DELETE")
  })
})
