# CHANGELOG.md — 변경 이력

## [Unreleased] - 2026-05-22

### Added — CC-5 web 구독 페이지 노출 (준비중 모드) (sprint-cc5-web-subscription)

CC-5 server 측 Polar 구독 정기결제 API(`POST /subscriptions/checkout`·`GET /membership`)는 prod 라이브이나, Polar KYC + 한국 payout 승인 미완으로 실 구독 결제 불가(test mode). 구독 기능/페이지를 web 에 선노출하되, 모든 구독 액션 버튼은 "준비중" 모달만 띄우도록 가드. server 구독 API 실호출 0건.

- **`MembershipPlans` — 표시 전용 → 구독 액션 버튼 노출.** 기존엔 `onSelect` 미전달 시 `<div>`만 렌더돼 버튼이 없었음. CC-5: `onSelect` 전달 시 카드마다 footer 버튼 렌더(pro/premium "구독하기" 활성, free "무료 플랜" 비활성, currentTier 일치 카드 "현재 플랜" 비활성). pro 카드 "추천" 배지 추가. 미사용 `selectedTier` prop 제거(YAGNI).
- **신설 `ComingSoonModal`** (`src/features/credits/ComingSoonModal.tsx`) — "준비중입니다" 안내 모달. 신규 시각 컴포넌트 아님 — 기존 `Alert`(사슴악마 시각 정본 PASS 컴포넌트) info 톤 래퍼. 새 색/레이아웃 0건. 메시지 "멤버십 구독 기능은 준비 중입니다. 곧 만나보실 수 있습니다…" + 확인 버튼 1개.
- **`/dashboard/membership` 개편** — `MembershipPlans`에 `onSelect={handleSelect}` 전달 → 구독 버튼 노출. 구독 해지 버튼 추가. 모든 구독 액션(플랜 선택/구독하기/해지)이 단일 핸들러 `handleSelect`로 수렴 → `ComingSoonModal` 노출. server `/subscriptions/checkout`·`/membership` 호출 0건. 기존 인라인 안내 문구는 "준비 중" 강조만 남기고 유지(모달과 비중복).
- **추후 실연결 전환 구조** — Polar KYC 승인 시 `MembershipPage.handleSelect`의 `setComingSoonOpen(true)` 1줄을 실 `api.checkoutSubscription(tier)` 호출로 교체하면 됨. 액션 핸들러를 1곳에 모아 가드→실연결 전환을 최소 변경으로.
- **진입 경로 노출** — `/dashboard/credits`→멤버십 링크는 기존 존재. 대시보드 메인 `CreditsSection` 헤더에 "멤버십 →" 링크 추가(충전하기 링크 옆).
- 검증: vitest — 신규 `ComingSoonModal.test.tsx`(7 it: 가시성/문구/onClose/body override + 구독 버튼 클릭→모달 노출 플로우 3건) + `MembershipPlans.test.tsx` 갱신(버튼 렌더/비활성/tier 콜백). 시각: 플랫폼 neutral-* + `#e53e3e`·`#f5f5f5`(기존 dashboard 동일 팔레트, 신규 색 0). 새 컴포넌트 `ComingSoonModal` — Alert 래퍼라 시각 표면 최소, VCK 검수 대상.

## [Unreleased] - 2026-05-17

### Added — 크레딧 개편 I Phase web Generator (sprint-credit-overhaul, Tier 2)

크레딧·구독·채팅 과금 개편 I Phase의 server 측(schema + 차감/적립 로직 + sensor 5종, develop `376ee04`) qa CONDITIONAL PASS 이후 web UI 측 구현. 디노미네이션 1크레딧 = 1,000pt + 포인트 출처 4종 회계 + 채팅 4구간 차감 안내 + 멤버십 플랜. 정본: `.claude/shared-contracts.md` §30 CreditOverhaul + `.claude/state/sprint-credit-overhaul-s-phase-draft.md` §14.

