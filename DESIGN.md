# DESIGN.md — 사슴악마 UI 디자인 시스템

## 디자인 철학

A24 영화 감성의 다크 판타지 소설 뷰어.
최소한의 UI, 최대한의 몰입감. 장식보다 타이포그래피.

---

## 스타일 방식

**Tailwind CSS 4 유틸리티 클래스 기반** + CSS Variables.

- `globals.css`의 `@theme inline`에서 디자인 토큰 정의
- `universe/layout.tsx`에서 `--u-*` CSS 변수 선언 (Universe 스코프)
- 컴포넌트에서는 `bg-u-bg`, `text-u-accent2`, `tracking-u-wide` 등 토큰 클래스 사용
- `cn()` 유틸 (`clsx` + `tailwind-merge`)로 조건부 클래스 병합
- 인라인 `style={{}}` 사용 금지 — CSS 변수 선언 영역(layout.tsx)만 예외

---

## 디자인 토큰

### 색상 토큰

| Tailwind 클래스 | CSS 변수 | 값 | 용도 |
|----------------|----------|------|------|
| `bg-u-bg` / `text-u-bg` | `--u-bg` | `#07070a` | 메인 배경 |
| `bg-u-bg2` | `--u-bg2` | `#0d0d12` | 카드/블록 배경 |
| `text-u-text` | `--u-text` | `#cdc8bc` | 본문 텍스트 |
| `text-u-text-muted` | `--u-text-muted` | `#7a7570` | 부제/보조 텍스트 |
| `text-u-text-dim` | `--u-text-dim` | `#4a4740` | 레이블/희미한 텍스트 |
| `text-u-text-bright` | — | `#e8e3d8` | 제목/h1 (밝은 크림) |
| `text-u-text-warm` | — | `#b0a895` | 이탤릭 본문 |
| `text-u-text-soft` | — | `#c8c3b8` | 특수 카드 제목 |
| `text-u-accent` / `bg-u-accent` | `--u-accent` | `#9a8060` | 액센트 (구분선, 뿔 SVG) |
| `text-u-accent2` | `--u-accent2` | `#c4a46a` | 강조 (활성 탭, 챕터 제목) |
| `border-u-border` | `--u-border` | `#1e1e26` | 테두리 |

### 폰트 토큰

| Tailwind 클래스 | 폰트 스택 |
|----------------|-----------|
| `font-u-serif` | EB Garamond + Noto Serif KR + Georgia + Batang |
| `font-u-sans` | system-ui, -apple-system, sans-serif |

### 간격 토큰 (컴포넌트 간 일관성 보장)

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `mt-u-section` / `mb-u-section` | `3.5rem` | 섹션 간 여백 |
| `mt-u-block` / `mb-u-block` | `1.8rem` | 블록 간 여백 |
| `mt-u-paragraph` / `mb-u-paragraph` | `1.3rem` | 문단 간 여백 |

### 읽기 폭 토큰

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `max-w-u-landing` | `900px` | 랜딩 그리드 |
| `max-w-u-reader` | `700px` | 에피소드/후기 뷰어 |
| `max-w-u-reader-narrow` | `640px` | 일러두기 (학술 문서 톤) |

### 타이포 크기 토큰

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `text-u-label` | `10px` | 섹션 라벨, 에피소드 번호 |
| `text-u-caption` | `11px` | 캡션, 부제, 탭 |
| `text-u-body-sm` | `14px` | 각주 등 작은 본문 |

### 자간 토큰 (흔들림 방지)

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `tracking-u-wide` | `0.25em` | 라벨/카테고리 헤더 |
| `tracking-u-normal` | `0.1em` | 네비/링크/캡션 |
| `tracking-u-tight` | `0.05em` | 브랜드/소제목 |

### 둥글기 토큰

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `rounded-u-card` | `8px` | 카드, 컨테이너 |
| `rounded-u-pill` | `20px` | 탭 버튼, 뒤로가기 링크 |

---

## 타이포그래피

### 폰트 크기 (컴포넌트별)

| 용도 | 크기 | 비고 |
|------|------|------|
| 본문 기본 | 19px, line-height 1.85 | layout.tsx에서 설정 |
| h1 (에피소드 제목) | text-4xl, italic, weight 400 | |
| h1 (랜딩 타이틀) | text-5xl, italic | |
| 챕터 제목 | 1.1rem, italic, weight 500 | |
| 카드 제목 | text-xl, italic | |
| UI 레이블 | text-u-label, uppercase, tracking-u-wide | |
| 일러두기 본문 | 17px, line-height 1.75 | |
| 후기 글리치 텍스트 | 13px, mono, opacity 0.4 | |

---

## 레이아웃

- **에피소드 뷰어**: `max-w-u-reader` (700px), 중앙 정렬
- **일러두기 뷰어**: `max-w-u-reader-narrow` (640px)
- **랜딩 페이지**: `max-w-u-landing` (900px)
- **카드 그리드**: `grid-cols-[repeat(auto-fit,minmax(260px,1fr))]`

---

## 네비게이션

- Sticky top, `bg-u-bg/95` + `backdrop-blur-sm`
- 탭: 알약 형태 (`rounded-u-pill`), hover 시 accent 테두리
- 활성 탭: `text-u-accent2` + `border-u-accent` + `bg-u-accent/10`

---

## 시각 요소

### 사슴뿔 SVG (`AntlerSVG`)
- 크기: 20-48px (용도별 조절)
- 색상: `#9a8060` (u-accent)
- 용도: 구분선 장식, 카드 워터마크, 헤더 장식

### 구분선
- 점 세 개 (Divider): `size-1 rounded-full bg-u-accent`, opacity 0.3
- 뿔 구분선: `flex items-center` + AntlerSVG + `h-px bg-u-accent`
- 단순 선: `h-px bg-u-border`

### 카드 인터랙션
- hover 시: `-translate-y-0.5`, `border-u-accent`
- 좌측 accent 라인: `w-[3px]`, `group-hover:bg-u-accent`

---

## 공통 패턴 (재사용 클래스 조합)

```
# 섹션 라벨
font-u-sans text-u-label tracking-u-wide text-u-text-dim uppercase

# 캡션/부제
font-u-sans text-u-caption text-u-text-muted tracking-u-normal

# 뒤로가기 링크
inline-flex items-center gap-2 font-u-sans text-u-caption tracking-u-normal
text-u-text-muted border border-u-border px-4 py-1.5 rounded-u-pill
hover:border-u-accent hover:text-u-accent2 transition-all duration-200
```
