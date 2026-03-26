# CHANGELOG.md — 변경 이력

## [0.5.0] - 2026-03-26

### Added
- EpisodeFooter 컴포넌트 (이전화/좋아요/다음화 + 댓글 UI)
- 독자 서재 페이지 (`/library`) — 내 작품 + 구독 작품 탭
- 프로필 설정 페이지 (`/dashboard/profile`)
- 좋아요/구독/댓글 API 클라이언트 메서드
- PageFlipTransition 작가 공간 레이아웃에 통합
- 8개 페이지 SEO metadata 추가

### Fixed
- 전수조사: theme/page.tsx 타입 캐스팅 이중 캐스트 수정
- 고아 컴포넌트 2개 통합 (EpisodeFooter, PageFlipTransition)
- SCREENS.md 5개 라우트 추가
- DESIGN.md design-tokens.md 참조 추가
- docs/api-contract.md 서버와 동기화

---

## 2026-03-26

### Phase 2 — 인증 화면 + 대시보드 + 원고 업로드

#### Added
- API 클라이언트 (`src/lib/api.ts`) — grimoire-server 연동 (인증, 테마, 작가, 작품, 원고)
- AuthProvider 컨텍스트 (`src/features/auth/`) — JWT 토큰 기반 로그인 상태 관리
- 로그인 페이지 (`/login`) — 테스트 계정 자동 채우기 버튼 포함
- 회원가입 페이지 (`/register`) — 슬러그 자동 생성, 3 크레딧 보너스 안내
- 작가 대시보드 (`/dashboard`) — 환영 카드, 빠른 액션, 작품 목록, 크레딧 현황
- 원고 업로드 페이지 (`/dashboard/upload`) — 파일 드래그앤드롭, 텍스트 붙여넣기, 포맷 자동 감지, 서버 파싱 미리보기
- TESTING.md 신규 생성 (고아문서 해소)

#### Stats
- 기존 테스트 70개 전부 통과

---

## 2026-03-25 (2차)

### E2E 테스트 도입 (Playwright, 15개 시나리오)
- Playwright + Chromium headless 설치 및 설정
- `npm run test:e2e` / `npm run test:all` 스크립트 추가
- CLAUDE.md에 테스트 필수 규칙 추가 (모든 작업 시 유닛+E2E 통과 필수)

**랜딩 페이지 테스트 (6개)**
- 페이지 로드, 네비게이션 탭, 에피소드 카드, ep11 카드, 번외 섹션, 일러두기/후기

**에피소드 뷰어 테스트 (5개)**
- ep1/ep11 로드 및 제목 표시, 본문 렌더링(타이핑 애니메이션 대기), 404 처리, 탭 이동

**네비게이션 테스트 (4개)**
- 루트 리다이렉트, 일러두기/후기 로드, 탭 클릭 이동

---

## 2026-03-25 (1차)

### Git 브랜치 정책 도입
- projectZenith 기반 브랜치 전략 적용: main ← develop ← feature/bugfix
- CLAUDE.md에 브랜치 정책, 머지 규칙, 커밋 컨벤션 추가
- develop 브랜치 생성

### ep11 이름 없는 괴물 추가
- 사슴악마_ep11_이름없는괴물.md: frontmatter 추가 + 챕터 헤딩 규칙 변환
- npm run parse로 ep11.ts 자동 생성 (262개 블록)
- CLAUDE.md 에피소드 목록에 ep9, ep10, ep11 반영

### 유닛테스트 기반 구축 (62개 테스트)
- Vitest + jsdom + @testing-library/react + @testing-library/jest-dom 환경 세팅
- vitest.config.ts: environmentMatchGlobs, setupFiles 추가
- parse-md.ts 리팩토링: 핵심 파싱 함수 export, main() CLI 가드 추가

**파서 테스트 (32개)**
- parseFrontmatter: 유효/무효 frontmatter, 따옴표 제거, 필수 필드 누락
- parseEpisodeBlocks: 8가지 블록 타입 변환, 복합 구조, 빈 본문 엣지케이스
- parsePreface: 문단/마지막 줄 분리, 빈 본문 처리
- parseAfterword: 글리치/각주 분리, 구분선 없는 경우
- escapeForTemplate: 백틱/달러/역슬래시 이스케이프, 불필요한 이스케이프 정리

