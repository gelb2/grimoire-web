# Design Tokens — ProjectGrimoire

> 정본: grimoire-web → grimoire-server에 동기화

---

## 개요

v0.15.0에서 `globals.css`가 삭제되고 `theme.css`로 대체되었다.

- **색상 토큰**: `@theme inline`에 정의 (opacity modifier 필수)
- **비색상 토큰**: `@layer utilities`에 유틸리티 클래스로 정의
- 비색상 토큰은 `var()` 참조 + fallback으로 ThemeProvider CSS 변수와 연동

---

## 색상 토큰 (@theme inline)

`theme.css`의 `@theme inline` 블록에 색상만 정의한다.
Tailwind CSS 4의 opacity modifier(`bg-g-bg/50` 등)를 사용하려면 `@theme inline` 등록이 필수.

| CSS Variable | Tailwind 토큰 | 용도 |
|-------------|--------------|------|
| `--color-g-bg` | `bg-g-bg` | 작가 테마 배경색 |
| `--color-g-bg2` | `bg-g-bg2` | 카드/섹션 배경 |
| `--color-g-text` | `text-g-text` | 본문 텍스트 |
| `--color-g-text-muted` | `text-g-text-muted` | 보조 텍스트 |
| `--color-g-text-dim` | `text-g-text-dim` | 가장 연한 텍스트 |
| `--color-g-text-bright` | `text-g-text-bright` | 제목, 강조 |
| `--color-g-accent` | `text-g-accent`, `bg-g-accent` | 주 강조색 |
| `--color-g-accent2` | `text-g-accent2` | 보조 강조색 |
| `--color-g-border` | `border-g-border` | 경계선 |

> 이 색상들은 ThemeProvider가 `<div style="--color-g-bg: ...">`로 주입한다.

---

## 비색상 토큰 (@layer utilities)

`theme.css`의 `@layer utilities` 블록에 유틸리티 클래스로 정의한다.
`var()` + fallback 패턴으로 ThemeProvider CSS 변수와 연동.

### 타이포그래피 크기

| 유틸리티 클래스 | CSS 변수 (fallback) | 용도 |
|---------------|-------------------|------|
| `fs-caption` | `--g-fs-caption` (0.75rem) | 캡션, 날짜 |
| `fs-label` | `--g-fs-label` (0.8125rem) | 라벨, 태그 |

### 자간 (letter-spacing)

| 유틸리티 클래스 | CSS 변수 (fallback) | 용도 |
|---------------|-------------------|------|
| `tracking-wide-g` | `--g-label-letter-spacing` (0.25em) | 넓은 자간 |
| `tracking-normal-g` | `--g-tracking-normal` (0.1em) | 기본 자간 |
| `tracking-tight-g` | `--g-tracking-tight` (0.05em) | 좁은 자간 |

### 라운딩

| 유틸리티 클래스 | CSS 변수 (fallback) | 용도 |
|---------------|-------------------|------|
| `pill-radius` | `--g-tab-pill-radius` (20px) | 필 버튼/탭 라운딩 |

### 폰트 패밀리

| 유틸리티 클래스 | CSS 변수 (fallback) | 용도 |
|---------------|-------------------|------|
| `font-g-serif` | `--g-font-serif` (EB Garamond, Noto Serif KR, Georgia, Batang, serif) | 세리프 본문 |
| `font-g-sans` | `--g-font-sans` (Inter, system-ui, sans-serif) | 산세리프 본문 |
| `font-ci` | — | 플랫폼 CI 폰트 |

---

## 기본 토큰 (DeerDevil 기반)

### 타이포그래피

| 토큰 | 값 | 용도 |
|------|-----|------|
| font-body-serif | EB Garamond, Noto Serif KR, Georgia, Batang, serif | 본문 (세리프) |
| font-body-sans | Inter, system-ui, sans-serif | 본문 (산세리프) |
| font-body-mono | JetBrains Mono, monospace | 본문 (모노) |
| font-heading | 본문과 동일 또는 별도 설정 | 제목 |

### 간격

| 토큰 | 값 | 용도 |
|------|-----|------|
| spacing-paragraph | 1.6em | 문단 간격 |
| spacing-chapter | 3rem | 챕터 간격 |
| max-width-reader | 700px | 읽기 영역 최대 폭 |
| max-width-landing | 800px | 랜딩 최대 폭 |

### 색상

테마별로 달라지므로 `theme-spec.md`의 프리셋 참조.

---

## 토큰 아키텍처 정책

1. **globals.css에 디자인토큰 금지** — 3단 우선순위 충돌 방지
2. 색상은 ThemeProvider + `@theme inline` 연동
3. 비색상은 ThemeProvider CSS 변수 → `@layer utilities` var()+fallback 연동
4. 매직넘버는 유틸리티 클래스로 추출하여 일관성 유지
