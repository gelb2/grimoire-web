# Theme Specification — ProjectGrimoire

> 정본: grimoire-web → grimoire-server에 동기화
> Claude API 응답 형식 + CSS Variables 매핑

## 테마 파라미터

Claude API가 생성하는 JSON의 스키마:

```typescript
interface AuthorTheme {
  // 색상
  bgPrimary: string       // 배경색 (예: "#0a0a0a")
  bgSecondary: string     // 카드/섹션 배경 (예: "#1a1a1a")
  textPrimary: string     // 본문 텍스트 (예: "#d4c5a0")
  textMuted: string       // 보조 텍스트 (예: "#8a7e6b")
  textBright: string      // 강조 텍스트 (예: "#e8dcc8")
  accent: string          // 강조색 — 링크, 버튼 (예: "#c4a46c")
  border: string          // 경계선 (예: "#2a2520")

  // 타이포그래피
  fontBody: "serif" | "sans-serif" | "monospace" | "handwriting"
  fontHeading: "serif" | "sans-serif" | "monospace" | "handwriting"
  fontSize: "compact" | "normal" | "large"

  // 분위기
  animation: "typing" | "fade" | "slide" | "none"
  cardStyle: "sharp" | "rounded" | "minimal"
  tone: "dark" | "light" | "sepia" | "custom"
}
```

## CSS Variables 매핑

| 파라미터 | CSS Variable | 적용 대상 |
|---------|-------------|----------|
| bgPrimary | `--g-bg` | body, 전체 배경 |
| bgSecondary | `--g-bg-card` | 카드, 섹션 |
| textPrimary | `--g-text` | 본문 |
| textMuted | `--g-text-muted` | 보조 텍스트 |
| textBright | `--g-text-bright` | 제목, 강조 |
| accent | `--g-accent` | 링크, 버튼 |
| border | `--g-border` | 경계선 |
| fontBody | `--g-font-body` | 본문 font-family |
| fontHeading | `--g-font-heading` | 제목 font-family |

## 프리셋

| 이름 | tone | bgPrimary | textPrimary | fontBody | animation |
|------|------|-----------|-------------|----------|-----------|
| Midnight | dark | #0a0a0a | #d4c5a0 | serif | typing |
| Parchment | sepia | #f5f0e8 | #3d3529 | serif | fade |
| Morning | light | #ffffff | #1a1a1a | sans-serif | slide |
| Neon | dark | #0d0d0d | #e0e0e0 | monospace | none |
| Cream | light | #faf8f5 | #4a4035 | handwriting | none |

## DeerDevil 매핑

사슴악마 작가 공간은 **Midnight** 프리셋 기반:

| DeerDevil CSS Variable | Grimoire CSS Variable |
|-----------------------|----------------------|
| --u-bg | --g-bg |
| --u-text | --g-text |
| --u-text-muted | --g-text-muted |
| --u-text-bright | --g-text-bright |
| --u-border | --g-border |
| --u-accent | --g-accent |
