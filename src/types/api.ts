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
  updatedAt: string
}

export interface AuthorSpace {
  author?: {
    id: string
    slug: string
    name: string
    bio?: string
  }
  // 플랫 구조 폴백
  id?: string
  slug?: string
  name?: string
  theme: Theme | null
  works: WorkSummary[]
}

export interface AuthorProfile {
  id: string
  slug: string
  name: string
  bio: string | null
  createdAt: string
  subscriberCount: number
  totalLikes: number
  works: WorkSummary[]
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
  work?: WorkSummary
  episodes?: EpisodeSummary[]
  // 플랫 구조 폴백
  id?: string
  slug?: string
  title?: string
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
