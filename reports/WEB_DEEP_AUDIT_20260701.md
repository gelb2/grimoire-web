# grimoire-web 전수조사 심층 감사 — WEB_DEEP_AUDIT_20260701

> read-only 감사. 코드 수정 0건. develop `a061e45`. 발견 15건 (🔴0 / 🟠4 / 🟡6 / 🟢5).
> 모든 발견 file:line + 근거 실측 (§0 추정 금지). 서버 확인은 verification 목적 read.

## 카운트
- 🔴 보안·데이터: **0**
- 🟠 기능파손·사용자체감: **4** (W-1 선물기능 사망 / W-2 바이너리 업로드 손상 / W-3 크레딧 로그 1000× / W-4 새로고침 로그아웃)
- 🟡 정합·edge: **6** (W-5~W-10)
- 🟢 사소: **5** (W-11~W-15)

---

## 🟠 W-1 | 버그 | 독자 "응원 보내기(선물)" 기능 100% 사망
- **file**: `src/features/reader/ui/EpisodeFooter.tsx:273` + `:217-218`, `src/app/[author]/profile/page.tsx:195` + `:198-199`
- **증상→영향**: 선물 금액 버튼이 `{[1, 3, 5].map(...)}` → `api.giftCredits(authorSlug, 1|3|5)` 호출. 서버는 pt 단위 3단계 `[1000,3000,5000]`만 허용하고 그 외는 400 reject. **모든 독자의 모든 선물 시도가 100% 실패** → catch에서 "선물 실패" 토스트. 작가 응원(수익/인게이지먼트) 경로 전면 불능. CC-2b 디노미(2026-05-20경) 이후 web 미갱신 잔존.
- **근거**: 서버 `grimoire-server/src/application/social/social.usecase.ts:136` `throw ... 선물 금액은 ${GIFT_POINT_OPTIONS.join(', ')}pt 중 하나여야 합니다`; 동일 spec `social.usecase.spec.ts:380-385`가 **명시적으로 `giftCredits(...,1)`, `3`, `5` reject 테스트**. `gift-points.ts:18` `GIFT_POINT_OPTIONS=[1000,3000,5000]`. web엔 이 상수 mirror 부재(하드코딩 1/3/5).
- **픽스**: `[1,3,5]`→`[1000,3000,5000]`, 라벨 "N 크레딧"→"N pt/포인트"; `credit-overhaul.ts`에 `GIFT_POINT_OPTIONS` mirror 상수 신설로 재드리프트 차단.
- **규모**: XS

## 🟠 W-2 | 버그 | BFF 프록시가 바이너리 업로드(커버 이미지·DOCX/HWP) 손상
- **file**: `src/app/api/[...path]/route.ts:54-56` (`fetchOptions.body = await request.text()`); 소비자 `src/lib/api.ts:331-338`(`uploadManuscriptFile`), `:543-550`(`uploadCover`)
- **증상→영향**: 파일 업로드는 FormData + `getApiBaseUrl()`(=`/api`)로 **catch-all 프록시 경유**. 프록시가 multipart 본문을 `request.text()`(UTF-8 lossy decode)로 읽어 재전송 → 비UTF-8 바이트(이미지/zip 기반 DOCX)가 U+FFFD로 치환. 커버 이미지 업로드는 깨진 이미지 저장, DOCX/HWP 원고 업로드는 파서 실패. 텍스트(.md/.txt)만 무손실.
- **근거**: **실측** — multipart(PNG 시그니처+고바이트 포함) 127바이트를 `Request.text()`→`Buffer.from(str,'utf8')` 재인코딩 시 141바이트, `original.equals(reSent)===false`. 프록시엔 multipart 특수처리 0건. 업로드 flow spec 부재로 브라우저 e2e 미검출(서버 유닛테스트는 프록시 우회 → latent).
- **픽스**: `request.text()` → `request.arrayBuffer()`(Buffer 전달) 또는 `request.body` 스트림(`duplex:'half'`)로 무손실 패스스루. JSON 경로는 arrayBuffer로도 안전.
- **규모**: S

