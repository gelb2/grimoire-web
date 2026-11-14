/**
 * @vitest-environment node
 *
 * Sprint: sprint-baked-css-url-absolute (P1-#7)
 * 계약: reports/sprint-baked-css-url-absolute-progress.md AC-5 + AC-2
 *
 * resolveBakedCssUrl 정책 검증:
 * - server는 절대 URL 또는 null로 응답 보장 (방향 B — server 응답 단계 절대화)
 * - 본 helper는 응답 값이 spec과 다를 경우(레거시/회귀 등)의 방어선
 */
import { describe, it, expect } from "vitest"
import { resolveBakedCssUrl } from "./baked-css-url"

describe("resolveBakedCssUrl — bakedCssUrl 응답 정규화", () => {
  it.each(['http://localhost:33000', 'https://api.example.test'])("자체 API CSS %s는 BFF로 중계한다", (origin) => {
    expect(resolveBakedCssUrl(`${origin}/api/themes/css/local-writer`, 'local-writer'))
      .toBe('/api/themes/css/local-writer')
  })

  it("GCS CDN URL은 자체 API로 바꾸지 않는다", () => {
    const url = 'https://storage.googleapis.com/user-bucket/themes/local-writer.css'
    expect(resolveBakedCssUrl(url, 'local-writer')).toBe(url)
  })

  it("다른 작가 경로를 현재 작가 BFF로 바꾸지 않는다", () => {
    const url = 'https://api.example.test/api/themes/css/other-writer'
    expect(resolveBakedCssUrl(url, 'local-writer')).toBe(url)
  })

  it("절대 URL(https) 입력 → 그대로 반환", () => {
    const url = "https://cdn.grimoire-book.com/themes/deerdevil.css"
    expect(resolveBakedCssUrl(url)).toBe(url)
  })

  it("절대 URL(http) 입력 → 그대로 반환 (localhost 환경)", () => {
    const url = "http://localhost:3000/api/themes/css/deerdevil"
    expect(resolveBakedCssUrl(url)).toBe(url)
  })

  it("null 입력 → null 반환 (link 미렌더 대상)", () => {
    expect(resolveBakedCssUrl(null)).toBeNull()
  })

  it("undefined 입력 → null 반환", () => {
    expect(resolveBakedCssUrl(undefined)).toBeNull()
  })

  it("빈 문자열 입력 → null 반환", () => {
    expect(resolveBakedCssUrl("")).toBeNull()
  })

  it("비문자열(number) 입력 → null 반환 (방어선)", () => {
    expect(resolveBakedCssUrl(123)).toBeNull()
  })

  it("비문자열(object) 입력 → null 반환 (방어선)", () => {
    expect(resolveBakedCssUrl({ url: "https://x" })).toBeNull()
  })

  it("dev 환경 절대 URL → 그대로 반환", () => {
    const url = "https://dev-api.grimoire-book.com/api/themes/css/deerdevil"
    expect(resolveBakedCssUrl(url)).toBe(url)
  })
})
