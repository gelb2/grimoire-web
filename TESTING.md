# TESTING.md — grimoire-web

> 테스트 전략과 패턴.
> 현재 테스트 수: `npm test` 및 `npm run test:e2e` 실행으로 확인.

---

## 1. 프레임워크

| 도구 | 용도 |
|------|------|
| Vitest | 유닛 테스트 |
| @testing-library/react | React 컴포넌트 테스트 |
| Playwright | E2E 테스트 |

---

## 2. 테스트 실행

```bash
npm test              # Vitest 유닛 테스트
npm run test:watch    # 워치 모드
npm run test:coverage # 커버리지 리포트
npm run test:e2e      # Playwright E2E 테스트
npm run test:all      # 유닛 + E2E 전체
```

---

## 3. 테스트 구조

테스트 파일 목록: `find src -name "*.test.*" && find e2e -name "*.spec.*"` 실행으로 확인.

### 유닛 테스트 위치
- `src/features/` 하위 — 도메인 로직 및 UI 컴포넌트 테스트
- `scripts/` — MD 파서 테스트

### E2E 테스트 위치
- `e2e/` — Playwright 시나리오 테스트

---

## 4. 테스트 환경 설정

### Vitest

- **jsdom**: React 컴포넌트 (`.test.tsx`)
- **node**: 유틸리티 + 스크립트 (`.test.ts`)
- **셋업 파일**: `src/test-setup.ts` (@testing-library/jest-dom)
- **커버리지**: v8 provider, `src/features/**` + `src/shared/**` + `scripts/**`

### Playwright

기본은 localhost 대상이며, `PLAYWRIGHT_BASE_URL` env 로 dev 등 배포 환경 대상 실행을 지원한다.

| 항목 | localhost (기본) | dev 환경 대상 (`PLAYWRIGHT_BASE_URL` 박제) |
|------|------------------|-------------------------------------------|
| Base URL | `http://localhost:3002` | `PLAYWRIGHT_BASE_URL` 값 (예: `https://dev.grimoire-book.com`) |
| webServer | `npm run dev -- -p 3002` 자동 기동 | 비활성 (이미 배포된 환경) |
| 브라우저 | Chromium headless | Chromium **headed** (reCAPTCHA v3 대응) |
| 타임아웃 | 30000ms | 60000ms (Azure 콜드스타트 고려) |

- **dev 대상 headed 강제 사유**: dev 서버는 `RECAPTCHA_SECRET_KEY` 박제 →
  `/login` 로그인이 reCAPTCHA v3 점수 검증을 거친다. headless 브라우저는 봇 판정(낮은 점수)으로
  서버가 400 차단 → headed(실제 창) 브라우저만 정상 점수로 통과한다.
- **dev 대상 실행 예**:
  `PLAYWRIGHT_BASE_URL=https://dev.grimoire-book.com E2E_AUTHOR_PASSWORD=… npm run test:e2e -- account-delete`
- **E2E 계정 env**: `E2E_AUTHOR_*` (작가 로그인), `E2E_ADMIN_*` (관리자) — `.env.example` 참조.
  미박제 시 로그인 의존 it 는 `test.skip`.

---

## 5. 테스트 패턴

### Mock 전략

- `next/navigation` → vi.mock (라우터 모킹)
- `framer-motion` → vi.mock (애니메이션 건너뛰기)
- 외부 컴포넌트 → vi.mock (독립 테스트)

### 네이밍

- 유닛: `*.test.ts` / `*.test.tsx`
- E2E: `*.spec.ts`
- 한국어 설명 사용

---

## 6. 필수 검증 규칙

### 커밋 전 검증

```bash
npm test && npm run build
```

테스트 미통과 상태로 커밋 금지 (루트 `CLAUDE.md` §2).

### 크롬 브라우저 실제 확인

모든 작업(기능 추가, 수정, 버그픽스) 후 크롬 브라우저에서 실제 동작을 확인한다.
자동 테스트만으로는 시각적 결함이나 레이아웃 깨짐을 잡을 수 없다.

### 고아 페이지 검증

모든 페이지가 네비게이션(PlatformNav, UniverseNav, 대시보드 사이드바 등)에서 도달 가능한지 확인한다.
네비게이션에서 접근 불가능한 페이지는 고아 페이지로 간주하고, 네비게이션에 링크를 추가하거나 페이지를 제거한다.
