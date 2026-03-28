# CHANGELOG.md — 변경 이력

## [0.11.0] - 2026-03-28

### 전역 리네이밍 + 테마 시스템 강화 + 네비게이션/훅 전수 수정

#### Added
- HTML 파서 연동 (sourceFormat 자동 감지)
- 테마 animation 필드 실제 분기 (typing/fade/slide/none)
- 플랫폼/작가 CSS 스코핑 분리 (bg-platform-bg 토큰)
- UniverseNav/UniverseLanding 유닛테스트 22건
- AdminGuard 유닛테스트 4건
- ChapterBlock heading-2/separator/bold 블록 지원
- 테마 에디터 서버 연동 (저장+퍼블리시)
- 크레딧 선물 + 응원받는 작가 랭킹 API

#### Changed
- 전역 리네이밍: features/universe → features/reader, --u-* → --g-*, UniverseNav → SeriesNav
- layout 값: "universe" → "series"
- authorThemeMap dead code 삭제
- EpisodeViewer 기본 장식 antler → dot (범용)
- 테마 미지정 작가 기본 프리셋 midnight → cream

#### Fixed
- 에피소드 빠른 스크롤 시 깜박임/흔들림 (motion.div 정적 전환)
- 타이핑 애니메이션 간헐적 미재생 (key prop + sessionStorage 복합 키)
- 네비게이션 정책 통일 (router.replace → push, `<a>` → `<Link>`)
- AuthorSpace API race condition (mounted 플래그)
- CardTransition vw/vh 매 렌더 재계산 (useState + resize)
- HorizontalScroll pages 배열 useMemo
- 카드 제목 truncate (탐색 only, 작가공간 롤백)
- 크레딧 충전 페이지 크래시 (priceKrw → price 필드명)
- 프로필 WorkCard 목차 페이지 우회

## [0.10.0] - 2026-03-27

### 테마 장식 + 네비게이션 안정화

#### Added
- 테마 장식 아이콘 SVG 9종 프리셋 (작가별 고유 아이콘)
- E2E 테스트 갱신 — 멀티테넌트 Grimoire 반영

#### Fixed
- Zustand loaded 플래그 버그 — API 실패 시 캐시 안 함 + TTL 5분
- 뒤로가기 정책 수정 + useNavigationStore
- 번외/후기 카드 workSlug 누락 + SpecialCard 3단계 URL 수정
- HorizontalScroll 2행 그리드 + 인디케이터 버그 수정
- 크레딧 결제 버튼 더블클릭 방지 — useLoadingAction 적용

---

## [0.9.0] - 2026-03-26

### BFF 패턴 + 보안 강화

#### Added
- 탐색 페이지 가로스크롤 + 페이지네이션
- BFF API Proxy 패턴 도입 (단일 이미지 3환경 배포)
- 테마 기반 tagline + divider 아이콘 (9종 SVG)
- 모든 작가에 테마 기반 에피소드 네비(WorkNav) 적용
- DeerDevil 레이아웃 복원 + 테마 장식 시스템
- CI/CD GitHub Actions 자동 배포 구축

#### Fixed
- HttpOnly Cookie 전환 (localStorage 완전 제거)
- 에피소드 라벨 type별 분기 (Preface/Afterword/Bonus)
- 구분선-본문 간 여백 추가
- UniverseNav/WorkNav 데이터 기반 pills + type 인식
- Dockerfile SSR 런타임 API URL ENV 추가
- DeerDevil 원본 1:1 복원
- WorkCard 단일 에피소드 라우팅 — 실제 slug 사용
- 작가 공간 내 작품 카드 → 작품 상세/에피소드로 라우팅
- WorkCard 클릭 → 작가 공간으로 라우팅 수정

---

## [0.8.0] - 2026-03-26

### 테마 시스템 감사 + Zustand 도입

#### Fixed
- [author]/layout에 AuthProvider 추가 + ANTHROPIC_API_KEY 선택적 전환
- 테마 시스템 전면 감사 — 7개 갭 수정
- [author]/layout.tsx에서 DeerDevil 전용 UniverseNav 제거
- 문서 피라미드 리팩토링 + 하드코딩 제거
- 에피소드 뷰어 네비게이션 + 고아 페이지 해결
- 작가공간 DeerDevil 폴백 렌더링 근본 해결
- AuthorSpace 에피소드 데이터 로드 + 작가명 전달
- EpisodeCard workSlug 3단계 URL + UniverseLanding 에피소드 데이터 전달

#### Refactored
- 테마 로딩 API 단일 소스 전환 + Zustand 도입
- 에러 팝업 도입, DeerDevil 폴백 완전 제거

---

## [0.7.0] - 2026-03-26

### EPISODE UNDEFINED 버그 수정

#### Fixed
- EPISODE UNDEFINED 버그 수정 + 타입 안전성 개선
- DeerDevil 작가 공간은 로컬 데이터 우선 사용
- 작가 공간 에피소드 미표시 + PageFlipTransition 제거