## 🟠 W-3 | 오구현 | 크레딧 사용내역 표시 1000× 부풀림 + 설명 공백
- **file**: `src/app/dashboard/credits/page.tsx:194` (`formatPoints(creditsToPoints(log.amount))`), `:190` (`{log.description}`); api 타입 `src/lib/api.ts:466-469`
- **증상→영향**: 서버 `/credits/logs`는 `CreditLedgerEntry[]`(amount = **정수 pt**, 필드 `source/type/amount/balanceAfter/expiresAt/relatedId/reason/createdAt`) 반환. web은 `log.amount`를 다시 ×1000(`creditsToPoints`) → 예: 분석 2,440pt 차감이 **"2,440,000 pt"로 표시**. 또한 `log.description`은 신 응답에 없음(→`reason`) → **모든 내역 설명 공백**.
- **근거**: `docs/data-model.md:382` "amount | integer | 변동 포인트"; `docs/api-contract.md:254` 응답형태 `CreditLog[]`→`CreditLedgerEntry[]` 변경 명시. api.ts 반환타입은 구 `{...description...}` 잔존(stale).
- **픽스**: `getCreditLogs` 타입을 `CreditLedgerEntry`로 교체, 렌더에서 `creditsToPoints` 제거(이미 pt), `log.description`→`log.reason`(+type별 라벨). ※테마 무관 — 크레딧 로직 영역.
- **규모**: S

## 🟠 W-4 | 버그 | 15분 후 새로고침 시 유효 리프레시 토큰 무시하고 로그아웃
- **file**: `src/lib/api/client.ts:18` (`... && !path.startsWith('/auth/')`), `src/features/auth/AuthProvider.tsx:63` (mount 시 `getProfile`)
- **증상→영향**: 클라 401 자동 리프레시가 `/auth/*` 경로 전체를 제외. `getProfile`(`/auth/profile`)가 로그인 상태 판별의 유일 경로인데 access 만료 시 401→**리프레시 미시도**→`setUser(null)`. access TTL=**15분**이라 15분 뒤 페이지 리로드/재방문하면 유효 refresh 토큰이 있어도 로그아웃 UI. 리프레시 토큰 회전의 핵심 목적(리로드 지속 로그인)이 무력화.
- **근거**: 서버 `grimoire-server/src/app.module.ts:114` `signOptions:{expiresIn:'15m'}`. `!path.startsWith('/auth/')` → `/auth/profile`도 제외됨(무한루프 방지 의도가 profile까지 과잉 포섭).
- **픽스**: 제외를 `/auth/refresh`·`/auth/login`·`/auth/register`로 한정(profile 허용), 또는 AuthProvider가 mount 401 시 명시적 `/auth/refresh` 1회 후 재조회.
- **규모**: S

---

## 🟡 W-5 | 정합 | 분석 페이지 비용 "4 크레딧" 하드코딩 (실제 2,440 pt)
- **file**: `src/app/dashboard/analysis/page.tsx:258`, `:265`, `:280`
- **증상→영향**: 유료 액션 안내 3곳이 "4 크레딧"/"분석 시작 (4 크레딧)" 하드코딩. 디노미 후 실제 차감은 `ANALYSIS_POINT_COST=2440` pt(잔액은 앱 전역 pt 표기). 사용자가 pt 잔액 대비 비용 판단 불가 + 단위·수치(4크레딧=4000pt≠2440pt) 이중 오류. 크레딧 페이지는 이미 2,440pt 정상 표기라 화면 간 불일치.
- **근거**: `src/features/credits/credit-overhaul.ts:72` `ANALYSIS_POINT_COST=2440`; `dashboard/credits/page.tsx:174`는 `formatPoints(ANALYSIS_POINT_COST)` 정상 사용.
- **픽스**: 하드코딩 제거, `formatPoints(ANALYSIS_POINT_COST)+' pt'`로 치환.
- **규모**: XS

## 🟡 W-6 | 오구현 | 헤더/관리자가 포인트 값을 "크레딧"으로 오표기 (디노미 용어 드리프트)
- **file**: `src/components/PlatformNav.tsx:111` + `:134`; `src/app/admin/tabs/CreditsTab.tsx:75-77,131,156,176`; `src/app/admin/page.tsx:197,209`
- **증상→영향**: `user.credits`는 이제 `getBalance().total`(=총 pt)인데 네비바가 `{user.credits} 크레딧`(축약 없이) 표기 → pro 93,000pt가 "93000 크레딧"으로 보여 실제 크레딧 수로 오인 가능. 관리자 수동지급/작가목록도 pt 값을 "크레딧"으로 라벨. 값은 pt와 동일하나 **용어가 앱 전역(pt) 대비 불일치**. data-model이 가정한 "web 영향 0건"이 실제로는 이 지점에서 위반.
- **근거**: `docs/data-model.md:39` "응답 키 credits는 controller가 ledger.getBalance().total 매핑으로 보존(… web 영향 0건)". CreditBalanceCard/credits page는 "pt"로 표기.
- **픽스**: "크레딧"→"pt/포인트" 용어 통일 + 네비바 `abbreviatePoints` 적용. ※대량 문자열 스윕(User 인터페이스 `credits` 필드명은 유지 가능).
- **규모**: S

