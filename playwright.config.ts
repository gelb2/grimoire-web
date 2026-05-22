import { defineConfig } from "@playwright/test"

/**
 * Playwright 설정 — localhost 기본 + dev 환경 대상 실행 양립.
 *
 * ── 기본(localhost) ──
 *   `npm run test:e2e` → baseURL=localhost:3002 + webServer(`npm run dev`) 자동 기동.
 *   기존 10 spec 정합 — 무변경.
 *
 * ── dev 환경 대상 (USER-SOFT-DELETE 3 시나리오, 2026-05-17) ──
 *   dev 는 이미 배포돼 있으므로 webServer 기동이 불필요하다.
 *   `PLAYWRIGHT_BASE_URL` env 가 박제되면:
 *     - baseURL 을 그 값으로 override (예: https://dev.grimoire-book.com)
 *     - webServer 를 비활성화 (undefined) — 로컬 next dev 미기동
 *     - headless 를 false 로 강제 (reCAPTCHA v3 대응 — 아래 설명)
 *   예: PLAYWRIGHT_BASE_URL=https://dev.grimoire-book.com npm run test:e2e -- account-delete
 *   네트워크 왕복(콜드스타트 포함)을 고려해 dev 대상은 timeout 을 60s 로 상향.
 *
 *   ⚠️ reCAPTCHA v3 — dev 대상 headed 강제 사유:
 *   dev 서버는 `RECAPTCHA_SECRET_KEY` 가 박제돼 있어 /login 로그인 시 reCAPTCHA v3
 *   점수 검증을 수행한다 (recaptcha-verifier.ts MIN_SCORE 0.5). headless 브라우저는
 *   reCAPTCHA 가 봇으로 판정(낮은 점수)하여 서버가 "자동화된 요청이 감지되었습니다"(400)로
 *   로그인을 차단한다. headed(실제 창) 브라우저는 정상 점수를 받아 로그인이 통과된다.
 *   localhost 는 RECAPTCHA_SECRET_KEY 미설정 → 검증 스킵 → headless 무방.
 */

// PLAYWRIGHT_BASE_URL 박제 여부로 dev 대상 실행을 판별한다.
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const isExternalTarget = Boolean(externalBaseUrl)
const baseURL = externalBaseUrl ?? "http://localhost:3002"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  // dev 대상은 콜드스타트(Azure Container Apps) 왕복을 고려해 timeout 상향.
  timeout: isExternalTarget ? 60000 : 30000,
  use: {
    baseURL,
    // dev 대상은 reCAPTCHA v3 통과를 위해 headed(실제 창) 강제. localhost 는 headless.
    headless: !isExternalTarget,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  // dev 대상 실행 시 로컬 webServer 기동을 건너뛴다 (이미 배포된 환경).
  webServer: isExternalTarget
    ? undefined
    : {
        command: "npm run dev -- -p 3002",
        port: 3002,
        reuseExistingServer: true,
        timeout: 60000,
        env: {
          API_URL: "http://localhost:3000/api",
        },
      },
})
