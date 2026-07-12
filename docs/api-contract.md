# API Contract — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> 참조: `server/CLAUDE.md` §7, `server/TECH_STATUS.md`

---

## 글로벌 규칙

### 접두사

모든 엔드포인트: `/api/` 접두사 (NestJS `setGlobalPrefix`)

### 인증

- `JWT` 표기가 있는 엔드포인트는 `Authorization: Bearer <token>` 헤더 필요
- `admin` 표기가 있는 엔드포인트는 관리자 권한 필요 (AdminGuard 적용)
- `크레딧 N` 표기가 있는 엔드포인트는 크레딧 N 차감

### 입력 검증

- `ValidationPipe`: whitelist + forbidNonWhitelisted + transform
- 유효하지 않은 필드 → 400 에러

### 에러 응답 형식 (NestJS 기본)

```json
{
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request"
}
```

---

## 엔드포인트 전체 목록

### Health

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/health` | 헬스체크 | - |

### Auth

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/auth/register` | 이메일 회원가입 (JWT 발급, 3크레딧 보너스) | - |
| POST | `/api/auth/login` | 로그인 (JWT 발급) | - |
| GET | `/api/auth/profile` | 내 프로필 조회 | JWT |
| POST | `/api/auth/google` | Google OAuth 로그인 | - |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 삭제) | JWT |
| POST | `/api/auth/change-password` | 비밀번호 변경 | JWT |
| POST | `/api/auth/email/verify-request` | 이메일 인증 토큰 발급 + 발송 (EMAIL-POLAR-READY Phase C) | JWT, @Throttle 3/분 |
| POST | `/api/auth/email/verify-confirm` | 이메일 인증 토큰 검증 (본인 토큰만) | JWT, @Throttle 10/분 |
| POST | `/api/auth/password/reset-request` | 비밀번호 초기화 토큰 발급 (비로그인 OK, enumeration 차단) | - , @Throttle 3/분 |
| POST | `/api/auth/password/reset-confirm` | 비밀번호 초기화 토큰 검증 (purpose='password_reset' 강제) | - , @Throttle 10/분 |

**EMAIL-POLAR-READY Phase C 정합 (2026-05-27)**:
- `EMAIL_PROVIDER=null` (default) 시 토큰 DB 박제 + 검증 흐름 정상 + 외부 발송 0건 (logger.warn만 박제)
- `EMAIL_PROVIDER=resend` 또는 `sendgrid` 시 자동 실 발송 (사용자 라이브 액션 — Cloud Run env 1줄 갱신)
- 토큰 보안: sha256(plainToken + EMAIL_TOKEN_PEPPER) hash만 DB 저장, 평문은 발송 시점만 메모리
- 만료: verify_email=60분 / password_reset=30분
- 재사용 차단: `redeemedAt NOT NULL` 시 BadRequest "이미 사용된 토큰입니다"
- 본 sprint는 토큰 발급/검증만 박제 — `Author.emailVerifiedAt` 컬럼 갱신은 별 sprint (마이그레이션 ≤1건 제약)
- 정본: `shared-contracts.md` §32 EmailVerificationTokenPolicy

### Theme

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/themes/presets` | 시스템 프리셋 목록 조회 (8종) | - |
| POST | `/api/themes/from-preset` | 프리셋으로 테마 생성 (무료) | JWT |
| POST | `/api/themes/generate` | AI 테마 생성 | JWT, 크레딧 1 |
| GET | `/api/themes/:authorSlug` | 작가 테마 조회 | - |
| POST | `/api/themes/publish/:authorSlug` | 테마 퍼블리시 (CSS 베이킹) | JWT |
| GET | `/api/themes/css/:authorSlug` | Baked CSS 반환 | - |
| GET | `/api/themes/mine` | 내 테마 목록 | JWT |
| PUT | `/api/themes/:themeId` | 테마 커스텀 수정 (overrides) | JWT |
| DELETE | `/api/themes/:themeId` | 테마 삭제 (슬롯 반환) | JWT |
| GET | `/api/themes/resolve/:authorSlug` | 작품별 테마 resolve (`?work=slug`) | - |
| POST | `/api/themes/:themeId/slot` | 테마를 활성 슬롯에 배치 | JWT |
| DELETE | `/api/themes/:themeId/slot` | 테마를 슬롯에서 제거 (보관) | JWT |
| GET | `/api/themes/slots/info` | 슬롯 현황 (플랜/슬롯수/테마목록) | JWT |
| GET | `/api/themes/detail/:themeId` | 개별 테마 상세 조회 (소유권 확인) | JWT |
| POST | `/api/themes/:themeId/activate` | 테마를 작가 공간 기본 테마로 활성화 (슬롯 자동배정) | JWT |
| PATCH | `/api/themes/works/:workId/theme` | 작품에 테마 배정 (`{ themeId }`, null로 해제) | JWT |

### Plan

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/plan` | 내 플랜 정보 조회 | JWT |
| POST | `/api/admin/authors/:authorId/plan` | 작가 플랜 수동 설정 (관리자) | JWT, Admin |

### Manuscript

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/manuscripts/parse` | 원고 파싱 (md/txt/docx/html → Block[]) | - |
| POST | `/api/manuscripts/upload` | 파일 업로드 파싱 (multipart) | JWT |

### Work Management

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/works` | 작품 생성 | JWT |
| PATCH | `/api/works/:id` | 작품 수정 | JWT |
| DELETE | `/api/works/:id` | 작품 삭제 | JWT |
| POST | `/api/works/:workId/episodes` | 에피소드 생성 | JWT |
| PATCH | `/api/works/:id/episodes/reorder` | **F-20** 에피소드 순서 변경 — body `{episodeIds}` (새 순서대로 작품 전체 에피소드 id). 소유권 + 집합 일치(개수/중복/소속) 검증 후 `$transaction` 원자 재부여 | JWT |
| DELETE | `/api/episodes/:id` | 에피소드 삭제 | JWT |
| PUT | `/api/works/:id/cover` | 커버 이미지 업로드 | JWT |
| PATCH | `/api/works/:workId/episodes/:episodeId/status` | 에피소드 상태 변경 | JWT |
| POST | `/api/works/:workId/episodes/:episodeId/share` | 공유 링크 생성 | JWT |
| PATCH | `/api/episodes/:episodeId/reupload` | 에피소드 재업로드 (파일 교체) | JWT |