---

## [0.6.0] - 2026-03-26

### 탐색 페이지 + 네비게이션 수정

#### Added
- 탐색 페이지 그리드 레이아웃 + WorkCard 컴포넌트
- 클라이언트 Throttle/Debounce 방어

#### Fixed
- 네비게이션 전면 수정 — 고아 페이지 해소 + 공유 네비바
- Dockerfile에 .env.production 생성 추가 (NEXT_PUBLIC_ 인라인 보장)

#### Refactored
- 독자 페이지를 서버 API 호출로 전환

#### Infrastructure
- Docker + CI/CD + Pre-push hook 구축

---

## [0.5.0] - 2026-03-26

### Added
- EpisodeFooter 컴포넌트 (이전화/좋아요/다음화 + 댓글 UI)
- 독자 서재 페이지 (`/library`) — 내 작품 + 구독 작품 탭
- 프로필 설정 페이지 (`/dashboard/profile`)
- 좋아요/구독/댓글 API 클라이언트 메서드
- 8개 페이지 SEO metadata 추가

### Fixed
- 전수조사: theme/page.tsx 타입 캐스팅 이중 캐스트 수정
- 고아 컴포넌트 2개 통합 (EpisodeFooter, PageFlipTransition)

---

## [0.4.0] - 2026-03-26

### Added (Phase 4)
- 탐색 페이지 (`/explore`) + 관리자 패널 (`/admin`)
- 루트 리다이렉트 변경 (`/` → `/explore`)

### Added (Phase 3)
- Google 로그인 UI + 대시보드 고도화 + 크레딧 충전 UI (`/dashboard/credits`)

---

## [0.3.0] - 2026-03-26

### Added
- 커스텀 테마 에디터 (`/dashboard/theme`) + 멀티테넌트 서버 연동 + 작가 공간 미리보기
- 회원가입 비밀번호 재확인 + 업로드 DOCX 지원 + 권장 포맷 안내

---

## [0.2.0] - 2026-03-26

### Added (Phase 2)
- API 클라이언트 (`src/lib/api.ts`) — grimoire-server 연동 (인증, 테마, 작가, 작품, 원고)
- AuthProvider 컨텍스트 (`src/features/auth/`) — JWT 토큰 기반 로그인 상태 관리
- 로그인 페이지 (`/login`) — 테스트 계정 자동 채우기 버튼 포함
- 회원가입 페이지 (`/register`) — 슬러그 자동 생성, 3 크레딧 보너스 안내
- 작가 대시보드 (`/dashboard`) — 환영 카드, 빠른 액션, 작품 목록, 크레딧 현황
- 원고 업로드 페이지 (`/dashboard/upload`) — 파일 드래그앤드롭, 텍스트 붙여넣기, 포맷 자동 감지, 서버 파싱 미리보기

---

## [0.1.0] - 2026-03-25

### Added
- 멀티테넌트 라우팅 + 테마 시스템 구축 (프리셋 5종)

### E2E 테스트 도입 (Playwright)
- Playwright + Chromium headless 설치 및 설정
- `npm run test:e2e` / `npm run test:all` 스크립트 추가
- 랜딩, 에피소드 뷰어, 네비게이션 E2E 테스트

### Git 브랜치 정책 도입
- projectZenith 기반 브랜치 전략 적용: main ← develop ← feature/bugfix

### 유닛테스트 기반 구축
- Vitest + jsdom + @testing-library/react 환경 세팅
- 파서, 데이터 무결성, UI 컴포넌트 테스트

---

## [0.0.1] - 2026-03-20

### 카드 확대 전환 애니메이션
- framer-motion 도입, CardTransitionProvider 컨텍스트

### 에피소드 타이핑 효과
- 히어로 영역 순차 타이핑 + 블록 순차 페이드인

### 공용 컴포넌트 추출
- BackLink, SectionLabel, AntlerDivider 추출 (Tailwind 중복 제거)

### Tailwind CSS 마이그레이션
- 인라인 style → Tailwind CSS 4 유틸리티 클래스 전환
- `globals.css`에 @theme inline 디자인 토큰 시스템 구축

### 반응형 + SEO
- 전체 컴포넌트 반응형 대응 + SEO 메타데이터

### MD 자동 파싱 시스템 구축
- `scripts/parse-md.ts` — MD → TS 자동 변환
- `npm run parse` / `prebuild` 훅

---

## [0.0.0] - 2026-03-19

### 프로젝트 초기 세팅
- Next.js 16 + TypeScript + React 19 + Tailwind CSS 4
- DeerDevil 코드 마이그레이션 (에피소드 8편 + 번외 1편 + 일러두기 + 후기)
- Universe 뷰어 UI 컴포넌트 9종
- 문서 체계 구축 (CLAUDE.md, DESIGN.md, SCREENS.md, TODO.md, CHANGELOG.md)
