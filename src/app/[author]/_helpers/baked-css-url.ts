/**
 * bakedCssUrl 응답 정규화 helper
 *
 * Sprint: sprint-baked-css-url-absolute (P1-#7)
 * 계약: reports/sprint-baked-css-url-absolute-progress.md AC-5
 *
 * 정책 (방향 B — server 동적 절대화):
 * - server는 GET /api/themes/{slug} 응답 단계에서 bakedCssUrl을
 *   **항상 절대 URL(http(s)://...) 또는 NULL** 로 반환한다.
 * - DB의 themes.baked_css_url 컬럼은 절대 URL 또는 NULL 만 박제된다 (마이그레이션
 *   `baked_css_url_clear_relative`로 stale 상대 경로 일괄 NULL 정리).
 * - 상대 경로(`/api/themes/css/{slug}`) 박제는 폐지 — web에서 fallback 처리하지 않는다.
 *
 * 본 helper는 server 응답이 spec과 다른 (legacy) 값을 보낼 경우의 방어선이다:
 * - 비문자열/빈문자열 → null
 * - 문자열 + length > 0 → CDN은 그대로, 현재 작가 자체 API CSS는 BFF로 중계
 *   (2026-11-13: API 포트/출처 차이로 style-src에서 차단되는 경로 수정)
 *
 * 향후 sensor-web으로 "상대 경로 응답 발견 시 경고" 회귀 가드 추가 예정.
 */
export function resolveBakedCssUrl(raw: unknown, authorSlug?: string): string | null {
  if (typeof raw !== 'string') return null
  if (raw.length === 0) return null
  // 서버 계약은 절대 URL 그대로 유지한다. 자체 API의 CSS 응답만 같은 출처 BFF로 중계한다.
  // API 포트/도메인이 웹과 달라도 style-src 'self' 안에서 읽을 수 있다.
  if (authorSlug) {
    try {
      const url = new URL(raw)
      const apiPath = `/api/themes/css/${encodeURIComponent(authorSlug)}`
      if (['http:', 'https:'].includes(url.protocol) && url.pathname === apiPath) return apiPath
    } catch { /* 레거시 값은 기존 정규화 정책을 유지한다. */ }
  }
  return raw
}