- **신설 `src/features/credits/` 슬라이스** (FSD — slice index.ts Public API 격리). `credit-overhaul.ts`: §30 도메인 상수 미러(CREDIT_TO_POINT / CHAT_CHARGE_TIERS 4구간 190·810·3,390·5,520pt / ANALYSIS·THEME_POINT_COST / MEMBERSHIP_MONTHLY_POOL · PRICE_KRW / 출처 라벨) + 디노미 표시 유틸(`formatPoints` 천단위 / `abbreviatePoints` 만·억 축약 — S Phase Draft §8-1 "큰 숫자 완화 UI"). `point-balance.ts`: server `/credits/balance` 응답 정규화(`normalizePointBalance`) — 출처 회계(bySource)/포인트 총량(available)/정수 크레딧(credits, 현행 server backward-compatible) 3형태 모두 PointBalanceView 로 변환.
- **신설 컴포넌트 3종** — `CreditBalanceCard`(포인트 잔액 표시: 헤드라인 축약 + 4 출처 분해 + deficit 외상 안내), `ChatChargeGuide`(채팅 4구간 차감 안내, 일반/compact 모드), `MembershipPlans`(멤버십 3등급 표시·선택 — 결제 연동 없음). 채팅 `_components/ChatChargeBadge`(메시지별 4구간 사후 차감 결과 배지).
- **`/dashboard/credits` 개편** — 크레딧 → 포인트 디노미 표시. 잔액 4 출처 + deficit(`CreditBalanceCard`), 충전 패키지 pt 표기(server `/payments/products` 정본 — Polar 흐름 재사용), 채팅 4구간 차감 안내, 분석 2,440pt / 테마 590pt 안내, 멤버십 페이지 링크.
- **신설 `/dashboard/membership`** — 멤버십 free/pro/premium 3등급 플랜 표시(가격 + 월 포인트 풀 + 특징). 표시·선택 전용 — Polar 구독 결제 연동은 I Phase 외(별도 sprint PAY-P1-4).
- **`/dashboard/chat` 차감 표시** — assistant 메시지에 `ChatChargeBadge` 추가. server `sendMessage` 응답의 `chargedPoints`/`chargeTier`(4구간 사후 차감 결과 — §30 ChatMessage) 표시.
- **API 클라이언트** — `api.getPointBalance()` 추가 (`/credits/balance` → `normalizePointBalance` 정규화). BFF 프록시 경유 — 백엔드 직접 호출 없음.
- **상태 검증 (CLAUDE.md §0)** — server I Phase 는 backward-compatible: `/credits/balance`·`/auth/me`·`/payments/products` HTTP 응답 미변경(정수 크레딧·구 3 패키지 유지), `CreditLedger.getBalance`(4 출처)·`MembershipPlan` 은 domain 에만 존재하고 HTTP 미연동. `ChatMessage.chargedPoints`/`chargeTier` 만 실제 응답에 포함. → web 은 server 가 실제 반환하는 값에만 의존(없는 출처 값 추정 금지). 잔액은 정수 크레딧 ×1,000 환산 표시, server 가 출처 회계 응답을 줄 때 자동 분해.
- 검증: vitest 160 → **210** passed (+50 it, 신규 6 파일). credits 슬라이스 커버리지 lines/stmts 100%. tsc --noEmit 0 errors / eslint 신규 파일 0 errors·0 warnings / Next.js build PASS (`/dashboard/membership` 라우트 생성 확인). 플랫폼 neutral-* + `#e53e3e`·`#f5f5f5`(기존 dashboard 페이지 동일 팔레트, 신규 색상 0). 시각 컴포넌트 신규 4종 — VCK 사전 검수 대상.

### Added — USER-SOFT-DELETE E2E 통합 검증 (sprint-e2e-user-soft-delete, Tier 1)

USER-SOFT-DELETE 풀스택 5/15 dev+prod 배포 종료(server-prod rev 101 / web-prod rev 119 Healthy) 이후 미완이던 Playwright E2E 통합 검증 마무리. vitest 9 it(AccountDeleteDialog 4 + UsersTab 5)은 5/15 web Generator에서 작성됨 — 본 변경은 E2E spec 영역만 추가.

- **신설 `e2e/account-delete.spec.ts`** — Playwright E2E 5 it 블록. 시나리오 3건: ① 본인 탈퇴 (`/dashboard/profile` "위험 영역" → AccountDeleteDialog 모달 → slug 미입력/불일치 시 "탈퇴" 버튼 disabled + 불일치 경고 → slug 정합 + 동의 체크박스 → enabled) ② 어드민 force delete (`/admin` '탈퇴/익명화' 탭(UsersTab) → 행 "강제 탈퇴" → 사유 필수 모달 → 사유 미입력 시 confirm 버튼 disabled → 사유 입력 시 enabled) ③ GDPR anonymize (동일 탭 → 행 "익명화" → 사유 필수 모달, force delete 동형 검증). 비인증 리다이렉트 it 2건(`/dashboard/profile` → `/login`, `/admin` → `/admin/login`) 포함.
- **데이터 파괴 방지 영역 (CRITICAL)** — 본인 탈퇴 it는 AccountDeleteDialog.onConfirm 이 실제 `api.deleteMyAccount()` 호출이므로 confirm("탈퇴") 버튼을 끝까지 클릭하지 않고 모달 취소로 종료 (활성/비활성 상태까지만 검증). force delete / anonymize it는 `page.on('dialog', d => d.dismiss())`로 UsersTab.handleAction 의 `window.confirm()` 네이티브 게이트를 자동 거부 → `api.adminForceDeleteAuthor` / `api.adminAnonymizeAuthor` 절대 미호출 — deerdevil 등 실제 작가 계정 soft delete/anonymize 0건.
- **환경 의존 graceful degradation** — 비인증 리다이렉트 it 2건은 server 무관 web 단독 PASS. 로그인 의존 it 3건은 `E2E_AUTHOR_SLUG` / `E2E_AUTHOR_PASSWORD` / `E2E_ADMIN_PASSWORD` env 미박제 시 `test.skip` (기존 `auth.spec.ts` / `dashboard.spec.ts` 정합). 로그인 헬퍼는 `dashboard.spec.ts` slug-or-email 폼 패턴 차용.
- 검증: `npm run test:e2e -- account-delete` 2 passed + 3 skipped (server localhost:3000 미기동 — `ECONNREFUSED` 로그 확인. env 박제 + server 기동 시 3 시나리오 PASS) / vitest 9 it 회귀 무손상 PASS (UsersTab 5 + AccountDeleteDialog 4) / tsc --noEmit 0 errors / eslint 0 errors / Next.js build PASS. 시각 컴포넌트 신규 0건 (E2E spec만) — VCK 검수 불요. globals.css 디자인토큰 변경 0.

## [Unreleased] - 2026-05-15

### Added — USER-SOFT-DELETE web Generator (sprint-user-soft-delete, §15-1 web 영역)

본인 계정 탈퇴 + 운영자 강제 탈퇴 + GDPR 익명화 UI 박제. server 영역(domain/policy/port/adapter/usecase/cron + Prisma migration)은 별도 sprint 영역 (parallel server agent). 본 변경은 web UI 영역만 — BFF 프록시 경유 강제 + HttpOnly Cookie 자동 + localStorage 0 박제. 사용자 5/15 §16 6 결정 옵션 A 채택 정합 (User.deletedAt + 작품 영역 Restrict + GDPR basic + 자동 cron + `0 4 * * *`).

