# TESTING.md — grimoire-web

> 테스트 전략 + 현황.

---

## 1. 프레임워크

| 도구 | 용도 |
|------|------|
| Vitest 4.x | 유닛 테스트 |
| @testing-library/react | React 컴포넌트 테스트 |
| Playwright 1.58+ | E2E 테스트 |

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

```
src/
├── features/universe/ui/
│   ├── ChapterBlock.test.tsx      # 챕터 블록 렌더링 (16개)
│   └── EpisodeViewer.test.tsx     # 에피소드 뷰어 (9개)
├── features/universe/data/
│   └── contents.test.ts           # 콘텐츠 데이터 (14개)
scripts/
└── parse-md.test.ts               # MD 파서 (27개)

e2e/
├── landing.spec.ts                # 랜딩 페이지 (6개)
├── episode.spec.ts                # 에피소드 뷰어 (7개)
├── navigation.spec.ts             # 네비게이션
└── navigation-state.spec.ts       # 네비게이션 상태
```

---

## 4. 현황

| 구분 | 테스트 수 | 상태 |
|------|----------|------|
| ChapterBlock | 16 | 통과 |
| EpisodeViewer | 9 | 통과 |
| contents | 14 | 통과 |
| parse-md | 27 | 통과 |
| **유닛 소계** | **66** | **통과** |
| landing (E2E) | 6 | 통과 |
| episode (E2E) | 7 | 통과 |
| navigation (E2E) | 5+ | 통과 |
| navigation-state (E2E) | 4+ | 통과 |
| **E2E 소계** | **22+** | **통과** |
| **총합** | **88+** | **통과** |

---

## 5. 테스트 환경 설정

### Vitest

- **jsdom**: React 컴포넌트 (`.test.tsx`)
- **node**: 유틸리티 + 스크립트 (`.test.ts`)
- **셋업 파일**: `src/test-setup.ts` (@testing-library/jest-dom)
- **커버리지**: v8 provider, `src/features/**` + `src/shared/**` + `scripts/**`

### Playwright

- **브라우저**: Chromium (headless)
- **Base URL**: `http://localhost:3002`
- **서버**: `npm run dev -- -p 3002` (reuseExistingServer 활성)
- **타임아웃**: 30000ms

---

## 6. 테스트 패턴

### Mock 전략

- `next/navigation` → vi.mock (라우터 모킹)
- `framer-motion` → vi.mock (애니메이션 건너뛰기)
- 외부 컴포넌트 → vi.mock (독립 테스트)

### 네이밍

- 유닛: `*.test.ts` / `*.test.tsx`
- E2E: `*.spec.ts`
- 한국어 설명 사용

---

## 7. 커밋 전 검증

```bash
npm test && npm run build
```

테스트 미통과 상태로 커밋 금지 (루트 CLAUDE.md §2).
