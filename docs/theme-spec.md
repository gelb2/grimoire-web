# Theme Specification — ProjectGrimoire

> 정본: grimoire-web → grimoire-server에 동기화
> Claude API 응답 형식 + CSS Variables 매핑

## 테마 파라미터

Claude API가 생성하는 JSON의 스키마:

```typescript
interface ThemeDecorations {
  dividerIcon: "antler" | "flower" | "star" | "geometric" | "brush" | "leaf" | "camellia" | "umbrella" | "waterwheel" | "book" | "dot" | "line" | "none"
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
  episodeListLayout: "series" | "grid" | "classic" | "magazine" | "gallery" | "minimal"
  // - "series": 시리즈 소설 — 에피소드 네비게이션 탭 + 카드 그리드 + 타이핑 애니메이션
  // - "grid": 기본 그리드 레이아웃 — 작품 카드 목록
  // - "classic": 전통적 웹소설 목록형
  // - "magazine": 매거진 스타일 레이아웃
  // - "gallery": 갤러리 스타일 레이아웃
  // - "minimal": 미니멀 텍스트 중심
  // ※ v0.15.0에서 layout → episodeListLayout으로 리네이밍

  // 네비게이션
  navStyle?: "top" | "side" | "none"  // 네비게이션 스타일
  navOpacity?: number                  // 네비게이션 불투명도 (default: 0.95)

  // 히어로
  heroStyle?: "fullname" | "cover" | "minimal" | "none"
  tagline?: string                     // 작가 공간 태그라인 (예: "Inspired by the sensibility of A24")

  // 타이포그래피 Phase 1 (v0.16.0 추가)
  titleSize?: "sm" | "md" | "lg" | "xl"    // 제목 크기
  titleWeight?: "light" | "normal" | "bold" | "black"  // 제목 두께
  bodySize?: "compact" | "normal" | "large"            // 본문 크기
  letterSpacing?: "tight" | "normal" | "wide"  // 자간
  bodyLineHeight?: "compact" | "normal" | "relaxed"  // 행간
  contentWidth?: "narrow" | "normal" | "wide"  // 콘텐츠 폭

  // 장식 요소
  decorations: ThemeDecorations

  // 추가 시각 요소 (optional)
  typingSpeed?: number     // ms per character (default: 50)
  cardRadius?: string      // border radius (default: "8px")

  // UI 세부 조정 (v0.15.0 추가)
  tabPillRadius?: string          // 탭 필 버튼 라운딩 (예: "9999px")
  labelLetterSpacing?: string     // 라벨 자간 (예: "0.05em")
  cardWatermarkOpacity?: number   // 카드 워터마크 불투명도 0-1 (default: 0.03)
  cardHoverLift?: string          // 카드 호버 시 상승 거리 (예: "-4px")
  cardCtaText?: string            // 카드 CTA 텍스트 (예: "읽기", "Read")
  subtitleStyle?: "italic" | "normal"  // 부제 스타일
  episodeLabelFormat?: string     // 에피소드 라벨 포맷 (예: "EP.{n}", "제{n}화")
  sectionSpacing?: "sm" | "md" | "lg"  // 섹션 간 간격 (default: "md")
  showPreface?: boolean           // 서문 섹션 표시 여부 (default: true)
  showAfterword?: boolean         // 후기 섹션 표시 여부 (default: true)
  showProfileTab?: boolean        // 프로필 탭 표시 여부 (default: true)
  subscribeButtonStyle?: "outlined" | "filled"  // 구독 버튼 스타일
}
```

## CSS Variables 매핑

| 파라미터 | CSS Variable | Tailwind 토큰 | 적용 대상 |
|---------|-------------|--------------|----------|
| bgPrimary | `--g-bg` | `bg-g-bg` | body, 전체 배경 |
| bgSecondary | `--g-bg2` | `bg-g-bg2` | 카드, 섹션 |
| textPrimary | `--g-text` | `text-g-text` | 본문 |
| textMuted | `--g-text-muted` | `text-g-text-muted` | 보조 텍스트 |
| textDim | `--g-text-dim` | `text-g-text-dim` | 가장 연한 텍스트 |
| textBright | `--g-text-bright` | `text-g-text-bright` | 제목, 강조 |
| accent | `--g-accent` | `text-g-accent`, `bg-g-accent` | 강조색 |
| accent2 | `--g-accent2` | `text-g-accent2` | 보조 강조색 |
| border | `--g-border` | `border-g-border` | 경계선 |
| fontBody | `--g-serif` | `font-g-serif` | 본문 font-family |
| fontHeading | `--g-heading-font` | — | 제목 font-family |

## 프리셋

시스템 프리셋 8종 (DB: authorId=null, source='system'). deerDevil은 프리셋이 아님.

| 이름 | tone | episodeListLayout | bgPrimary | textPrimary | fontBody | animation |
|------|------|--------|-----------|-------------|----------|-----------|
| Midnight | dark | series | #08080e | #c8c4bc | serif | typing |
| Parchment | sepia | grid | #f5f0e8 | #3d3529 | serif | fade |
| Morning | light | grid | #ffffff | #1a1a1a | sans-serif | slide |
| Neon | dark | grid | #0d0d0d | #e0e0e0 | monospace | none |
| Cream | light | grid | #faf8f5 | #4a4035 | serif | none |
| Magazine | light | magazine | #ffffff | #1a1a1a | serif | fade |
| Gallery | dark | gallery | #0a0a0a | #e0e0e0 | sans-serif | fade |
| Minimal | dark | minimal | #111111 | #d4d0c8 | serif | none |

## 레이아웃 타입

### series (시리즈 소설)
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
  "episodeListLayout": "series",
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
}
```

## 장식 아이콘 레퍼런스

| dividerIcon | 설명 |
|-------------|------|
| `antler` | 사슴뿔 SVG — DeerDevil 전용 |
| `flower` | 꽃 장식 |
| `star` | 별표 — 판타지/서정 |
| `geometric` | 기하학 문양 |
| `brush` | 붓터치 |
| `leaf` | 잎사귀 |
| `camellia` | 동백꽃 |
| `umbrella` | 우산 |
| `waterwheel` | 물레방아 |
| `book` | 펼친 책 |
| `dot` | 점 3개 기본 구분선 |
| `line` | 단순 수평선 |
| `none` | 구분선 없음 |

## 초기 저장 테마 호환 (2026-11-14)

초기 복원 데이터에는 `layout`만 있고 `episodeListLayout`이 없는 테마가 있다. 독서 UI는 현재 `episodeListLayout`을 우선하고, 없을 때만 알려진 `layout` 값(series/grid/classic/magazine/gallery/minimal)을 읽는다. 둘 다 없거나 알 수 없는 값이면 기존 grid 기본값을 사용한다. 원본 테마 JSON을 덮어쓰거나 일괄 DB 변환하지 않는다. 구현은 웹 `src/features/theme/episode-list-layout.ts`다.
