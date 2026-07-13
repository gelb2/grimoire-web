// @vitest-environment node
// F-6 회귀 — BFF 프록시는 non-GET 바디를 arrayBuffer로 원본 바이트 무손실 중계한다.
// 구버전 request.text()는 UTF-8 lossy 디코딩으로 커버 이미지·DOCX 바이트를 손상시켰다.

import { describe, it, expect, vi, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"

function makeCtx(path: string[]) {
  return { params: Promise.resolve({ path }) }
}

describe("BFF 프록시 body 중계 (F-6)", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("바이너리(0x89 PNG 헤더 포함) 바디를 바이트 손실 없이 중계한다", async () => {
    // 0x89/0xff/0xc0/0x80/0xfe 는 단독으로 유효하지 않은 UTF-8 → text() 라면 손상되는 바이트들
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0xd8, 0xc0, 0x80, 0xfe, 0x7f, 0x00, 0x42,
    ])
    let captured: ArrayBuffer | undefined
    const mockFetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      captured = init.body as ArrayBuffer
      return Promise.resolve(
        new Response('{"coverImage":"x"}', { status: 200, headers: { "Content-Type": "application/json" } }),
      )
    })
    vi.stubGlobal("fetch", mockFetch)

    const req = new NextRequest("http://localhost:3001/api/works/w1/cover", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=----X" },
      body: pngBytes,
    })
    const res = await POST(req, makeCtx(["works", "w1", "cover"]))
    expect(res.status).toBe(200)

    expect(captured).toBeDefined()
    const out = new Uint8Array(captured as ArrayBuffer)
    expect(Array.from(out)).toEqual(Array.from(pngBytes))
  })

  it("JSON 바디는 회귀 없이 그대로 중계된다 (Content-Type 보존)", async () => {
    const json = JSON.stringify({ title: "가나다", n: 42 })
    let captured: ArrayBuffer | undefined
    let capturedCT: string | undefined
    const mockFetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      captured = init.body as ArrayBuffer
      capturedCT = (init.headers as Record<string, string>)["Content-Type"]
      return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }))
    })
    vi.stubGlobal("fetch", mockFetch)

    const req = new NextRequest("http://localhost:3001/api/works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    })
    await POST(req, makeCtx(["works"]))

    expect(capturedCT).toBe("application/json")
    const decoded = new TextDecoder().decode(captured as ArrayBuffer)
    expect(decoded).toBe(json)
    expect(JSON.parse(decoded)).toEqual({ title: "가나다", n: 42 })
  })
})
