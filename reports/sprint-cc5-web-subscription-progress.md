# sprint-cc5-web-subscription — 진행 박제

> CC-5 web 구독 페이지 노출 (준비중 모드). 2026-05-22.
> 작업 디렉토리: `grimoire-web/`. 브랜치: `feature/cc5-web-subscription-coming-soon` → develop `--no-ff` 로컬 머지 (remote push 금지).

## 배경

CC-5 server 측 Polar 구독 정기결제 API(`POST /api/subscriptions/checkout`·`GET /api/membership`) prod 라이브.
단 Polar KYC + 한국 payout 승인 미완 → 실 구독 결제 불가(test mode).
사용자 요청: 구독 기능/페이지를 web 에 노출하되 모든 구독 액션 버튼 → "준비중" 팝업. server 구독 API 실호출 0건.

## sub-task별 결과

### sub-task 1 — 구독 플랜 UI + 액션 버튼 노출 ✅

- 변경: `src/features/credits/MembershipPlans.tsx`
- 기존: `onSelect` 미전달 시 `<div>`만 렌더(버튼 0). `selectable` 분기로 카드 전체가 버튼이거나 div.
- 변경 후: 카드는 항상 `<div>`, footer에 액션 버튼 별도 렌더(`onSelect` 전달 시).
  - pro/premium: "구독하기" 활성 버튼 (`bg-black`)
  - free: "무료 플랜" 비활성 버튼 (결제 대상 아님)
  - currentTier 일치 카드: "현재 플랜" 비활성 버튼
- pro 카드 "추천" 배지(`#e53e3e`) 추가. 미사용 `selectedTier` prop 제거(YAGNI).
- 가격(₩9,900/₩19,900)·월 포인트 풀(93,000/191,500 pt)·보너스 특징 — 기존 표시 유지.

### sub-task 2 — 모든 구독 액션 → "준비중" 모달 ✅

- 신설: `src/features/credits/ComingSoonModal.tsx`
- **신규 시각 컴포넌트 아님** — 기존 `Alert`(`src/components/Alert.tsx`, 사슴악마 시각 정본 PASS 컴포넌트) info 톤 래퍼. 새 색/레이아웃/타이포 0건.
- 메시지: "멤버십 구독 기능은 준비 중입니다. 곧 만나보실 수 있습니다. 현재는 포인트 충전으로 이용해 주세요." + 확인 버튼 1개.
- 연결된 버튼: 플랜 "구독하기"(pro/premium) + "구독 해지" — 모두 `MembershipPage.handleSelect`/`setComingSoonOpen(true)`로 수렴.
- server `/subscriptions/checkout`·`/membership` 호출 코드 0건 (api.ts 미접촉 — 해당 메서드 자체 미존재).

### sub-task 3 — 페이지 접근 경로 ✅

- `/dashboard/credits` → `/dashboard/membership` 링크: **기존 존재** (credits/page.tsx L108~114 "멤버십 구독으로 매월 포인트 받기").
- 대시보드 메인: `CreditsSection` 헤더에 "멤버십 →" 링크 **추가** (충전하기 링크 옆, `src/app/dashboard/_components/CreditsSection.tsx`).
- PlatformNav 드롭다운: 크레딧 링크는 있으나 멤버십은 미추가 — 대시보드 메인 + 충전 페이지 2경로로 충분(최소 구현).

### sub-task 4 — "준비중" 모달 ✅

- `Alert` 재사용 (sub-task 2 참조). 기존 안내 문구(membership/page.tsx 하단 "멤버십 안내" 박스)는 "준비 중" 강조만 남기고 유지 — 모달과 비중복(안내 박스 = 상시 안내, 모달 = 액션 시 차단).

## 추후 실연결 전환 용이성

- 모든 구독 액션이 `MembershipPage.handleSelect` 단일 핸들러로 수렴.
- Polar KYC 승인 시: `handleSelect`의 `setComingSoonOpen(true)` 1줄 → 실 `api.checkoutSubscription(tier)` 호출로 교체.
- `ComingSoonModal`은 그대로 두거나 제거. `MembershipPlans`는 무수정 (`onSelect` 시그니처 동일).

## 검증

- vitest: 신규 `ComingSoonModal.test.tsx` + 갱신 `MembershipPlans.test.tsx`. 결과는 DEV_REPORT.md sensor raw stdout 참조.
- tsc / build: sensor-web.sh 결과 참조.

## VCK 검수 필요 항목

- **`ComingSoonModal`** — 신규 파일이나 기존 `Alert`(시각 정본 PASS) 래퍼. 시각 표면 = `Alert` 그대로(bg-white / border-neutral-200 / rounded-xl / info 톤 = `#e53e3e` dot). 신규 색/레이아웃 0건 → 시각 정본 정합 추정 PASS. 메인이 VCK 별도 위임 예정.
- **`MembershipPlans` 버튼/배지 추가** — footer 버튼(`bg-black`/`bg-neutral-200`), pro "추천" 배지(`#e53e3e`) — 모두 기존 dashboard/credits 페이지에서 쓰는 팔레트. 플랫폼 neutral-* 스코핑 준수, 작가 g-* 침범 0건.

## 발견 사항

- `MembershipPage`는 server `/membership`(현재 등급) 미조회 → `currentTier` 항상 미전달 → "현재 플랜" 배지/비활성 미발동. CC-5 범위(구독 API 실호출 0건)상 의도된 동작. KYC 승인 후 `/membership` 연결 시 `currentTier` 전달하면 자동 동작.
- `MembershipPlans.test.tsx` 기존 테스트는 구 API(`selectedTier`, 카드 전체 버튼)를 검증 → 컴포넌트 변경에 맞춰 갱신 필요했음(완료).
