import { test, expect } from "@playwright/test"

test.describe("대시보드 흐름 (로그인 → 대시보드 → 작품 관리)", () => {
  test("비로그인 시 대시보드 접근하면 로그인 페이지로 이동한다", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test("로그인 후 대시보드에 환영 메시지가 표시된다", async ({ page }) => {
    // 로그인
    await page.goto("/login")
    await page.fill('input[type="email"]', "deerdevil@grimoire.app")
    await page.fill('input[type="password"]', process.env.E2E_AUTHOR_PASSWORD ?? (() => { throw new Error('E2E_AUTHOR_PASSWORD env 필수') })())
    await page.click('button[type="submit"]')

    // 대시보드로 리다이렉트
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
    await expect(page.getByText("환영합니다")).toBeVisible({ timeout: 5000 })
  })

  test("대시보드에서 내 작품 목록이 표시된다", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "deerdevil@grimoire.app")
    await page.fill('input[type="password"]', process.env.E2E_AUTHOR_PASSWORD ?? (() => { throw new Error('E2E_AUTHOR_PASSWORD env 필수') })())
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

    // 내 작품 섹션
    await expect(page.getByText("내 작품")).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("사슴악마")).toBeVisible({ timeout: 5000 })
  })

  test("대시보드에서 빠른 액션 링크가 작동한다", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "deerdevil@grimoire.app")
    await page.fill('input[type="password"]', process.env.E2E_AUTHOR_PASSWORD ?? (() => { throw new Error('E2E_AUTHOR_PASSWORD env 필수') })())
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

    // 테마 설정 링크 클릭
    await page.getByText("테마 설정").click()
    await expect(page).toHaveURL(/\/dashboard\/theme/, { timeout: 5000 })
  })

  test("크레딧 충전 페이지가 정상 로드된다", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]', "deerdevil@grimoire.app")
    await page.fill('input[type="password"]', process.env.E2E_AUTHOR_PASSWORD ?? (() => { throw new Error('E2E_AUTHOR_PASSWORD env 필수') })())
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })

    await page.goto("/dashboard/credits")
    await expect(page.getByText("크레딧 패키지")).toBeVisible({ timeout: 5000 })
  })
})