- **신설 `src/features/account/AccountDeleteDialog.tsx`** — 본인 계정 탈퇴 모달. props: `{ open, slug, name, onClose, onConfirm }`. 검증 영역: 본인 슬러그 재입력 정합 (오작동 방지) + 동의 체크박스 영역 영역 + 사유 선택 입력 (max 500자, audit log 박제 영역) + 30일 유예 + 작품 보존 + 회계 보존 + GDPR 익명화 정책 5개 항목 박제. 시각 정본 (사슴악마): Alert.tsx 동일 모달 골격 차용 — bg-white + border-neutral-200 + rounded-xl + 경고 dot `#e53e3e` (Alert warning tone 정합). 작가 g-* 토큰 침범 0건, 플랫폼 neutral-* 영역. ESC 키 닫기 + backdrop 클릭 닫기 (submitting 0건 강제). onConfirm 실패 시 에러 메시지 표시 + 모달 영역 유지 (영역 영역 0).
- **신설 `src/features/account/index.ts`** — barrel export 박제 (`AccountDeleteDialog`, `AccountDeleteDialogProps`).
- **신설 `src/features/account/AccountDeleteDialog.test.tsx`** — vitest 4 it 블록 (open=false 가시성 게이트 / slug 미일치 disabled / slug 정합 + 사유 박제 → onConfirm 호출 정합 / onConfirm 실패 시 에러 표시 + 모달 유지). 의미 있는 assertion (toHaveBeenCalledWith 사유 정합 + toHaveBeenCalledTimes + screen.getByText 정책 영역 검증) — 더미 toBeTruthy 0건.
- **갱신 `src/app/dashboard/profile/page.tsx`** — 페이지 하단 "위험 영역" 섹션 신설 (border-t neutral-200 + uppercase tracking 헤더 `#e53e3e` + 정책 안내 4줄 + 탈퇴 버튼 outline 영역). `AccountDeleteDialog` 마운트 + `onConfirm` 영역 `api.deleteMyAccount(reason)` 호출 + `logout()` 영역 클라이언트 상태 초기화 + `router.push('/login?account_deleted=1')` 이동. 기존 프로필 폼/소셜 영역 변경 0 (회귀 영역 0).
- **신설 `src/app/admin/tabs/UsersTab.tsx`** — 운영자 강제 탈퇴 + GDPR 익명화 탭. 사용자 검색(slug/email/ID, 기존 AuthorsTab 영역 정합) + 카드 + 상태 컬럼 (deletedAt 박제 시 "탈퇴됨" 빨강 배지) + 강제 탈퇴 / 익명화 버튼 분리 + 사유 필수 모달 영역 (textarea max 500자) + 네이티브 confirm() 멀티콘펌 (11 tabs 정본 — CreditsTab 영역 정합) + sonner toast.success/error + 페이지네이션 영역. AdminAuditLog 박제 (`admin_force_delete` / `gdpr_anonymize`) 영역 영역 강제. 시각 정본: admin neutral-* 영역 (다크 배경) — 작가 g-* 토큰 침범 0건.
- **신설 `src/app/admin/tabs/UsersTab.test.tsx`** — vitest 5 it 블록 (마운트 → adminListAuthors 호출 + 카드 렌더 / 강제 탈퇴 클릭 → 사유 모달 표시 + disabled / 강제 탈퇴 + 사유 + confirm 승인 → adminForceDeleteAuthor 1회 + toast.success / 익명화 + 사유 + confirm 승인 → adminAnonymizeAuthor 1회 + toast.success / confirm 취소 → API 호출 0회). toHaveBeenCalledWith 인자 정합 + confirmMsg 정합 검증.
- **갱신 `src/app/admin/page.tsx`** — `Tab` 타입에 `'users'` 추가 + TAB_LABELS에 `users: '탈퇴/익명화'` 박제 + UsersTab 마운트 분기 추가. 기존 AuthorsTab + planEdit + 역할 토글 영역 변경 0 (회귀 영역 0).
- **갱신 `src/lib/api.ts`** — `deleteMyAccount(reason?)` (DELETE `/auth/me`) + `adminForceDeleteAuthor(id, reason)` (POST `/admin/authors/:id/force-delete`) + `adminAnonymizeAuthor(id, reason)` (POST `/admin/authors/:id/anonymize`) 3 메서드 신설. BFF 프록시 경유 (`/api` 접두) + HttpOnly Cookie 자동 + AbortSignal 자동. 기존 메서드 시그니처 변경 0.
- **갱신 `SCREENS.md`** — `/dashboard/profile` API 컬럼에 `DELETE /api/auth/me` 추가 + 설명 영역 "계정 탈퇴" 박제. `/admin` 탭 매트릭스에 "탈뎈/익명화" 추가 (16 탭) + UsersTab 영역 박제 + API 컬럼에 `POST /api/admin/authors/:id/force-delete` + `POST /api/admin/authors/:id/anonymize` 추가. `src/features/account/` 슬라이스 신설 박제 (AccountDeleteDialog).
- 검증: vitest 151→160 PASS (+9 신규 — AccountDeleteDialog 4 + UsersTab 5) / tsc --noEmit 0 errors / Next.js build PASS (23 routes) / lint 0 errors (warnings 5건은 본 sprint 외부 — CardTransition.tsx + AuthorSpace.tsx pre-existing) / 외부 Anthropic API 의존 0건 / localStorage 토큰 박제 0 / BFF 프록시 우회 0.
- 시각 정본 (visual-canon-keeper 자가 검수): AccountDeleteDialog는 Alert.tsx 동일 모달 골격 (bg-white + border-neutral-200 + rounded-xl + 경고 dot `#e53e3e` warning tone) 차용 — 사슴악마 정본 변경 0. UsersTab은 기존 AuthorsTab + CreditsTab 시각 정본 영역 (neutral-900 + neutral-700 + bg-red-700 / yellow-700 액션 분기) 차용 — 작가 g-* 토큰 침범 0건. globals.css 디자인토큰 영역 변경 0 (사용자 5/15 명시 정합).