## 🟡 W-7 | 버그 | 크레딧 페이지 잔액 폴백 1000× (서버 balance 실패 시)
- **file**: `src/app/dashboard/credits/page.tsx:94-95` (`balance ?? { available: creditsToPoints(user.credits) }`)
- **증상→영향**: `/credits/balance` 실패 시 폴백이 `user.credits`(이미 총 pt)를 다시 ×1000 → 예 5,000pt가 "5,000,000 pt" 헤드라인. 정상 경로(balance 수신)에선 안 보이는 latent, balance 장애 시 표면화.
- **근거**: W-6과 동일 근원(`user.credits`=총 pt). `creditsToPoints`는 정수크레딧 전제 함수.
- **픽스**: 폴백을 `{ available: user.credits }`로 (×1000 제거).
- **규모**: XS

## 🟡 W-8 | 미구현 | not-found.tsx 부재 → 없는 작품/회차가 맨 Next 404 + 일시오류도 404로 오분류
- **file**: `src/app/**` (not-found.tsx 0건); `src/app/[author]/[slug]/[episode]/page.tsx:131-133` (`catch { notFound() }`)
- **증상→영향**: 존재하지 않는 회차/작품(및 `shared/[token]`)이 브랜드/테마 없는 기본 Next "404 This page could not be found" 노출. 또 episode page가 **모든 예외를 notFound()로 수렴** → API 일시 오류·타임아웃도 404로 표시(서버오류/부재 혼동).
- **근거**: `find src/app -name not-found.tsx` 0건; episode page catch가 err 종류 무관 notFound.
- **픽스**: 루트/작가공간 `not-found.tsx` 추가(테마 정합 — VCK 검수), episode page에서 실제 404(getEpisode 404)와 그 외 오류 분기.
- **규모**: S

## 🟡 W-9 | 오구현 | `getCreditLogs()` 반환 타입 stale (서버 CreditLedgerEntry와 불일치)
- **file**: `src/lib/api.ts:468`
- **증상→영향**: `{id,type,amount,description,createdAt}[]`로 선언(구 CreditLog). 서버는 `source/balanceAfter/expiresAt/relatedId/reason` 포함 신모델 → 타입-런타임 불일치(W-3 렌더 버그의 근원). `key={log.id}`도 신 DTO에 id 미포함 시 undefined key 위험.
- **근거**: `docs/api-contract.md:254` 신 응답형태; 소비처 credits page.
- **픽스**: `CreditLedgerEntry` 인터페이스 신설·적용.
- **규모**: XS

## 🟡 W-10 | 버그 | 프로필 "Google 연동하기" 버튼 핸들러 없음 (죽은 버튼)
- **file**: `src/app/dashboard/profile/page.tsx:98` (`<button ...>연동하기</button>` — onClick 없음)
- **증상→영향**: 소셜 계정 섹션의 Google "연동하기"가 클릭해도 무동작·무피드백. 옆 Kakao는 "준비 중"(disabled)로 명시돼 정직하나, Google은 활성처럼 보이며 죽어 있음(기존계정↔Google 연동 미구현).
- **근거**: 해당 `<button>`에 onClick/href 부재. 인증 `googleLogin`은 로그인용이며 연동용 API 부재.
- **픽스**: 연동 미지원이면 "준비 중"(disabled)으로 통일, 지원이면 핸들러 배선.
- **규모**: XS

---

## 🟢 W-11 | 미구현 | error.tsx/global-error.tsx 부재 → 브랜드 에러 폴백 없음
- `src/app/**` 에러 바운더리 0건. 클라/서버 컴포넌트 uncaught 시 기본 Next 에러 화면. (W-8과 세트 — 루트 error boundary 추가 권장, VCK 검수)  규모 S

## 🟢 W-12 | 정합 | 중첩 AuthProvider (dashboard/layout + credits|membership|profile/layout)
- `src/app/dashboard/layout.tsx:30` 가 이미 AuthProvider 제공하는데 `dashboard/credits|membership|profile/layout.tsx`가 재제공 → 해당 서브페이지에서 `getProfile` 이중 호출 + focus/visibility 리스너 이중 바인딩. 크래시 아님(내부가 외부 shadow). 폰트 주입만 필요하면 AuthProvider 중복 제거.  규모 XS

