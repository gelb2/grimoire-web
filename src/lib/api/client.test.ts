// @vitest-environment jsdom
// F-7 회귀 — 401 자동 리프레시 제외를 리프레시 무한루프/비인증 경로로만 축소한다.
// 구버전은 path.startsWith('/auth/') 전체를 제외 → /auth/profile 도 refresh 불가 →
// access(15분) 만료 후 리로드 시 강제 로그아웃.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("BaseApiClient 401 자동 리프레시 (F-7)", () => {
  beforeEach(() => {
    vi.resetModules()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("/auth/profile 401 → refresh 성공 → 재시도 흐름을 탄다", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 })) // profile #1
      .mockResolvedValueOnce(new Response("", { status: 200 })) // refresh #2
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "a1", slug: "deerdevil" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ) // profile 재시도 #3
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("../api")
    await expect(api.getProfile()).resolves.toEqual({ id: "a1", slug: "deerdevil" })

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch.mock.calls[0][0]).toBe("/api/auth/profile")
    expect(mockFetch.mock.calls[1][0]).toBe("/api/auth/refresh")
    expect(mockFetch.mock.calls[2][0]).toBe("/api/auth/profile")
  })

  it("refresh 실패 시 재시도하지 않고 401 을 전파한다", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 })) // profile
      .mockResolvedValueOnce(new Response("", { status: 401 })) // refresh 실패
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("../api")
    await expect(api.getProfile()).rejects.toThrow(/401/)
    expect(mockFetch).toHaveBeenCalledTimes(2) // profile + refresh (재시도 없음)
  })

  it("/auth/login 401 은 리프레시를 트리거하지 않는다 (제외 경로)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("bad creds", { status: 401 }))
    vi.stubGlobal("fetch", mockFetch)

    const { api } = await import("../api")
    await expect(api.login({ email: "x@y.com", password: "p" })).rejects.toThrow(/401/)
    expect(mockFetch).toHaveBeenCalledTimes(1) // refresh 시도 없음
    expect(mockFetch.mock.calls[0][0]).toBe("/api/auth/login")
  })
})