### Author (공개)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/authors/:slug` | 작가 공간 데이터 (테마 + 작품 목록) | - |
| GET | `/api/authors/:slug/profile` | 작가 공개 프로필 (통계 포함) | - |
| PATCH | `/api/authors/:slug/profile` | 작가 bio 수정 | JWT |
| DELETE | `/api/authors/me` | 본인 계정 탈퇴 (soft delete + GDPR 익명화 + 30일 cron hard delete) | JWT |

### Content (공개)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/works/:authorSlug/:workSlug` | 작품 정보 + 에피소드 목록 | 선택적 (JWT 시 upload 포함) |
| GET | `/api/episodes/:authorSlug/:workSlug/:episodeSlug` | 에피소드 본문 (Block[] 포함) | 선택적 (status별 접근 제어) |
| GET | `/api/shared/:token` | 공유 링크로 에피소드 접근 | - |

### Social

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/social/likes/:episodeId` | 좋아요 토글/생성 | Optional (비로그인 가능) |
| GET | `/api/social/likes/:episodeId/status` | 좋아요 상태+수 조회 | Optional (비로그인 가능) |
| GET | `/api/social/likes/:episodeId/count` | 좋아요 수 조회 | - |
| POST | `/api/social/subscriptions/:authorId` | 구독 토글 | JWT |
| GET | `/api/social/subscriptions` | 내 구독 목록 | JWT |
| GET | `/api/social/subscriptions/:authorId/count` | 구독자 수 조회 | - |
| POST | `/api/social/comments/:episodeId` | 댓글 작성 | Optional (비로그인: 닉네임+비번) |
| GET | `/api/social/comments/:episodeId` | 댓글 목록 조회 | - |
| DELETE | `/api/social/comments/:commentId` | 댓글 삭제 | Optional (비로그인: 비번) |
| POST | `/api/social/gift/:authorSlug` | 크레딧 선물 | JWT |

### Reader

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/reader/bookmarks/:episodeId` | 북마크 토글 | JWT |
| GET | `/api/reader/bookmarks` | 내 북마크 목록 | JWT |
| POST | `/api/reader/progress` | 읽은 위치 저장 | JWT |
| GET | `/api/reader/progress/:episodeId` | 읽은 위치 조회 | JWT |
| GET | `/api/reader/library` | 서재 (북마크 + 구독 + 읽던 위치) | JWT |

### Discovery

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/discover/authors` | 작가 검색 (`?q=검색어&limit=10`) | - |
| GET | `/api/discover/works/popular` | 인기 작품 (`?limit=10`) | - |
| GET | `/api/discover/works/recent` | 최신 작품 (`?limit=10`) | - |
| GET | `/api/discover/authors/most-gifted` | 응원받는 작가 랭킹 (`?limit=8`) — **CC-4 P1 (2026-05-21)**: `DiscoveryUseCase` 가 `CreditUseCase.getGiftRanking` 위임 → CC-2b 신 선물(`source='gift'`)이 본 엔드포인트에 자동 인식 (구 `creditRepo.getGiftRanking` 직접 호출 제거). | - |

### Payment

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/payments/products` | 크레딧 상품 목록 | - |
| POST | `/api/payments/webhook` | Polar 결제 콜백 (충전 + CC-5 구독 생명주기 webhook 라우팅) | - |
| POST | `/api/payments/initiate` | 결제 시작 (24h 이내 pending 재사용 — PAY-P1-3) | JWT |
| GET | `/api/payments/history` | 결제 내역 | JWT |
| GET | `/api/payments/credits` | 내 크레딧 잔액 | JWT |

### Subscription (크레딧 개편 CC-5 — PAY-P1-4 Polar 구독 정기결제, 2026-05-22)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/subscriptions/checkout` | 구독 정기결제 시작 (Polar Checkout recurring) | JWT |
| GET | `/api/membership` | 내 멤버십 등급/풀 조회 | JWT |

**POST /api/subscriptions/checkout** (`@Throttle` 분당 3회):
- body: `{ tier: 'pro' | 'premium', returnUrl: string }` (free 는 구독 불가).
- 응답: `{ paymentUrl, tradeNo }` — Polar 호스티드 Checkout(정기결제 모드) URL.
- **graceful (CC-5 §4)** — env(`POLAR_PRODUCT_SUBSCRIPTION_PRO/_PREMIUM`) 미설정 시 `503 Service Unavailable`("구독 결제가 아직 활성화되지 않았습니다"). 구독 checkout 만 비활성, 나머지 기능 전부 정상.
- 결제 완료 시 Polar 가 `subscription.created` webhook 발행 → `/api/payments/webhook` → `ProcessSubscriptionWebhookUseCase` → `MembershipPlanPort.changeTier`.

**GET /api/membership**:
- 응답: `{ tier, monthlyPoolPoints, poolBalance, poolResetAt, status, expiresAt }`.
- 내부 ID(`authorId`/`polarSubscriptionId`) 미노출 (SECURITY.md §4).
- 조회 직전 `checkAndResetExpiredPool` lazy 안전망 호출 (CC-3 정합).

**Polar 구독 webhook** (`/api/payments/webhook` 경유): `subscription.created`/`updated` → `changeTier(tier)` + `polarSubscriptionId` 매핑, `subscription.canceled`/`revoked` → `changeTier('free')` 다운그레이드. `WebhookEvent` 멱등성 게이트 재사용.

> 정본: `.claude/shared-contracts.md` §30 CreditOverhaul / ADR-015.

**POST /api/payments/initiate — 재사용 정책 (PAY-P1-3, 2026-05-04)**:
- 진입 시 `findReusablePendingPayment(authorId, productId, now-24h)` 게이트.
- 적중 시 → 동일 `paymentId` 재사용 + Polar Checkout URL 신규 발급 (응답 schema 변경 0건).
- null 반환 시 → 신규 Payment row 생성 (기존 흐름).
- Polar 정책상 매 호출마다 신규 `tradeNo` 발급 → `externalTransactionId` 갱신 1회 호출.
- 응답 schema 동일: `{ paymentId, paymentUrl, tradeNo }` (클라이언트 변경 0건).
- 정본: `.claude/shared-contracts.md` §14 PaymentRetryReuse

### Payment Reconciliation Cron (PAY-P0-2, 2026-05-03)

HTTP 미노출. NestJS `@Cron('0 */10 * * * *')` 10분 주기로 자동 실행 — Container Apps cron 단독.

