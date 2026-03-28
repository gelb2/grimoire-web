/** 페이지네이션 작품 응답 타입 */
export interface PaginatedWorksResponse {
  works: Array<{
    id: string; slug: string; title: string; subtitle: string | null
    description: string | null; viewCount: number; authorName: string
    authorSlug: string; episodeCount: number; createdAt: string
  }>
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

// BFF 패턴:
// - 클라이언트(브라우저): 같은 도메인의 /api 프록시로 호출
// - 서버(SSR): API_URL 런타임 환경변수로 백엔드 직접 호출 (루프백 방지)
function getApiBase(): string {
  if (typeof window === 'undefined') {
    // 서버 사이드 — 백엔드 직접 호출
    return process.env.API_URL || 'http://localhost:3000/api'
  }
  // 클라이언트 사이드 — BFF 프록시 경유
  return '/api'
}

class ApiClient {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    }

    // SSR 환경에서 타임아웃 설정 (서버 미연결 시 빠른 폴백)
    const signal = options?.signal ?? AbortSignal.timeout(5000)

    const res = await fetch(`${getApiBase()}${path}`, {
      ...options,
      credentials: 'include',
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
    return this.fetch<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.fetch<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getProfile() {
    return this.fetch<any>('/auth/profile')
  }

  async logout() {
    return this.fetch<void>('/auth/logout', { method: 'POST' })
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

  async updateTheme(themeId: string, overrides: Record<string, unknown>) {
    return this.fetch<any>(`/themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify({ overrides }),
    })
  }

  async publishTheme(authorSlug: string) {
    return this.fetch<any>(`/themes/publish/${authorSlug}`, {
      method: 'POST',
    })
  }

  async getMyThemes() {
    return this.fetch<any[]>('/themes/mine')
  }

  // 작가 공간
  async getAuthorSpace(slug: string) {
    return this.fetch<any>(`/authors/${slug}`)
  }

  // 작가 공개 프로필
  async getAuthorProfile(slug: string) {
    return this.fetch<any>(`/authors/${slug}/profile`)
  }

  // 작가 bio 업데이트
  async updateBio(slug: string, bio: string) {
    return this.fetch<{ bio: string }>(`/authors/${slug}/profile`, {
      method: 'PATCH',
      body: JSON.stringify({ bio }),
    })
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
    return this.fetch<{ user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    })
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
  /** 인기 작품 페이지네이션 조회 */
  async getPopularWorksPaginated(page = 1, pageSize = 12) {
    return this.fetch<PaginatedWorksResponse>(`/discover/works/popular?page=${page}&pageSize=${pageSize}`)
  }
  /** 최신 작품 페이지네이션 조회 */
  async getRecentWorksPaginated(page = 1, pageSize = 12) {
    return this.fetch<PaginatedWorksResponse>(`/discover/works/recent?page=${page}&pageSize=${pageSize}`)
  }

  /** 응원받는 작가 랭킹 */
  async getMostGiftedAuthors(limit = 8) {
    return this.fetch<{ id: string; slug: string; name: string; bio: string | null; totalGifted: number }[]>(`/discover/authors/most-gifted?limit=${limit}`)
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
  async createComment(episodeId: string, content: string, parentId?: string) {
    const body: { content: string; parentId?: string } = { content }
    if (parentId) body.parentId = parentId
    return this.fetch<any>(`/social/comments/${episodeId}`, { method: 'POST', body: JSON.stringify(body) })
  }
  async getComments(episodeId: string) {
    return this.fetch<any[]>(`/social/comments/${episodeId}`)
  }
  async deleteComment(commentId: string) {
    return this.fetch<void>(`/social/comments/${commentId}`, { method: 'DELETE' })
  }

  // 크레딧 선물
  async giftCredits(receiverId: string, amount: number) {
    return this.fetch<{ senderCredits: number; receiverCredits: number }>('/credits/gift', {
      method: 'POST',
      body: JSON.stringify({ receiverId, amount }),
    })
  }

  // 서재
  async getLibrary() {
    return this.fetch<{
      bookmarked: Array<{
        workId: string; workTitle: string; workSlug: string
        authorName: string; authorSlug: string; episodeCount: number
        readEpisodeCount: number; lastReadEpisodeTitle: string | null
        lastReadEpisodeSlug: string | null; subscribed: boolean
      }>
      subscribed: Array<{
        workId: string; workTitle: string; workSlug: string
        authorName: string; authorSlug: string; episodeCount: number
        latestEpisodeTitle: string | null; createdAt: string
      }>
    }>('/reader/library')
  }

  // 조회수 통계
  async getWorkStats(workId: string) {
    return this.fetch<{ dates: string[]; counts: number[]; totalViews: number }>(`/works/${workId}/stats`)
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
