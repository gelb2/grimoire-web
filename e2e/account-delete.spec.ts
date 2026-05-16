import { test, expect, type Page } from "@playwright/test"

/**
 * USER-SOFT-DELETE E2E (5/15 풀스택 dev+prod 배포 완료 — server-prod rev 101 / web-prod rev 119).
 *
 * 시나리오 3건:
 *  1. 본인 탈퇴 — /dashboard/profile "위험 영역" → AccountDeleteDialog 모달 → slug 검증 + 체크박스
 *  2. 어드민 force delete — /admin '탈퇴/익명화' 탭(UsersTab) → 강제 탈퇴 → 사유 필수 모달
 *  3. GDPR anonymize — UsersTab → 익명화 → 사유 필수 모달
 *
 * ⚠️ 데이터 파괴 방지 (CRITICAL):
 *  - 본인 탈퇴: 모달 + slug 미일치 disabled / slug 정합 + 체크박스 enabled 까지만 검증.
 *    AccountDeleteDialog.onConfirm 은 실제 api.deleteMyAccount() 호출이므로 "탈퇴" 버튼은 클릭하지 않는다.
 *  - force delete / anonymize: UsersTab handleAction 은 사유 모달 confirm 버튼 클릭 후
 *    추가로 window.confirm() 네이티브 게이트가 있다. page.on('dialog', d => d.dismiss()) 로
 *    confirm 을 자동 거부하면 실제 api.adminForceDeleteAuthor / adminAnonymizeAuthor 는 절대 호출되지 않는다.
 *  - 결과적으로 deerdevil 등 실제 작가 계정은 어떤 시나리오에서도 soft delete 되지 않는다.
 *
 * 환경 의존:
 *  - 비인증 리다이렉트 it 는 server 없이도 PASS (web 단독).
 *  - 로그인 의존 it 는 기존 auth.spec.ts / dashboard.spec.ts 정합으로 env 미박제 시 test.skip.
 *    E2E_AUTHOR_SLUG / E2E_AUTHOR_PASSWORD / E2E_ADMIN_PASSWORD 박제 + server localhost:3000 기동 시 PASS.
 */

// ── 로그인 헬퍼 (dashboard.spec.ts / auth.spec.ts 패턴 차용) ──

/** 작가 로그인 — /login slug-or-email 폼. 성공 시 /dashboard 진입까지 대기. */
async function loginAsAuthor(page: Page): Promise<void> {
  const identifier =
    process.env.E2E_AUTHOR_SLUG ?? process.env.E2E_AUTHOR_EMAIL ?? "deerdevil"
  const password = process.env.E2E_AUTHOR_PASSWORD!
  await page.goto("/login")
  await page.getByLabel("이메일 또는 슬러그").fill(identifier)
  await page.getByLabel("비밀번호").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

/** 관리자 로그인 — /admin/login. 성공 시 /admin 진입까지 대기. */
async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.E2E_ADMIN_EMAIL ?? "admin@grimoire-book.com"
  const password = process.env.E2E_ADMIN_PASSWORD!
  await page.goto("/admin/login")
  await page.getByPlaceholder("관리자 이메일").fill(email)
  await page.getByPlaceholder("비밀번호").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()
  await page.waitForURL("/admin", { timeout: 10000 })
}

// ─────────────────────────────────────────────────────────────
// 시나리오 1: 본인 계정 탈퇴 (/dashboard/profile → AccountDeleteDialog)
// ─────────────────────────────────────────────────────────────

