// 탐색 페이지 상태 — 뒤로가기 시 데이터/스크롤 복원용
import { create } from 'zustand'

interface WorkItem {
  id: string; slug: string; title: string
  authorSlug?: string; authorName?: string
  genre?: string; viewCount?: number; episodeCount?: number
}

interface ExploreStore {
  popularWorks: WorkItem[]
  recentWorks: WorkItem[]
  scrollY: number
  loaded: boolean
  setPopularWorks: (works: WorkItem[]) => void
  setRecentWorks: (works: WorkItem[]) => void
  setScrollY: (y: number) => void
  setLoaded: (v: boolean) => void
}

export const useExploreStore = create<ExploreStore>((set) => ({
  popularWorks: [],
  recentWorks: [],
  scrollY: 0,
  loaded: false,
  setPopularWorks: (works) => set({ popularWorks: works }),
  setRecentWorks: (works) => set({ recentWorks: works }),
  setScrollY: (y) => set({ scrollY: y }),
  setLoaded: (v) => set({ loaded: v }),
}))
