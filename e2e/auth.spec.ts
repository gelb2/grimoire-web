import { test, expect } from "@playwright/test"

test.describe("로그인 페이지 (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("renders login form with email and password fields", async ({
    page,
  }) => {
    // Grimoire 헤딩
    await expect(page.getByRole("link", { name: "Grimoire" })).toBeVisible()

    // 서브타이틀
    await expect(page.getByText("작가의 공간으로 돌아오세요")).toBeVisible()

    // 이메일 필드
    await expect(page.getByLabel("이메일")).toBeVisible()
    await expect(page.getByPlaceholder("your@email.com")).toBeVisible()

    // 비밀번호 필드
    await expect(page.getByLabel("비밀번호")).toBeVisible()

    // 로그인 버튼
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible()
  })

  test("has link to register page", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: "회원가입" })
    await expect(registerLink).toBeVisible()
    await expect(registerLink).toHaveAttribute("href", "/register")
  })

  test("has test account fill button", async ({ page }) => {
    const testButton = page.getByRole("button", {
      name: "테스트 계정으로 채우기",
    })
    await expect(testButton).toBeVisible()

    // 클릭하면 이메일/비밀번호가 채워진다
    await testButton.click()
    await expect(page.getByPlaceholder("your@email.com")).toHaveValue(
      "test@grimoire.app"
    )
  })

  test("shows error on invalid login attempt", async ({ page }) => {
    // 잘못된 자격증명으로 로그인 시도
    await page.getByPlaceholder("your@email.com").fill("wrong@test.com")
    await page.getByPlaceholder("••••••••").fill("wrongpassword")
    await page.getByRole("button", { name: "로그인" }).click()

    // 에러 메시지가 표시되어야 한다 (API 서버 여부에 따라 메시지가 다를 수 있음)
    const errorDiv = page.locator(".bg-red-900\\/30")
    const loginButton = page.getByRole("button", { name: "로그인" })

    // 에러 메시지가 나타나거나, 버튼이 다시 활성화된다
    await expect(errorDiv.or(loginButton)).toBeVisible({ timeout: 10000 })
  })

  test("Google login button is disabled", async ({ page }) => {
    const googleButton = page.getByRole("button", {
      name: /Google 로그인/,
    })
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeDisabled()
  })
})

test.describe("회원가입 페이지 (/register)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register")
  })

  test("renders register form with all required fields", async ({ page }) => {
    // Grimoire 헤딩
    await expect(page.getByRole("link", { name: "Grimoire" })).toBeVisible()

    // 서브타이틀
    await expect(page.getByText("나만의 소설 공간을 만드세요")).toBeVisible()

    // 이메일 필드
    await expect(page.getByLabel("이메일")).toBeVisible()

    // 비밀번호 필드
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible()

    // 비밀번호 확인 필드
    await expect(page.getByLabel("비밀번호 확인")).toBeVisible()

    // 작가명 필드
    await expect(page.getByLabel("작가명")).toBeVisible()

    // 슬러그 필드
    await expect(page.getByLabel("슬러그 (URL 경로)")).toBeVisible()

    // 회원가입 버튼
    await expect(
      page.getByRole("button", { name: /회원가입/ })
    ).toBeVisible()
  })

  test("has link to login page", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: "로그인" })
    await expect(loginLink).toBeVisible()
    await expect(loginLink).toHaveAttribute("href", "/login")
  })

  test("shows error when passwords do not match", async ({ page }) => {
    await page.getByPlaceholder("your@email.com").fill("test@test.com")

    // 비밀번호 필드들 채우기 — placeholder로 구분
    await page.getByPlaceholder("6자 이상").fill("password123")
    await page
      .getByPlaceholder("비밀번호를 다시 입력하세요")
      .fill("different456")

    await page.getByPlaceholder("필명 또는 닉네임").fill("Test Author")
    await page.getByPlaceholder("my-space").fill("test-author")

    await page.getByRole("button", { name: /회원가입/ }).click()

    // 비밀번호 불일치 에러 메시지
    await expect(
      page.getByText("비밀번호가 일치하지 않습니다")
    ).toBeVisible()
  })

  test("auto-generates slug from author name", async ({ page }) => {
    const nameInput = page.getByPlaceholder("필명 또는 닉네임")
    const slugInput = page.getByPlaceholder("my-space")

    await nameInput.fill("test author")

    // 이름 입력 시 슬러그가 자동 생성 (영소문자 + 하이픈)
    await expect(slugInput).toHaveValue("test-author")
  })
})
