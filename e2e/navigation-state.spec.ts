import { test, expect } from "@playwright/test"

test.describe("네비게이션 상태 관리 (뒤로가기/앞으로가기)", () => {
  test("에피소드 재방문 시 타이핑 애니메이션이 스킵된다", async ({ page }) => {
    // 1. ep1 첫 방문 — 타이핑 애니메이션 대기
    await page.goto("/universe/ep1")
    await expect(page.getByText("EPISODE 01")).toBeVisible({ timeout: 10000 })

    // 첫 문단이 나타날 때까지 대기 (타이핑 진행)
    const firstParagraph = page.locator("main p").first()
    await expect(firstParagraph).toBeVisible({ timeout: 30000 })

    // 2. ep2로 이동
    await page.goto("/universe/ep2")
    await expect(page.getByText("EPISODE 02")).toBeVisible({ timeout: 10000 })

    // 3. 브라우저 뒤로가기 → ep1로 복귀
    await page.goBack()
    await expect(page).toHaveURL(/\/universe\/ep1/)

    // 4. 재방문 시 본문이 즉시 표시되어야 함 (타이핑 없이)
    //    타이핑이 스킵되면 main 영역이 빠르게 나타남
    //    stage가 바로 5(완료)로 가므로 footer도 즉시 보여야 함
    await expect(page.getByText("결핍은 질문을 삼킨다.")).toBeVisible({ timeout: 3000 })
  })

  test("새 탭에서 에피소드 첫 방문 시 타이핑이 작동한다 (즉시 완료 아님)", async ({ page }) => {
    // sessionStorage가 비어있는 새 탭에서는 stage 0에서 시작
    // → 라벨 타이핑부터 순차 진행 (즉시 완료가 아님)
    await page.goto("/universe/ep11")

    // 라벨이 타이핑되어 나타나는지 확인 (stage 1 이상)
    await expect(page.getByText("EPISODE 11")).toBeVisible({ timeout: 10000 })

    // 제목이 타이핑되어 나타나는지 확인 (stage 2 이상)
    await expect(page.getByText("이름 없는 괴물")).toBeVisible({ timeout: 15000 })
  })

  test("뒤로가기로 랜딩 복귀 시 정상 렌더된다", async ({ page }) => {
    await page.goto("/universe")
    await page.goto("/universe/ep1")
    await expect(page.getByText("EPISODE 01")).toBeVisible({ timeout: 10000 })

    await page.goBack()
    await expect(page).toHaveURL(/\/universe$/)
    await expect(page.getByRole("heading", { name: "사슴악마" })).toBeVisible()
  })

  test("앞으로가기로 에피소드 재진입 시 타이핑이 스킵된다", async ({ page }) => {
    // ep1 방문
    await page.goto("/universe/ep1")
    const firstParagraph = page.locator("main p").first()
    await expect(firstParagraph).toBeVisible({ timeout: 30000 })

    // 랜딩으로 이동
    await page.goto("/universe")
    await expect(page.getByRole("heading", { name: "사슴악마" })).toBeVisible()

    // 뒤로가기 → ep1
    await page.goBack()
    await expect(page).toHaveURL(/\/universe\/ep1/)

    // 재방문이므로 즉시 완료 상태
    await expect(page.getByText("결핍은 질문을 삼킨다.")).toBeVisible({ timeout: 3000 })
  })

  test("빠른 페이지 전환을 반복해도 크래시하지 않는다", async ({ page }) => {
    // 여러 에피소드를 빠르게 이동
    await page.goto("/universe/ep1")
    await page.goto("/universe/ep2")
    await page.goto("/universe/ep3")

    // 뒤로가기/앞으로가기 반복 — 타이머 정리가 안 되면 여기서 터짐
    // 빠른 전환 시 네비게이션이 중단될 수 있으므로 에러 흡수, 최종 상태만 검증
    for (let i = 0; i < 3; i++) {
      await page.goBack({ waitUntil: "commit" }).catch(() => {})
      await page.goForward({ waitUntil: "commit" }).catch(() => {})
    }

    // 최종 페이지가 살아있고 정상 렌더되는지 확인
    await expect(page.locator("header")).toBeVisible({ timeout: 10000 })
  })
})
