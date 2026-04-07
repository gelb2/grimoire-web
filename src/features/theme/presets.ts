// 장식 요소 — 테마 데코레이션 시스템
export interface ThemeDecorations {
  dividerIcon: "antler" | "flower" | "star" | "geometric" | "brush" | "leaf" | "camellia" | "umbrella" | "waterwheel" | "book" | "dot" | "line" | "none"
  dividerColor: string
  headerIcon: "antler" | "quill" | "book" | "dot" | "none"
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

  // 에피소드 목록 표시 방식 — "series" = 시리즈 소설 (카드 그리드 + 히어로), "grid" = 작품 카드 나열
  episodeListLayout: "series" | "grid" | "classic" | "magazine" | "gallery" | "minimal"

  // 장식 요소
  decorations: ThemeDecorations

  // 작가별 대표 문구 (optional)
  tagline?: string         // 예: "결핍은 질문을 삼킨다."

  // 추가 시각 요소 (optional, 기본값 있음)
  typingSpeed?: number     // ms per character (default: 50)
  cardRadius?: string      // border radius (default: "12px")
  navOpacity?: number      // nav bar opacity 0-1 (default: 0.95)

  // ── Phase 1: 타이포그래피 확장 (레디맥 리서치 기반) ──
  titleSize?: "sm" | "md" | "lg" | "xl"          // 작가명/제목 크기 (default: "lg")
  titleWeight?: "light" | "normal" | "bold" | "black"  // 제목 두께 (default: "bold")
  letterSpacing?: "tight" | "normal" | "wide"     // 자간 (default: "normal")
  bodyLineHeight?: "compact" | "normal" | "relaxed"  // 본문 행간 (default: "relaxed")
  bodySize?: "compact" | "normal" | "large"        // 본문 크기 (default: "normal" = 19px)
  contentWidth?: "narrow" | "normal" | "wide"     // 읽기 영역 폭 (default: "normal")

  // ── Phase 2: 레이아웃 프리셋 (레디맥 리서치 기반) ──
  heroStyle?: "fullname" | "cover" | "minimal" | "none"  // 작가 랜딩 히어로 (default: "minimal")

  // ── 네비/탭 ──
  tabPillRadius?: string              // 탭 pill 둥글기 (default: "20px")

  // ── 레이블/텍스트 ──
  labelLetterSpacing?: string         // EPISODE 01 등 레이블 자간 (default: "0.25em")

  // ── 에피소드 카드 ──
  cardWatermarkOpacity?: number       // 카드 하단 아이콘 워터마크 투명도 (default: 0.15)
  cardHoverLift?: string              // 카드 hover 시 올라가는 정도 (default: "0.125rem")
  cardCtaText?: string                // 카드 CTA 텍스트 (default: "읽기 →")

  // ── 에피소드 뷰어 ──
  subtitleStyle?: "italic" | "normal" // 소제목 스타일 (default: "italic")
  episodeLabelFormat?: string         // 라벨 형식 — {author}, {type}, {num} 치환 (default: "{author} · {type} {num}")

  // ── 여백 ──
  sectionSpacing?: "sm" | "md" | "lg" // 섹션 간 여백 (default: "md")

  // ── 섹션 표시 ──
  showPreface?: boolean               // PREFACE 섹션 표시 여부 (default: true)
  showAfterword?: boolean             // AFTERWORD 섹션 표시 여부 (default: true)

  // ── 프로필/구독 ──
  showProfileTab?: boolean            // 네비에 프로필 탭 표시 (default: true)
  subscribeButtonStyle?: "outlined" | "filled"  // 구독 버튼 스타일 (default: "outlined")
}

// 기본 장식 설정 — episodeListLayout: "grid" 전용
const defaultDecorations: ThemeDecorations = {
  dividerIcon: "dot",
  dividerColor: "",
  headerIcon: "none",
  headerSubtitle: "",
  cardAccentPosition: "left",
  footerText: "",
}

// 기본값 — 기존 프리셋과 하위 호환
const defaultTypography = {
  titleSize: "lg" as const,
  titleWeight: "bold" as const,
  letterSpacing: "normal" as const,
  bodyLineHeight: "relaxed" as const,
  bodySize: "normal" as const,
  contentWidth: "normal" as const,
  heroStyle: "minimal" as const,
}

const defaultUI = {
  tabPillRadius: "20px",
  labelLetterSpacing: "0.25em",
  cardWatermarkOpacity: 0.15,
  cardHoverLift: "0.125rem",
  cardCtaText: "읽기 →",
  subtitleStyle: "italic" as const,
  episodeLabelFormat: "{author} · {type} {num}",
  sectionSpacing: "md" as const,
  showPreface: true,
  showAfterword: true,
  showProfileTab: true,
  subscribeButtonStyle: "outlined" as const,
}

