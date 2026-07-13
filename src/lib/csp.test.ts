// FW-1 회귀 가드 — CSP connect-src 환경별 분기 + stale 도메인 제거.
// prod = api 만 / dev = dev-api / inhouse-* 전 환경 제거 를 단언한다 (재도입 시 즉시 RED).
import { describe, it, expect } from "vitest"
import { buildCsp, apiConnectSrc } from "./csp"

describe("CSP connect-src 환경 분기 (FW-1)", () => {
  it("prod: api.grimoire-book.com 만 허용 (dev-api·inhouse 없음)", () => {
    const csp = buildCsp("production")
    expect(csp).toContain("connect-src 'self' https://api.grimoire-book.com ")
    expect(csp).not.toContain("dev-api.grimoire-book.com")
    expect(csp).not.toContain("inhouse")
    expect(apiConnectSrc("production")).toBe("https://api.grimoire-book.com")
  })

  it("dev: dev-api.grimoire-book.com 만 허용 (inhouse 없음)", () => {
    const csp = buildCsp("development")
    expect(csp).toContain("https://dev-api.grimoire-book.com")
    expect(csp).not.toContain("inhouse")
    expect(apiConnectSrc("development")).toBe("https://dev-api.grimoire-book.com")
  })

  it("local: localhost:3000 origin", () => {
    expect(apiConnectSrc("local")).toBe("http://localhost:3000")
  })

  it("미지정: production 을 안전 기본값으로 사용 (stale 노출 없음)", () => {
    expect(apiConnectSrc(undefined)).toBe("https://api.grimoire-book.com")
    expect(buildCsp(undefined)).not.toContain("dev-api.grimoire-book.com")
  })

  it("inhouse-api 는 전 환경에서 제거", () => {
    for (const e of ["production", "development", "local", undefined]) {
      expect(buildCsp(e as string | undefined)).not.toContain("inhouse")
    }
  })

  it("CSP 골격(다른 지시어)은 불변 유지", () => {
    const csp = buildCsp("production")
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-src https://www.google.com https://accounts.google.com https://polar.sh")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
  })
})
