# DESIGN.md — Grimoire UI 디자인 시스템

> 이 문서는 `docs/design-tokens.md` (정본)에서 파생된 Tailwind 구현 가이드이다.
> 디자인 토큰의 정의 및 변경은 반드시 `docs/design-tokens.md`에서 먼저 수행한다.

## 디자인 철학

A24 영화 감성의 다크 판타지 소설 뷰어.
최소한의 UI, 최대한의 몰입감. 장식보다 타이포그래피.

---

## 멀티 작가 테마 시스템

각 작가는 고유한 테마를 가진다. 테마는 CSS Variables (`--g-*`)로 `[author]/layout.tsx`에서 동적 주입된다.

- 작가가 텍스트로 분위기를 구술 → Claude API가 테마 JSON 생성 → CSS Variables로 동적 렌더링
- 아래 DeerDevil 토큰은 **기본(baseline) 테마**이자 디자인 시스템의 참조 기준이다
- 작가별 테마가 로드되면 해당 `--g-*` 변수가 오버라이드된다
- 테마 파라미터 명세: `docs/theme-spec.md` 참조

---

## 스타일 방식

**Tailwind CSS 4 유틸리티 클래스 기반** + CSS Variables.

- `theme.css`의 `@theme inline`에서 디자인 토큰 정의
- `reader/layout.tsx`에서 `--g-*` CSS 변수 선언 (Universe 스코프)
- 컴포넌트에서는 `bg-g-bg`, `text-g-accent2`, `tracking-wide-g` 등 토큰 클래스 사용
- `cn()` 유틸 (`clsx` + `tailwind-merge`)로 조건부 클래스 병합
- 인라인 `style={{}}` 사용 금지 — CSS 변수 선언 영역(layout.tsx)만 예외

---

## 디자인 토큰

### 색상 토큰

| Tailwind 클래스 | CSS 변수 | 값 | 용도 |
|----------------|----------|------|------|
| `bg-g-bg` / `text-g-bg` | `--g-bg` | `#07070a` | 메인 배경 |
| `bg-g-bg2` | `--g-bg2` | `#0d0d12` | 카드/블록 배경 |
| `text-g-text` | `--g-text` | `#cdc8bc` | 본문 텍스트 |
| `text-g-text-muted` | `--g-text-muted` | `#7a7570` | 부제/보조 텍스트 |
| `text-g-text-dim` | `--g-text-dim` | `#4a4740` | 레이블/희미한 텍스트 |
| `text-g-text-bright` | `--g-text-bright` | `#e8e3d8` | 제목/h1 (밝은 크림) |
| `text-g-text-warm` | `--g-text-warm` | `#b0a895` | 이탤릭 본문 |
| `text-g-text-soft` | `--g-text-muted` | `#c8c3b8` | 특수 카드 제목 |
| `text-g-accent` / `bg-g-accent` | `--g-accent` | `#9a8060` | 액센트 (구분선, 뿔 SVG) |
| `text-g-accent2` | `--g-accent2` | `#c4a46a` | 강조 (활성 탭, 챕터 제목) |
| `border-g-border` | `--g-border` | `#1e1e26` | 테두리 |

### 폰트 토큰

| Tailwind 클래스 | 폰트 스택 |
|----------------|-----------|
| `font-g-serif` | EB Garamond + Noto Serif KR + Georgia + Batang |
| `font-g-sans` | system-ui, -apple-system, sans-serif |

### 간격 토큰 (컴포넌트 간 일관성 보장)

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `mt-g-section` / `mb-g-section` | `3.5rem` | 섹션 간 여백 |
| `mt-g-block` / `mb-g-block` | `1.8rem` | 블록 간 여백 |
| `mt-g-paragraph` / `mb-g-paragraph` | `1.3rem` | 문단 간 여백 |

### 읽기 폭

> ⚠️ 2026-06-27 문서 감사: 과거 표기하던 `max-w-g-landing`/`max-w-g-reader`/`max-w-g-reader-narrow` 커스텀 토큰은
> **코드에 존재하지 않는다(`grep` 0건)**. 실제 구현은 컴포넌트별 **표준 Tailwind 컨테이너 클래스**를 직접 사용한다.

