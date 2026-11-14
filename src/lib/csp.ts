/** CSP API 출처는 사용자 설정만 허용한다. 기본 통신은 같은 출처 BFF다. */
export type AppEnv = 'local' | 'localhost' | 'development' | 'production'

export function apiConnectSrc(appEnv?: string, apiOrigin?: string): string {
  if (apiOrigin) {
    const url = new URL(apiOrigin)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) {
      throw new Error('NEXT_PUBLIC_API_ORIGIN must be an HTTP(S) origin without credentials or path')
    }
    return url.origin
  }
  return appEnv === 'local' || appEnv === 'localhost' ? 'http://localhost:3000' : ''
}

/** 환경별 전체 CSP 문자열을 조립한다 (헤더 value). */
export function buildCsp(appEnv?: string, apiOrigin?: string): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://accounts.google.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com https://storage.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiConnectSrc(appEnv, apiOrigin)} https://polar.sh https://www.google.com https://accounts.google.com`,
    "frame-src https://www.google.com https://accounts.google.com https://polar.sh",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
