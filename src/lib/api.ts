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

    // SSR 환경에서 타임아웃 설정 (서버 미연결 시 빠른 폴백)
    const signal = options?.signal ?? AbortSignal.timeout(5000)

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal,
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

  // Google 로그인
  async googleLogin(googleToken: string) {
    const result = await this.fetch<{ user: any; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    })
    this.setToken(result.token)
    return result
  }

  // 결제/크레딧
  async getProducts() {
    return this.fetch<any[]>('/payments/products')
  }

  async getCredits() {
    return this.fetch<{ credits: number }>('/payments/credits')
  }

  // 작품 관리
  async createWork(data: { title: string; slug: string; subtitle?: string; description?: string }) {
    return this.fetch<any>('/works', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateWork(id: string, data: { title?: string; subtitle?: string; description?: string }) {
    return this.fetch<any>(`/works/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async deleteWork(id: string) {
    return this.fetch<void>(`/works/${id}`, { method: 'DELETE' })
  }

  // 에피소드 관리
  async createEpisode(workId: string, data: { title: string; rawContent: string; sourceFormat?: string }) {
    return this.fetch<any>(`/works/${workId}/episodes`, { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteEpisode(id: string) {
    return this.fetch<void>(`/episodes/${id}`, { method: 'DELETE' })
  }

  // 원고 파싱
  async parseManuscript(rawText: string) {
    return this.fetch<any>('/manuscripts/parse', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    })
  }

  // 북마크
  async toggleBookmark(episodeId: string) {
    return this.fetch<any>(`/reader/bookmarks/${episodeId}`, { method: 'POST' })
  }
  async getBookmarks() {
    return this.fetch<any[]>('/reader/bookmarks')
  }

  // 읽은 위치
  async saveProgress(episodeId: string, blockIndex: number) {
    return this.fetch<any>('/reader/progress', {
      method: 'POST',
      body: JSON.stringify({ episodeId, blockIndex }),
    })
  }
  async getProgress(episodeId: string) {
    return this.fetch<any>(`/reader/progress/${episodeId}`)
  }

  // 탐색
  async searchAuthors(query: string) {
    return this.fetch<any[]>(`/discover/authors?q=${encodeURIComponent(query)}`)
  }
  async getPopularWorks(limit = 10) {
    return this.fetch<any[]>(`/discover/works/popular?limit=${limit}`)
  }
  async getRecentWorks(limit = 10) {
    return this.fetch<any[]>(`/discover/works/recent?limit=${limit}`)
  }

  // 좋아요
  async toggleLike(episodeId: string) {
    return this.fetch<{ liked: boolean; likeCount: number }>(`/social/likes/${episodeId}`, { method: 'POST' })
  }
  async getLikeCount(episodeId: string) {
    return this.fetch<{ count: number }>(`/social/likes/${episodeId}/count`)
  }

  // 구독
  async toggleSubscription(authorId: string) {
    return this.fetch<{ subscribed: boolean }>(`/social/subscriptions/${authorId}`, { method: 'POST' })
  }
  async getSubscriptions() {
    return this.fetch<any[]>('/social/subscriptions')
  }
  async getSubscriberCount(authorId: string) {
    return this.fetch<{ count: number }>(`/social/subscriptions/${authorId}/count`)
  }

  // 댓글
  async createComment(episodeId: string, content: string) {
    return this.fetch<any>(`/social/comments/${episodeId}`, { method: 'POST', body: JSON.stringify({ content }) })
  }
  async getComments(episodeId: string) {
    return this.fetch<any[]>(`/social/comments/${episodeId}`)
  }
  async deleteComment(commentId: string) {
    return this.fetch<void>(`/social/comments/${commentId}`, { method: 'DELETE' })
  }

  // 관리자
  async getAdminStats() {
    return this.fetch<any>('/admin/stats')
  }
  async adminGrantCredits(authorId: string, amount: number, reason: string) {
    return this.fetch<any>('/admin/credits', {
      method: 'POST',
      body: JSON.stringify({ authorId, amount, reason }),
    })
  }
}

export const api = new ApiClient()