| 영역 | 실제 클래스 (실측) | 컴포넌트 |
|------|------|----------|
| 작가 랜딩/작품 페이지 | `max-w-6xl` / `max-w-4xl` | `AuthorSpace`, `WorkPage`, `GridLayout` |
| 에피소드 뷰어 본문 | `max-w-prose` | `EpisodeViewer` |
| 댓글/푸터 영역 | `max-w-2xl` | `EpisodeFooter` |
| 매거진/미니멀 레이아웃 | `max-w-5xl` / `max-w-4xl` | `MagazineLayout`, `MinimalLayout` |

### 타이포 크기 토큰

| Tailwind 클래스 | 값 (fallback) | 용도 |
|----------------|------|------|
| `fs-label` | `0.8125rem` (≈13px) | 섹션 라벨, 에피소드 번호 |
| `fs-caption` | `0.75rem` (≈12px) | 캡션, 부제, 탭 |
| `text-sm` | `14px` | 각주 등 작은 본문 |

> ⚠️ `fs-label`/`fs-caption` 값은 `theme.css` `@layer utilities`의 fallback(`--g-fs-label`/`--g-fs-caption`) 실측치다. ThemeProvider가 작가 테마별로 덮어쓸 수 있다.

### 자간 토큰 (흔들림 방지)

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `tracking-wide-g` | `0.25em` | 라벨/카테고리 헤더 |
| `tracking-normal-g` | `0.1em` | 네비/링크/캡션 |
| `tracking-tight-g` | `0.05em` | 브랜드/소제목 |

### 둥글기 토큰

| Tailwind 클래스 | 값 | 용도 |
|----------------|------|------|
| `rounded-lg` | `8px` | 카드, 컨테이너 |
| `pill-radius` | `20px` | 탭 버튼, 뒤로가기 링크 |

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
| UI 레이블 | fs-label, uppercase, tracking-wide-g | |
| 일러두기 본문 | 17px, line-height 1.75 | |
| 후기 글리치 텍스트 | 13px, mono, opacity 0.4 | |

---

## 레이아웃

- **에피소드 뷰어 본문**: `max-w-prose`, 중앙 정렬 (`EpisodeViewer`)
- **작가 랜딩/작품 페이지**: `max-w-6xl` / `max-w-4xl` 중앙 정렬 (`AuthorSpace`/`WorkPage`/`GridLayout`)
- **카드 그리드**: `grid-cols-[repeat(auto-fit,minmax(260px,1fr))]`

> 읽기 폭은 커스텀 토큰이 아니라 표준 Tailwind 컨테이너 클래스 직접 사용. 상세는 위 "읽기 폭" 표 참조.

---

## 네비게이션

- Sticky top, `bg-g-bg/95` + `backdrop-blur-sm`
- 탭: 알약 형태 (`pill-radius`), hover 시 accent 테두리
- 활성 탭: `text-g-accent2` + `border-g-accent` + `bg-g-accent/10`

---

## 시각 요소

### 사슴뿔 SVG (`AntlerSVG`)
- 크기: 20-48px (용도별 조절)
- 색상: `#9a8060` (g-accent)
- 용도: 구분선 장식, 카드 워터마크, 헤더 장식

### 구분선
- 점 세 개 (Divider): `size-1 rounded-full bg-g-accent`, opacity 0.3
- 뿔 구분선: `flex items-center` + AntlerSVG + `h-px bg-g-accent`
- 단순 선: `h-px bg-g-border`

### 카드 인터랙션
- hover 시: `-translate-y-0.5`, `border-g-accent`
- 좌측 accent 라인: `w-[3px]`, `group-hover:bg-g-accent`

---

## 공통 패턴 (재사용 클래스 조합)

```
# 섹션 라벨
font-g-sans fs-label tracking-wide-g text-g-text-dim uppercase

# 캡션/부제
font-g-sans fs-caption text-g-text-muted tracking-normal-g

# 뒤로가기 링크
inline-flex items-center gap-2 font-g-sans fs-caption tracking-normal-g
text-g-text-muted border border-g-border px-4 py-1.5 pill-radius
hover:border-g-accent hover:text-g-accent2 transition-all duration-200
```

---

## 모바일/반응형 가이드라인