| 항목 | 값 |
|------|-----|
| 실행 주기 | `0 */10 * * * *` (매 10분 0초) |
| 동작 | Polar `checkouts.list` 호출 + DB Payment 비교 → 4 시나리오 분기 |
| 로그 패턴 | `[PaymentReconciliationJob] PaymentReconciliationJob 시작 — since=...` / `... 완료 — processed=N boost=N mismatch=N expire=N` |
| AuditLog 박제 | operator=`system_reconciliation`, action ∈ {`reconciliation_boost`, `reconciliation_refund_mismatch`, `reconciliation_expire`} |
| 비활성화 | `RECONCILIATION_DISABLED=1` 환경변수 (즉시 return) |
| 동시 실행 차단 | in-memory `isRunning` lock + try-finally 해제 |

**4 시나리오**:
- S1 boost: PG=succeeded + DB=pending → `completePaymentAtomically` (webhook 누락 자동 보정)
- S2 mismatch: PG=refunded + DB=completed → AuditLog만 (실제 환수는 P1-1 위임)
- S3 expire: PG=NotFound + DB=pending(24h 경과) → status='expired' 만료 처리
- S4 정합: skip

정본: `.claude/shared-contracts.md` §12 PaymentReconciliation

### Payment Cleanup Cron (PAY-P1-3, 2026-05-04)

HTTP 미노출. NestJS `@Cron('0 0 4 * * *')` 매일 새벽 4시 1회 — PAY-P0-2 reconciliation cron(새벽 3시 + 10분 주기)과 시간대/주기 분리.

| 항목 | 값 |
|------|-----|
| 실행 주기 | `0 0 4 * * *` (매일 새벽 4시 0분 0초) |
| 동작 | `findPendingPaymentsOlderThan(24)` → `expirePayment` + AuditLog 박제 |
| 로그 패턴 | `[PaymentCleanupJob] PaymentCleanupJob 시작 — startedAt=...` / `... 완료 — expireCount=N stalePendingCount=N` |
| AuditLog 박제 | operator=`system_cleanup`, action=`payment_expire` (PAY-P0-2 `system_reconciliation`과 분리) |
| 비활성화 | `PAYMENT_CLEANUP_DISABLED=1` 환경변수 (즉시 return) |
| 동시 실행 차단 | in-memory `isRunning` lock + try-finally 해제 |

**역할**: PAY-P0-2 reconciliation cron이 PG list 기반 일부 expire를 처리하지만, PG에 record가 아예 없는 (사용자가 결제 페이지 진입조차 안 한) 24h 초과 row를 추가 정리 + PAY-P1-3 재사용 정책 cutoff와 정합 보장.

정본: `.claude/shared-contracts.md` §14 PaymentRetryReuse

### Credits

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/credits/gift` | 응원 선물 (독자 → 작가) — body `{receiverId, amount}` `amount` **단위 pt** (1,000/3,000/5,000pt 3단계, CC-2b §6 결정) | JWT |
| GET | `/api/credits/ranking` | 응원받는 작가 랭킹 — **CC-3 (HIGH-3) 재작성**: `CreditLedger source='gift', type='earn'` groupBy. 반환 `{authorId, totalGifted}[]` (구 `CreditLog reason='gift_received'` 집계 폐기 — CC-2b 신 선물 정합) | - |
| GET | `/api/credits/balance` | 4 출처 포인트 잔액 (`CreditBalance` — bySource/total/deficit/available). **CC-3 (CRITICAL-1) lazy 안전망 진입점** — 호출 시 `MembershipPlanPort.checkAndResetExpiredPool` 자동 실행 (poolResetAt 만료 시 풀 리셋). cron 실패 백업 — 이월 금지 코드 강제 | JWT |
| GET | `/api/credits/logs` | 크레딧 로그 조회 — 응답 `CreditLedgerEntry[]` (source/type/amount/balanceAfter/expiresAt/relatedId/reason/createdAt). **F-21** 쿼리 `?from=ISO8601&to=ISO8601&limit=1..100&offset=0..` (기간 필터 + 오프셋 페이지네이션, 전부 optional — 무파라미터 시 최신순 100건 하위호환). 응답은 배열 유지(web 계약 미파손, hasMore 는 `length===limit` 로 클라 추정) | JWT |
| GET | `/api/credits/expiring` | **F-21** (brightMall #1) 구독 풀 만료 예정 요약 — 활성 유료 구독의 다음 리셋일 소멸 예정 pt. 응답 `{ expiringAmount, expiresAt } \| null`(free/미구독/잔액0 시 null). 구독 풀은 이월 금지(매월 리셋)라 현재 구독 잔액 전액이 poolResetAt 에 소멸 | JWT |

### Stats

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/stats/works/:workId` | 작품 조회수 통계 (소유자만). `/api/works/:authorSlug/:workSlug` 공개 라우트와 Express 라우트 shadowing 충돌을 피하려고 `/stats` 접두어 사용 | JWT |

