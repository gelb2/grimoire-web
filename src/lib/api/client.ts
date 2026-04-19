/** API 기반 클래스 — BFF 프록시 + 자동 Refresh Token 갱신 */

function getApiBase(): string {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:3000/api'
  }
  return '/api'
}

export function getApiBaseUrl() { return getApiBase() }

export class BaseApiClient {
  private refreshing: Promise<boolean> | null = null

  protected async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await this.rawFetch(path, options)

    if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        const retry = await this.rawFetch(path, options)
        if (!retry.ok) {
          const body = await retry.json().catch(() => ({}))
          throw new Error(body.message || `API 오류: ${retry.status}`)
        }
        return retry.json()
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `API 오류: ${res.status}`)
    }

    return res.json()
  }

  protected async rawFetch(path: string, options?: RequestInit): Promise<globalThis.Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    }

    // Azure Container Apps min-replicas=0 cold start가 최장 60초까지 걸릴 수 있음.
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
