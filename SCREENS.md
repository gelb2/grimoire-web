# SCREENS.md — 화면/컴포넌트 카탈로그

## 라우트 구조

### 작가 공간 (멀티테넌트)

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `app/page.tsx` | 루트 → `/deerdevil`로 리다이렉트 |
| `/{author}` | `app/[author]/page.tsx` | 작가 랜딩 (에피소드 목록) |
| `/{author}/{slug}` | `app/[author]/[slug]/page.tsx` | 에피소드 읽기 |
| `/{author}/preface` | `app/[author]/preface/page.tsx` | 일러두기 |
| `/{author}/afterword` | `app/[author]/afterword/page.tsx` | 후기 |

### 인증

| 경로 | 파일 | 설명 | API |
|------|------|------|-----|
| `/login` | `app/login/page.tsx` | 로그인 | `POST /api/auth/login` |
| `/register` | `app/register/page.tsx` | 회원가입 (3 크레딧 보너스) | `POST /api/auth/register` |

### 작가 대시보드

| 경로 | 파일 | 설명 | API |
|------|------|------|-----|
| `/dashboard` | `app/dashboard/page.tsx` | 작가 대시보드 (작품 목록, 크레딧, 빠른 액션) | `GET /api/auth/profile` |
| `/dashboard/upload` | `app/dashboard/upload/page.tsx` | 원고 업로드 (드래그앤드롭, 포맷 감지, 미리보기) | `POST /api/manuscripts/parse` |
| `/dashboard/theme` | (Phase 2 예정) | 테마 에디터 | `POST /api/themes/generate` |
| `/dashboard/credits` | (예정) | 크레딧 충전 (상품 선택, 결제) | `GET /api/payments/products`, `GET /api/payments/credits` |
| `/dashboard/profile` | (예정) | 프로필 설정 (이름, 슬러그, 비밀번호 변경) | `GET /api/auth/profile` |

### 독자 공간

| 경로 | 파일 | 설명 | API |
|------|------|------|-----|
| `/library` | (예정) | 독자 서재 (북마크 작품 + 구독 작가 작품) | `GET /api/reader/bookmarks`, `GET /api/social/subscriptions` |
| `/explore` | (예정) | 작품 탐색 (검색, 인기, 최신) | `GET /api/discover/authors`, `GET /api/discover/works/popular`, `GET /api/discover/works/recent` |

### 관리자

| 경로 | 파일 | 설명 | API |
|------|------|------|-----|
| `/admin` | (예정) | 관리자 패널 (통계, 크레딧 부여) | `GET /api/admin/stats`, `POST /api/admin/credits` |

### 레이아웃
- `app/layout.tsx` — 루트 레이아웃 (html/body, globals.css import, 메타데이터)
- `app/[author]/layout.tsx` — 작가 공간 레이아웃 (ThemeProvider, 폰트, CardTransitionProvider)
- `app/login/layout.tsx` — 인증 레이아웃 (AuthProvider)
- `app/register/layout.tsx` — 인증 레이아웃 (AuthProvider)
- `app/dashboard/layout.tsx` — 대시보드 레이아웃 (AuthProvider)

---

## UI 컴포넌트 (`features/universe/ui/`)

### UniverseLanding.tsx
- 에피소드 카드 그리드 + 번외 섹션 + 특수 페이지 섹션
- 헤더: 타이틀 + AntlerSVG + 부제
- 의존: `EpisodeCard`, `SpecialCard`, `AntlerSVG`, `contents`

### UniverseNav.tsx (client component)
- Sticky 상단 네비게이션
- 브랜드 버튼 + 에피소드 탭 + 일러두기/후기 탭
- 현재 페이지 하이라이트
- 의존: `usePathname`, `useRouter`, `contents`

### EpisodeViewer.tsx
- 에피소드 본문 읽기 뷰어
- 히어로 헤더 + 본문 블록 + 클로즈 라인 + 뒤로가기
- 의존: `ChapterBlock`, `AntlerSVG`, `ContentMeta`, `EpisodeData`

### ChapterBlock.tsx
- 블록 배열 렌더러 (paragraph, chapter, divider, refrain, italic, epilogue, reviews-wrap)
- 내부 서브 컴포넌트: `Divider`, `Refrain`, `ReviewsWrap`, `ReviewItem`, `SingleBlock`
- 의존: `Block` 타입

### EpisodeCard.tsx
- 에피소드 목록 카드
- accent 라인 + 번호 + 제목 + 부제 + 설명 + CTA + AntlerSVG 워터마크
- hover: translateY(-2px) + accent 테두리
- 의존: `AntlerSVG`, `ContentMeta`

### SpecialCard.tsx
- 일러두기/후기 카드
- 후기: 깨진 문자 배경 효과
- 의존: `ContentMeta`

### PrefaceViewer.tsx
- 일러두기 본문 뷰어
- 단락 목록 + 구분선 + 마지막 이탤릭 줄
- Props: `paragraphs: string[]`, `lastLine: string`

### AfterwrdViewer.tsx
- 후기 뷰어 (글리치 효과)
- 깨진 문자 덩어리 (mono, opacity 0.4) + 각주
- Props: `glitchText: string`, `footnote: string`

### AntlerSVG.tsx
- 사슴뿔 SVG 아이콘
- Props: `size?: number`, `opacity?: number`
