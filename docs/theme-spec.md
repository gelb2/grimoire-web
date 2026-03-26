# Theme Specification — ProjectGrimoire

> 정본: grimoire-web → grimoire-server에 동기화
> Claude API 응답 형식 + CSS Variables 매핑

## 테마 파라미터

Claude API가 생성하는 JSON의 스키마:

```typescript
interface ThemeDecorations {
  dividerIcon: "antler" | "star" | "dot" | "line" | "none"
  dividerColor: string        // CSS 색상 (예: "#9a8060"), 빈 문자열이면 accent 사용
  headerIcon: "antler" | "quill" | "book" | "none"
  headerSubtitle: string      // 헤더 부제 (예: "Short Fiction Anthology")
  cardAccentPosition: "left" | "top" | "none"
  footerText: string          // 푸터 설명 (예: "Inspired by the sensibility of A24")
}

interface AuthorTheme {
  // 색상
  bgPrimary: string       // 배경색 (예: "#07070a")
  bgSecondary: string     // 카드/섹션 배경 (예: "#0d0d12")
  textPrimary: string     // 본문 텍스트 (예: "#cdc8bc")
  textMuted: string       // 보조 텍스트 (예: "#7a7570")
  textDim: string         // 가장 연한 텍스트 (예: "#4a4740")
  textBright: string      // 강조 텍스트 (예: "#e8e3d8")
  accent: string          // 주 강조색 — 링크, 버튼 (예: "#9a8060")
  accent2: string         // 보조 강조색 — 제목, CTA (예: "#c4a46a")
  border: string          // 경계선 (예: "#1e1e26")

  // 타이포그래피
  fontBody: "serif" | "sans-serif" | "monospace"
  fontHeading: "serif" | "sans-serif" | "monospace"

  // 분위기
  animation: "typing" | "fade" | "slide" | "none"
  tone: "dark" | "light" | "sepia"

  // 레이아웃
  layout: "universe" | "grid" | "classic"
  // - "universe": DeerDevil 스타일 — 에피소드 네비게이션 탭 + 카드 그리드 + 타이핑 애니메이션
  // - "grid": 기본 그리드 레이아웃 — 작품 카드 목록
  // - "classic": 전통적 웹소설 목록형

  // 장식 요소
  decorations: ThemeDecorations

  // 추가 시각 요소 (optional)
  typingSpeed?: number     // ms per character (default: 50)
  cardRadius?: string      // border radius (default: "12px")
  navOpacity?: number      // nav bar opacity 0-1 (default: 0.95)
}
```

## CSS Variables 매핑

| 파라미터 | CSS Variable | Tailwind 토큰 | 적용 대상 |
|---------|-------------|--------------|----------|
| bgPrimary | `--u-bg` | `bg-u-bg` | body, 전체 배경 |
| bgSecondary | `--u-bg2` | `bg-u-bg2` | 카드, 섹션 |
| textPrimary | `--u-text` | `text-u-text` | 본문 |
| textMuted | `--u-text-muted` | `text-u-text-muted` | 보조 텍스트 |
| textDim | `--u-text-dim` | `text-u-text-dim` | 가장 연한 텍스트 |
| textBright | `--u-text-bright` | `text-u-text-bright` | 제목, 강조 |
| accent | `--u-accent` | `text-u-accent`, `bg-u-accent` | 강조색 |
| accent2 | `--u-accent2` | `text-u-accent2` | 보조 강조색 |
| border | `--u-border` | `border-u-border` | 경계선 |
| fontBody | `--u-serif` | `font-u-serif` | 본문 font-family |
| fontHeading | — | — | 제목 font-family (fontBody와 동일 시 생략) |

## 프리셋

| 이름 | tone | layout | bgPrimary | textPrimary | fontBody | animation |
|------|------|--------|-----------|-------------|----------|-----------|
| Midnight | dark | universe | #07070a | #cdc8bc | serif | typing |
| Parchment | sepia | grid | #f5f0e8 | #3d3529 | serif | fade |
| Morning | light | grid | #ffffff | #1a1a1a | sans-serif | slide |
| Neon | dark | grid | #0d0d0d | #e0e0e0 | monospace | none |
| Cream | light | grid | #faf8f5 | #4a4035 | serif | none |

## 레이아웃 타입

### universe (DeerDevil 스타일)
- 상단 네비게이션: 작가 브랜드 + 에피소드 탭
- 랜딩: 작가 아이콘 + 에피소드 카드 그리드 + 번외/후기 섹션
- 에피소드 뷰어: 타이핑 애니메이션 + 순차 페이드인 + 장식 구분선
- 장식 시스템: dividerIcon, headerIcon 등 decorations 설정에 따라 렌더링

### grid (기본)
- 작가 헤더 + 작품 카드 그리드
- 장식 요소 최소화
- 범용적인 깔끔한 레이아웃

### classic (전통)
- 목록형 에피소드 나열 (향후 구현)

## DeerDevil (사슴악마) 완전 테마 JSON

```json
{
  "bgPrimary": "#07070a",
  "bgSecondary": "#0d0d12",
  "textPrimary": "#cdc8bc",
  "textMuted": "#7a7570",
  "textDim": "#4a4740",
  "textBright": "#e8e3d8",
  "accent": "#9a8060",
  "accent2": "#c4a46a",
  "border": "#1e1e26",
  "fontBody": "serif",
  "fontHeading": "serif",
  "animation": "typing",
  "tone": "dark",
  "layout": "universe",
  "decorations": {
    "dividerIcon": "antler",
    "dividerColor": "#9a8060",
    "headerIcon": "antler",
    "headerSubtitle": "Short Fiction Anthology",
    "cardAccentPosition": "left",
    "footerText": "Inspired by the sensibility of A24"
  },
  "typingSpeed": 15,
  "cardRadius": "8px",
  "navOpacity": 0.95
}
```

## 장식 아이콘 레퍼런스

| dividerIcon | 설명 |
|-------------|------|
| `antler` | 사슴뿔 SVG — DeerDevil 전용 |
| `star` | 별표 — 판타지/서정 |
| `dot` | 점 3개 기본 구분선 |
| `line` | 단순 수평선 |
| `none` | 구분선 없음 |
