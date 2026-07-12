/** API 기반 클래스 — BFF 프록시 + 자동 Refresh Token 갱신 */

function getApiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:3000/api'
  }
  return '/api'
}

export function getApiBaseUrl() { return getApiBase() }

/**
 * 401 자동 리프레시에서 제외할 경로 (F-7).
 *
 * 401 이 access 토큰 만료가 아니라 (1) 인증 자체 실패(로그인/가입/구글 — 비인증 계열) 또는
 * (2) 리프레시 무한루프 위험(refresh)인 경로만 제외한다.
 * `/auth/profile`·`/auth/logout`·`/auth/me`·`/authors/me` 등 인증 필요 경로는 access(15분)
 * 만료 시 refresh 후 재시도되어야 한다 — 제외하면 리로드 때마다 강제 로그아웃된다.
 */
const REFRESH_EXCLUDED_PATHS = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/google']

/**
 * HTTP 비정상 응답(4xx/5xx)을 status 코드와 함께 전달하는 에러 (F-16).
 *
 * 기존 `new Error(message)`는 status를 잃어 호출자가 진짜 404(리소스 없음)와
 * 네트워크/5xx 일시 오류를 구분할 수 없었다(episode page가 모든 예외를 notFound로 수렴).
 * `Error`를 확장하므로 `instanceof Error`·`.message` 는 그대로 유지(후향호환) —
 * `.status` 로 404 여부만 추가 판별한다. 네트워크 실패(TypeError/AbortError)는
 * `res.ok` 체크 이전에 던져지므로 ApiError가 아니다(구분 가능).
 */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export class BaseApiClient {
  private refreshing: Promise<boolean> | null = null

  protected async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await this.rawFetch(path, options)

    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !REFRESH_EXCLUDED_PATHS.some((p) => path.startsWith(p))
    ) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        const retry = await this.rawFetch(path, options)
        if (!retry.ok) {
          const body = await retry.json().catch(() => ({}))
          throw new ApiError(body.message || `API 오류: ${retry.status}`, retry.status)
        }
        return retry.json()
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(body.message || `API 오류: ${res.status}`, res.status)
    }

    return res.json()
  }

  protected async rawFetch(path: string, options?: RequestInit): Promise<globalThis.Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    }

    // GCP Cloud Run min-instances=0 cold start가 최장 60초까지 걸릴 수 있음(2026-05-27 GCP 이관, W-15).
    // 브라우저 기본값을 15초로 늘려 1회 요청은 일반 케이스를 커버하고,
    // 호출자는 options.signal로 더 긴 타임아웃을 명시 지정할 수 있음.
    const timeout = typeof window === 'undefined' ? 5000 : 15000
    const signal = options?.signal ?? AbortSignal.timeout(timeout)

    return fetch(`${getApiBase()}${path}`, {
      ...options,
      credentials: 'include',
      headers,
      signal,
    })
  }

  private async tryRefresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing
    this.refreshing = (async () => {
      try {
        const res = await this.rawFetch('/auth/refresh', { method: 'POST' })
        return res.ok
      } catch {
        return false
      } finally {
        this.refreshing = null
      }
    })()
    return this.refreshing
  }
}
