# TODO.md — 작업 추적

## 인프라
- [x] 프로젝트 초기 세팅 (package.json, tsconfig, next.config 등)
- [x] Claude 관련 문서 생성 (CLAUDE.md, DESIGN.md, SCREENS.md, CHANGELOG.md)
- [x] npm install 및 개발 서버 동작 확인
- [x] Git 리포지토리 초기화 및 원격 연결
- [ ] Vercel 배포 설정

## UI/UX
- [x] globals.css 생성 (Tailwind 초기화 + 다크 테마 전역 스타일)
- [x] 루트 레이아웃 (app/layout.tsx) 생성
- [x] 루트 페이지 (app/page.tsx) → /universe 리다이렉트
- [x] 인라인 CSS → Tailwind CSS 4 마이그레이션
- [x] @theme 디자인 토큰 시스템 구축
- [x] cn() 유틸 추가 (clsx + tailwind-merge)
- [x] **볼드** 인라인 서식 렌더링 지원
- [x] 반응형 대응 (모바일/태블릿 — md: 브레이크포인트)
- [x] 메타데이터/OG 태그 설정

## 콘텐츠/SEO
- [x] 에피소드 데이터 검증 (원본 md와 ts 데이터 대조)
- [x] 볼드 마크다운 원문 복원 (~100건)
- [x] MD 원본 제목 TS 데이터와 일치시킴
- [x] SEO 최적화 (에피소드별 동적 메타데이터, robots.txt, sitemap.xml)

## MD 자동 파싱 시스템
- [x] 현재 데이터가 하드코딩(수동 파싱)인지 확인 → 맞음
- [x] MD → TS 자동 파서 구축 (scripts/parse-md.ts)
- [x] MD 파일 frontmatter 추가 (11개)
- [x] refrain 구분을 위한 `>` 인용문 표기
- [x] npm run parse → contentDataSource/ 자동 출력
- [x] prebuild 훅 연동 (빌드 시 자동 파싱)
- [x] import 경로 contentDataSource로 전환
- [x] generated → contentDataSource 리네이밍

## Tailwind CSS 품질 점검
- [x] 동일 CSS 효과가 여러 컴포넌트에 중복 작성되어 있는지 확인
- [x] 중복 패턴을 공통 컴포넌트로 추출 (BackLink, SectionLabel, AntlerDivider)
- [x] tailwind-merge 커스텀 토큰 충돌 문제 발견 및 수정

## Git 브랜치 정책
- [x] projectZenith 기반 브랜치 전략 도입 (main ← develop ← feature/bugfix)
- [x] CLAUDE.md에 브랜치 정책 문서화
- [x] develop 브랜치 생성

## 테스트
- [x] Vitest + jsdom + RTL + jest-dom 환경 구축
- [x] 파서(parse-md.ts) 유닛테스트 32개
- [x] 데이터 무결성 유닛테스트 16개
- [x] UI 컴포넌트(ChapterBlock) 유닛테스트 14개
- [x] E2E 테스트 도입 (Playwright 15개 시나리오)
- [x] CLAUDE.md에 테스트 필수 규칙 추가
- [ ] EpisodeViewer 유닛테스트 (타이핑 애니메이션 스테이지)
- [ ] UniverseNav 유닛테스트 (라우팅, 활성 탭)
- [ ] UniverseLanding 유닛테스트 (콘텐츠 필터링/정렬)

## 콘텐츠
- [x] ep11 이름 없는 괴물 추가 (262개 블록)

## Phase 2 (진행 중)
- [x] API 클라이언트 (grimoire-server 연동)
- [x] AuthProvider (JWT 토큰 기반 로그인 상태 관리)
- [x] 로그인 페이지 (`/login`)
- [x] 회원가입 페이지 (`/register`)
- [x] 작가 대시보드 (`/dashboard`)
- [x] 원고 업로드 페이지 (`/dashboard/upload`)
- [x] TESTING.md 생성
- [ ] 멀티테넌트 라우팅 서버 연동 (`/[author]/` → API에서 테마 로드)
- [ ] 커스텀 테마 에디터 (Color Picker, 폰트 선택)
- [ ] 테마 Baking 후 CDN CSS 로드

## Phase 3 (완료 항목 포함)
- [x] EpisodeFooter 컴포넌트 (이전화/좋아요/다음화 + 댓글 UI)
- [x] 독자 서재 페이지 (`/library`)
- [x] 프로필 설정 페이지 (`/dashboard/profile`)
- [x] 좋아요/구독/댓글 API 클라이언트 메서드
- [x] PageFlipTransition 작가 공간 레이아웃에 통합
- [x] 8개 페이지 SEO metadata 추가
- [x] 전수조사 지적사항 수정 (타입 캐스팅, 고아 컴포넌트, 문서 동기화)
- [ ] Google OAuth 실제 연동 (Client ID 필요)
- [ ] 작가 대시보드 고도화 (조회수 통계 차트, 작품 CRUD)
- [ ] 크레딧 충전 UI (PAYAPP 연동)

## Phase 4 (예정)
- [ ] 크레딧-원화-AI토큰 비용 정밀 계산식 UI
- [ ] 조회수 통계 차트 (대시보드)
- [ ] HTML 파서 (최후순위)

## 인프라 (예정)
- [ ] Vercel 배포
- [ ] 이미지/일러스트 추가
