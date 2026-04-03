import type { AuthResponse, AuthUser, Theme, GiftedAuthor, WorkStats, Product } from "@/types/api"
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

    // 타임아웃: SSR=5초 (서버 미연결 시 빠른 폴백), 클라이언트=10초 (prod Cold Start 대응)
    const timeout = typeof window === 'undefined' ? 5000 : 10000
    const signal = options?.signal ?? AbortSignal.timeout(timeout)

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
  async register(data: { email: string; password: string; name: string; slug: string; recaptchaToken?: string }) {
    return this.fetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string; recaptchaToken?: string }) {
    return this.fetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getProfile() {
    return this.fetch<AuthUser>('/auth/profile')
  }

  async logout() {
    return this.fetch<void>('/auth/logout', { method: 'POST' })
  }

  // 테마
  async getTheme(authorSlug: string) {
    return this.fetch<Theme>(`/themes/${authorSlug}`)
  }

  async generateTheme(description: string) {
    return this.fetch<{ themeId: string; preview: Record<string, unknown> }>('/themes/generate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    })
  }

  async updateTheme(themeId: string, overrides: Record<string, unknown>) {
    return this.fetch<{ themeId: string; overrides: Record<string, unknown> }>(`/themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify({ overrides }),
    })
  }

  async publishTheme(authorSlug: string) {
    return this.fetch<{ cssUrl: string }>(`/themes/publish/${authorSlug}`, {
      method: 'POST',
    })
  }

  async getMyThemes() {
    return this.fetch<Theme[]>('/themes/mine')
  }

  // 작가 공간 — 호출처에서 타입 지정 가능
  async getAuthorSpace<T = Record<string, unknown>>(slug: string) {
    return this.fetch<T>(`/authors/${slug}`)
  }

  // 작가 공개 프로필 — 호출처에서 타입 지정 가능
  async getAuthorProfile<T = Record<string, unknown>>(slug: string) {
    return this.fetch<T>(`/authors/${slug}/profile`)
  }

  // 작가 bio 업데이트
  async updateBio(slug: string, bio: string) {
    return this.fetch<{ bio: string }>(`/authors/${slug}/profile`, {
      method: 'PATCH',
      body: JSON.stringify({ bio }),
    })
  }

  // 작품 — 호출처에서 타입 지정 가능
  async getWork<T = Record<string, unknown>>(authorSlug: string, workSlug: string) {
    return this.fetch<T>(`/works/${authorSlug}/${workSlug}`)
  }

  // 에피소드 — 호출처에서 타입 지정 가능
  async getEpisode<T = Record<string, unknown>>(authorSlug: string, workSlug: string, episodeSlug: string) {
    return this.fetch<T>(`/episodes/${authorSlug}/${workSlug}/${episodeSlug}`)
  }

  // Google 로그인
  async googleLogin(googleToken: string) {
    return this.fetch<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    })
  }

  // 결제/크레딧
  async getProducts() {
    return this.fetch<Product[]>('/payments/products')
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

  // 원고 파싱 (텍스트)
  async parseManuscript(rawText: string) {
    return this.fetch<{ frontmatter: Record<string, string>; blocks: Record<string, unknown>[] }>('/manuscripts/parse', {
      method: 'POST',
      body: JSON.stringify({ mdText: rawText }),
    })
  }

  // 원고 파일 업로드 (DOCX/HWP 등 바이너리 파일 서버사이드 파싱)
  async uploadManuscriptFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${getApiBase()}/manuscripts/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `업로드 오류: ${res.status}`)
    }
    return res.json() as Promise<{ frontmatter: Record<string, string>; blocks: Record<string, unknown>[] }>
  }

  // 북마크
  async toggleBookmark(episodeId: string) {
    return this.fetch<{ bookmarked: boolean }>(`/reader/bookmarks/${episodeId}`, { method: 'POST' })
  }
  async getBookmarks() {
    return this.fetch<any[]>('/reader/bookmarks')
  }

  // 읽은 위치
  async saveProgress(episodeId: string, blockIndex: number) {
    return this.fetch<{ episodeId: string; blockIndex: number }>('/reader/progress', {
      method: 'POST',
      body: JSON.stringify({ episodeId, blockIndex }),
    })
  }
  async getProgress(episodeId: string) {
    return this.fetch<{ episodeId: string; blockIndex: number }>(`/reader/progress/${episodeId}`)
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
  async getLikeStatus(episodeId: string) {
    return this.fetch<{ liked: boolean; likeCount: number }>(`/social/likes/${episodeId}/status`)
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
  async createComment(episodeId: string, content: string, parentId?: string, anonymous?: { nickname: string; password: string }, honeypot?: string) {
    const body: { content: string; parentId?: string; nickname?: string; password?: string; website?: string } = { content }
    if (parentId) body.parentId = parentId
    if (anonymous) {
      body.nickname = anonymous.nickname
      body.password = anonymous.password
    }
    if (honeypot) body.website = honeypot
    return this.fetch<any>(`/social/comments/${episodeId}`, { method: 'POST', body: JSON.stringify(body) })
  }
  async getComments(episodeId: string) {
    return this.fetch<any[]>(`/social/comments/${episodeId}`)
  }
  async deleteComment(commentId: string, password?: string) {
    const options: RequestInit = { method: 'DELETE' }
    if (password) {
      options.body = JSON.stringify({ password })
    }
    return this.fetch<void>(`/social/comments/${commentId}`, options)
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

  // 커버 이미지 업로드
  async uploadCover(workId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${getApiBase()}/works/${workId}/cover`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `API 오류: ${res.status}`)
    }
    return res.json() as Promise<{ coverImage: string }>
  }

}

export const api = new ApiClient()
