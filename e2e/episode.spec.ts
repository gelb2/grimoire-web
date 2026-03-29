import { test, expect } from "@playwright/test"

test.describe("에피소드 뷰어 (/deerdevil/[slug])", () => {
  test("ep1 페이지가 로드되고 제목이 표시된다", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/ep1")
    await expect(page.getByText("EPISODE 01")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("선녀와 나무꾼")).toBeVisible({ timeout: 15000 })
  })

  test("ep11 페이지가 로드되고 제목이 표시된다", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/ep11")
    await expect(page.getByText("EPISODE 11")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("이름 없는 괴물")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("The Nameless Monster")).toBeVisible({ timeout: 15000 })
  })

  test("ep12 페이지가 로드되고 제목이 표시된다", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/ep12")
    await expect(page.getByText("EPISODE 12")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("베를린 천사의 시")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("The Poem of a Berlin Angel")).toBeVisible({ timeout: 15000 })
  })

  test("본문이 렌더된다 (타이핑 애니메이션 완료 대기)", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/ep1")
    // 첫 문단이 타이핑되어 나타날 때까지 대기
    await expect(page.locator("p").first()).toBeVisible({ timeout: 30000 })
  })

  test("존재하지 않는 slug는 404를 반환한다", async ({ page }) => {
    const response = await page.goto("/deerdevil/deerdevil/nonexistent-episode")
    expect(response?.status()).toBe(404)
  })

  test("네비게이션 탭에서 다른 에피소드로 이동할 수 있다", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/ep1")
    await page.getByText("02").click()
    await expect(page).toHaveURL("/deerdevil/deerdevil/ep2", { timeout: 10000 })
  })
})