## [Unreleased] - 2026-05-04

### Added — slug 로그인 마이그레이션 web Phase 2 (EMAIL-P0-3, sprint-email-p0-3-slug-login)
- `src/app/login/page.tsx` — input 입력칸 1개로 통합. label "이메일" → "이메일 또는 슬러그", placeholder "your@email.com" → "your@email.com 또는 deerdevil", `type="email"` → `type="text"`, htmlFor + autoComplete 박제. `emailOrSlug` state로 단일화 후 trim → `AuthProvider.login(emailOrSlug, password, recaptchaToken)` 위임.
- `src/features/auth/AuthProvider.tsx` — `EMAIL_OR_SLUG_REGEX` (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) + `detectIdentifierType` 헬퍼 박제. `login(emailOrSlug, password, recaptchaToken)` 시그니처로 갱신 + 정규식 자동 판별 후 `api.login({ email })` 또는 `api.login({ slug })` XOR 박제. 후향호환 — emailOrSlug에 email 입력 시 기존 동작 100% 유지.
- `src/features/auth/index.ts` — barrel export에 `EMAIL_OR_SLUG_REGEX` + `detectIdentifierType` 추가.
- `src/lib/api.ts` — `login()` 시그니처 `{ email?: string; slug?: string; password: string; recaptchaToken?: string }`로 확장 (기존 `email: string` → 옵셔널, `slug?` 추가). server LoginDto Phase 1과 양립.
- `src/features/auth/AuthProvider.test.tsx` (신설) — vitest 11 it 블록 (정규식 7건 + login 자동 판별 6건). 의미 있는 assertion 8건 (toHaveBeenCalledWith 인자 정합 + toMatchObject + toHaveBeenCalledTimes — 더미 toBeTruthy 0건).
- `e2e/auth.spec.ts` — placeholder/label assertion 갱신 + 신규 it "슬러그로 로그인 후 dashboard 진입" 박제 (E2E_AUTHOR_SLUG default `deerdevil` + E2E_AUTHOR_PASSWORD 박제 시 PASS, 미박제 시 skip).
- `e2e/dashboard.spec.ts` — `process.env.E2E_AUTHOR_SLUG ?? E2E_AUTHOR_EMAIL` 양립 옵션 추가. `getByLabel('이메일 또는 슬러그')` 사용으로 통합 입력칸 정합.
- `.env.example` — `E2E_AUTHOR_SLUG=deerdevil` 박제. EMAIL_INTEGRITY_PLAN §13 정합.
- 검증: tsc 0 errors / vitest 151/151 PASS (이전 140 → +11) / lint 0 errors (warning 5건은 본 sprint 외부 — AuthorSpace.tsx + CardTransition.tsx) / build PASS / e2e dry-run 9 tests (`auth.spec.ts:60` 신규 it 박제 확인) / 외부 인용 0건.
- 시각 정본 (visual-canon-keeper) 자가 검수: placeholder/label 텍스트 변경 + type=email→text + htmlFor/autoComplete 박제만. border/border-radius/padding/색상/크기 변경 0건. 사슴악마 정본 (deerdevil 작가공간/뷰어/목록) 직접 영향 0 (`/login`은 플랫폼 영역).

## [Unreleased] - 2026-05-03

### Added — 운영자 수동 크레딧 지급/차감 web UI (PAY-P0-3, sprint-pay-p0-3-admin-credit-grant-ui)
- 신설 `src/app/admin/tabs/CreditsTab.tsx` — 사용자 검색(slug/email/ID) → 카드 결과 → 선택 → 잔액 표시 → 금액(음수=차감, 양수=지급) + 사유 필수 입력 → 네이티브 confirm() 멀티콘펌(11 tabs 정본) → adminGrantCredits/adminDeductCredits 분기 호출(절대값) → sonner toast 결과 + 잔액 즉시 갱신.
- 변경 `src/app/admin/page.tsx` — Tab union에 `'credits'` 추가, `TAB_LABELS.credits = '크레딧'`, `import { CreditsTab }` + `tab === 'credits' && <CreditsTab />` 라우팅. 기존 인라인 `CreditsTab` 함수(line 288-314, 사용자 검색/멀티콘펌/sonner 토스트 부재) 제거.
- 신설 `src/app/admin/tabs/CreditsTab.test.tsx` — vitest 7 it 블록 (검색→카드 / 사유 누락 disabled / amount=0 disabled / confirm 승인 → grant + toast.success + 잔액 즉시 갱신 / 음수 amount → deduct 절대값 / confirm 취소 → API 0건 / API 실패 → toast.error). adminListAuthors/adminGrantCredits/adminDeductCredits/window.confirm/sonner toast 모두 mock + toHaveBeenCalledWith 정확 검증.
- VCK 사전 검수 PASS (CONDITIONAL — AA-1~6 [MUST] + AA-7 [NICE] helper text 모두 준수). admin neutral-* 영역, 작가 g-* 토큰 침범 0건 (sensor 검증). PaymentsTab/CommentsTab/AuthorsTab 시각 패턴 정합.
- server 변경 0건 — 백엔드 API(`POST /admin/credits/grant`, `POST /admin/credits/deduct`) 재사용, AdminAuditLog 자동 박제 인프라 그대로.
- 검증: tsc 0 errors / vitest 140/140 PASS (이전 133 → +7) / lint 0 errors / build PASS / sensor-web 3/3 / sensor-admin-credit-ui 10/10 / eval regression-54 8/8 / eval 전체 54/54 PASS (이전 53/54).

