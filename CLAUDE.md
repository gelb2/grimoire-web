# CLAUDE.md — grimoire-web

> 프론트엔드 — 멀티테넌트 작가 공간 + 대시보드.
> 작가별 맞춤 공간을 제공하는 소설 퍼블리싱 플랫폼의 웹 클라이언트.

---

## 1. 개요

ProjectGrimoire의 프론트엔드. DeerDevil(사슴악마 단편소설 웹 뷰어)을 출발점으로 하여,
다수 작가가 자신만의 시각적 공간에서 소설을 퍼블리시할 수 있는 플랫폼으로 확장.

백엔드: grimoire-server (NestJS + Prisma + PostgreSQL)

### 시각적 정본: 사슴악마 (deerdevil)

운영 사슴악마의 작가공간·에피소드 뷰어·에피소드 목록이 **모든 시각적 렌더링의 정본**이다.
루트 `CLAUDE.md` §1 "시각적 정본" 참조. 이 기준과 불일치하는 렌더링은 **버그**다.

---

## 2. 핵심 규칙

### 언어
- **코드**: 영어 (변수명, 함수명, 파일명)
- **주석/커밋/문서**: 한국어
- **소설 콘텐츠**: 한국어 원문 유지, 절대 수정 금지

### 크로스 브라우저 호환성 — 필수 규칙

모든 웹 UI는 **Chrome + Safari** 양쪽에서 동일하게 렌더링되어야 한다.

- CSS/Tailwind 구현 시 어두운 배경에 어두운 텍스트, 밝은 배경에 밝은 텍스트가 되는 사태를 반드시 방지
- `@layer` 누락으로 유틸리티 클래스가 무시되는 문제 주의 (특히 Safari)
  - 전역 리셋(`a { color: inherit }` 등)은 반드시 `@layer base { }` 안에 작성
  - unlayered CSS는 Tailwind 유틸리티(`text-white` 등)보다 우선하여 Safari에서 깨짐
- `font-[var(--font-*)]` 사용 시 해당 CSS 변수가 모든 컨텍스트에서 유효한지 확인
- 네비게이션 컴포넌트 이중 렌더링 금지:
  - `[author]/layout.tsx`가 SeriesNav를 담당 → 하위 페이지에서 PlatformNav/WorkNav 렌더링 금지
  - 플랫폼 페이지(`explore`, `dashboard`, `library` 등)에서만 PlatformNav 사용

### 문서 동기화 체크리스트 (커밋 전 확인)

- 테마 파라미터 변경 → `docs/theme-spec.md` 업데이트
- 디자인 토큰 변경 → `docs/design-tokens.md` 업데이트
- 컴포넌트/폴더 리네이밍 → `SCREENS.md`, `DESIGN.md` 업데이트
- 페이지 추가/삭제 → `SCREENS.md` 업데이트

### 아키텍처 — FSD (Feature-Sliced Design)
```
src/
├── app/           # Next.js App Router — 라우팅 + 레이아웃
├── features/      # 도메인 로직 (auth, theme, reader)
├── lib/           # 유틸리티 (api.ts, utils.ts)
├── components/    # 공용 UI 컴포넌트
├── stores/        # Zustand 스토어
└── shared/        # 공용 유틸, UI (향후)
```

### 라우트 구조

멀티테넌트 작가 공간 + 플랫폼 공용 페이지 + 작가 대시보드.

- `[author]/` — 작가별 독립 공간 (테마, 작품, 에피소드)
- `dashboard/` — 작가 관리 (업로드, 테마 에디터, 크레딧, 프로필)
- `explore/`, `library/` — 독자용 탐색/서재
- `admin/` — 관리자 패널
- `login/`, `register/` — 인증

전체 라우트 목록: `SCREENS.md` 참조.
실제 라우트 확인: `find src/app -name "page.tsx" | sort`

### 패키지 매니저
- **npm** 사용 (yarn/pnpm 금지)

### 테스트 — 필수 규칙
- **모든 작업(기능 추가, 수정, 버그픽스) 완료 시 테스트 필수 통과**
- 테스트 미통과 상태로 커밋 금지
- 테스트 전략: `TESTING.md` 참조
- 현재 테스트 수: `npm test` 및 `npm run test:e2e` 실행으로 확인

### Git 브랜치 정책

루트 `CLAUDE.md` §8 참조 (2개 레포 공통).

