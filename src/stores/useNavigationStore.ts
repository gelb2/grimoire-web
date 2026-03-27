// 네비게이션 히스토리 스토어 — 뒤로가기 정책 관리
// "← 작가 공간으로" 같은 UI 뒤로가기 버튼이 정확한 경로를 알 수 있도록
import { create } from 'zustand'

interface NavigationState {
  /** 현재 페이지에 오기 전 경로 (UI "뒤로가기" 버튼용) */
  previousPath: string | null
  /** 현재 작가 공간 slug (작가 공간 내 이동 시 유지) */
  currentAuthorSlug: string | null
  /** 현재 작품 slug */
  currentWorkSlug: string | null

  /** 페이지 진입 시 호출 — 이전 경로 기록 */
  setNavContext: (opts: {
    previousPath?: string
    authorSlug?: string
    workSlug?: string
  }) => void

  /** 작가 공간 진입 */
  enterAuthorSpace: (authorSlug: string) => void

  /** 작가 공간 나가기 */
  leaveAuthorSpace: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  previousPath: null,
  currentAuthorSlug: null,
  currentWorkSlug: null,

  setNavContext: ({ previousPath, authorSlug, workSlug }) =>
    set((state) => ({
      previousPath: previousPath ?? state.previousPath,
      currentAuthorSlug: authorSlug ?? state.currentAuthorSlug,
      currentWorkSlug: workSlug ?? state.currentWorkSlug,
    })),

  enterAuthorSpace: (authorSlug) =>
    set({ currentAuthorSlug: authorSlug, currentWorkSlug: null }),

  leaveAuthorSpace: () =>
    set({ currentAuthorSlug: null, currentWorkSlug: null }),
}))
