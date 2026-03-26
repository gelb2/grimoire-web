import { test, expect } from "@playwright/test"

test.describe("네비게이션", () => {
  test("루트(/)에서 /universe로 리다이렉트된다", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/universe/)
  })

  test("일러두기 페이지가 로드된다", async ({ page }) => {
    await page.goto("/universe/preface")
    await expect(page.locator("p").first()).toBeVisible({ timeout: 15000 })
  })

  test("후기 페이지가 로드된다", async ({ page }) => {
    await page.goto("/universe/afterword")
    await expect(page).toHaveURL("/universe/afterword")
  })

  test("랜딩에서 일러두기 탭 클릭 시 이동한다", async ({ page }) => {
    await page.goto("/universe")
    await page.getByRole("button", { name: "일러두기" }).click()
    await expect(page).toHaveURL("/universe/preface", { timeout: 10000 })
  })
})
