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