test.describe("USER-SOFT-DELETE — 본인 계정 탈퇴", () => {
  test("비로그인 시 /dashboard/profile 접근하면 로그인 페이지로 이동한다", async ({
    page,
  }) => {
    // server 무관 — web 미들웨어/AuthProvider 가드만 검증
    await page.goto("/dashboard/profile")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test("프로필 페이지 '위험 영역' → 탈퇴 모달 → slug 검증 + 체크박스 활성화", async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_AUTHOR_PASSWORD,
      "E2E_AUTHOR_PASSWORD 미박제 — 환경변수 + server localhost:3000 기동 후 재실행"
    )

    await loginAsAuthor(page)
    await page.goto("/dashboard/profile")

    // 위험 영역 섹션 + 탈퇴 버튼 노출
    await expect(page.getByRole("heading", { name: "위험 영역" })).toBeVisible({
      timeout: 5000,
    })
    const dangerButton = page.getByRole("button", { name: "계정 탈퇴" })
    await expect(dangerButton).toBeVisible()

    // 탈퇴 버튼 클릭 → AccountDeleteDialog 모달
    await dangerButton.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("heading", { name: "계정 탈퇴" })
    ).toBeVisible()
    // 정책 안내 5줄 노출
    await expect(dialog.getByTestId("account-delete-policy")).toBeVisible()

    // ⚠️ 데이터 파괴 방지: 모달 confirm("탈퇴") 버튼은 끝까지 클릭하지 않는다.
    const confirmBtn = dialog.getByRole("button", { name: /^탈퇴$/ })

    // (a) 초기 상태 — slug 미입력 + 체크박스 미선택 → 탈퇴 버튼 disabled
    await expect(confirmBtn).toBeDisabled()

    // (b) slug 불일치 입력 → 여전히 disabled + 불일치 경고
    const slugInput = page.locator("#account-delete-slug")
    await slugInput.fill("wrong-slug-not-matching")
    await expect(
      dialog.getByText("슬러그가 일치하지 않습니다.")
    ).toBeVisible()
    await expect(confirmBtn).toBeDisabled()

    // (c) slug 정합 입력 — placeholder 가 본인 slug 이므로 그것을 그대로 사용
    const ownSlug = (await slugInput.getAttribute("placeholder")) ?? ""
    expect(ownSlug.length).toBeGreaterThan(0)
    await slugInput.fill(ownSlug)
    // slug 만으로는 아직 disabled (체크박스 미선택)
    await expect(confirmBtn).toBeDisabled()

    // (d) 동의 체크박스 선택 → 탈퇴 버튼 enabled
    await dialog.getByRole("checkbox").check()
    await expect(confirmBtn).toBeEnabled()

    // 검증 종료 — confirmBtn 은 클릭하지 않고 모달을 닫는다 (취소)
    await dialog.getByRole("button", { name: "취소" }).click()
    await expect(dialog).not.toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────
// 시나리오 2 & 3: 어드민 force delete / GDPR anonymize (UsersTab)
// ─────────────────────────────────────────────────────────────

test.describe("USER-SOFT-DELETE — 어드민 force delete / GDPR anonymize", () => {
  test("비인증 시 /admin 접근하면 관리자 로그인 페이지로 이동한다", async ({
    page,
  }) => {
    // server 무관 — admin 가드만 검증
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 })
  })

  test("어드민 '탈퇴/익명화' 탭 → 강제 탈퇴 → 사유 필수 모달 (사유 미입력 시 진행 불가)", async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_ADMIN_PASSWORD,
      "E2E_ADMIN_PASSWORD 미박제 — 환경변수 + server localhost:3000 기동 후 재실행"
    )

    // ⚠️ 데이터 파괴 방지: window.confirm() 네이티브 게이트를 모두 거부 →
    // UsersTab.handleAction 의 api.adminForceDeleteAuthor 호출에 절대 도달하지 않는다.
    page.on("dialog", d => d.dismiss())

    await loginAsAdmin(page)

    // '탈퇴/익명화' 탭 클릭 (TAB_LABELS.users)
    await page.getByRole("button", { name: "탈퇴/익명화" }).click()

    // UsersTab 검색 → 첫 행 노출 대기 (server 응답 의존)
    await page.getByPlaceholder("이름, 슬러그, 이메일 검색...").fill("")
    await page.getByRole("button", { name: "검색" }).click()

    const firstRow = page.locator("tbody tr").first()
    await expect(firstRow).toBeVisible({ timeout: 10000 })

    // 행의 '강제 탈퇴' 버튼 클릭 → 사유 모달
    await firstRow.getByRole("button", { name: "강제 탈퇴" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("heading", { name: "강제 탈퇴" })
    ).toBeVisible()

    // (a) 사유 미입력 → 모달 내 강제 탈퇴 confirm 버튼 disabled
    const modalConfirm = dialog
      .getByRole("button", { name: "강제 탈퇴" })
      .last()
    await expect(modalConfirm).toBeDisabled()

    // (b) 사유 입력 → confirm 버튼 enabled
    const reasonInput = dialog.getByPlaceholder(/감사 로그/)
    await reasonInput.fill("E2E 검증 — 실제 처리는 confirm 거부로 차단")
    await expect(modalConfirm).toBeEnabled()

    // (c) confirm 버튼 클릭 — window.confirm() 이 뜨지만 page.on('dialog') 가 dismiss →
    //     api.adminForceDeleteAuthor 는 호출되지 않는다 (데이터 파괴 0).
    await modalConfirm.click()
    // 모달은 confirm 거부 시 닫히지 않고 유지된다 (handleAction early return)
    await expect(dialog).toBeVisible()

    // 검증 종료 — 모달 취소
    await dialog.getByRole("button", { name: "취소" }).click()
    await expect(dialog).not.toBeVisible()
  })

  test("어드민 '탈퇴/익명화' 탭 → GDPR 익명화 → 사유 필수 모달 (사유 미입력 시 진행 불가)", async ({
    page,
  }) => {
    test.skip(
      !process.env.E2E_ADMIN_PASSWORD,
      "E2E_ADMIN_PASSWORD 미박제 — 환경변수 + server localhost:3000 기동 후 재실행"
    )

    // ⚠️ 데이터 파괴 방지: confirm() 전부 거부 → api.adminAnonymizeAuthor 미호출
    page.on("dialog", d => d.dismiss())

    await loginAsAdmin(page)
    await page.getByRole("button", { name: "탈퇴/익명화" }).click()

    await page.getByRole("button", { name: "검색" }).click()
    const firstRow = page.locator("tbody tr").first()
    await expect(firstRow).toBeVisible({ timeout: 10000 })

    // 행의 '익명화' 버튼 클릭 → 사유 모달
    await firstRow.getByRole("button", { name: "익명화" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("heading", { name: "GDPR 익명화" })
    ).toBeVisible()

    // (a) 사유 미입력 → 모달 내 GDPR 익명화 confirm 버튼 disabled
    const modalConfirm = dialog
      .getByRole("button", { name: "GDPR 익명화" })
      .last()
    await expect(modalConfirm).toBeDisabled()

    // (b) 사유 입력 → confirm 버튼 enabled
    const reasonInput = dialog.getByPlaceholder(/감사 로그/)
    await reasonInput.fill("E2E 검증 — GDPR 익명화, confirm 거부로 차단")
    await expect(modalConfirm).toBeEnabled()

    // (c) confirm 버튼 클릭 — window.confirm() dismiss → api.adminAnonymizeAuthor 미호출
    await modalConfirm.click()
    await expect(dialog).toBeVisible()

    await dialog.getByRole("button", { name: "취소" }).click()
    await expect(dialog).not.toBeVisible()
  })
})