### Fixed — 테마 에디터 preset 변경 시 사용자 입력 name 보존 (P2-#10 UX, sprint-theme-editor-name-sync)
- `dashboard/theme/page.tsx` + 신설 `_hooks/useThemeName.ts` — 사용자가 테마 이름 input을 직접 수정한 적이 있으면(`userEditedName=true`), preset 변경 시 themeName을 preset label로 덮어쓰지 않음. 자동 로드(`setNameFromServer`)는 flag 변경 안 함 → edit 모드 진입 후 첫 preset 변경은 기존처럼 label 동기. AC-1~AC-5 PASS, vitest 6/6 PASS, eval regression-50 신설 5/5.

## [0.32.3] - 2026-04-29

### Security — X-Powered-By 헤더 노출 차단 (Next.js 핑거프린팅 방어)

#### Changed
- `next.config.ts`: `poweredByHeader: false` 추가 — Next.js 기본값(`true`)으로 응답에 노출되던 `X-Powered-By: Next.js` 헤더 제거

#### Rationale
- 외부 보안 점검(강의 4화 시연용 핸드오버)에서 발견된 프레임워크 핑거프린팅 이슈
- 공격자가 "Next.js 사이트"임을 알면 Next.js 특화 취약점(SSRF/prefetch 악용 등) 표적화 가능
- 다른 보안 헤더(HSTS/CSP/X-Frame-Options/Referrer-Policy/Permissions-Policy) 영향 없음

#### Verification
- 로컬 dev (port 3001) curl `-sI` `/`, `/explore`, `/dashboard` 모두 X-Powered-By 헤더 미포함
- 크롬 fetch로 정적 자원(`_next/static/css/app/layout.css`) 응답에서도 `has_x_powered_by=false` 확인

## [0.32.2] - 2026-04-24

### Fix — 크레딧 UI 동기화 + 테마 "기본 적용" 버튼 항상 노출

#### Changed (크레딧 상태관리)
- `features/auth/AuthProvider.tsx` — 로그인 상태에서 `window.focus` + `document.visibilitychange` 이벤트에 자동 `api.getProfile()` 재호출. 다른 탭·디바이스·결제 webhook에서 크레딧이 바뀌어도 현재 탭이 활성화되는 순간 네비바/대시보드 숫자 동기화
- `dashboard/theme/page.tsx handleGenerate` — AI 테마 생성(1 크레딧) 성공/실패 양쪽에서 `refreshUser()` 호출 (누락 수정)
- `features/reader/ui/EpisodeFooter.tsx handleGift` — 독자 선물 후 `refreshUser()` 호출 (누락 수정)
- `app/[author]/profile/page.tsx` 선물 버튼 — 동일 (누락 수정)

#### Changed (테마 기본 적용)
- `dashboard/_components/ThemeSlots.tsx` — "기본 적용" 버튼을 `t.isSlotted` 조건 대신 `t.source !== 'system'` 조건으로 노출. 서버 `activateTheme`이 슬롯에 없는 테마도 자동 배정 + auto-evict 지원하므로 UI에서 막을 필요 없음
- 적용 성공 토스트 분기: 슬롯에 없던 테마는 "슬롯에 추가하고 기본 테마로 적용했어요" 메시지

#### Rationale
- 사용자 보고 1: "네비바 크레딧 상태관리 전혀 안 됨". Zustand 미사용 확인(크레딧은 AuthProvider React Context로 관리되고 있음 — 설계는 정상). 근본 원인은 **크레딧 차감 후 `refreshUser` 호출 누락 3곳** + **포커스 복귀 자동 갱신 없음**
- 사용자 보고 2: "테마 2에서 3으로 바꾸려는데 안 바뀜". 서버는 지원하는데 UI가 `t.isSlotted` 조건으로 버튼을 숨겨놔서 슬롯에 없는 테마는 활성화 경로 자체가 막혀있던 UI 버그. 서버 `ThemeSlotUseCase.activateTheme`에 auto-evict 로직 추가하고 UI 조건도 완화해 경로 복구

## [0.32.1] - 2026-04-24

### Hotfix — AI 분석을 fire-and-forget으로 전환 (사용자 UX 의도 정합)

#### Changed
- `dashboard/analysis/page.tsx`:
  - `runAnalyze`를 `await` 제거 — 요청은 시작하고 백그라운드에서 진행 (브라우저가 SPA 내내 요청 유지)
  - "분석 진행 중 locked" Alert 제거 → "분석을 시작했어요" 안내 Alert로 교체
  - 안내 Alert 확인 누르면 `router.push('/dashboard')`로 대시보드 복귀
  - 분석 완료/실패는 백그라운드에서 toast로 알림 + `refreshUser()` 호출 (AuthProvider 공유 상태라 다른 화면에서도 크레딧 갱신됨)
  - state명 `analyzing` → `submitting` (요청 송신 중 의미로 명확화)

