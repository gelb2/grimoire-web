import { test, expect } from "@playwright/test"

test.describe("랜딩 페이지 (/deerdevil)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/deerdevil")
  })

  test("페이지가 로드된다", async ({ page }) => {
    await expect(page).toHaveURL("/deerdevil")
    await expect(page.getByRole("heading", { name: "사슴악마" })).toBeVisible()
  })

  test("네비게이션 탭이 렌더된다", async ({ page }) => {
    await expect(page.getByRole("button", { name: "전체" })).toBeVisible()
    await expect(page.getByRole("button", { name: "일러두기" })).toBeVisible()
  })

  test("에피소드 카드가 표시된다", async ({ page }) => {
    await expect(page.getByText("EPISODE 01")).toBeVisible()
    await expect(page.getByText("선녀와 나무꾼: 숲속의 목격자")).toBeVisible()
  })

  test("ep11 카드가 표시된다", async ({ page }) => {
    await expect(page.getByText("이름 없는 괴물", { exact: true })).toBeVisible()
    await expect(page.getByText("The Nameless Monster")).toBeVisible()
  })

  test("ep12 카드가 표시된다", async ({ page }) => {
    await expect(page.getByText("베를린 천사의 시", { exact: true })).toBeVisible()
    await expect(page.getByText("The Poem of a Berlin Angel")).toBeVisible()
  })

  test("번외 에피소드 섹션이 표시된다", async ({ page }) => {
    await expect(page.getByText("브란덴부르크 문 앞에서")).toBeVisible()
  })

  test("일러두기/후기 카드가 표시된다", async ({ page }) => {
    await expect(page.getByText("Preface")).toBeVisible()
    await expect(page.getByText("Afterword")).toBeVisible()
  })
})
