import { create } from 'zustand'

export type PreviewTab = 'authorSpace' | 'episode'

interface ThemeEditorState {
  previewTab: PreviewTab
  manualTabSwitch: boolean
  setPreviewTab: (tab: PreviewTab) => void
  autoSwitchTab: (tab: PreviewTab) => void
  resetManualSwitch: () => void
}

// 에피소드 뷰어에만 영향을 주는 필드
const EPISODE_FIELDS = new Set([
  'typingSpeed', 'subtitleStyle', 'episodeLabelFormat', 'animation',
  'sectionSpacing', 'bodyLineHeight', 'bodySize', 'contentWidth',
])

// 작가공간에만 영향을 주는 필드
const AUTHOR_SPACE_FIELDS = new Set([
  'episodeListLayout', 'heroStyle', 'cardRadius', 'cardWatermarkOpacity',
  'cardHoverLift', 'cardCtaText', 'tabPillRadius', 'labelLetterSpacing',
  'showProfileTab',
])

/** 변경된 필드명으로 적절한 미리보기 탭을 추론 */
export function inferTabFromField(fieldName: string): PreviewTab | null {
  if (EPISODE_FIELDS.has(fieldName)) return 'episode'
  if (AUTHOR_SPACE_FIELDS.has(fieldName)) return 'authorSpace'
  return null // 공통 필드 — 탭 전환 안 함
}

export const useThemeEditorStore = create<ThemeEditorState>((set, get) => ({
  previewTab: 'authorSpace',
  manualTabSwitch: false,

  /** 수동 탭 전환 — 이후 자동 전환 중단 */
  setPreviewTab: (tab) => set({ previewTab: tab, manualTabSwitch: true }),

  /** 자동 탭 전환 — 수동 전환 상태이면 무시 */
  autoSwitchTab: (tab) => {
    if (!get().manualTabSwitch) set({ previewTab: tab })
  },

  /** 수동 전환 플래그 초기화 (다른 필드 조작 시) */
  resetManualSwitch: () => set({ manualTabSwitch: false }),
}))