### Admin (관리자 전용 — AdminGuard, reCAPTCHA 없음)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/admin/login` | 관리자 로그인 | - |
| GET | `/api/admin/stats` | 플랫폼 통계 (6개 KPI) | JWT, admin |
| GET | `/api/admin/authors` | 작가 목록 (검색/페이징) | JWT, admin |
| GET | `/api/admin/authors/:id` | 작가 상세 | JWT, admin |
| POST | `/api/admin/authors` | 작가 생성 | JWT, admin |
| PATCH | `/api/admin/authors/:id` | 작가 정보 수정 | JWT, admin |
| DELETE | `/api/admin/authors/:id` | 작가 삭제 (legacy soft delete) | JWT, admin |
| POST | `/api/admin/authors/:id/force-delete` | 운영자 강제 삭제 (soft delete + GDPR 익명화 + 30일 cron hard delete + 사유 필수) | JWT, admin |
| POST | `/api/admin/authors/:id/anonymize` | 운영자 GDPR 익명화 only (계정 유지 + email/name/passwordHash/bio 4 필드 익명화 + 사유 필수) | JWT, admin |
| PATCH | `/api/admin/authors/:id/role` | 역할 변경 (user/admin) | JWT, admin |
| PATCH | `/api/admin/authors/:id/plan` | 플랜 변경 | JWT, admin |
| POST | `/api/admin/credits/grant` | 크레딧 부여 | JWT, admin |
| POST | `/api/admin/credits/deduct` | 크레딧 차감 | JWT, admin |
| GET | `/api/admin/credits/logs` | 크레딧 이력 조회 — **CC-4 P1 (2026-05-21) 응답 형태 변경**: `CreditLog[]` → `CreditLedgerEntry[]` (source/type/amount/balanceAfter/expiresAt/relatedId 추가, `/credits/logs` 와 동일 신 모델). 신 `CreditLedger` 위임 — admin 화면이 4 출처/type 인식. | JWT, admin |
| GET | `/api/admin/works` | 작품 목록 (검색/필터) | JWT, admin |
| GET | `/api/admin/works/:id` | 작품 상세 + 에피소드 목록 | JWT, admin |
| GET | `/api/admin/works/:wid/episodes/:eid` | 에피소드 상세 | JWT, admin |
| PATCH | `/api/admin/works/:wid/episodes/:eid/status` | 에피소드 상태 강제 변경 | JWT, admin |
| GET | `/api/admin/comments` | 댓글 목록 (검색) | JWT, admin |
| DELETE | `/api/admin/comments/:id` | 댓글 삭제 (모더레이션) | JWT, admin |
| GET | `/api/admin/payments` | 결제 내역 전체 조회 | JWT, admin |
| POST | `/api/admin/sanctions` | 사용자 제재 | JWT, admin |
| DELETE | `/api/admin/sanctions/:id` | 제재 해제 | JWT, admin |
| GET | `/api/admin/sanctions` | 제재 이력 조회 | JWT, admin |
| GET | `/api/admin/reports` | 신고 목록 | JWT, admin |
| PATCH | `/api/admin/reports/:id` | 신고 처리 (승인/기각) | JWT, admin |
| GET | `/api/admin/settings` | 시스템 설정 조회 | JWT, admin |
| PATCH | `/api/admin/settings/:key` | 시스템 설정 변경 | JWT, admin |
| GET | `/api/admin/access-logs` | 접근 로그 조회 | JWT, admin |
| GET | `/api/admin/audit-logs` | 감사 로그 조회 | JWT, admin |
| GET | `/api/admin/circuit-breaker/state` | Circuit Breaker 상태 조회 (PAY-S3, 2026-05-23) — 2 호출점(`polar:checkouts:create`/`polar:checkouts:list`) state + 메트릭 + policy 4 env값. `?key=` 미지정 시 전체, 지정 시 단일. @Throttle 분당 60. 응답에 내부 ID 노출 0 | JWT, admin |
| POST | `/api/admin/circuit-breaker/reset` | Circuit Breaker 수동 복구 (PAY-S3) — body `{key, reason}` (reason 필수, key 화이트리스트 검증). AuditLog `circuit_breaker.manual_reset` 박제(operator_id + reason + beforeState/afterState). @Throttle 분당 5 | JWT, admin |
| POST | `/api/admin/circuit-breaker/trip` | Circuit Breaker 수동 차단 (PAY-S3) — body `{key, reason}`. 결제 즉시 503 변환. AuditLog `circuit_breaker.manual_trip` 박제. @Throttle 분당 5. ⚠️ 파괴적 액션 (사고 대응·연습 전용) | JWT, admin |

### Chat (AI 어시스턴트)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/chat/sessions` | 새 채팅 세션 생성 | JWT |
| GET | `/api/chat/sessions?workId=` | 세션 목록 조회 | JWT |
| POST | `/api/chat/sessions/:sessionId/messages` | 메시지 전송 + AI 응답 | JWT |
| GET | `/api/chat/sessions/:sessionId/messages` | 히스토리 조회 (커서 페이지네이션) | JWT |
| DELETE | `/api/chat/sessions/:sessionId` | 세션 삭제 | JWT |

### Analysis (RAG)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/analysis/index` | 작품 벡터 인덱싱 | JWT |
| POST | `/api/analysis/check` | 업로드된 회차의 설정 일관성 검사 (Q1=(a) 모드) | JWT, 크레딧 3 |
| GET | `/api/analysis/status/:workId` | 인덱싱 상태 조회 | JWT |
| GET | `/api/analysis/reports` | 분석 히스토리 목록 (본인, 최신순 50건) | JWT |
| GET | `/api/analysis/reports/:id` | 분석 리포트 단건 상세 (소유권 검증) | JWT |

---

## 상세 명세

### GET /api/health

```
Response 200:
{ "status": "ok", "timestamp": "2026-03-26T..." }
```

### POST /api/auth/register

```
Request:
{ "email": "author@example.com", "password": "...", "name": "작가명", "slug": "author-slug" }

Response 201:
{
  "user": { "id": "uuid", "slug": "author-slug", "name": "작가명", "email": "...", "credits": 3000 },
  "token": "jwt-token"
}

Error 400: 유효성 검증 실패
Error 409: 이메일/슬러그 중복
```

> **CC-4 Phase 3 (2026-05-21) — 응답 `credits` 필드 의미 변경 (案 P3-Y 옵션 A)**:
> 구 `authors.credits Int` 컬럼 DROP 후에도 **응답 키 `credits` 보존** — 외부 호환성(web `AuthUser.credits` + `PlatformNav.tsx` + admin authors UI 영향 회피).
> 값 = `CreditLedgerPort.getBalance().total` (4 출처 합 pt 단위 — 디노미 1:1,000). ledger 미주입/throw 시 0 폴백(안전망).
> 예: 가입 보너스 3,000pt → `"credits": 3000`. 구 정수 의미("3 크레딧")에서 pt 의미로 전환됨 — web 표시 시 디노미 환산 가능(`point-balance.ts` 패턴).

### POST /api/auth/login

```
Request:
{ "email": "author@example.com", "password": "..." }

Response 200:
{
  "user": { "id": "uuid", "slug": "author-slug", "name": "작가명", "email": "...", "credits": 5000 },
  "token": "jwt-token"
}

Error 401: 이메일/비밀번호 불일치
```

### GET /api/auth/profile

```
Headers: Authorization: Bearer <token>

Response 200:
{ "id": "uuid", "slug": "author-slug", "name": "작가명", "email": "...", "credits": 5000 }

Error 401: 인증 실패
```

### POST /api/auth/google

```
Request:
{ "token": "google-id-token" }

Response 200:
{
  "user": { "id": "uuid", "slug": "...", "name": "...", "email": "...", "credits": 5000 },
  "token": "jwt-token"
}
```

### POST /api/themes/generate

테마 생성. 크레딧 1 차감 후 Claude API 호출.

```
Request:
{ "authorId": "uuid", "description": "어둡고 묵직한 A24 감성" }

Response 201:
{ "themeId": "uuid", "preview": AuthorTheme }

Error 400: 크레딧 부족 / 설명 5자 미만
Error 404: 작가 없음
```

AuthorTheme 스키마는 `docs/theme-spec.md` 참조.

### GET /api/themes/:authorSlug

```
Response 200: Theme (id, name, preset, overrides, rawDescription, bakedCssUrl, theme, updatedAt)
  - bakedCssUrl: 항상 절대 URL (Blob CDN 절대 URL 또는 ${PUBLIC_API_BASE_URL}/themes/css/{slug} 폴백)
                 (P1-#7, 2026-05-03). 상대 경로 응답 0건 보장.
Error 404: 테마 없음
```

