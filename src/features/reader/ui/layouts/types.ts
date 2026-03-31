import type { AuthorTheme } from '@/features/theme'

export interface Episode {
  slug: string
  title: string
  subtitle?: string
  description?: string
  orderNum?: number
  type?: string
}

export interface Work {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  genre?: string
  episodeCount?: number
  viewCount?: number
  episodes?: Episode[]
}

export interface AuthorData {
  id: string
  slug: string
  name: string
  description?: string
  works?: Work[]
}

/** 모든 레이아웃 컴포넌트가 받는 공통 props */
export interface LayoutProps {
  author: AuthorData
  authorSlug: string
  theme: AuthorTheme
}
