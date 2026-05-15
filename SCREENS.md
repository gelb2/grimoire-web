# SCREENS.md — 화면/컴포넌트 카탈로그

> 이 문서는 Level 2 정본이다. 새 화면 추가 시 이 문서를 업데이트한다.
> 실제 라우트 확인: `find src/app -name "page.tsx" | sort`
> API 명세: `docs/api-contract.md` 참조.

---

## 라우트 구조

### 플랫폼 공용

| 경로 | 파일 | 설명 | 인증 | API |
|------|------|------|------|-----|
| `/` | `app/page.tsx` | 루트 — `/explore`로 리다이렉트 | - | - |
| `/login` | `app/login/page.tsx` | 로그인 — 입력칸 1개 (이메일 또는 슬러그) + 정규식 자동 판별 (EMAIL-P0-3 Phase 2, sprint-email-p0-3-slug-login) | - | `POST /api/auth/login` (`{ email? }` 또는 `{ slug? }` XOR + password) |
| `/register` | `app/register/page.tsx` | 회원가입 (3 크레딧 보너스) | - | `POST /api/auth/register` |
| `/explore` | `app/explore/page.tsx` | 작품 탐색 (검색, 인기, 최신) | - | `GET /api/discover/*` |
| `/library` | `app/library/page.tsx` | 독자 서재 (북마크, 구독) | JWT | `GET /api/reader/bookmarks`, `GET /api/social/subscriptions` |
| `/admin` | `app/admin/page.tsx` | 관리자 패널 — 16 탭 (통계/사용자/**탈퇴·익명화**/콘텐츠/제재/신고/댓글/결제/수익/**크레딧**/공지/추천/테마/접근로그/설정/감사로그). 크레딧 탭은 `tabs/CreditsTab.tsx` 분리 (PAY-P0-3). 탈퇴·익명화 탭은 `tabs/UsersTab.tsx` (USER-SOFT-DELETE sprint §15-1 — 강제 탈퇴 + GDPR 익명화 + 사유 필수 + 멀티콘펌 + sonner toast + AdminAuditLog 박제) | JWT, admin | `GET /api/admin/stats`, `GET /api/admin/authors?q`, `POST /api/admin/credits/grant`, `POST /api/admin/credits/deduct`, `POST /api/admin/authors/:id/force-delete`, `POST /api/admin/authors/:id/anonymize` |

### 작가 대시보드

| 경로 | 파일 | 설명 | API |
|------|------|------|-----|
| `/dashboard` | `app/dashboard/page.tsx` | 작가 대시보드 (작품 목록, 테마 관리, 빠른 액션) | `GET /api/auth/profile`, `GET /api/themes/slots/info` |
| `/dashboard/upload` | `app/dashboard/upload/page.tsx` | 원고 업로드 (드래그앤드롭, 포맷 감지, 미리보기) | `POST /api/manuscripts/parse` |
| `/dashboard/theme` | `app/dashboard/theme/page.tsx` | 테마 에디터 (편집 전용, `?id=`로 특정 테마 로드) | `GET /api/themes/detail/:themeId`, `POST /api/themes/generate` |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | 작품 분석 (요약 카드 + 조회수 차트 + 에피소드 순위) | `GET /api/authors/:slug/profile`, `GET /api/works/:id/stats` |
| `/dashboard/credits` | `app/dashboard/credits/page.tsx` | 크레딧 충전 | `GET /api/payments/products`, `GET /api/payments/credits` |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | 프로필 설정 + **계정 탈퇴** (USER-SOFT-DELETE sprint §15-1 — `AccountDeleteDialog` 모달 영역 + slug 재입력 검증 + 30일 유예 안내 + GDPR basic 익명화 박제) | `GET /api/auth/profile`, `DELETE /api/auth/me` |

### 작가 공간 (멀티테넌트)