**데이터 무결성 테스트 (16개)**
- contents 배열: slug 중복 검사, 필수 필드 존재, 타입 유효성, 정렬 순서
- episodeSlugs: episode/bonus만 포함 확인
- 동적 import: 모든 에피소드/preface/afterword 데이터 로딩 검증

**UI 컴포넌트 테스트 (14개)**
- ChapterBlock: 8개 블록 타입 렌더링, **볼드** 파싱, 빈 배열/undefined text 엣지케이스
- ReviewsWrap: children 유무에 따른 조건부 렌더링
- 알 수 없는 블록 타입 null 반환 검증

---

## 2026-03-20 (2차)

### 카드 확대 전환 애니메이션
- framer-motion 도입
- 카드 클릭 → 카드 위치에서 풀스크린 확대 + 사슴뿔 엠블렘 등장
- 확대 완료 → 라우팅 → 원래 카드 위치로 축소하며 사라짐
- CardTransitionProvider 컨텍스트로 EpisodeCard/SpecialCard에서 트리거

### 에피소드 타이핑 효과
- 히어로 영역: 라벨 → 제목 순차 타이핑 (TypeWriter 컴포넌트)
- 첫 3문단: 글자 단위 타이핑 (speed 15ms)
- 나머지 블록: 순차 페이드인 (80ms 간격)
- React Strict Mode 이중 실행 버그 수정 (cancelled 플래그 패턴)

### 트러블슈팅 문서
- TROUBLESHOOTING.md 신규 생성 (7개 이슈 기록)

---

## 2026-03-20 (1차)

### 공용 컴포넌트 추출 (Tailwind 중복 제거)
- BackLink: 뒤로가기 링크 3곳 → 컴포넌트 1개 (variant: default/dim)
- SectionLabel: 섹션 라벨 8곳 → 컴포넌트 1개
- AntlerDivider: 뿔 구분선 2곳 → 컴포넌트 1개
- tailwind-merge 커스텀 토큰 충돌 문제 발견 및 수정

### 정렬 및 순서 수정
- 네비게이션 탭: 일러두기를 에피소드 앞으로 이동
- 랜딩 페이지: 일러두기 → 에피소드 → 번외 → 후기 순서
- contents 정렬: slug 문자열 → num 숫자 기준 (ep10 정렬 문제 해결)

### 파서 버그 수정
- MD 원본의 \" 이스케이프가 웹에 슬래시로 노출되던 문제 수정
- ep3 리뷰 블록 수집 로직 재작성

### contentDataSource 리네이밍
- generated → contentDataSource (데이터소스 역할 명확화)

### ep10 추가
- 장화홍련전: 예쁘게 민원 넣기 (356개 블록)

---

## 2026-03-19 (5차)

### 에피소드 9 추가
- ep9 도리안 그레이의 초상 (244개 블록)
- MD 자동 파싱 시스템으로 추가 — MD 파일 드롭 + npm run parse만으로 완료

---

## 2026-03-19 (4차)

### MD 자동 파싱 시스템 구축
- `scripts/parse-md.ts` 파서 작성 — MD 파일을 읽어 TS 데이터 자동 생성
- MD 작성 규칙: 표준 마크다운만 사용 (frontmatter + `#` `###` `---` `>` `*` `**`)
- DeerDevil_MDfiles/ 11개 파일에 frontmatter 추가
- refrain 블록 구분을 위해 `>` 인용문 표기 도입
- ep3 리뷰 블록 수집 로직 구현 (★ 패턴 + reviews-wrap 자동 묶기)
- `npm run parse` 명령어 추가, `prebuild` 훅으로 빌드 시 자동 실행
- `generated/` 디렉토리로 출력, 기존 수동 데이터 파일 대신 사용
- index.ts에서 contents/episodeSlugs를 generated/contents.ts에서 re-export

---

## 2026-03-19 (3차)

