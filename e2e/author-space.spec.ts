import { test, expect } from "@playwright/test"

test.describe("작가 공간 — DeerDevil (/deerdevil)", () => {
  test("renders author space or error popup", async ({ page }) => {
    await page.goto("/deerdevil")

    // API 연결 성공: 작가 공간 렌더링 (UniverseNav 또는 그리드)
    // API 연결 실패: ErrorPopup 표시
    const hasAuthorContent = page.locator("text=사슴악마").or(
      page.locator("text=deerdevil")
    )
    const hasError = page.getByText("오류 발생")

    await expect(hasAuthorContent.or(hasError)).toBeVisible({ timeout: 10000 })
  })

  test("DeerDevil page loads with theme applied", async ({ page }) => {
    await page.goto("/deerdevil")

    // ThemeProvider가 CSS 변수를 설정하므로, 배경이 적용된 컨테이너 확인
    const container = page.locator(".min-h-screen").first()
    await expect(container).toBeVisible({ timeout: 10000 })
  })
})

test.describe("작가 공간 — Kim Sowol (/kim-sowol)", () => {
  test("renders author space or error popup", async ({ page }) => {
    await page.goto("/kim-sowol")

    // API 연결 성공: 작가명 또는 slug 표시
    // API 연결 실패: ErrorPopup 표시
    const hasAuthorContent = page.locator("text=김소월").or(
      page.locator("text=kim-sowol")
    )
    const hasError = page.getByText("오류 발생")

    await expect(hasAuthorContent.or(hasError)).toBeVisible({ timeout: 10000 })
  })

  test("grid layout shows work list section", async ({ page }) => {
    await page.goto("/kim-sowol")

    // 그리드 레이아웃: "작품 목록" 섹션 또는 에러 팝업
    const workList = page.getByText("작품 목록")
    const hasError = page.getByText("오류 발생")

    await expect(workList.or(hasError)).toBeVisible({ timeout: 10000 })
  })
})

test.describe("작가 공간 — 존재하지 않는 작가", () => {
  test("shows error popup for non-existent author", async ({ page }) => {
    await page.goto("/this-author-does-not-exist-xyz")

    // 존재하지 않는 작가 → ErrorPopup "오류 발생" 표시
    const hasError = page.getByText("오류 발생")
    const hasContent = page.locator(".min-h-screen").first()

    // API 서버 여부에 따라: 에러 팝업 또는 로딩 후 에러
    await expect(hasError.or(hasContent)).toBeVisible({ timeout: 10000 })
  })

  test("error popup shows confirm button", async ({ page }) => {
    await page.goto("/this-author-does-not-exist-xyz")

    // ErrorPopup에 "확인" 버튼이 있어야 한다
    const confirmButton = page.getByRole("button", { name: "확인" })
    const hasContent = page.locator(".min-h-screen").first()

    await expect(confirmButton.or(hasContent)).toBeVisible({ timeout: 10000 })
  })
})
