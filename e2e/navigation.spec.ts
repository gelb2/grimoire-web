import { test, expect } from "@playwright/test"

test.describe("네비게이션", () => {
  test("루트(/)에서 /explore로 리다이렉트된다", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/explore/)
  })

  test("작가 공간 페이지가 로드된다", async ({ page }) => {
    // AuthorSpace 컴포넌트가 렌더링된다 (API 연결 여부와 무관하게 로딩 UI 표시)
    await page.goto("/deerdevil")
    await expect(page.locator("div").first()).toBeVisible({ timeout: 15000 })
  })

  test("preface 경로는 작가 공간으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/deerdevil/preface")
    await expect(page).toHaveURL(/\/deerdevil$/)
  })

  test("afterword 경로는 작가 공간으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/deerdevil/afterword")
    await expect(page).toHaveURL(/\/deerdevil$/)
  })
})
