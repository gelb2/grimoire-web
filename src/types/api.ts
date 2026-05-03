/** API 응답 타입 정의 — api.ts에서 사용 */

export interface AuthUser {
  id: string
  slug: string
  name: string
  email: string
  credits: number
  bio?: string
  role?: string
}

export interface AuthResponse {
  user: AuthUser
  token?: string
}

export interface Theme {
  id: string
  authorId: string
  name: string
  preset: string
  overrides: Record<string, unknown> | null
  rawDescription: string | null
  /**
   * 베이킹된 테마 CSS의 **절대 URL** 또는 **NULL**.
   *
   * Sprint sprint-baked-css-url-absolute (P1-#7) — 방향 B 채택:
   * server가 GET /api/themes/{slug} 응답 단계에서 환경별 base URL로 동적 절대화하여
   * 항상 절대 URL(`https?://...`) 또는 NULL을 반환한다. 상대 경로(`/api/themes/css/{slug}`)
   * 박제는 폐지됨 (DB는 마이그레이션 `baked_css_url_clear_relative`로 일괄 NULL 정리).
   *
   * - 절대 URL: `<link rel="stylesheet" href={url}>` 로 직접 로드 (Blob CDN 또는 server fallback)
   * - NULL: link 미렌더 (ThemeProvider 인라인 스타일이 단독 적용)
   */
  bakedCssUrl: string | null
  isSlotted: boolean
  source: 'system' | 'ai' | 'user'
  updatedAt: string
}

export interface AuthorSpace {
  author: {
    id: string
    slug: string
    name: string
    bio?: string
    [key: string]: unknown
  }
  theme: Theme | null
  works: WorkSummary[]
  [key: string]: unknown
}

export interface AuthorProfile {
  author: Record<string, unknown> & {
    id: string
    slug: string
    name: string
  }
  works: WorkSummary[]
  subscriberCount: number
  totalLikes: number
  [key: string]: unknown
}

export interface WorkSummary {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  genre?: string
  episodeCount: number
  viewCount: number
  episodes?: EpisodeSummary[]
}

export interface WorkDetail {
  work: WorkSummary
  episodes: EpisodeSummary[]
  [key: string]: unknown
}

export interface EpisodeSummary {
  slug: string
  title: string
  subtitle?: string
  orderNum: number
  type?: string
}

export interface EpisodeData {
  id: string
  workId: string
  slug: string
  title: string
  subtitle?: string | null
  description?: string
  type: string
  num?: string
  orderNum?: number
  blocks: Record<string, unknown>[]
  rawMd?: string
  authorName?: string
  workTitle?: string
  prevSlug?: string | null
  nextSlug?: string | null
  createdAt?: string
}

export interface GiftedAuthor {
  id: string
  slug: string
  name: string
  bio: string | null
  totalGifted: number
}

export interface WorkStats {
  dates: string[]
  counts: number[]
  totalViews: number
}

export interface Product {
  id: string
  name: string
  credits: number
  price: number
  pricePerCredit: number
}

export interface AnalysisResult {
  type: 'consistency' | 'tone' | 'character'
  score: number
  summary: string
  issues: string[]
  suggestions: string[]
}

export interface IndexStatus {
  chunkCount: number
  isIndexed: boolean
}

/** 분석 히스토리 목록 항목 (GET /analysis/reports 응답, 2026-04-24 F4) */
export interface AnalysisReportSummary {
  id: string
  workId: string
  episodeId: string
  workTitle: string
  episodeTitle: string
  types: ('consistency' | 'tone' | 'character')[]
  scores: { type: 'consistency' | 'tone' | 'character'; score: number }[]
  creditsCharged: number
  createdAt: string
}

/** 분석 리포트 상세 (GET /analysis/reports/:id 응답) */
export interface AnalysisReport {
  id: string
  authorId: string
  workId: string
  episodeId: string
  workTitle: string
  episodeTitle: string
  types: ('consistency' | 'tone' | 'character')[]
  results: AnalysisResult[]
  creditsCharged: number
  createdAt: string
}
