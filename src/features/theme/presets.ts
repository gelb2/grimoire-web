// 장식 요소 — 테마 데코레이션 시스템
export interface ThemeDecorations {
  dividerIcon: "antler" | "star" | "dot" | "line" | "none"
  dividerColor: string
  headerIcon: "antler" | "quill" | "book" | "none"
  headerSubtitle: string    // 예: "Short Fiction Anthology"
  cardAccentPosition: "left" | "top" | "none"
  footerText: string        // 예: "Inspired by the sensibility of A24"
}

export interface AuthorTheme {
  // 색상
  bgPrimary: string
  bgSecondary: string
  textPrimary: string
  textMuted: string
  textDim: string
  textBright: string
  accent: string
  accent2: string
  border: string

  // 타이포그래피
  fontBody: "serif" | "sans-serif" | "monospace"
  fontHeading: "serif" | "sans-serif" | "monospace"

  // 분위기
  animation: "typing" | "fade" | "slide" | "none"
  tone: "dark" | "light" | "sepia"

  // 레이아웃 — "universe" = DeerDevil 스타일, "grid" = 일반 그리드
  layout: "universe" | "grid" | "classic"

  // 장식 요소
  decorations: ThemeDecorations

  // 추가 시각 요소 (optional, 기본값 있음)
  typingSpeed?: number     // ms per character (default: 50)
  cardRadius?: string      // border radius (default: "12px")
  navOpacity?: number      // nav bar opacity 0-1 (default: 0.95)
}

// 기본 장식 설정 — layout: "grid" 전용
const defaultDecorations: ThemeDecorations = {
  dividerIcon: "dot",
  dividerColor: "",
  headerIcon: "none",
  headerSubtitle: "",
  cardAccentPosition: "left",
  footerText: "",
}

// Midnight — 사슴악마 기본 테마 (DeerDevil 원본 값 그대로)
const midnight: AuthorTheme = {
  bgPrimary: "#07070a",
  bgSecondary: "#0d0d12",
  textPrimary: "#cdc8bc",
  textMuted: "#7a7570",
  textDim: "#4a4740",
  textBright: "#e8e3d8",
  accent: "#9a8060",
  accent2: "#c4a46a",
  border: "#1e1e26",
  fontBody: "serif",
  fontHeading: "serif",
  animation: "typing",
  tone: "dark",
  layout: "universe",
  decorations: {
    dividerIcon: "antler",
    dividerColor: "#9a8060",
    headerIcon: "antler",
    headerSubtitle: "Short Fiction Anthology",
    cardAccentPosition: "left",
    footerText: "Inspired by the sensibility of A24",
  },
}

// Parchment — 역사/고전 느낌
const parchment: AuthorTheme = {
  bgPrimary: "#f5f0e8",
  bgSecondary: "#ebe5d8",
  textPrimary: "#3d3529",
  textMuted: "#8a7e6b",
  textDim: "#b5a992",
  textBright: "#1a1510",
  accent: "#8b6914",
  accent2: "#a67c1a",
  border: "#d5cbb8",
  fontBody: "serif",
  fontHeading: "serif",
  animation: "fade",
  tone: "sepia",
  layout: "grid",
  decorations: defaultDecorations,
}

// Morning — 로맨스/일상 밝은 톤
const morning: AuthorTheme = {
  bgPrimary: "#ffffff",
  bgSecondary: "#f8f8fa",
  textPrimary: "#1a1a1a",
  textMuted: "#6b7280",
  textDim: "#9ca3af",
  textBright: "#000000",
  accent: "#2563eb",
  accent2: "#3b82f6",
  border: "#e5e7eb",
  fontBody: "sans-serif",
  fontHeading: "sans-serif",
  animation: "slide",
  tone: "light",
  layout: "grid",
  decorations: defaultDecorations,
}

// Neon — SF/사이버펑크
const neon: AuthorTheme = {
  bgPrimary: "#0d0d0d",
  bgSecondary: "#1a1a2e",
  textPrimary: "#e0e0e0",
  textMuted: "#888899",
  textDim: "#555566",
  textBright: "#ffffff",
  accent: "#00ff88",
  accent2: "#00cc6a",
  border: "#2a2a3e",
  fontBody: "monospace",
  fontHeading: "monospace",
  animation: "none",
  tone: "dark",
  layout: "grid",
  decorations: defaultDecorations,
}

// Cream — 에세이/시 따뜻한 톤
const cream: AuthorTheme = {
  bgPrimary: "#faf8f5",
  bgSecondary: "#f0ede8",
  textPrimary: "#4a4035",
  textMuted: "#8a7e70",
  textDim: "#b5aa9a",
  textBright: "#2a2018",
  accent: "#c4956a",
  accent2: "#d4a57a",
  border: "#e0d8cc",
  fontBody: "serif",
  fontHeading: "sans-serif",
  animation: "none",
  tone: "light",
  layout: "grid",
  decorations: defaultDecorations,
}

export const themePresets: Record<string, AuthorTheme> = {
  midnight,
  parchment,
  morning,
  neon,
  cream,
}

// 작가 slug → 테마 매핑 (Phase 0에서는 하드코딩, Phase 1에서 DB로 이관)
export const authorThemeMap: Record<string, string> = {
  deerdevil: "midnight",
}

export function getThemeForAuthor(authorSlug: string): AuthorTheme {
  const presetName = authorThemeMap[authorSlug] ?? "midnight"
  return themePresets[presetName] ?? themePresets.midnight
}
