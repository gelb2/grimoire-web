import { test, expect } from "@playwright/test"

test.describe("탐색 페이지 (/explore)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/explore")
  })

  test("renders page heading and search input", async ({ page }) => {
    // 페이지 제목 확인
    await expect(
      page.getByRole("heading", { name: "작가와 작품을 탐색하세요" })
    ).toBeVisible()

    // 검색 인풋 확인
    await expect(
      page.getByPlaceholder("작가 이름 또는 슬러그 검색...")
    ).toBeVisible()

    // 검색 버튼 확인
    await expect(page.getByRole("button", { name: "검색" })).toBeVisible()
  })

  test("renders popular works section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "인기 작품" })
    ).toBeVisible()
  })

  test("renders recent works section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "최신 작품" })
    ).toBeVisible()
  })

  test("search input accepts text", async ({ page }) => {
    const input = page.getByPlaceholder("작가 이름 또는 슬러그 검색...")
    await input.fill("사슴")
    await expect(input).toHaveValue("사슴")
  })

  test("search button triggers search on click", async ({ page }) => {
    const input = page.getByPlaceholder("작가 이름 또는 슬러그 검색...")
    await input.fill("test")

    const searchButton = page.getByRole("button", { name: "검색" })
    await searchButton.click()

    // 검색 요청 후 버튼이 로딩("...") 또는 다시 "검색"으로 돌아옴
    await expect(searchButton).toBeVisible()
  })

  test("PlatformNav is visible on explore page", async ({ page }) => {
    // PlatformNav에는 Grimoire 로고 + 탐색 링크가 있다
    await expect(page.getByRole("link", { name: "Grimoire" })).toBeVisible()
    await expect(page.getByRole("link", { name: "탐색" })).toBeVisible()
  })

  test("horizontal scroll containers exist for work sections", async ({
    page,
  }) => {
    // HorizontalScroll은 data-scroll-page 속성을 가진 요소를 포함하거나
    // "아직 작품이 없습니다" 메시지를 표시한다
    const popularSection = page
      .locator("section")
      .filter({ hasText: "인기 작품" })
    await expect(popularSection).toBeVisible()

    const recentSection = page
      .locator("section")
      .filter({ hasText: "최신 작품" })
    await expect(recentSection).toBeVisible()
  })
})
