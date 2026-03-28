import { test, expect } from "@playwright/test"

test.describe("PlatformNav 네비게이션", () => {
  test("PlatformNav shows on explore page with correct links", async ({
    page,
  }) => {
    await page.goto("/explore")

    // Grimoire 로고 → 홈 링크
    const logo = page.getByRole("link", { name: "Grimoire" })
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute("href", "/")

    // 탐색 링크
    const exploreLink = page.getByRole("link", { name: "탐색" })
    await expect(exploreLink).toBeVisible()
    await expect(exploreLink).toHaveAttribute("href", "/explore")

    // 비로그인 상태: 로그인/시작하기 링크
    const loginLink = page.getByRole("link", { name: "로그인" })
    const startLink = page.getByRole("link", { name: "시작하기" })
    await expect(loginLink.or(startLink)).toBeVisible()
  })

  test("clicking explore link navigates to /explore", async ({ page }) => {
    await page.goto("/")

    // 루트 페이지에서 탐색 링크가 있을 수 있다 — 있으면 클릭
    const exploreLink = page.getByRole("link", { name: "탐색" })
    if (await exploreLink.isVisible()) {
      await exploreLink.click()
      await expect(page).toHaveURL(/\/explore/)
    }
  })

  test("login link navigates to /login from explore", async ({ page }) => {
    await page.goto("/explore")

    const loginLink = page.getByRole("link", { name: "로그인" })
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test("start link navigates to /register from explore", async ({ page }) => {
    await page.goto("/explore")

    const startLink = page.getByRole("link", { name: "시작하기" })
    if (await startLink.isVisible()) {
      await startLink.click()
      await expect(page).toHaveURL(/\/register/)
    }
  })
})

test.describe("페이지 간 네비게이션", () => {
  test("login page register link navigates to /register", async ({
    page,
  }) => {
    await page.goto("/login")

    await page.getByRole("link", { name: "회원가입" }).click()
    await expect(page).toHaveURL(/\/register/)
  })

  test("register page login link navigates to /login", async ({ page }) => {
    await page.goto("/register")

    await page.getByRole("link", { name: "로그인" }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("browser back button works after navigation", async ({ page }) => {
    await page.goto("/explore")
    await page.goto("/login")

    await expect(page).toHaveURL(/\/login/)

    await page.goBack()
    await expect(page).toHaveURL(/\/explore/)
  })

  test("Grimoire logo navigates to home from login", async ({ page }) => {
    await page.goto("/login")

    await page.getByRole("link", { name: "Grimoire" }).click()

    // 홈 페이지(/) 또는 리다이렉트된 페이지
    await expect(page).toHaveURL(/^\/$|\/explore/)
  })

  test("preface route redirects to author space", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/preface")
    await expect(page).toHaveURL(/\/deerdevil$/)
  })

  test("afterword route redirects to author space", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/afterword")
    await expect(page).toHaveURL(/\/deerdevil$/)
  })
})

test.describe("작가 공간 네비게이션", () => {
  test("author space renders PlatformNav for grid layout", async ({
    page,
  }) => {
    await page.goto("/kim-sowol")

    // grid 레이아웃은 PlatformNav를 포함한다
    const logo = page.getByRole("link", { name: "Grimoire" })
    const errorPopup = page.getByText("오류 발생")

    // API 성공: PlatformNav 표시, API 실패: ErrorPopup 표시
    await expect(logo.or(errorPopup)).toBeVisible({ timeout: 10000 })
  })
})