### 반응형 대응
- 전체 컴포넌트에 `md:` 브레이크포인트 추가
- 모바일: 패딩 축소 (`px-4`, `pt-12`, `pb-16`), 태블릿↑: 원래 값 유지
- 타이포그래피 반응형: 본문 `text-base md:text-[19px]`, 제목 `text-2xl md:text-4xl`
- 랜딩 그리드: `grid-cols-1 md:grid-cols-[auto-fit]` (모바일 1열)
- 카드 패딩: `p-5 md:p-8`
- 네비게이션: `overflow-x-auto` 가로 스크롤 탭 (스크롤바 숨김)

### SEO 최적화
- `layout.tsx`: viewport, openGraph, twitter, keywords 메타데이터 추가
- `[slug]/page.tsx`: `generateMetadata()` — 에피소드별 동적 OG/Twitter 메타
- `preface/page.tsx`, `afterword/page.tsx`: 개별 metadata 추가
- `robots.ts`: 크롤링 허용 규칙
- `sitemap.ts`: 전체 URL 자동 생성

---

## 2026-03-19 (2차)

### Tailwind CSS 마이그레이션
- 인라인 `style={{}}` → Tailwind CSS 4 유틸리티 클래스 전환 (UI 컴포넌트 10개)
- `globals.css`에 `@theme inline` 디자인 토큰 시스템 구축
  - 색상: `text-u-text`, `bg-u-bg2`, `border-u-border` 등
  - 간격: `mt-u-section`, `mb-u-block`, `mb-u-paragraph`
  - 자간: `tracking-u-wide` (0.25em 통일), `tracking-u-normal`, `tracking-u-tight`
  - 둥글기: `rounded-u-card` (8px), `rounded-u-pill` (20px)
  - 읽기 폭: `max-w-u-reader` (700px), `max-w-u-reader-narrow` (640px), `max-w-u-landing` (900px)
- `cn()` 유틸 추가 (`clsx` + `tailwind-merge`)
- 인라인 `<style>` 태그 / `onMouseEnter` 이벤트 → `hover:` / `group-hover:` 클래스 대체
- 하드코딩 색상 3개 토큰화 (`text-u-text-bright`, `text-u-text-warm`, `text-u-text-soft`)
- 흔들리던 값 통일 (letterSpacing 0.2~0.3em → 0.25em)

### 볼드 서식 지원
- `ChapterBlock.tsx`에 `parseInlineText()` 추가 — `**텍스트**`를 `<strong>`으로 렌더링
- 에피소드 데이터 볼드 마크다운 원문 복원 (~100건, ep1~8 + bonus1)

### 데이터 정합성
- MD 원본 제목 수정: ep2, bonus1 (TS 데이터와 일치시킴)
- 원본 MD와 TS 데이터 전수 대조 — 텍스트 누락/변형 없음 확인

### 문서 갱신
- DESIGN.md: 토큰 시스템 전면 문서화
- CLAUDE.md: 기술 스택, 디렉토리 구조 업데이트
- TODO.md: 완료 항목 반영
- CHANGELOG.md: 이 항목

---

## 2026-03-19 (1차)

### 프로젝트 초기 세팅
- Next.js 16.1.6 + TypeScript + React 19 프로젝트 구성
- Tailwind CSS 4 + PostCSS 설정
- ESLint 9 + next config 설정
- Vitest 4 + v8 coverage 설정
- shadcn/ui 설정 (components.json)
- 환경변수 템플릿 (.env.example)

### 소설 콘텐츠 코드 이관
- 맥버전 Claude 아티팩트에서 웹 프로젝트 코드 이관
- 에피소드 8편 + 번외 1편 + 일러두기 + 후기 데이터
- Universe 뷰어 UI 컴포넌트 9종

### 누락 파일 보완
- 루트 레이아웃 (`app/layout.tsx`) 생성 — html/body + 메타데이터
- 루트 페이지 (`app/page.tsx`) 생성 — `/universe`로 리다이렉트
- 글로벌 CSS (`app/globals.css`) 생성 — Tailwind 초기화 + 다크 테마 스크롤바

### 문서 체계 구축
- CLAUDE.md: 핵심 개발 가이드
- DESIGN.md: UI 디자인 시스템
- SCREENS.md: 화면/컴포넌트 카탈로그
- TODO.md: 작업 추적
- CHANGELOG.md: 변경 이력