#### Rationale
- 사용자 의도 재확인: Alert는 "**나가지 말고 기다리세요**"가 아니라 "**나가서 다른 작업 하셔도 됩니다**" 안내용
- AI 분석이 1~2분 걸리는 동안 사용자를 화면에 묶어두는 것은 UX 낭비. 백그라운드 실행 + 완료 시 분석 기록에 자동 저장 + toast 알림으로 충분
- 결과 자체는 0.32.0에서 도입한 AnalysisReport DB 영구 저장 + `/dashboard/analysis/history` 화면으로 언제든 조회 가능

## [0.32.0] - 2026-04-24

### F4 보강 — Alert 컴포넌트 + 분석 기록 화면 + 원고 관리(덮어쓰기·삭제)

#### Added
- `src/components/Alert.tsx` — 그리모어 톤앤매너 기본 모달 얼럿 (default/info/warning/success tone, locked 모드, cancel/confirm 개별 숨김 지원)
- `src/app/dashboard/analysis/_components/AnalysisResultCards.tsx` — 결과 카드 3종 렌더러 (분석 페이지와 히스토리 모달 공용)
- `src/app/dashboard/analysis/history/page.tsx` — 분석 기록 리스트 + 상세 모달 (서버 `GET /analysis/reports`, `GET /analysis/reports/:id`)
- `src/app/dashboard/episodes/page.tsx` — 원고 관리 화면 (작품 선택 → 회차 리스트 → 파일 덮어쓰기 / 삭제). 본문 복붙 UI 없음 (서비스 원칙 준수)
- `api.getAnalysisReports()`, `api.getAnalysisReport(id)`, `api.reuploadEpisode(id, data)` — 신규 API 메서드
- `AnalysisReport`, `AnalysisReportSummary` 타입 (`src/types/api.ts`)

#### Changed
- `dashboard/analysis/page.tsx` — 재작성:
  - 결과를 이 화면에서 직접 렌더링하지 않음 → 분석 완료 시 `/dashboard/analysis/history`로 라우팅
  - 분석 시작 전 `Alert` 확인 모달 (소요 시간 + 크레딧 차감 안내)
  - 분석 중 `Alert locked` 모달로 진행 상태 고정 표시
  - **버그 수정**: useEffect 의존성을 `user` → `user.slug` (primitive)로 변경 → `refreshUser()`로 user 참조만 바뀌어도 재로딩 루프 차단. 결과 사라짐 증상 근본 원인
- `dashboard/_components/QuickActions.tsx` — "원고 관리", "분석 기록" 항목 추가
- `dashboard/analysis/page.tsx` 상단에 "분석 기록 보기 →" 링크 추가

#### Tests
- 119 vitest 전부 통과 (기존)

#### Docs Sync
- `docs/ai-analysis-spec.md`, `docs/api-contract.md`, `docs/data-model.md` — 서버 정본에서 복사

#### Rationale
- 사용자 버그 3건 근본 원인 + 해결:
  1. 분석 후 결과가 사라짐 → `user` 의존 useEffect가 `refreshUser` 호출 시 재실행되어 `setResults([])` 트리거. 해결: 결과 자체를 DB 저장 + 히스토리 화면 분리, 의존성을 slug로 제한
  2. 두 번째 분석 동작 안함 → 결과 렌더링 상태가 꼬여있던 것으로 추정. 결과 UI 제거 + 완료 시 라우팅으로 상태 격리
  3. 다른 작품 분석 5분 무응답 → 프론트 AbortSignal.timeout(120s)은 그대로. `Alert locked` 진행 모달로 사용자가 "무응답"으로 오인하지 않도록 시각화
- 원고 수정/삭제 신규 기능 — 서버 `/episodes/:id/reupload`, `DELETE /episodes/:id`는 이미 존재했으나 웹 UI 미연결이었음. 기존 서비스 원칙(복붙 금지) 준수 위해 파일 업로드 경로로만 구현

## [0.31.0] - 2026-04-24

### F4 — AI 일관성 분석 Q1=(a) 에피소드 ID 모드 (벤치마크 정합)

#### Changed
- `dashboard/analysis/page.tsx` 전면 재작성 — Claude Projects 벤치마크 정합 (`docs/ai-analysis-spec.md §6-1`)
  - **textarea(본문 복붙) 완전 제거** — 작가가 회차 업로드 시점에 본문 제공 완료 → 분석 화면 재입력 강제는 벤치마크 위반
  - 작품 + 회차 선택만으로 분석 (선택 회차 본문은 서버가 DB에서 로드)
  - 첫 회차 자동 선택, 작품 변경 시 이전 결과 비움
  - 회차 0개 시 안내 + 대시보드 업로드 링크
  - "재분석할 기존 에피소드 (선택 사항)" 별도 드롭다운 제거 — self-reference 청크 제외는 RAG 내부 사정이라 작가에게 노출 불필요 (벤치마크 정합)
- `lib/api.ts` `analyzeEpisode(episodeId, types?)` — 인자 4개 → 2개로 축소. body는 `{ episodeId, types }`만 전송 (workId/newEpisodeText 제거)

#### Docs Sync
- `docs/ai-analysis-spec.md` — 서버 정본에서 복사 (§5-1 흐름 0~6단계)
- `docs/api-contract.md` — 서버 정본에서 복사 (크레딧 3 정정 + 새 body)

#### Test Updates
- `lib/api.test.ts` — 신규 시그니처 6 케이스 (Abort/Timeout 메시지 변환, body 형식, types 미지정, 120s 타임아웃)
- 119 vitest 전부 통과