## 🟢 W-13 | 버그 | AuthorsTab이 keyless `<>` fragment로 map (React key 경고)
- `src/app/admin/page.tsx:205` `authors.map(a => (<>...두 tr...</>))` — 최외곽 Fragment에 key 부재(내부 tr에만 key). "unique key" 경고 + 재조정 비효율. `<Fragment key={a.id}>`로 교체.  규모 XS

## 🟢 W-14 | 오구현/죽은코드 | 읽기 진행도 resume 미구현 + getProgress 미사용
- `src/features/reader/ui/EpisodeFooter.tsx:75` `saveProgress(episodeId, 0)`를 열람 시마다 호출(항상 blockIndex=0). `api.getProgress`(`src/lib/api.ts:366`)는 **어디서도 소비 안 됨** → 실제 이어읽기 위치 복원 없음(서재 "읽음" 마킹 전용). 저장은 하되 항상 0이라 위치 resume 확장 시 의미 0. 죽은 API 정리 or 실제 blockIndex 저장/복원.  규모 S

## 🟢 W-15 | 정합 | 코드 주석에 잔존 "Azure" (GCP 이관 완료 후)
- `src/lib/api/client.ts:44` "Azure Container Apps min-replicas=0 cold start…" — 프로젝트는 GCP Cloud Run 단일(2026-05~06 이관 완료). timeout 로직은 유효, 주석만 stale. 문구 정정.  규모 XS

---

## 이상 없음 확인 (clean 축)
- **BFF 프록시 매핑/인증전달/status 패스스루**: catch-all이 method별 정합, Cookie/Authorization/Set-Cookie 전달, `res.status` 그대로 패스(500 미삼킴), `request.signal` 백엔드 전파. **단 바이너리 본문 처리만 결함(W-2)**.
- **localStorage 토큰/본문 저장**: 토큰 0건(HttpOnly cookie만), 본문 캐싱 0건. localStorage는 `grimoire_anon_nickname`·`grimoire_font_size`(UI 프리퍼런스)만, sessionStorage는 방문여부 플래그만.
- **XSS**: `dangerouslySetInnerHTML` 0건. 소설 본문 React 이스케이프 렌더.
- **직접 API 호출**: `NEXT_PUBLIC_API_URL`/절대 API URL 클라 직접호출 0건 — 전부 `/api` 프록시.
- **AuthProvider 커버리지**: useAuth/PlatformNav 소비 페이지 전부 AuthProvider 조상 보유(explore/library/login/register/[author]/dashboard 계층) — 미제공 크래시 0건(실측 검증).
- **CSS 스코핑**: 뷰어/작가공간 `g-*`(ThemeProvider CSS 변수 + `font-g-serif`/`text-g-*`/`border-g-border`), 플랫폼/대시보드/관리자 `neutral-*` — 경계 침범 0건.
- **테마 플리커/ bakedCssUrl 절대화**: `[author]/layout.tsx:151-154` bakedCssUrl `<link>` + SSR `<style>` 배경 프리셋 + meta theme-color(anti-flicker 유지); `resolveBakedCssUrl`(비문자열/빈문자열→null) 회귀 가드 정상.
- **에피소드 넘버링/이전·다음 nav**: episode 타입만 연속 카운트(orderNum 갭/bonus/preface/afterword 무관), prev/nextSlug null 시 비활성 span 폴백 — edge 정상.
- **관리자 16탭 배선**: 전 탭(stats~audit) 컴포넌트 연결, 빈/데드 탭 0건. `CircuitBreakerPanel`·`PaymentInfraAlertBadge` 폴링 30s + `clearInterval` unmount 정리 + error 분기 + reason 필수 게이트 — 누수/미처리 0건.
- **수동 지급 UI 검증**: 초과 차감은 서버 사전검증(`api-contract.md:876` available<amount 거부), 지급은 confirm+audit — 클라 음수/0 차단(`amountValid`). (용어만 W-6)
- **연타/race**: like `useThrottledAction`, 댓글/선물/분석/결제 `submitting`·pending 가드 정상. 뮤테이션 후 `refreshUser`/재조회 배선(gift·analysis·purchase) 정상.
- **워킹트리**: `git status --short` 결과 없음 (clean, uncommitted 0).
- **vitest 공백(축 12)**: 크리티컬 flow 무spec — `EpisodeFooter`(선물·댓글), `dashboard/credits/page`(충전·로그 렌더), `dashboard/analysis/page`(유료 AI) 무테스트 → **W-1·W-3·W-5가 미검출된 직접 원인**. (전체 21 spec은 GREEN 유지 영역)

---
*생성: web dev agent 심층감사(read-only). qa 핸드오프용 — 픽스는 별도 feature 브랜치 + VCK/cost-accountant 검수 후.*
