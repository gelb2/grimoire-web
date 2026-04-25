import { test, expect } from "@playwright/test"

test.describe("관리자 로그인 페이지 (/admin/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login")
  })

  test("다크 테마 로그인 폼이 렌더링된다", async ({ page }) => {
    await expect(page.getByText("ADMIN PANEL")).toBeVisible()
    await expect(page.getByText("Grimoire")).toBeVisible()
    await expect(page.getByPlaceholder("관리자 이메일")).toBeVisible()
    await expect(page.getByPlaceholder("비밀번호")).toBeVisible()
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible()
  })

  test("잘못된 비밀번호로 로그인 시 에러가 표시된다", async ({ page, browserName }) => {
    test.skip(!process.env.API_URL, "API 서버 필요 — 로컬 API 미실행 시 스킵")
    await page.getByPlaceholder("관리자 이메일").fill("admin@test.com")
    await page.getByPlaceholder("비밀번호").fill("wrongpassword")
    await page.getByRole("button", { name: "로그인" }).click()

    // 에러 메시지 확인 (API 연결/미연결 모두 커버)
    const errorLocator = page.locator("[class*='border-red'], [class*='text-red']")
    await expect(errorLocator.first()).toBeVisible({ timeout: 5000 })
  })

  test("reCAPTCHA가 없다 (관리자 전용)", async ({ page }) => {
    // reCAPTCHA 배지가 없어야 함
    await expect(page.locator(".grecaptcha-badge")).not.toBeVisible()
  })
})

test.describe("관리자 패널 (/admin)", () => {
  test("인증 없이 접근 시 로그인 페이지로 리다이렉트된다", async ({ page }) => {
    await page.goto("/admin")
    // 인증 실패 → /admin/login으로 이동
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 })
  })

  test("관리자 페이지는 작가 AuthProvider를 사용하지 않는다", async ({ page }) => {
    // /admin에 접근해도 AuthProvider 에러가 발생하면 안 됨
    await page.goto("/admin")
    // "useAuth는 AuthProvider 내부에서" 에러가 콘솔에 없어야 함
    const consoleErrors: string[] = []
    page.on("console", msg => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })
    await page.waitForTimeout(2000)
    const authProviderError = consoleErrors.some(e => e.includes("AuthProvider"))
    expect(authProviderError).toBe(false)
  })
})

test.describe("관리자 패널 — 탭 구조", () => {
  // 이 테스트는 실제 로그인이 필요하므로 API 서버가 실행 중이어야 함
  // 로컬 환경에서 실행 시 관리자 계정이 DB에 있어야 함
  test.skip(({ browserName }) => true, "로컬 DB + 관리자 계정 필요 — CI에서 스킵")

  test("10개 탭이 모두 표시된다", async ({ page }) => {
    // 로그인
    await page.goto("/admin/login")
    await page.getByPlaceholder("관리자 이메일").fill("admin@grimoire-book.com")
    await page.getByPlaceholder("비밀번호").fill(process.env.E2E_ADMIN_PASSWORD ?? (() => { throw new Error('E2E_ADMIN_PASSWORD env 필수') })())
    await page.getByRole("button", { name: "로그인" }).click()
    await page.waitForURL("/admin", { timeout: 10000 })

    // 10개 탭 확인
    const tabs = ["통계", "사용자", "콘텐츠", "제재", "신고", "댓글", "결제", "접근 로그", "설정", "감사 로그"]
    for (const tab of tabs) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible()
    }
  })
})