### 커밋 메시지 컨벤션
- 형식: `{type}: {한국어 메시지}`
- 타입: `feat`, `fix`, `test`, `chore`, `docs`, `refactor`, `merge`
- 머지 커밋: `merge: feature/{name} → develop ({설명})`

---

## 3. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16+ (App Router) |
| 언어 | TypeScript |
| UI 프레임워크 | React 19 |
| 스타일 | Tailwind CSS 4 + @theme 디자인 토큰 + CSS Variables |
| UI 라이브러리 | shadcn/ui (준비됨) |
| 상태 관리 | Zustand |
| 테스트 (유닛) | Vitest + @testing-library/react + v8 coverage |
| 테스트 (E2E) | Playwright |
| 린트 | ESLint 9 + next config |
| 배포 | Azure Container Apps (`docs/environments.md` 참조) |

> 정확한 버전은 `package.json` 참조.

---

## 4. 서버 API 연동

- API 클라이언트: `src/lib/api.ts`
- 서버 API 명세: `docs/api-contract.md` 참조
- 백엔드: grimoire-server

### BFF (Backend For Frontend) 패턴

클라이언트 → Next.js API Route (`/api/...`) → grimoire-server

- 클라이언트는 같은 도메인(`/api/...`)으로만 호출 → CORS 문제 없음
- 백엔드 URL(`API_URL`)은 런타임 환경변수 → Docker 이미지 1개로 3환경 배포
- `NEXT_PUBLIC_API_URL` 사용하지 않음 (빌드 시 인라인 방지)
- HttpOnly Cookie가 같은 도메인이므로 자동 전송
- 프록시 핸들러: `src/app/api/[...path]/route.ts`

호출 패턴:
- **클라이언트 컴포넌트** (`'use client'`): `/api/...` (프록시 경유)
- **서버 컴포넌트**: `process.env.API_URL` 직접 호출 (루프백 방지)
- `api.ts`는 `typeof window`로 자동 분기

---

## 5. 공통 명령어

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 시작 (port 3001)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm test             # Vitest 유닛 테스트
npm run test:e2e     # Playwright E2E 테스트
npm run test:all     # 유닛 + E2E 전체
npm run test:coverage # 커버리지 리포트
```

---

## 6. 빌드 환경

```bash
# .env.local
API_URL=http://localhost:3000/api
```

| 환경 | API URL | 웹 |
|------|---------|-----|
| localhost | localhost:3000 | localhost:3001 |
| development | dev-api.grimoire-book.com | dev.grimoire-book.com |
| inhouse | inhouse-api.grimoire-book.com | inhouse.grimoire-book.com |
| production | api.grimoire-book.com | grimoire-book.com |

상세: `docs/environments.md` 참조.

---

## 7. 문서 연동 규칙

| 변경 내용 | 업데이트 대상 |
|-----------|--------------|
| UI/스타일 변경 | `DESIGN.md` |
| 새 화면/컴포넌트 추가 | `SCREENS.md` |
| API 연결 추가/변경 | `TECH_STATUS.md` + 루트 `SYNC_STATUS.md` |
| 작업 완료/추가 | `TODO.md` |
| 모든 의미 있는 변경 | `CHANGELOG.md` |

### 참고 연구 문서

| 문서 | 내용 |
|------|------|
| `docs/DESIGN_REFERENCE_READYMAG.md` | 레디맥 디자인 리서치 (테마 Phase 1/2 참고) |

---

## 8. 숫자 하드코딩 금지

문서에 테스트 수, 라우트 수, 컴포넌트 수 등을 숫자로 적지 않는다.
검증은 실제 코드/실행 결과로:

| 항목 | 검증 방법 |
|------|----------|
| 웹 라우트 | `find src/app -name "page.tsx" \| sort` |
| 컴포넌트 목록 | `SCREENS.md` 참조 |
| 테스트 수 | `npm test` / `npm run test:e2e` 실행 |
| 의존성 | `package.json` 직접 확인 |
| API 엔드포인트 | `docs/api-contract.md` 참조 |

---

## 9. 참고 프로젝트

| 프로젝트 | 참고 대상 |
|---------|----------|
| DeerDevil | MD 파서, 블록 시스템, CSS Variables, 타이핑 이펙트, E2E 테스트 |
| projectZenith | 폴더 구조, 문서 동기화, Azure 배포, 브랜치 전략 |
