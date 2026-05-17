import type {
  AuthResponse, AuthUser, Theme, GiftedAuthor, WorkStats, Product,
  AnalysisResult, IndexStatus, AnalysisReport, AnalysisReportSummary,
} from "@/types/api"
import { BaseApiClient, getApiBaseUrl } from "./api/client"
import type { PointBalanceView } from "@/features/credits"
import { normalizePointBalance, type CreditBalanceResponse } from "@/features/credits/point-balance"

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

class ApiClient extends BaseApiClient {

  /** Health check — cold start warm-up 용도. 응답을 기다리거나 결과 사용 안 해도 됨. */
  async getHealth() {
    return this.fetch<{ status: string; timestamp: string }>('/health')
  }

  // ─── 인증 ───
  async register(data: { email: string; password: string; name: string; slug: string; recaptchaToken?: string }) {
    return this.fetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 로그인 — email 또는 slug XOR 1택 + password.
   *
   * Sprint email-p0-3-slug-login (2026-05-04 EMAIL-P0-3 Phase 2):
   * - email + password (기존 후향호환)
   * - slug + password (신규 — `deerdevil` 등)
   * - 둘 다 박제 시 server BadRequestException
   * - 둘 다 미박제 시 server BadRequestException
   *
   * 클라이언트는 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` 정규식으로 판별 후 양쪽 중 1택만 박제.
   */
  async login(data: { email?: string; slug?: string; password: string; recaptchaToken?: string }) {
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

  /**
   * 본인 계정 탈퇴 (USER-SOFT-DELETE sprint §5-4 정합).
   *
   * - JWT 인증 영역 (HttpOnly Cookie 자동 전송, BFF 프록시 경유)
   * - server 영역: User.deletedAt 박제 + GDPR basic 익명화 (email/name/passwordHash/bio) + RefreshToken Cascade 무효화
   * - 30일 후 cron으로 hard delete (회계 8건 Restrict 영역은 PG 자동 차단)
   * - 작품/episode 영역은 별도 archive 0건 (PAY-P3-E `works.authorId onDelete=Restrict` 정합 강제)
   * - audit log 박제 (action=`self_account_delete`)
   *
   * @returns `{ deletedAt: string }` — soft delete 박제 시각 (ISO 8601)
   */
  async deleteMyAccount(reason?: string) {
    return this.fetch<{ deletedAt: string }>('/auth/me', {
      method: 'DELETE',
      body: JSON.stringify({ reason: reason ?? null }),
    })
  }

  // 테마
  async getTheme(authorSlug: string) {
    return this.fetch<Theme>(`/themes/${authorSlug}`)
  }

  async getThemeById(themeId: string) {
    return this.fetch<any>(`/themes/detail/${themeId}`)
  }

  async generateTheme(description: string) {
    return this.fetch<{ themeId: string; preview: Record<string, unknown> }>('/themes/generate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    })
  }

  async updateTheme(themeId: string, overrides?: Record<string, unknown>, name?: string) {
    return this.fetch<{ themeId: string; name: string; overrides: Record<string, unknown> }>(`/themes/${themeId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...(overrides && { overrides }), ...(name && { name }) }),
    })
  }

  async deleteTheme(themeId: string) {
    return this.fetch<{ deleted: boolean }>(`/themes/${themeId}`, {
      method: 'DELETE',
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

  async getPresets() {
    return this.fetch<{ name: string; label: string; tone: string; genre: string; preview: { bgPrimary: string; bgSecondary: string; accent: string; textPrimary: string; textBright: string } }[]>('/themes/presets')
  }

  async createFromPreset(preset: string, name?: string) {
    return this.fetch<{ themeId: string; preset: string; name: string }>('/themes/from-preset', {
      method: 'POST',
      body: JSON.stringify({ preset, name }),
    })
  }

  async getSlotInfo() {
    return this.fetch<{
      plan: string; planExpireAt: string | null; isExpired: boolean
      slotLimit: number; slottedCount: number; themes: any[]
    }>('/themes/slots/info')
  }

  async assignThemeSlot(themeId: string) {
    return this.fetch<{ themeId: string; isSlotted: boolean }>(`/themes/${themeId}/slot`, { method: 'POST' })
  }

  async removeThemeSlot(themeId: string) {
    return this.fetch<{ themeId: string; isSlotted: boolean }>(`/themes/${themeId}/slot`, { method: 'DELETE' })
  }

  async activateTheme(themeId: string) {
    return this.fetch<{ themeId: string; name: string; activated: boolean }>(`/themes/${themeId}/activate`, { method: 'POST' })
  }

  async assignThemeToWork(workId: string, themeId: string | null) {
    return this.fetch<{ workId: string; themeId: string | null; assigned: boolean }>(`/themes/works/${workId}/theme`, {
      method: 'PATCH',
      body: JSON.stringify({ themeId }),
    })
  }

  async getPlanInfo() {
    return this.fetch<{
      plan: string; planExpireAt: string | null; isExpired: boolean
      slotLimit: number; slottedCount: number; totalThemes: number
    }>('/plan')
  }

  // AI 채팅
  async createChatSession(workId: string, title?: string) {
    return this.fetch<any>('/chat/sessions', { method: 'POST', body: JSON.stringify({ workId, title }) })
  }

  async listChatSessions(workId: string) {
    return this.fetch<any[]>(`/chat/sessions?workId=${workId}`)
  }

  async sendChatMessage(sessionId: string, content: string) {
    return this.fetch<{ userMsg: any; assistantMsg: any }>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST', body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(60000), // 채팅은 60초 타임아웃 (Claude 응답 대기)
    })
  }

  async getChatMessages(sessionId: string, limit = 30, cursor?: string) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor) params.set('cursor', cursor)
    return this.fetch<any[]>(`/chat/sessions/${sessionId}/messages?${params}`)
  }

  async deleteChatSession(sessionId: string) {
    return this.fetch<void>(`/chat/sessions/${sessionId}`, { method: 'DELETE' })
  }

  // 작가 공간 — 호출처에서 타입 지정 가능
  async getAuthorSpace<T = Record<string, unknown>>(slug: string) {
    return this.fetch<T>(`/authors/${slug}`)
  }

  // 작가 공개 프로필 — 호출처에서 타입 지정 가능
  async getAuthorProfile<T = Record<string, unknown>>(slug: string) {
    return this.fetch<T>(`/authors/${slug}/profile`)
  }

  // 작가 프로필(name, bio) 업데이트
  async updateProfile(slug: string, data: { name?: string; bio?: string }) {
    return this.fetch<{ name: string; bio: string }>(`/authors/${slug}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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

  /**
   * 결제 시작 — Polar Checkout URL 반환.
   * 성공 시 응답의 `paymentUrl`로 리다이렉트하면 Polar 호스티드 결제 페이지로 이동.
   */
  async initiatePayment(productId: string, returnUrl: string) {
    return this.fetch<{ paymentId: string; paymentUrl: string; tradeNo: string }>(
      '/payments/initiate',
      {
        method: 'POST',
        body: JSON.stringify({ productId, returnUrl }),
      },
    )
  }

  // 작품 관리
  async createWork(data: { title: string; slug: string; subtitle?: string; description?: string }) {
    return this.fetch<any>('/works', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateWork(id: string, data: { title?: string; subtitle?: string; description?: string; context?: string | null; instructions?: string | null }) {
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

  /**
   * 에피소드 재업로드 (파일 덮어쓰기 — 2026-04-24)
   * 서비스 원칙: 본문 복붙/타이핑 금지 → 파일 업로드로만 교체.
   * 서버가 블록 재파싱 + RAG 재인덱싱까지 자동 수행.
   */
  async reuploadEpisode(episodeId: string, data: { title?: string; rawContent: string; sourceFormat?: string }) {
    return this.fetch<Record<string, unknown>>(`/episodes/${episodeId}/reupload`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /** 작가 본인 에피소드 rawMd 조회 (인라인 본문 편집용, 묶음 MM 신설)
   * 신설 사유: public getEpisode는 rawMd 의도적 제거 (Constitution P3 작가 콘텐츠 보호).
   * 작가 본인이 dashboard 본문 편집 페이지에서 직접 호출.
   */
  async getEpisodeRaw(episodeId: string) {
    return this.fetch<{
      id: string
      title: string
      subtitle: string | null
      description: string | null
      rawMd: string
      sourceFormat: string
      orderNum: number
    }>(`/episodes/${episodeId}/raw`)
  }

  async updateEpisodeStatus(workId: string, episodeId: string, status: 'upload' | 'public' | 'nonPublic') {
    return this.fetch<{ status: string }>(`/works/${workId}/episodes/${episodeId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async createShareLink(workId: string, episodeId: string, expireIn: '12h' | '24h' | '48h' | 'never') {
    return this.fetch<{ sharedUrl: string; expireAt: string | null }>(`/works/${workId}/episodes/${episodeId}/share`, {
      method: 'POST',
      body: JSON.stringify({ expireIn }),
    })
  }

  async getSharedEpisode(token: string) {
    return this.fetch<any>(`/episodes/shared/${token}`)
  }

  // 원고 파싱 (텍스트)
  async parseManuscript(rawText: string) {
    return this.fetch<{
      frontmatter: Record<string, string>
      title?: string
      normalizedTitle?: string
      blocks: Record<string, unknown>[]
    }>('/manuscripts/parse', {
      method: 'POST',
      body: JSON.stringify({ mdText: rawText }),
    })
  }

  // 원고 파일 업로드 (DOCX/HWP 등 바이너리 파일 서버사이드 파싱)
  async uploadManuscriptFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${getApiBaseUrl()}/manuscripts/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `업로드 오류: ${res.status}`)
    }
    return res.json() as Promise<{
      frontmatter: Record<string, string>
      title?: string
      normalizedTitle?: string
      blocks: Record<string, unknown>[]
    }>
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

  // 크레딧 선물 (authorSlug 기반)
  async giftCredits(authorSlug: string, amount: number) {
    return this.fetch<{ senderCredits: number; receiverCredits: number }>(`/social/gift/${authorSlug}`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  // 크레딧 잔액 조회
  async getCreditBalance() {
    return this.fetch<{ credits: number }>('/credits/balance')
  }

  /**
   * 포인트 잔액 조회 (크레딧 개편 I Phase — 디노미네이션 + 4 출처 회계).
   *
   * server `/credits/balance` 는 디노미 전환 backward-compatible 단계에서
   * 정수 `credits` 만 반환할 수 있다. 그 경우 web 에서 ×1,000 환산해 총 포인트로 표시한다.
   * server 가 출처별 잔액(`pointsFree` 등 / `bySource`)을 반환하면 그대로 통과시킨다.
   * 없는 출처 값은 만들지 않는다 (CLAUDE.md §0 추정 금지).
   *
   * 정본: shared-contracts §30 CreditOverhaul.
   */
  async getPointBalance(): Promise<PointBalanceView> {
    const raw = await this.fetch<CreditBalanceResponse>('/credits/balance')
    return normalizePointBalance(raw)
  }

  // 크레딧 사용 로그
  async getCreditLogs() {
    return this.fetch<{ id: string; type: string; amount: number; description: string; createdAt: string }[]>('/credits/logs')
  }

  // AI 분석
  async indexEpisode(episodeId: string, workId: string, rawText: string) {
    return this.fetch<{ chunkCount: number; tokensUsed: number }>('/analysis/index', {
      method: 'POST',
      body: JSON.stringify({ episodeId, workId, rawText }),
    })
  }

  /**
   * AI 일관성 분석 (Q1=(a) 모드, 2026-04-24)
   *
   * Claude Projects 벤치마크(`docs/ai-analysis-spec.md §6-1`) 정합:
   * - 작가는 회차 업로드 시점에 본문 제공 완료 → 분석 화면에서 본문 재입력 금지
   * - 회차 ID만 보내면 서버가 DB의 Episode.rawMd로 분석 + 자기 자신 청크 자동 제외
   */
  async analyzeEpisode(
    episodeId: string,
    types?: ('consistency' | 'tone' | 'character')[],
  ) {
    try {
      return await this.fetch<AnalysisResult[]>('/analysis/check', {
        method: 'POST',
        body: JSON.stringify({ episodeId, types }),
        // 서버측은 RAG 검색 + Claude Sonnet 4 3종 병렬 호출 + 환각 검증을 수행.
        // cold start까지 겹치면 60s는 초과할 수 있어 120s로 상향.
        signal: AbortSignal.timeout(120000),
      })
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        throw new Error('분석 시간이 초과되었습니다 (최대 2분). 분석 항목 수를 줄여 다시 시도해주세요. 서버가 내부적으로 실패로 확정한 경우 크레딧이 자동 환불되지만, 서버 처리 자체는 이미 성공해서 결과만 네트워크상에서 누락된 경우는 차감이 유지될 수 있어 크레딧 페이지에서 잔액을 확인해주세요.')
      }
      throw err
    }
  }

  async getAnalysisStatus(workId: string) {
    return this.fetch<IndexStatus>(`/analysis/status/${workId}`)
  }

  /** 분석 히스토리 목록 (본인, 최신순 50건) */
  async getAnalysisReports() {
    return this.fetch<AnalysisReportSummary[]>('/analysis/reports')
  }

  /** 분석 리포트 단건 상세 (results 포함, 소유권 검증) */
  async getAnalysisReport(id: string) {
    return this.fetch<AnalysisReport>(`/analysis/reports/${id}`)
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

  // 조회수 통계 (서버 stats.controller.ts와 ContentController 간 라우트 shadowing을 피하려고 /stats 접두어 사용)
  async getWorkStats(workId: string) {
    return this.fetch<{ dates: string[]; counts: number[]; totalViews: number }>(`/stats/works/${workId}`)
  }

  // 커버 이미지 업로드
  async uploadCover(workId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${getApiBaseUrl()}/works/${workId}/cover`, {
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

  // ─── 관리자 API ───

  async adminLogin(email: string, password: string) {
    return this.fetch<{ user: { id: string; slug: string; name: string; email: string; role: string } }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async adminGetStats() {
    return this.fetch<{ totalAuthors: number; totalWorks: number; totalEpisodes: number; totalCreditsConsumed: number }>('/admin/stats')
  }

  async adminListAuthors(params?: { page?: number; limit?: number; q?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.q) qs.set('q', params.q)
    return this.fetch<{ items: any[]; total: number }>(`/admin/authors?${qs}`)
  }

  async adminGetAuthor(authorId: string) {
    return this.fetch<any>(`/admin/authors/${authorId}`)
  }

  async adminCreateAuthor(data: { email: string; name: string; slug: string; password: string; plan?: string }) {
    return this.fetch<any>('/admin/authors', { method: 'POST', body: JSON.stringify(data) })
  }

  async adminUpdateAuthor(authorId: string, data: { name?: string; bio?: string }) {
    return this.fetch<any>(`/admin/authors/${authorId}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  async adminDeleteAuthor(authorId: string) {
    return this.fetch<{ deleted: boolean }>(`/admin/authors/${authorId}`, { method: 'DELETE' })
  }

  /**
   * 운영자 강제 사용자 탈퇴 (USER-SOFT-DELETE sprint §5-4 정합).
   *
   * - admin role 영역 (JWT + AdminGuard)
   * - server 영역: User.deletedAt 박제 + GDPR basic 익명화 + RefreshToken Cascade 무효화
   * - 30일 후 cron으로 hard delete (회계 8건 Restrict 정합 강제)
   * - 사유(reason) 필수 — AdminAuditLog에 박제 (action=`admin_force_delete`, beforeState/afterState 박제)
   *
   * @returns `{ deletedAt: string }` — soft delete 박제 시각
   */
  async adminForceDeleteAuthor(authorId: string, reason: string) {
    return this.fetch<{ deletedAt: string }>(`/admin/authors/${authorId}/force-delete`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  /**
   * 운영자 GDPR 익명화 (USER-SOFT-DELETE sprint §7-1 옵션 A — basic).
   *
   * - admin role 영역 (JWT + AdminGuard)
   * - basic 익명화: email → `deleted-{uuid}@grimoire.local` + name → `Deleted Author` + passwordHash → null + bio → null
   * - GDPR Article 17 (Right to Erasure) 정합 영역
   * - 사유(reason) 필수 — AdminAuditLog에 박제 (action=`gdpr_anonymize`)
   * - 본 작업은 soft delete와 독립 — 작성자 요청 시 즉시 익명화 영역
   *
   * @returns `{ anonymizedAt: string }` — 익명화 박제 시각
   */
  async adminAnonymizeAuthor(authorId: string, reason: string) {
    return this.fetch<{ anonymizedAt: string }>(`/admin/authors/${authorId}/anonymize`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async adminChangeRole(authorId: string, role: string) {
    return this.fetch<any>(`/admin/authors/${authorId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) })
  }

  async adminChangePlan(authorId: string, plan: string, durationDays: number) {
    return this.fetch<{ success: boolean }>(`/admin/authors/${authorId}/plan`, { method: 'PATCH', body: JSON.stringify({ plan, durationDays }) })
  }

  async adminGrantCredits(authorId: string, amount: number, reason: string) {
    return this.fetch<any>('/admin/credits/grant', { method: 'POST', body: JSON.stringify({ authorId, amount, reason }) })
  }

  async adminDeductCredits(authorId: string, amount: number, reason: string) {
    return this.fetch<any>('/admin/credits/deduct', { method: 'POST', body: JSON.stringify({ authorId, amount, reason }) })
  }

  async adminGetCreditLogs(authorId?: string) {
    const qs = authorId ? `?authorId=${authorId}` : ''
    return this.fetch<any[]>(`/admin/credits/logs${qs}`)
  }

  async adminListWorks(params?: { page?: number; limit?: number; q?: string; authorId?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.q) qs.set('q', params.q)
    if (params?.authorId) qs.set('authorId', params.authorId)
    return this.fetch<{ items: any[]; total: number }>(`/admin/works?${qs}`)
  }

  async adminGetWorkDetail(workId: string) { return this.fetch<any>(`/admin/works/${workId}`) }

  async adminChangeEpisodeStatus(workId: string, episodeId: string, status: string) {
    return this.fetch<any>(`/admin/works/${workId}/episodes/${episodeId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  }

  async adminListComments(params?: { page?: number; limit?: number; episodeId?: string; q?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.episodeId) qs.set('episodeId', params.episodeId)
    if (params?.q) qs.set('q', params.q)
    return this.fetch<{ items: any[]; total: number }>(`/admin/comments?${qs}`)
  }

  async adminDeleteComment(commentId: string) {
    return this.fetch<{ deleted: boolean }>(`/admin/comments/${commentId}`, { method: 'DELETE' })
  }

  async adminListPayments(params?: { page?: number; limit?: number; authorId?: string; status?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.authorId) qs.set('authorId', params.authorId)
    if (params?.status) qs.set('status', params.status)
    return this.fetch<{ items: any[]; total: number }>(`/admin/payments?${qs}`)
  }

  async adminListAccessLogs(params?: { page?: number; limit?: number; action?: string; ip?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.action) qs.set('action', params.action)
    if (params?.ip) qs.set('ip', params.ip)
    return this.fetch<{ items: any[]; total: number }>(`/admin/access-logs?${qs}`)
  }

  // 제재
  async adminSanctionUser(body: { authorId: string; type: string; reason: string; detail?: string }) {
    return this.fetch<any>('/admin/sanctions', { method: 'POST', body: JSON.stringify(body) })
  }
  async adminLiftSanction(sanctionId: string) {
    return this.fetch<any>(`/admin/sanctions/${sanctionId}`, { method: 'DELETE' })
  }
  async adminListSanctions(authorId?: string) {
    const qs = authorId ? `?authorId=${authorId}` : ''
    return this.fetch<any[]>(`/admin/sanctions${qs}`)
  }

  // 신고
  async adminListReports(params?: { page?: number; status?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.status) qs.set('status', params.status)
    return this.fetch<{ items: any[]; total: number }>(`/admin/reports?${qs}`)
  }
  async adminResolveReport(reportId: string, action: 'approved' | 'rejected') {
    return this.fetch<any>(`/admin/reports/${reportId}`, { method: 'PATCH', body: JSON.stringify({ action }) })
  }

  // 시스템 설정
  async adminGetSettings() { return this.fetch<Record<string, string>>('/admin/settings') }
  async adminUpdateSetting(key: string, value: string) {
    return this.fetch<any>(`/admin/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) })
  }

  // 시계열 통계
  async adminGetTimeseries(metric: string, days?: number) {
    const qs = new URLSearchParams({ metric })
    if (days) qs.set('days', String(days))
    return this.fetch<{ date: string; count: number }[]>(`/admin/stats/timeseries?${qs}`)
  }

  // 공지사항
  async adminListAnnouncements(page?: number) {
    return this.fetch<{ items: any[]; total: number }>(`/admin/announcements?page=${page ?? 1}`)
  }
  async adminCreateAnnouncement(data: { title: string; content: string; isPinned?: boolean; target?: string }) {
    return this.fetch<any>('/admin/announcements', { method: 'POST', body: JSON.stringify(data) })
  }
  async adminDeleteAnnouncement(id: string) {
    return this.fetch<any>(`/admin/announcements/${id}`, { method: 'DELETE' })
  }

  // 추천 작품
  async adminListFeatured(section?: string) {
    const qs = section ? `?section=${section}` : ''
    return this.fetch<any[]>(`/admin/featured${qs}`)
  }
  async adminAddFeatured(data: { workId: string; section?: string; position?: number }) {
    return this.fetch<any>('/admin/featured', { method: 'POST', body: JSON.stringify(data) })
  }
  async adminRemoveFeatured(id: string) {
    return this.fetch<any>(`/admin/featured/${id}`, { method: 'DELETE' })
  }

  async adminGetRevenue() { return this.fetch<any>('/admin/revenue') }
  async adminListSystemThemes() { return this.fetch<any[]>('/admin/themes') }
  async adminCreateSystemTheme(data: { name: string; preset: string; overrides: any }) {
    return this.fetch<any>('/admin/themes', { method: 'POST', body: JSON.stringify(data) })
  }
  async adminDeleteSystemTheme(themeId: string) {
    return this.fetch<any>(`/admin/themes/${themeId}`, { method: 'DELETE' })
  }

  async adminGetAuditLogs(params?: { page?: number; action?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.action) qs.set('action', params.action)
    return this.fetch<{ items: any[]; total: number }>(`/admin/audit-logs?${qs}`)
  }
}

export const api = new ApiClient()