| 경로 | 파일 | 설명 | API |
|------|------|------|-----|
| `/[author]` | `app/[author]/page.tsx` | 작가 랜딩 (작품 목록) | `GET /api/authors/:slug` |
| `/[author]/[slug]` | `app/[author]/[slug]/page.tsx` | 작품 페이지 (에피소드 목록) | `GET /api/works/:authorSlug/:workSlug` |
| `/[author]/[slug]/[episode]` | `app/[author]/[slug]/[episode]/page.tsx` | 에피소드 읽기 뷰어 | `GET /api/episodes/:a/:w/:e` |

### 레이아웃

| 파일 | 설명 |
|------|------|
| `app/layout.tsx` | 루트 레이아웃 (html/body, globals.css, 메타데이터) |
| `app/[author]/layout.tsx` | 작가 공간 레이아웃 (ThemeProvider, AuthProvider, 폰트, CardTransitionProvider) |
| `app/dashboard/layout.tsx` | 대시보드 레이아웃 (AuthProvider) |
| `app/admin/layout.tsx` | 관리자 레이아웃 |
| `app/explore/layout.tsx` | 탐색 레이아웃 |
| `app/library/layout.tsx` | 서재 레이아웃 |
| `app/login/layout.tsx` | 로그인 레이아웃 |
| `app/register/layout.tsx` | 회원가입 레이아웃 |
| `app/dashboard/credits/layout.tsx` | 크레딧 충전 레이아웃 |
| `app/dashboard/profile/layout.tsx` | 프로필 설정 레이아웃 |
| `app/dashboard/theme/layout.tsx` | 테마 에디터 레이아웃 |

---

## UI 컴포넌트

### 공용 (`src/components/`)

| 컴포넌트 | 설명 |
|---------|------|
| WorkCard | 작품 카드 |
| PlatformNav | 플랫폼 네비게이션 |
| ErrorPopup | 에러 팝업 |
| HorizontalScroll | 가로 스크롤 컨테이너 (2행 그리드 + 인디케이터) |

### 작가 공간 뷰어 (`src/features/reader/ui/`)

| 컴포넌트 | 설명 |
|---------|------|
| AuthorSpace | 작가 공간 메인 (레이아웃별 분기) |
| WorkPage | 작품 페이지 (에피소드 목록) |
| SeriesLanding | 에피소드 카드 그리드 + 번외/특수 페이지 섹션 |
| SeriesNav | Sticky 상단 네비게이션 (브랜드 + 탭) |
| EpisodeViewer | 에피소드 본문 읽기 뷰어 (히어로 + 블록 + 타이핑 이펙트) |
| ChapterBlock | 블록 배열 렌더러 (paragraph, chapter, divider, refrain, italic 등) |
| EpisodeCard | 에피소드 목록 카드 |
| SpecialCard | 일러두기/후기 카드 |
| PrefaceViewer | 일러두기 본문 뷰어 |
| AfterwrdViewer | 후기 뷰어 (글리치 효과) |
| AntlerSVG | 사슴뿔 SVG 아이콘 |
| EpisodeFooter | 이전화/좋아요/다음화 + 댓글 UI |

### 인증 (`src/features/auth/`)

| 컴포넌트 | 설명 |
|---------|------|
| AuthProvider | JWT 토큰 기반 인증 상태 관리 컨텍스트 |

### 계정 (`src/features/account/`)

| 컴포넌트 | 설명 |
|---------|------|
| AccountDeleteDialog | 본인 계정 탈퇴 모달 (USER-SOFT-DELETE sprint §15-1 — slug 재입력 검증 + 사유 입력 + 30일 유예 안내 + GDPR basic 익명화 정책 박제. 시각 정본 사슴악마: Alert.tsx 동일 골격 + neutral-* 팔레트 + 경고 포인트 `#e53e3e`) |

### 테마 (`src/features/theme/`)

| 컴포넌트 | 설명 |
|---------|------|
| ThemeProvider | CSS Variables 동적 주입 (작가별 테마) |

### 상태 관리 (`src/stores/`)

| 스토어 | 설명 |
|--------|------|
| useExploreStore | 탐색 페이지 상태 (Zustand) |
| useNavigationStore | 뒤로가기 정책 + 네비게이션 상태 (Zustand) |
