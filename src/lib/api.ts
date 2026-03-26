const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      if (typeof window !== 'undefined') localStorage.setItem('grimoire_token', token)
    } else {
      if (typeof window !== 'undefined') localStorage.removeItem('grimoire_token')
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('grimoire_token')
    }
    return this.token
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `API 오류: ${res.status}`)
    }

    return res.json()
  }

  // 인증
  async register(data: { email: string; password: string; name: string; slug: string }) {
    const result = await this.fetch<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    this.setToken(result.token)
    return result
  }

  async login(data: { email: string; password: string }) {
    const result = await this.fetch<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    this.setToken(result.token)
    return result
  }

  async getProfile() {
    return this.fetch<any>('/auth/profile')
  }

  logout() {
    this.setToken(null)
  }

  // 테마
  async getTheme(authorSlug: string) {
    return this.fetch<any>(`/themes/${authorSlug}`)
  }

  async generateTheme(description: string) {
    return this.fetch<any>('/themes/generate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    })
  }

  // 작가 공간
  async getAuthorSpace(slug: string) {
    return this.fetch<any>(`/authors/${slug}`)
  }

  // 작품
  async getWork(authorSlug: string, workSlug: string) {
    return this.fetch<any>(`/works/${authorSlug}/${workSlug}`)
  }

  // 에피소드
  async getEpisode(authorSlug: string, workSlug: string, episodeSlug: string) {
    return this.fetch<any>(`/episodes/${authorSlug}/${workSlug}/${episodeSlug}`)
  }

  // 원고 파싱
  async parseManuscript(rawText: string) {
    return this.fetch<any>('/manuscripts/parse', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    })
  }
}

export const api = new ApiClient()