### POST /api/themes/publish/:authorSlug

테마를 CSS로 베이킹하고 baked_css_url을 갱신한다.

DB 박제 정책 (P1-#7, 2026-05-03):
  - Blob 활성 + 업로드 성공 → 절대 URL(Blob CDN) 박제
  - Blob 비활성 또는 업로드 실패 → NULL 박제 (응답 시 server가 환경별 base URL로 절대화)
  - 상대 경로(`/api/themes/css/...`) 박제 금지

```
Response 200: { "cssUrl": "<절대 URL>", "bakedCssUrl": "<절대 URL>", "css": "..." }
  - cssUrl/bakedCssUrl: 항상 절대 URL (Blob URL 또는 폴백 절대 URL)
Error 404: 테마 없음
```

### GET /api/themes/resolve/:authorSlug

작품별 테마 resolve (`?work=slug`).

```
Response 200: Theme | {}
  - bakedCssUrl: 항상 절대 URL (P1-#7, 2026-05-03)
```

### GET /api/themes/css/:authorSlug

```
Response 200: text/css (베이킹된 CSS 문자열)
Error 404: 테마 없음
```

### GET /api/themes/detail/:themeId

개별 테마 상세 조회 (인증 필수, 소유권 확인). preset + overrides merge된 완전한 theme 객체 반환.

```
Response 200:
{ "id": "...", "name": "...", "preset": "...", "source": "ai", "theme": { ...resolved theme }, ... }
Error 403: 본인의 테마만 조회 가능
Error 404: 테마 없음
```

### POST /api/manuscripts/parse

MD 텍스트를 파싱하여 Block[] 반환. DB 저장 없음 (순수 변환).

```
Request:
{ "mdText": "---\nslug: ep1\ntype: episode\n---\n# 제목\n본문..." }

Response 200 (episode/bonus):
{ "frontmatter": Frontmatter, "title": "제목", "normalizedTitle": "제목", "blocks": Block[] }

Response 200 (preface):
{ "frontmatter": Frontmatter, "title": "일러두기", "normalizedTitle": "일러두기", "paragraphs": string[], "lastLine": "..." }

Response 200 (afterword):
{ "frontmatter": Frontmatter, "title": "후기", "normalizedTitle": "후기", "glitchText": "...", "footnote": "..." }

Error 400: MD 텍스트 비어있음 / frontmatter 누락
```

Block 타입은 `docs/glossary.md` 참조.

`normalizedTitle`은 저장/렌더링 안전 형태로 정규화된 제목 (언더스코어 → 공백, 연속 공백 단일화, trim).
클라이언트는 이 값을 title input에 채우면 미리보기와 DB 저장 결과가 일치한다 — Safari `italic + Noto Serif KR faux synthesis` 조합에서 발생하는 한글 자모 분해 회피.
최종 저장 시 서버가 `createEpisode`/`updateWork` 등에서 `normalizeTitle()`을 다시 적용해 DB 무결성을 보장하므로 클라이언트가 정규화되지 않은 값을 보내도 안전.

### POST /api/manuscripts/upload

파일 업로드 (DOCX/HWP/HWPX/TXT/MD) 서버사이드 파싱.

```
Headers: Authorization: Bearer <token>
Request: multipart/form-data — file

Response 200:
{ "frontmatter": Frontmatter, "title": "파일명(확장자 제거)", "normalizedTitle": "파일명 정규화본", "blocks": Block[] }

Error 400: 지원하지 않는 포맷 / 빈 파일
Error 413: 파일 크기 초과 (10MB)
```

`title`: 파일명에서 확장자만 제거한 원본 (예: `사슴악마_ep9_도리안그레이의초상_초고`).
`normalizedTitle`: 정규화 적용 결과 (예: `사슴악마 ep9 도리안그레이의초상 초고`).

### POST /api/works

```
Headers: Authorization: Bearer <token>
Request:
{ "title": "작품 제목", "slug": "work-slug", "subtitle": "부제", "description": "설명" }

Response 201: Work
Error 409: 슬러그 중복
```

### PATCH /api/works/:id

```
Headers: Authorization: Bearer <token>
Request (모든 필드 optional):
{
  "title": "수정된 제목",
  "subtitle": "수정된 부제",
  "description": "설명",
  "context": "프로젝트 메모리 (세계관/캐릭터 — AI 채팅 시 주입, ≤20000자)",   // F-5
  "instructions": "작품 지침 (문체/톤 — AI 채팅 시 주입, ≤5000자)"          // F-5
}

Response 200: Work
Error 400: 유효성 (context>20000자 / instructions>5000자 등)
Error 403: 본인 작품 아님
Error 404: 작품 없음
```

> F-5 (2026-07-11): `context`/`instructions` 는 채팅 시스템 프롬프트 주입원. 명백한 AI 사과문
> 패턴(사과 표현 + AI 자기지칭 동시)은 **차단하지 않고** 서버 warn + AuditLog 로 관찰만 한다
> (`work_context_ai_apology_suspected` — 원문 비로깅, field/length 만 박제).

### DELETE /api/works/:id

```
Headers: Authorization: Bearer <token>
Response 200: { "deleted": true }
Error 403: 본인 작품 아님
```

### POST /api/works/:workId/episodes

```
Headers: Authorization: Bearer <token>
Request:
{ "title": "에피소드 제목", "slug": "ep-slug", "blocks": Block[], "rawMd": "..." }

Response 201: Episode
```

### PATCH /api/works/:id/episodes/reorder

에피소드 순서 변경 (F-20 — 기획 §13, 작가 전용). `episodeIds` 는 **새 순서대로** 나열한 해당 작품의 **전체** 에피소드 id 배열. 소유권(work.authorId === JWT sub) 검증 후 집합 일치(개수 일치 · 중복 불가 · 전원 소속)를 강제하고, `$transaction` 으로 `orderNum` 을 배열 순서대로 원자 재부여한다. orderNum 은 unique 제약이 없어(논유니크 인덱스) 임시 오프셋 없이 직접 재부여한다.

```
Headers: Authorization: Bearer <token>
Request:
{ "episodeIds": ["ep-3", "ep-1", "ep-2"] }

Response 200: EpisodeSummary[]   // orderNum 오름차순 (목록 조회와 동일 정렬)
Error 400: 빈 배열 / 중복 id / 작품 전체 에피소드와 집합 불일치(개수·미소속)
Error 403: 본인 작품 아님
Error 404: 작품 없음
```

### DELETE /api/episodes/:id

```
Headers: Authorization: Bearer <token>
Response 200: { "deleted": true }
Error 403: 본인 에피소드 아님
```

### PATCH /api/works/:workId/episodes/:episodeId/status

에피소드 상태 변경 (작가 전용).

```
Headers: Authorization: Bearer <token>
Body: { "status": "upload" | "public" | "nonPublic" }
Response 200: Episode (status 반영)
Error 400: shared 상태로 직접 변경 불가 (createShareLink 사용)
Error 403: 본인 에피소드 아님
```

### POST /api/works/:workId/episodes/:episodeId/share

공유 링크 생성 (작가 전용). 에피소드 상태가 shared로 변경됨.

```
Headers: Authorization: Bearer <token>
Body: { "expireIn": "12h" | "24h" | "48h" | "never" }
Response 200:
{
  "sharedToken": "hex-string",
  "sharedUrl": "https://grimoire-book.com/shared/{token}",
  "expireAt": "2026-04-01T00:00:00.000Z" | null
}
Error 403: 본인 에피소드 아님
```

### GET /api/shared/:token

공유 링크로 에피소드 접근 (비로그인 가능).

```
Response 200: Episode (rawMd, workId, sharedToken, sharedExpireAt 제외)
Error 403: 공유 링크 만료 — "이 공유 링크는 만료되었습니다. 로그인 하십시오."
Error 404: 존재하지 않는 공유 토큰
```

### GET /api/authors/:slug

작가 공간 데이터 (테마 + 작품 목록).

```
Response 200:
{
  "author": Author,
  "theme": Theme | null,
  "works": [{ "id", "slug", "title", "subtitle", "description", "episodeCount" }]
}

Error 404: 작가 없음
```

### GET /api/works/:authorSlug/:workSlug

```
Response 200:
{
  "work": Work,
  "episodes": [{ "id", "slug", "title", "subtitle", "orderNum" }]
}

Error 404: 작품 없음
```

### GET /api/episodes/:authorSlug/:workSlug/:episodeSlug

```
Response 200: Episode (id, workId, slug, title, subtitle, orderNum, blocks, rawMd, createdAt)
Error 404: 에피소드 없음
```

### POST /api/social/likes/:episodeId

좋아요 토글/생성. 인증 선택적 (OptionalAuthGuard).

```
# 로그인 사용자: 토글 (있으면 취소, 없으면 생성)
Headers: Authorization: Bearer <token>
Response 200: { "liked": true/false, "likeCount": 42 }

# 비로그인 사용자: 생성만 (취소 불가, IP+쿠키로 중복 방지)
Response 200: { "liked": true, "likeCount": 43 }
Set-Cookie: grimoire_anon={uuid} (최초 1회)
Error 409: 이미 좋아요를 눌렀습니다
```

### GET /api/social/likes/:episodeId/status

좋아요 상태 + 수 조회. 인증 선택적.

```
# 로그인: authorId로 확인, 비로그인: IP+쿠키로 확인
Response 200: { "liked": true/false, "likeCount": 42 }
```

### GET /api/social/likes/:episodeId/count

```
Response 200: { "count": 42 }
```

### POST /api/social/subscriptions/:authorId

```
Headers: Authorization: Bearer <token>
Response 200: { "subscribed": true } 또는 { "subscribed": false }
```

### GET /api/social/subscriptions

```
Headers: Authorization: Bearer <token>
Response 200: [{ "authorId", "authorName", "authorSlug", "subscribedAt" }]
```

### GET /api/social/subscriptions/:authorId/count

```
Response 200: { "count": 128 }
```

### POST /api/social/comments/:episodeId

댓글 작성. 인증 선택적 (OptionalAuthGuard).

```
# 로그인 사용자
Headers: Authorization: Bearer <token>
Request: { "content": "댓글 내용", "parentId?": "parent-id" }
Response 201: Comment

# 비로그인 사용자 (닉네임 + 비밀번호 필수)
Request: { "content": "댓글 내용", "nickname": "익명이", "password": "1234", "parentId?": "parent-id" }
Response 201: Comment (nickname 포함, authorId: null)
```

### GET /api/social/comments/:episodeId

```
Response 200: [Comment]
# Comment = { id, authorId (null=익명), episodeId, content, nickname?, parentId?, createdAt }
```

### DELETE /api/social/comments/:commentId

댓글 삭제. 인증 선택적.

```
# 로그인 사용자: authorId 확인
Headers: Authorization: Bearer <token>
Response 200: { "deleted": true }
Error 403: 본인 댓글 아님

# 비로그인 사용자: 비밀번호 확인
Request: { "password": "1234" }
Response 200: { "deleted": true }
Error 403: 비밀번호 불일치
```

### POST /api/reader/bookmarks/:episodeId

```
Headers: Authorization: Bearer <token>
Response 200: { "bookmarked": true } 또는 { "bookmarked": false }
```

### GET /api/reader/bookmarks

```
Headers: Authorization: Bearer <token>
Response 200: [Bookmark]
```

### POST /api/reader/progress

```
Headers: Authorization: Bearer <token>
Request: { "episodeId": "uuid", "blockIndex": 42 }
Response 200: ReadingProgress
```

### GET /api/reader/progress/:episodeId

```
Headers: Authorization: Bearer <token>
Response 200: ReadingProgress
```

### GET /api/discover/authors

```
Query: ?q=검색어&limit=10
Response 200: [Author]
```

### GET /api/discover/works/popular

```
Query: ?limit=10
Response 200: [Work]
```

### GET /api/discover/works/recent

```
Query: ?limit=10
Response 200: [Work]
```

### GET /api/payments/products

크레딧 충전 패키지 목록 — CC-2a (2026-05-20) 디노미 개편으로 **4종** 반환.

```
Response 200: [{ "id", "name", "points", "bonusRate", "price", "pricePerPoint" }]
```

- `points`: 총 충전 포인트 (기본 + 보너스, pt 단위). 구 `credits`(패키지 수량) 대체.
- `bonusRate`: 보너스 비율 (입문·기본 0 / 인기 0.10 / 베스트 0.15).
- `price`: 충전액 (원화 KRW).
- `pricePerPoint`: pt 당 충전 단가 (원화, 표면 단가).

| id | name | points | bonusRate | price |
|---|---|---|---|---|
| `credit-starter` | 입문 패키지 | 25,000 | 0 | ₩3,000 |
| `credit-basic` | 기본 패키지 | 41,667 | 0 | ₩5,000 |
| `credit-popular` | 인기 패키지 | 91,667 | 0.10 | ₩10,000 |
| `credit-best` | 베스트 패키지 | 287,500 | 0.15 | ₩30,000 |

> 정본: `docs/ai-cost-table.md` §2 (cost-accountant 승인 `786b0f3` — 전 패키지 §0 PASS).

### POST /api/payments/webhook

PG (Polar 등) 웹훅 콜백 — 서명 검증 + 멱등성 게이트 + 원자적 크레딧 부여.

**Headers (Polar Standard Webhooks)**:
- `webhook-id`: PG 발급 unique 이벤트 ID (멱등성 키, 누락 시 **400**)
- `webhook-timestamp`: Unix timestamp
- `webhook-signature`: HMAC

**Request (raw body)**: PG 원본 이벤트 JSON (Polar SDK가 검증/파싱)

**Error 400 — 무효 웹훅 (F-13, 2026-07-11)**: 서명검증 실패 / 파싱 불가 / `webhook-id` 헤더 누락 시
`BadRequestException`(400). 구 구현은 이 경우도 201(silent ack)을 반환해 Polar 가 "전달 성공"으로
간주 → 재전송 중단(실패 마스킹). 400 으로 실패를 surface(Polar 재전송 의미론 정합). 처리 로직
(R1/R2/R1-notify)은 미접촉.

**Response 2xx — 처리 결과 reason 박제** (Sprint PAY-P0-1, 2026-05-03 / PAY-P1-1, 2026-05-03):
```
{ "processed": true,  "credits": <N> }                                          // 정상 결제 — 크레딧 부여 (event.status='success')
{ "processed": true,  "credits": 0, "deficitCredits": 0 }                       // 정상 환불 — 환수 완료 (PAY-P1-1, event.status='cancel', Author.credits >= credits)
{ "processed": true,  "credits": 0, "deficitCredits": <N> }                     // deficit 환불 — 잔액 부족 (PAY-P1-1, Author.credits < credits, 0 fix + deficit 박제)
{ "processed": true,  "credits": 0 }                                            // 결제 실패 (event.status='fail', 환수 대상 아님)
{ "processed": false, "reason": "ignored" }                                     // F-13 — 정상이나 처리 대상 아닌 이벤트(알 수 없는 type/미매핑 구독 등) 무시 (2xx ack, 무효 서명은 400)
{ "processed": false, "reason": "duplicate_event" }                             // 동일 eventId 재전송 — 첫 호출만 처리, 두 번째 즉시 skip
{ "processed": false, "reason": "unknown_trade" }                               // tradeNo 매칭 실패
{ "processed": false, "reason": "already_completed" }                           // 멱등성 — (a) 약식 게이트(이전 webhook 박제 누락 PROD 안전망) 또는 (b) 충전 success 동시성 패자(status CAS count=0, R1-notify 2026-06-28). 둘 다 알림·적립 0건.
```

**멱등성 보장**: 동일 `webhook-id`로 두 번째 호출이 들어와도 `completePaymentWithPoints` / `refundPaymentAtomically`는 단 1회만 실행. DB `webhook_events.event_id` UNIQUE 제약으로 race condition 차단 (P2002 → safe skip).

**충전 적립 (CC-2a, 2026-05-20)**: `event.status='success'` 분기에서 `PaymentRepositoryPort.completePaymentWithPoints` 호출. 단일 `$transaction`으로 Payment.status='completed' + deficit(외상) 우선 상계(`CreditLedger` type='deficit_settle') + 남은 충전액 적립(`CreditLedger` source='charged' type='earn') + `Author.pointsCharged`/`deficitPoints` 캐시 갱신. 충전 시 외상이 먼저 상계되어 채팅 차단(`deficitPoints` 상한)이 해제된다. 응답 `credits` 필드 = 충전 총 pt. **동시성 패자(R1-notify, 2026-06-28)**: 서로 다른 Polar 이벤트(order.paid/order.updated/checkout.updated)가 eventId 가 달라 멱등 게이트를 둘 다 통과해도 status CAS(`updateMany WHERE status='pending'`)가 적립 이중화를 차단(승자 1건만 적립). 패자는 `completePaymentWithPoints` 가 `alreadyCompleted:true` 멱등 no-op 반환 → 호출처가 성공 알림(`notifyChargeSuccess`)·`payment_completed` AuditLog 를 skip 하고 `{processed:false, reason:'already_completed'}` 응답(약식 게이트와 동일 멱등 의미).

**환불 처리 (PAY-P1-1, 2026-05-03)**: `event.status='cancel'` 분기에서 `RefundPaymentUseCase.execute` 호출. $transaction 내부에서 Payment.status='refunded' + Author.credits decrement(0 fix) + CreditLog 음수 amount + RefundLog 박제. 후행으로 AdminAuditLog(operator='system_refund', action='refund_normal' | 'refund_deficit'). 잔액 부족 시 deficitCredits 양수 응답으로 운영자 추적 가능.

**Polar SDK exception 정책 (PAY-P3-B, 2026-05-09)**: webhook 처리 catch 블록에서 `classifyPolarError` 5분류 후 분기 처리.

| errorClass | 트리거 | 분기 | webhook_events.status | retry queue 박제 | AuditLog action |
|---|---|---|---|---|---|
| `timeout` | AbortError, TimeoutError, message에 'timeout' 포함 | retry | `failed` (errorMessage `polar_timeout: ...`) | 박제 (PAY-P2-2 DLQ, 5분 cron) | — |
| `network` | ECONNRESET, ENOTFOUND, ETIMEDOUT, EPIPE, ECONNREFUSED, ConnectionError | retry | `failed` (errorMessage `polar_network: ...`) | 박제 | — |
| `server_5xx` | HTTP 500/502/503/504 (PolarError.statusCode 추출) | retry | `failed` (errorMessage `polar_server_5xx: ...`) | 박제 | — |
| `client_4xx` | HTTP 400/401/403/404/422 (요청 결함, retry 무의미) | **permanent_failed 즉시** | `failed` (errorMessage `polar_client_4xx: ...`) | **박제 0건** | `webhook_permanent_failed` (operator='system_dlq') |
| `unknown` | 분류 실패 시 안전 fallback | retry | `failed` (errorMessage `polar_unknown: ...`) | 박제 | — |

**SDK timeout 옵션**: `new Polar({ timeoutMs })` Polar SDK v0.47.0 SDKOptions.timeoutMs 내장 옵션 (옵션 A 채택). env `POLAR_SDK_TIMEOUT_MS` 오버라이드 (기본값 30000ms). 워커 자원 leak 차단.

**관련**: `webhook_events` 테이블 + `refund_logs` 테이블 (data-model.md), `.claude/shared-contracts.md` §11 WebhookEventIdempotency + §13 RefundPaymentAtomically + §24 PolarSDKTimeoutPolicy (PAY-P3-B 신설)

### GET /api/payments/credits

크레딧 개편 I Phase — `GET /api/credits/balance` 와 동일한 4 출처 포인트 잔액 응답.

```
Headers: Authorization: Bearer <token>
Response 200: {
  "available": 10000,   // 실사용 가능 (total - deficit)
  "total": 10000,       // 4 출처 합
  "deficit": 0,         // 외상 (채팅 사후 차감 잔액 부족분)
  "bySource": { "free": 3000, "subscription": 0, "gift": 2000, "charged": 5000 }
}
```

### POST /api/admin/login

관리자 전용 로그인. reCAPTCHA 불요, `role=admin` 검증.

```
Request: { "email": "admin@grimoire-book.com", "password": "..." }
Response 200: { "user": { "id", "slug", "name", "email", "role" } }
Set-Cookie: grimoire_token (HttpOnly)
Error 401: 이메일/비밀번호 오류 또는 admin 권한 없음
```

### GET /api/admin/stats

```
Response 200:
{ "totalAuthors", "totalWorks", "totalEpisodes", "totalCreditsConsumed", "totalComments", "totalPaymentsCompleted" }
```

### POST /api/admin/credits/grant

```
Request: { "authorId": "uuid", "amount": 5000, "reason": "프로모션", "source?": "free"|"subscription"|"gift"|"charged" }
Response 200: { "balance": CreditBalance }
# 크레딧 개편 CC-1 (2026-05-19): 신 포인트 원장(CreditLedger) 적립.
#   amount = 포인트(pt) 단위. source 미지정 시 'charged' 폴백.
#   CreditBalance = { free, subscription, gift, charged, total, deficit, available } (§30)
```

### POST /api/admin/credits/deduct

```
Request: { "authorId": "uuid", "amount": 3000, "reason": "정정" }
Response 200: { "balance": CreditBalance }
Error 400: 가용 포인트 부족 (deficit 불가 모드 — 관리자 차감은 외상 금지)
# 크레딧 개편 CC-1 (2026-05-19): 신 포인트 원장 차감 (소진 우선순위 적용).
#   사전 잔액 검증 — available < amount 면 차감 거부.
```

### POST /api/admin/sanctions

```
Request: { "authorId": "uuid", "type": "suspend_7d", "reason": "욕설", "detail?": "..." }
Response 201: UserSanction
```

### PATCH /api/admin/reports/:id

```
Request: { "action": "approved" | "rejected" }
Response 200: { "resolved": true }
# approved 시 대상 콘텐츠 자동 비공개/삭제
```

### PATCH /api/admin/settings/:key

```
Request: { "value": "true" }
Response 200: { "key": "maintenance_mode", "value": "true" }
```

### POST /api/analysis/index

```
Headers: Authorization: Bearer <token>
Request: { "episodeId": "uuid", "workId": "uuid", "rawText": "에피소드 본문..." }
Response 200: { "indexed": true }
```

### POST /api/analysis/check

업로드된 에피소드를 같은 작품의 다른 회차와 비교해 설정·문체·캐릭터 일관성을 분석한다.
Claude Projects 벤치마크(`docs/ai-analysis-spec.md §6-1`) 정합 — 본문 재입력(복붙) 금지, 회차 ID만 받는다.
서버가 DB의 `Episode.rawMd`로 분석 + 자기 자신 청크 자동 RAG 제외.

소유권 검증: Episode → workId → Work.authorId === JWT sub (IDOR 방지).
크레딧: 분석 1회 = 3 크레딧 (F2 2026-04-19 확정). 실패 시 자동 환불.

```
Headers: Authorization: Bearer <token>
Request:
{
  "episodeId": "uuid",
  "types": ["consistency", "tone", "character"]   // 선택, 미지정 시 3종 전부
}

Response 200: AnalysisResult[]
Error 400: 'episodeId가 필요합니다' / '에피소드를 찾을 수 없습니다' / '본인 작품의 에피소드만 분석할 수 있습니다' / 'AI 분석은 3 크레딧이 필요합니다'
```

### GET /api/analysis/reports

본인이 실행한 분석의 히스토리(최신순). results 미포함, 점수 요약만.

```
Headers: Authorization: Bearer <token>
Response 200: AnalysisReportSummary[]
  [{
    id, workId, episodeId, workTitle, episodeTitle,
    types, scores: [{ type, score }], creditsCharged, createdAt
  }, ...]
```

### GET /api/analysis/reports/:id

분석 리포트 단건 상세. 소유권 검증(타인 리포트는 403).

```
Headers: Authorization: Bearer <token>
Response 200: AnalysisReport
  {
    id, authorId, workId, episodeId, workTitle, episodeTitle,
    types, results: AnalysisResult[], creditsCharged, createdAt
  }
Error 404: 리포트 없음
Error 403: 본인의 분석 리포트만 조회 가능
```

### POST /api/chat/sessions

```
Headers: Authorization: Bearer <token>
Request: { "workId": "uuid", "title?": "대화 제목" }
Response 201: ChatSession (id, workId, title, createdAt, updatedAt)
```

### GET /api/chat/sessions

```
Headers: Authorization: Bearer <token>
Query: ?workId=uuid
Response 200: [ChatSession]
```

### POST /api/chat/sessions/:sessionId/messages

메시지 전송 + RAG 기반 AI 응답 생성. 시스템 프롬프트에 에피소드 매니페스트, 프로젝트 메모리(Work.context), 작품 지침(Work.instructions), 관련 원고 청크(top 25)가 자동 주입된다.

```
Headers: Authorization: Bearer <token>
Request: { "content": "질문 내용" }
Response 200: { "userMsg": ChatMessage, "assistantMsg": ChatMessage }
Error 403: 본인 세션 아님
Error 404: 세션 없음
```

### GET /api/chat/sessions/:sessionId/messages

```
Headers: Authorization: Bearer <token>
Query: ?limit=30&cursor=messageId
Response 200: [ChatMessage] (오래된 순)
```

### DELETE /api/chat/sessions/:sessionId

```
Headers: Authorization: Bearer <token>
Response 200: { "deleted": true }
Error 403: 본인 세션 아님
```

### GET /api/analysis/status/:workId

```
Headers: Authorization: Bearer <token>
Response 200: { "workId": "uuid", "indexedEpisodes": 5, "totalEpisodes": 8 }
```
