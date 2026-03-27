// 탐색 페이지 상태 — 뒤로가기 시 데이터/스크롤 복원용
import { create } from 'zustand'

export interface WorkItem {
  id: string; slug: string; title: string
  authorSlug?: string; authorName?: string
  genre?: string; viewCount?: number; episodeCount?: number
}

// TTL — loaded 후 5분 경과 시 재요청
const LOADED_TTL_MS = 5 * 60 * 1000

interface ExploreStore {
  popularWorks: WorkItem[]
  recentWorks: WorkItem[]
  scrollY: number
  loaded: boolean
  loadedAt: number | null
  // 페이지네이션 상태
  popularPage: number
  recentPage: number
  popularHasMore: boolean
  recentHasMore: boolean
  popularLoading: boolean
  recentLoading: boolean
  setPopularWorks: (works: WorkItem[]) => void
  appendPopularWorks: (works: WorkItem[]) => void
  setRecentWorks: (works: WorkItem[]) => void
  appendRecentWorks: (works: WorkItem[]) => void
  setScrollY: (y: number) => void
  setLoaded: (v: boolean) => void
  setPopularPage: (p: number) => void
  setRecentPage: (p: number) => void
  setPopularHasMore: (v: boolean) => void
  setRecentHasMore: (v: boolean) => void
  setPopularLoading: (v: boolean) => void
  setRecentLoading: (v: boolean) => void
  /** loaded + TTL 고려하여 캐시 유효 여부 반환 */
  isStale: () => boolean
  /** 전체 상태 초기화 — 재시도 시 사용 */
  reset: () => void
}

export const useExploreStore = create<ExploreStore>((set, get) => ({
  popularWorks: [],
  recentWorks: [],
  scrollY: 0,
  loaded: false,
  loadedAt: null,
  popularPage: 1,
  recentPage: 1,
  popularHasMore: true,
  recentHasMore: true,
  popularLoading: false,
  recentLoading: false,
  setPopularWorks: (works) => set({ popularWorks: works }),
  appendPopularWorks: (works) => set((s) => ({ popularWorks: [...s.popularWorks, ...works] })),
  setRecentWorks: (works) => set({ recentWorks: works }),
  appendRecentWorks: (works) => set((s) => ({ recentWorks: [...s.recentWorks, ...works] })),
  setScrollY: (y) => set({ scrollY: y }),
  setLoaded: (v) => set({ loaded: v, loadedAt: v ? Date.now() : null }),
  setPopularPage: (p) => set({ popularPage: p }),
  setRecentPage: (p) => set({ recentPage: p }),
  setPopularHasMore: (v) => set({ popularHasMore: v }),
  setRecentHasMore: (v) => set({ recentHasMore: v }),
  setPopularLoading: (v) => set({ popularLoading: v }),
  setRecentLoading: (v) => set({ recentLoading: v }),
  isStale: () => {
    const { loaded, loadedAt } = get()
    if (!loaded) return true
    if (!loadedAt) return true
    return Date.now() - loadedAt > LOADED_TTL_MS
  },
  reset: () => set({
    popularWorks: [],
    recentWorks: [],
    scrollY: 0,
    loaded: false,
    loadedAt: null,
    popularPage: 1,
    recentPage: 1,
    popularHasMore: true,
    recentHasMore: true,
    popularLoading: false,
    recentLoading: false,
  }),
}))