### 뷰포트 설정
- `viewport-fit: cover` — iOS 노치 대응
- `interactiveWidget: resizes-content` — 가상 키보드 대응
- safe-area: **html에 전역 padding 금지** (배경색 불일치). 개별 sticky nav에서 인라인 처리:
  - `style={{ paddingTop: 'max(기본값, env(safe-area-inset-top))' }}`

### 브레이크포인트 전략
- **모바일 퍼스트**: 기본 스타일이 모바일, `md:` 이상에서 데스크톱
- `md:` (768px) — 주 전환점 (1열→2열, 패딩 확대, 네비 항목 표시)
- `lg:` (1024px) — 2열 레이아웃 (업로드 페이지 등)

### 높이 단위
- `min-h-dvh` 사용 (dynamic viewport height — 모바일 주소창 포함)
- `min-h-screen` 대신 `min-h-dvh` 권장 (100vh는 iOS에서 주소창 뒤를 포함)

### PlatformNav 모바일 대응
- 모바일에서 "서재", "대시보드", "크레딧"은 `hidden md:inline` → 드롭다운 메뉴로 이동
- 로고 크기: `text-lg md:text-2xl`
- 패딩: `px-4 md:px-6 py-3 md:py-4`

### 스크롤 성능
- **scroll 이벤트 리스너는 가능한 사용하지 않는다** — 브라우저 네이티브 스크롤과 충돌하여 jank 발생
- 스크롤 위치 저장이 필요하면: 페이지 떠날 때(cleanup) 1번만 저장, 진입 시 1번만 복원
- `scrollY`를 useEffect 의존성에 넣지 않는다 (매 프레임 effect 재실행 → scrollTo 충돌)
- sticky nav: `will-change: transform` 고려 (성능 이슈 시)

### 풀스크린 (작가공간/에피소드)
- ThemeProvider: `min-h-dvh` + `backgroundColor` 인라인
- `[author]/layout.tsx`에서 `html, body { background-color: 테마색 }` 동적 적용 (safe-area 틈 방지)
- `<meta name="theme-color">` 동적 설정 — 작가 테마 배경색과 status bar 통일
- 에피소드 뷰어 본문: `max-w-prose` + `px-4 md:px-8` (`EpisodeViewer`)


## 빌드 입력 범위 · 2026-11-13

테마 CSS의 Tailwind 입력은 `src/`로 제한한다. 허브와 CLAUDE.md의 문서 예시 문자열을
유틸리티 클래스로 만들지 않는다. 기존 화면의 색·서체·간격·레이어 정책은 유지한다.

## 로컬 공개 준비 후속 · 서체와 초기 배치

작가 공간과 대시보드는 같은 `src/app/author-fonts.ts`의 Garamond와 고정 Noto Serif KR CSS를 사용한다. Noto WOFF2는 이전 Next 빌드와 같은 bytes이며 `public/fonts/noto-serif-kr/SOURCE.json`으로 대조한다. 제목·목차에 필요한 한글 조각은 서버에서 preload하고, 해시 이름의 WOFF2만 1년 immutable로 제공한다. CSS와 SOURCE.json은 같은 장기 캐시 규칙에 넣지 않는다. Noto는 `font-display: optional`로 늦은 교체에 따른 줄바꿈을 막는다. 첫 방문에 글꼴이 늦으면 해당 화면은 시스템 대체 글꼴를 유지하고, 캐시된 다음 방문에는 Noto를 사용한다. [preload와 optional의 동작](https://web.dev/articles/preload-optional-fonts)을 따르며 모든 환경의 CLS 0을 보장한다고 표현하지 않는다.

탐색·작가·작품의 첫 데이터는 서버 HTML에 포함한다. 원고 타이핑은 최종 본문 공간과 제목 줄바꿈을 먼저 확보한다. 데이터·폰트가 도착하며 아래 콘텐츠를 밀던 동작을 줄이고 기존 서체·최종 배치·타이핑 효과를 유지한다. CLS는 최초·재방문과 측정 환경을 구분해 실제 결과로 판단한다.

초기 테마의 `layout`은 현재 `episodeListLayout`이 없는 경우에만 읽는다. 명시한 현재 설정이 우선하며 DB 원본은 변경하지 않는다.

2026-11-14 측정 조건·글꼴 서빙 선택·최초/재방문 결과는 [글꼴·CLS 검토](reports/FONT_CLS_REVIEW_2026-11-14.md)를 따른다.
