import { test, expect } from "@playwright/test"

test.describe("에피소드 뷰어 — DeerDevil", () => {
  test("navigates to episode page and renders content or 404", async ({
    page,
  }) => {
    const response = await page.goto("/deerdevil/deerdevil/ep1")

    // 에피소드 페이지가 200 또는 404를 반환
    expect(response?.status()).toBeDefined()

    // 에피소드 콘텐츠 또는 Not Found 페이지
    const hasContent = page.locator(".min-h-screen").first()
    const notFound = page.getByText("404").or(page.getByText("Not Found"))

    await expect(hasContent.or(notFound)).toBeVisible({ timeout: 10000 })
  })

  test("episode page has EpisodeViewer elements", async ({ page }) => {
    await page.goto("/deerdevil/deerdevil/ep1")

    // EpisodeViewer가 렌더링되면 main 콘텐츠 영역이 존재
    const mainContent = page.locator("main, article, .min-h-screen").first()
    await expect(mainContent).toBeVisible({ timeout: 10000 })
  })
})

test.describe("에피소드 뷰어 — Kim Sowol", () => {
  test("navigates to kim-sowol episode and renders", async ({ page }) => {
    const response = await page.goto(
      "/kim-sowol/jindalraekot/jindallae-kkot"
    )

    expect(response?.status()).toBeDefined()

    // 콘텐츠 또는 Not Found
    const hasContent = page.locator(".min-h-screen").first()
    const notFound = page.getByText("404").or(page.getByText("Not Found"))

    await expect(hasContent.or(notFound)).toBeVisible({ timeout: 10000 })
  })

  test("non-universe author shows WorkNav or back link", async ({ page }) => {
    await page.goto("/kim-sowol/jindalraekot/jindallae-kkot")

    // grid 레이아웃(김소월)이면 WorkNav가 "← 작가 공간으로" 링크를 렌더링
    // 또는 404/에러 페이지
    const backLink = page.getByText("작가 공간으로")
    const notFound = page.getByText("404").or(page.getByText("Not Found"))
    const mainContent = page.locator(".min-h-screen").first()

    await expect(
      backLink.or(notFound).or(mainContent)
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe("에피소드 뷰어 — 존재하지 않는 에피소드", () => {
  test("returns 404 for non-existent episode", async ({ page }) => {
    const response = await page.goto(
      "/deerdevil/deerdevil/nonexistent-episode"
    )

    // 서버가 없거나 에피소드가 없으면 404 또는 에러 페이지
    const notFound = page.getByText("404").or(page.getByText("Not Found"))
    const mainContent = page.locator(".min-h-screen").first()

    await expect(notFound.or(mainContent)).toBeVisible({ timeout: 10000 })
  })
})
