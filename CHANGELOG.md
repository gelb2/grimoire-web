# CHANGELOG.md — 변경 이력

## [0.17.0] - 2026-04-07

### AI 채팅 UI + 테마 슬롯 관리

#### Added
- AI 채팅 UI — 대시보드/채팅 페이지 (세션 관리, 메시지 전송, 무한 스크롤)
- ThinkingIndicator — 바운스 도트 + 순환 문구 로딩 애니메이션
- StreamedMessage — 문단별 200ms fadeIn 애니메이션 (새 메시지만)
- 채팅 설정 패널 — 작품 맥락(context) + 지침(instructions) 편집
- 테마 에디터에 플랜 정보 배너 (플랜명, 슬롯 사용량, 만기일)
- 테마 목록에 슬롯 배치/해제 토글 (활성/보관 배지)
- AI로 테마 생성 버튼 (크레딧 차감 표시)

#### Changed
- 문서 일괄 현행화 (theme-spec CSS 변수 프리픽스 --u- → --g- 수정)

---

## [0.16.0] - 2026-04-02

### 비로그인 좋아요/댓글 지원 (디시인사이드 스타일)

#### Added
- EpisodeFooter 비로그인 좋아요 지원 (쿠키 기반, 취소 불가)
- 비로그인 댓글 작성 UI (닉네임 + 비밀번호 필드)
- 익명 댓글 삭제 모달 (비밀번호 입력)
- 닉네임 기억하기 (localStorage)
- api.getLikeStatus() 메서드 추가

#### Changed
- api.createComment() — anonymous 파라미터 추가
- api.deleteComment() — password 파라미터 추가
- CommentData 타입: authorId nullable, nickname 필드 추가
- 댓글 표시: 익명은 닉네임 + "(익명)" 라벨
- docs/api-contract.md, docs/data-model.md 동기화 (server → web)

---

## [0.15.0] - 2026-04-01

### 테마 CSS 리팩터링 + 프리셋 통일 + 런타임 에러 수정

#### Changed
- globals.css 제거 → theme.css 도입 (비색상 디자인토큰 21개 삭제)
- `@layer utilities` 토큰 클래스 도입 (fs-caption, fs-label, tracking-*-g, pill-radius, font-g-* 등 매직넘버 제거)
- 백엔드-프론트 테마 정책 통일 (resolveTheme 제거, data.theme 직접 사용)
- WorkCard 하드코딩 색상 → 테마 변수로 교체
- 프리셋 데이터 구조 통일 (9개 프리셋 전체에 `...defaultUI` 추가)
- twMerge 충돌 해결 (`text-` 접두사 → `fs-` 접두사로 변경하여 Tailwind 색상 클래스와 분리)

#### Fixed
- 이광수 에피소드 blocks.map 런타임 에러 수정

---

## [0.14.0] - 2026-03-31

### 에피소드 상태 관리 UI + 공유 링크

#### Added
- 대시보드: 작품별 에피소드 목록 펼침 (상태 배지 + 상태 변경 드롭다운)
- 대시보드: 공유 링크 생성 모달 (12h/24h/48h/무한 만료 선택 → 링크 복사)
- `/shared/[token]` — 공유 에피소드 뷰어 (비로그인 접근 가능, 만료 시 에러 표시)
- api.ts: updateEpisodeStatus, createShareLink, getSharedEpisode 메서드

## [0.13.0] - 2026-03-31

### Explore 버그 수정 + Analytics 대시보드 + 테스트 보강 + 배포 복구

#### Added
- `/dashboard/analytics` — 작품 분석 페이지 (요약 카드 + 조회수 차트 + 에피소드 순위)
- 대시보드 quickActions에 "작품 분석" 링크 추가
- Explore 스켈레톤 UI (로딩 중 animate-pulse 카드)
- 유닛테스트 26건 추가: EpisodeViewer(episodeLabel/description/animation), SeriesNav(multi-work/click), SeriesLanding(heroStyle)
- DESIGN_REFERENCE_READYMAG.md → `docs/`로 이동
- CLAUDE.md에 연구문서 참조 추가
- `public/.gitkeep` (Docker COPY 빌드 실패 수정)
- dev.grimoire-book.com / dev-api.grimoire-book.com Cloudflare CNAME + Azure SSL 바인딩

#### Fixed
- Explore: Promise.all 에러 격리 (개별 .catch), toast 제거 → 인라인 메시지
- api.ts: 클라이언트 타임아웃 5초→10초 (prod Cold Start 대응)
- ESLint flat config: FlatCompat 제거, Next.js 16 네이티브 설정
- ChapterBlock: children prop → JSX children (lint error)
- GitHub Actions 리소스그룹 `grimoire-rg` → `zenith-rg` 복원 (전 환경 배포 실패 수정)
- CI에서 E2E 테스트 제거 (백엔드 미실행 환경 타임아웃)

#### Deployment
- dev → inhouse → prod 순차 배포 완료 (각 단계 성공 확인 후 진행)
- web CI: tsc ✅ lint ✅ test ✅ build ✅ (E2E 제외)

---

## [0.12.0] - 2026-03-30

### 테마 시스템 v2 + 에러 핸들링 + OAuth + 배포

#### Added
- 레디맥 리서치 기반 테마 Phase 1/2 구현 (타이포그래피 5개 파라미터 + 레이아웃 프리셋 3종)
- gallery/magazine/minimal 레이아웃 컴포넌트 구현
- SeriesLanding heroStyle 3종 (fullname/cover/minimal)
- Google OAuth 로그인 버튼 (@react-oauth/google)
- sonner toast 에러 피드백 전수 적용 (13개 silent catch 수정)
- MinimalNav — gallery/magazine/minimal 레이아웃 고아 방지 네비게이션
- 프리셋 8종: midnight, parchment, morning, neon, cream, magazine, gallery, minimal
- DESIGN_REFERENCE_READYMAG.md — 레디맥 리서치 결과 문서
- PROPOSAL_DIGITAL_SHOWROOM.md — 디지털 쇼룸 제안서

#### Fixed
- 고아 페이지 3건 수정 (dashboard/credits, dashboard/profile 뒤로가기, /[author]/profile 링크)
- 플랫폼 배경색 분리 (#0d0f1a — 작가 테마와 시각적 구분)
- Cloudflare/Azure SSL 525 오류 완전 수정 (managed certificate binding)

#### Deployment
- 6개 Container App 전체 배포 (dev/inhouse/prod × web/server)
- grimoire-book.com, api.grimoire-book.com, inhouse.grimoire-book.com, inhouse-api.grimoire-book.com 전 환경 정상

---

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
