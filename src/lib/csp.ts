/**
 * CSP(Content-Security-Policy) 빌더 — next.config.ts `headers()` 에서 사용.
 *
 * FW-1: prod CSP `connect-src` 에 stale `dev-api.grimoire-book.com` + `inhouse-api*` 가
 * prod `api.grimoire-book.com` 와 함께 허용돼 있던 위생 결함을 정리한다.
 *  - inhouse-* 는 2환경화(2026-04-19, inhouse 제거)로 폐기 → **전 환경 제거**.
 *  - connect-src 의 백엔드 API origin 을 환경별로 분기:
 *      production → https://api.grimoire-book.com (만)
 *      development → https://dev-api.grimoire-book.com (만)
 *      local       → http://localhost:3000
 *  - BFF(/api 프록시)는 same-origin 이라 'self' 로 이미 커버되나, 정본 API origin 을
 *    명시적으로 1개만 허용해 stale 도메인 노출을 없앤다.
 *
 * `appEnv` 는 빌드타임 `NEXT_PUBLIC_APP_ENV` (Next 가 config 로드 시 process.env 로 노출).
 * 값 매핑은 `scripts/deploy-common.sh` `env_to_app_env_buildarg`:
 *   dev → 'development', prod → 'production' (Dockerfile ARG 기본값도 production).
 * 미지정 시 production 기본값 — 잘못 빌드해도 stale dev/inhouse 를 노출하지 않는다.
 */
export type AppEnv = 'local' | 'development' | 'production'

/** connect-src 에 허용할 환경별 백엔드 API origin (정확히 1개). */
export function apiConnectSrc(appEnv?: string): string {
  switch (appEnv) {
    case 'development':
      return 'https://dev-api.grimoire-book.com'
    case 'local':
      return 'http://localhost:3000'
    default:
      // 'production' 및 미지정 — 안전 기본값(정본 prod origin, stale 노출 없음)
      return 'https://api.grimoire-book.com'
  }
}

/** 환경별 전체 CSP 문자열을 조립한다 (헤더 value). */
export function buildCsp(appEnv?: string): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://accounts.google.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiConnectSrc(appEnv)} https://polar.sh https://www.google.com https://accounts.google.com`,
    "frame-src https://www.google.com https://accounts.google.com https://polar.sh",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