// Midnight — 시스템 다크 프리셋 (book 아이콘, 보라 계열 accent)
const midnight: AuthorTheme = {
  bgPrimary: "#08080e",
  bgSecondary: "#0e0e16",
  textPrimary: "#c8c4bc",
  textMuted: "#7a7575",
  textDim: "#4a4545",
  textBright: "#e4e0d8",
  accent: "#8a7a90",
  accent2: "#a896b8",
  border: "#1e1e28",
  fontBody: "serif",
  fontHeading: "serif",
  animation: "typing",
  tone: "dark",
  episodeListLayout: "series",
  decorations: {
    dividerIcon: "book",
    dividerColor: "#8a7a90",
    headerIcon: "book",
    headerSubtitle: "Solitary Script For Midnight",
    cardAccentPosition: "left",
    footerText: "Until 4 AM",
  },
  ...defaultTypography,
  ...defaultUI,
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
  episodeListLayout: "grid",
  decorations: defaultDecorations,
  ...defaultTypography,
  ...defaultUI,
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
  episodeListLayout: "grid",
  decorations: defaultDecorations,
  ...defaultTypography,
  ...defaultUI,
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
  episodeListLayout: "grid",
  decorations: defaultDecorations,
  ...defaultTypography,
  ...defaultUI,
  titleWeight: "light",
  letterSpacing: "wide",
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
  episodeListLayout: "grid",
  decorations: defaultDecorations,
  ...defaultTypography,
  ...defaultUI,
  bodyLineHeight: "relaxed",
  contentWidth: "narrow",
}

// ── 레이아웃 특화 프리셋 (레디맥 리서치 기반) ──

// Magazine — 에디토리얼/잡지 스타일 (UNLEARNED 참고)
const magazine: AuthorTheme = {
  bgPrimary: "#ffffff",
  bgSecondary: "#f5f5f0",
  textPrimary: "#1a1a1a",
  textMuted: "#666666",
  textDim: "#999999",
  textBright: "#000000",
  accent: "#ff3333",
  accent2: "#cc0000",
  border: "#e0e0e0",
  fontBody: "serif",
  fontHeading: "sans-serif",
  animation: "fade",
  tone: "light",
  episodeListLayout: "magazine",
  decorations: {
    ...defaultDecorations,
    cardAccentPosition: "none",
  },
  titleSize: "xl",
  titleWeight: "black",
  letterSpacing: "tight",
  bodyLineHeight: "relaxed",
  contentWidth: "wide",
  heroStyle: "fullname",
  ...defaultUI,
}

// Gallery — 갤러리/포트폴리오 스타일 (AHYEON RYU 참고)
const gallery: AuthorTheme = {
  bgPrimary: "#0a0a0a",
  bgSecondary: "#141414",
  textPrimary: "#e0e0e0",
  textMuted: "#808080",
  textDim: "#4a4a4a",
  textBright: "#ffffff",
  accent: "#ff4444",
  accent2: "#ff6666",
  border: "#2a2a2a",
  fontBody: "sans-serif",
  fontHeading: "sans-serif",
  animation: "fade",
  tone: "dark",
  episodeListLayout: "gallery",
  decorations: {
    ...defaultDecorations,
    headerSubtitle: "",
    cardAccentPosition: "none",
  },
  titleSize: "xl",
  titleWeight: "black",
  letterSpacing: "wide",
  bodyLineHeight: "normal",
  contentWidth: "wide",
  heroStyle: "fullname",
  ...defaultUI,
}

// Minimal — 극단적 미니멀 (Frame 템플릿 참고)
const minimal: AuthorTheme = {
  bgPrimary: "#111111",
  bgSecondary: "#1a1a1a",
  textPrimary: "#d4d0c8",
  textMuted: "#8a8680",
  textDim: "#5a5650",
  textBright: "#f0ece4",
  accent: "#d4a46a",
  accent2: "#e4b47a",
  border: "#2a2a2a",
  fontBody: "serif",
  fontHeading: "serif",
  animation: "none",
  tone: "dark",
  episodeListLayout: "minimal",
  decorations: {
    ...defaultDecorations,
    dividerIcon: "none",
    headerIcon: "none",
    cardAccentPosition: "none",
  },
  titleSize: "lg",
  titleWeight: "light",
  letterSpacing: "wide",
  bodyLineHeight: "relaxed",
  contentWidth: "narrow",
  heroStyle: "cover",
  ...defaultUI,
}

/** 시스템 프리셋 8종 — DB system theme(authorId=null)의 원본 값 */
export const themePresets: Record<string, AuthorTheme> = {
  midnight,
  parchment,
  morning,
  neon,
  cream,
  magazine,
  gallery,
  minimal,
}

// 테마는 서버 API에서 로드 (layout.tsx → loadTheme)
// 로컬 프리셋은 테마 에디터의 시작점으로만 사용
