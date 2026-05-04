// @vitest-environment jsdom
//
// Sprint email-p0-3-slug-login Phase 2 (2026-05-04 EMAIL-P0-3 AC-6 정본).
//
// 검증 대상:
// 1. EMAIL_OR_SLUG_REGEX — `@` + `.` 둘 다 포함 시 email로 판별, 그 외는 slug로 판별
// 2. detectIdentifierType — 단일 입력 분기 함수 회귀
// 3. AuthProvider.login — emailOrSlug + password 입력 시 정규식 분기 + api.login에 `{ email }` 또는 `{ slug }` XOR 박제
//
// 거짓말 차단 정책 (Sprint progress §8-3):
// - toBeTruthy 단독 금지 — toEqual / toMatchObject / toHaveBeenCalledWith 의미 있는 assertion ≥3건 강제

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, act } from "@testing-library/react"
import { AuthProvider, useAuth, EMAIL_OR_SLUG_REGEX, detectIdentifierType } from "./AuthProvider"

// api 모듈 mock — login 시그니처 검증 + getProfile 무한 루프 회피
vi.mock("@/lib/api", () => ({
  api: {
    getProfile: vi.fn().mockRejectedValue(new Error("not logged in")),
    login: vi.fn().mockResolvedValue({
      user: {
        id: "a1",
        slug: "deerdevil",
        name: "사슴악마",
        email: "deerdevil@example.com",
        credits: 0,
      },
    }),
    googleLogin: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}))

import { api } from "@/lib/api"

describe("EMAIL_OR_SLUG_REGEX (Sprint email-p0-3 Phase 2 §2 정본)", () => {
  it("이메일 형식 (@ + .) 입력 시 true", () => {
    expect(EMAIL_OR_SLUG_REGEX.test("user@example.com")).toBe(true)
    expect(EMAIL_OR_SLUG_REGEX.test("deerdevil@grimoire.app")).toBe(true)
    expect(EMAIL_OR_SLUG_REGEX.test("a@b.c")).toBe(true)
  })

  it("슬러그 형식 (@ 또는 . 누락) 입력 시 false", () => {
    expect(EMAIL_OR_SLUG_REGEX.test("deerdevil")).toBe(false)
    expect(EMAIL_OR_SLUG_REGEX.test("lee-gwangsu")).toBe(false)
    expect(EMAIL_OR_SLUG_REGEX.test("user@nodomain")).toBe(false) // . 누락
    expect(EMAIL_OR_SLUG_REGEX.test("nodomaincom")).toBe(false) // @ 누락
  })

  it("공백 포함 입력 시 false (trim 책임은 호출처)", () => {
    expect(EMAIL_OR_SLUG_REGEX.test(" user@example.com")).toBe(false)
    expect(EMAIL_OR_SLUG_REGEX.test("user @example.com")).toBe(false)
    expect(EMAIL_OR_SLUG_REGEX.test("dee rdevil")).toBe(false)
  })
})

describe("detectIdentifierType (단일 분기 헬퍼)", () => {
  it("이메일 형식 입력 시 'email' 반환", () => {
    expect(detectIdentifierType("user@example.com")).toBe("email")
    expect(detectIdentifierType("deerdevil@grimoire.app")).toBe("email")
  })

  it("슬러그 형식 입력 시 'slug' 반환", () => {
    expect(detectIdentifierType("deerdevil")).toBe("slug")
    expect(detectIdentifierType("lee-gwangsu")).toBe("slug")
  })
})

describe("AuthProvider.login (자동 판별 분기 — Sprint email-p0-3 Phase 2 AC-6)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.login as any).mockResolvedValue({
      user: {
        id: "a1",
        slug: "deerdevil",
        name: "사슴악마",
        email: "deerdevil@example.com",
        credits: 0,
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // 테스트용 캡처 — useAuth 훅 인스턴스를 매 렌더마다 push (최신값을 마지막 인덱스에서 꺼냄)
  function renderAuth() {
    const snapshots: ReturnType<typeof useAuth>[] = []
    function Capture() {
      snapshots.push(useAuth())
      return null
    }
    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>,
    )
    return () => snapshots[snapshots.length - 1]!
  }

  it("이메일 형식 입력 시 api.login에 { email } 박제 (slug 미박제)", async () => {
    const getAuth = renderAuth()
    await act(async () => {
      await getAuth().login("user@example.com", "secret123", "rcap-token")
    })
    expect(api.login).toHaveBeenCalledTimes(1)
    expect(api.login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
      recaptchaToken: "rcap-token",
    })
    // slug 키가 페이로드에 포함되지 않음을 명시
    const payload = (api.login as any).mock.calls[0][0]
    expect(payload).not.toHaveProperty("slug")
  })

  it("슬러그 형식 입력 시 api.login에 { slug } 박제 (email 미박제)", async () => {
    const getAuth = renderAuth()
    await act(async () => {
      await getAuth().login("deerdevil", "secret123", "rcap-token")
    })
    expect(api.login).toHaveBeenCalledTimes(1)
    expect(api.login).toHaveBeenCalledWith({
      slug: "deerdevil",
      password: "secret123",
      recaptchaToken: "rcap-token",
    })
    const payload = (api.login as any).mock.calls[0][0]
    expect(payload).not.toHaveProperty("email")
  })

  it("좌우 공백 포함 슬러그 입력 시 trim 후 slug로 박제", async () => {
    const getAuth = renderAuth()
    await act(async () => {
      await getAuth().login("  deerdevil  ", "secret123")
    })
    expect(api.login).toHaveBeenCalledWith({
      slug: "deerdevil",
      password: "secret123",
      recaptchaToken: undefined,
    })
  })

  it("좌우 공백 포함 이메일 입력 시 trim 후 email로 박제", async () => {
    const getAuth = renderAuth()
    await act(async () => {
      await getAuth().login("  user@example.com  ", "secret123")
    })
    expect(api.login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
      recaptchaToken: undefined,
    })
  })

  it("recaptchaToken 미박제 시 undefined로 전달", async () => {
    const getAuth = renderAuth()
    await act(async () => {
      await getAuth().login("deerdevil", "secret123")
    })
    expect(api.login).toHaveBeenCalledWith({
      slug: "deerdevil",
      password: "secret123",
      recaptchaToken: undefined,
    })
  })

  it("로그인 성공 시 user 상태 갱신 (toMatchObject 의미 있는 검증)", async () => {
    const getAuth = renderAuth()
    // 1단계: 마운트 useEffect의 getProfile 비동기 reject가 완료되어 loading=false 진입까지 대기
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    // 2단계: 로그인 호출 — login 성공 후 user 상태 갱신 검증
    await act(async () => {
      await getAuth().login("deerdevil", "secret123")
    })
    expect(getAuth().user).toMatchObject({
      id: "a1",
      slug: "deerdevil",
      email: "deerdevil@example.com",
    })
  })
})