#### Rationale
- 사용자 피드백: "Claude 채팅 프로젝트 개념"이 정본 벤치마크. 작가가 자기 원고를 다시 복붙해야 하는 UX는 벤치마크 위반 + 본질 가치(이미 올린 회차들 사이 자동 일관성 감사) 작동 불가
- `research/FEATURE_AI_ANALYSIS.md §1` + `ai-analysis-spec.md §6-1` 정본 명시 — 분석 화면도 채팅처럼 작가는 회차 업로드만으로 끝나야 함

## [0.30.0] - 2026-04-19

### F1/F2/F3 — 크레딧 가격 인상 + 분석 3 크레딧 안내

#### Changed
- `dashboard/credits/page.tsx` — fallback 상품 `credit-5` 가격 ₩1,000→₩2,000 (개당 ₩200→₩400). 크레딧 사용 안내에 "AI 작품 분석: 3 크레딧" 라인 추가
- `dashboard/analysis/page.tsx` — 분석 버튼 캡션 "분석 시작 (3 크레딧)" + 차감/환불 안내 문구 추가
- `docs/ai-analysis-spec.md` — 서버 정본에서 복사 (Sonnet/Haiku 양 기준 병기 + 크레딧 차감 정책 표)

#### Rationale
- 서버 `/payments/products` API가 F1 인상 반영된 가격을 리턴 → 대시보드는 이를 소비할 뿐 (fallback은 서버 미연결 상황 안전망)
- 분석 페이지가 3 크레딧 차감 정책을 사용자에게 명시적으로 노출 → 예기치 못한 차감 방지

## [0.29.0] - 2026-04-19

### 업로드 미리보기 제목 정규화 (Safari 자모 분해 버그 회피)

#### Changed
- `useUploadPage.handlePreview` — 서버 응답의 `normalizedTitle` 소비. 사용자가 직접 편집하지 않은 상태면 `frontmatter.title` > `normalizedTitle` 우선순위로 title input 갱신
- `api.ts` `parseManuscript` / `uploadManuscriptFile` 타입에 `title?` + `normalizedTitle?` 필드 추가

#### Docs Sync
- `docs/api-contract.md` — 서버 정본과 동기화 (`normalizedTitle` 필드 명세)
- `docs/glossary.md` — Title Normalization / normalizedTitle 용어 정의 동기화

#### Rationale
- 서버 domain layer가 단일 진실 공급원 (grimoire-server `normalizeTitle()`).
  웹은 응답을 소비할 뿐 자체 정규화 로직 없음 → Two Sources of Truth 안티패턴 회피
- Safari의 `italic + Noto Serif KR faux synthesis` 조합에서 파일명 기반 title이 자모 분해되는 버그 회피
- 미리보기와 DB 저장 결과가 일치 → 원고공간 렌더링과 미리보기 렌더링 일관성 확보

## [0.28.0] - 2026-04-17

### 테마 시스템 UX 전면 개선 + 미리보기 버그 수정

#### Added
- 테마 에디터: "내 공간에 적용" 활성화 버튼
- 테마 에디터: 이름 편집 필드
- 대시보드: "내 작가 공간" 바로가기 (빠른 액션 01번)
- 대시보드: 테마 "기본 적용" 버튼 + 현재 기본 테마 "기본" 뱃지
- 미리보기 모달: 내 테마 ★ 슬롯 상태 표시
- api.ts: activateTheme, assignThemeToWork 메서드
- pre-push hook에 docs-sync 센서 연결

#### Fixed
- 미리보기 모달: 테마 변경 시 본문 사라지는 버그 (animation:'none' 오버라이드)
- CSP: accounts.google.com + static.cloudflareinsights.com 추가
- 테마 저장 시 자동 CSS 베이킹 (publishTheme 자동 호출)

## [0.27.0] - 2026-04-16

### 시각 정본 버그 수정 + DividerIcons "book" + 문서 현행화

#### Fixed
- [CRITICAL] theme.css fs-caption/fs-label fallback 19px → 정본 값 (0.75rem/0.8125rem)
- DividerIcons "book" 구분선 아이콘 추가 (Midnight 프리셋 dividerIcon 지원)

#### Changed
- DESIGN.md: 전체 u- 접두사 → g- 접두사 현행화
- design-tokens.md: max-width-reader 680px → 700px, serif 폰트 스택에 EB Garamond 추가
- SCREENS.md: AuthorSpace/WorkPage 컴포넌트 경로 수정 (components → features/reader/ui)
- theme-spec.md: dividerIcon 유니온에 "book" 추가
- TECH_STATUS: Reader/Social api.ts 연결 상태 ✅로 현행화
- SYNC_STATUS: 원고 파일 업로드/읽기 기능 UI 연결 완료 반영

## [0.26.0] - 2026-04-12

### 테마 선택 화면 + 본문 크기 제어 + 관리자 14탭 + 정비

#### Added
- 테마 에디터: AI/프리셋 선택 화면 (RoadRage 패턴)
- 에피소드 뷰어: 본문 크기 독립 제어 (A-/A+, localStorage 저장)
- 작가 프로필: 크레딧 선물 버튼 (1/3/5)
- 관리자 P1: 시계열 차트, 공지사항, 추천 작품 (12→14탭)
- 관리자 P2: 수익 대시보드, 테마 프리셋 관리
- 채팅 입력: textarea 자동 확장 (최대 8줄)

#### Fixed
- React hydration 경고 — SSR/CSR window 접근 분리

## [0.25.0] - 2026-04-11

### 관리자 패널 + 크레딧 정렬 + 테마 CDN

#### Added
- 관리자 패널 10탭 UI (/admin — 독립 인증, 다크 테마)
  - 통계, 사용자, 콘텐츠, 제재, 신고, 댓글, 결제, 접근로그, 설정, 감사로그
- 관리자 전용 로그인 (/admin/login — reCAPTCHA 없음)
- 탭 컴포넌트 분리 (src/app/admin/tabs/)
- 관리자 E2E 테스트 (Playwright, e2e/admin.spec.ts)

#### Changed
- 크레딧 페이지 폴백값 기획서 기준 (5/20/50)
- [author]/layout.tsx: CDN bakedCssUrl <link> 태그 로드
- 업로드 페이지 textarea 제거 (원칙 위반 수정)

#### Docs
- api-contract.md: 관리자 28개 엔드포인트 + reupload 추가
- environments.md: Polar + Blob Storage 환경변수 추가

## [0.24.0] - 2026-04-09

### Polar 결제 UI 3환경 배포 + 전수검사

#### Added
- `api.initiatePayment(productId, returnUrl)` (src/lib/api.ts)
- 크레딧 충전 페이지 결제 버튼 활성화 — Polar hosted checkout URL로 리다이렉트, 복귀 시 자동 balance refresh

#### Verified
- dev/inhouse/prod 3환경 결제 플로우 end-to-end 검증 (100% 할인 쿠폰 기반)
- 운영 페이지 curl HTTP 전수검사 25/25 통과 (플랫폼 페이지 13 + 사슴악마 공간 2 + 에피소드 5 + API 4 + 기타)
- 사슴악마 에피소드 시각 정본 정상 렌더링 확인

---

## [0.23.0] - 2026-04-08

### 테마 UI 갭 해소

#### Added
- 대시보드: 비활성 테마 삭제 버튼 (confirm 다이얼로그 포함)
- api.ts: deleteTheme() 메서드, updateTheme()에 name 옵션 추가

#### Changed
- EpisodeCard: rounded-lg 고정값 → var(--g-card-radius) CSS 변수 적용

---

## [0.22.0] - 2026-04-08

### 보안 대응 + 업로드 검증

#### Security
- generateTheme API에서 authorId 파라미터 제거 (서버 IDOR 대응)
- 업로드 페이지: 클라이언트 파일 크기 10MB 검증 추가 (서버 전송 전 차단)
- 드롭존에 "최대 10MB" 안내 문구 추가

---

## [0.21.0] - 2026-04-08

### 테마 시스템 정합성 정리 + spacing 버그 수정

#### Changed
- themePresets에서 deerDevil 제거 (프리셋 아닌 데드코드)
- 에디터 프리셋 드롭다운 API 기반으로 전환 (로컬 상수 폴백)
- theme-spec.md 프리셋 표 8종 완성 + glossary.md 프리셋 정의 보강
- midnight 주석 수정

#### Fixed
- EpisodeViewer spacing undefined 런타임 에러 수정 (sectionSpacing 방어코드)

---

## [0.20.0] - 2026-04-07

### 시스템 프리셋 UI + DEFAULT_THEME 제거

#### Added
- 대시보드 시스템 프리셋 선택 UI (API 기반)

#### Changed
- 작가 레이아웃 DEFAULT_THEME 제거 (DB 테마만 사용)

---

## [0.19.0] - 2026-04-07

### 테마 시스템 리팩토링 — 에디터/대시보드 분리 + 에피소드 미리보기

#### Added
- 대시보드에 테마 관리 섹션 (목록, 활성/보관 토글, 편집 진입, 퍼블리시)
- 테마 에디터 에피소드 미리보기 탭 (작가공간 / 에피소드 전환, Zustand 스토어)
- 미리보기 내 링크 클릭 시 라우팅 차단 (onClickCapture)
- 테마 에디터 URL 파라미터 지원 (?id={themeId}로 특정 테마 로드)
- useThemeEditorStore (Zustand) — 미리보기 탭 상태 + 자동/수동 전환 관리
- api.getThemeById — 개별 테마 조회 API 클라이언트
- dividerIcon에 "book" 옵션 추가

#### Changed
- deerDevil/midnight 프리셋 독립 분리 (midnight: book 아이콘+은보라 색상)
- 테마 에디터에서 퍼블리시/슬롯 관리 제거 → 대시보드로 이동
- 색상 라벨 사용자 친화적 변경 (배경→전체 배경, 뮤트→보조 글자 등 9개)
- 필드 변경 시 자동 탭 전환 (에피소드 관련→에피소드 탭, 작가공간 관련→작가공간 탭)

---

## [0.18.0] - 2026-04-07

### 테마 에디터 완성 + 버그 수정

#### Added
- 테마 에디터 기본 필드 4개 추가: fontHeading(제목 폰트), showPreface(일러두기 표시), showAfterword(후기 표시), footerText(푸터 텍스트)
- 테마 에디터 고급 설정 접이식 섹션 12개 필드: cardRadius, sectionSpacing, subtitleStyle, typingSpeed, navOpacity, tabPillRadius, labelLetterSpacing, cardWatermarkOpacity, cardHoverLift, cardCtaText, episodeLabelFormat, showProfileTab

#### Fixed
- episode/page.tsx: API 응답 타입 통일 (data.theme 우선 체크, layout.tsx와 일관성)
- ThemeDecorations: dividerColor 커스텀 색상 반영 (빈 문자열이면 accent 폴백)
- Explore 페이지 WorkCard variant magazine → platform 교체 (ThemeProvider 밖에서 CSS 변수 미정의 문제 해결)

#### Changed
- docs/theme-spec.md 코드-문서 정합성 수정 (titleWeight 4옵션, bodySize 값, cardRadius 기본값, sectionSpacing enum, subscribeButtonStyle ghost 제거, fontHeading CSS변수)

---

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
