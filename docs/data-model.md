# Data Model — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> 단일 진실 공급원 (Single Source of Truth) — Prisma 스키마와 1:1 대응

---

## 테이블 (25개)

### authors

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 작가 고유 식별자 |
| slug | text | unique | URL 경로 (`/{slug}/`) |
| name | text | - | 작가명 |
| email | text | unique | 이메일 |
| password_hash | text (nullable) | - | 비밀번호 해시 (bcryptjs) |
| bio | text (nullable) | - | 작가 소개 (최대 500자) |
| role | text | default("user") | 역할 (user/admin) |
| ~~credits~~ | ~~integer~~ | ~~DROPPED~~ | **[CC-4 Phase 3 DROP, 2026-05-21]** `ALTER TABLE "authors" DROP COLUMN "credits"` — 마이그레이션 `20260521_author_credits_drop_credit_log_phase3`. 신 4 출처 캐시(`points_*`) + `deficit_points` 단일. 응답 키 `credits`(`/auth/me` 등)는 controller 측에서 `CreditLedgerPort.getBalance().total` 매핑으로 보존(案 P3-Y 옵션 A) |
| points_free | integer | default(0) | **크레딧 개편 I Phase** — 무료 적립(가입·첫작품) 포인트 잔액 캐시. §0 위상 = CAC(매출 0) |
| points_subscription | integer | default(0) | **크레딧 개편 I Phase** — 구독 월 풀 포인트 잔액 캐시. 매월 리셋·이월 금지 |
| points_gift | integer | default(0) | **크레딧 개편 I Phase** — 응원 선물 수령 포인트 잔액 캐시. 독자 결제분 이전 |
| points_charged | integer | default(0) | **크레딧 개편 I Phase** — 충전(Polar) 포인트 잔액 캐시. pt 단가에 §0 박힘, 영구 보존 |
| deficit_points | integer | default(0) | **크레딧 개편 I Phase** — 외상(채팅 사후 차감 시 잔액 부족분). 충전 시 우선 상계. 상한 -10,000pt |
| plan | text | default("free") | 구독 플랜 (free/pro/premium). **CC-3 (HIGH-1 案 A, 2026-05-20, ADR-014)** — `Author.plan` 정본 유지 + `MembershipPlan.tier` 미러. `MembershipPlanPort.changeTier` 가 유일한 변경 진입점 — `$transaction` 안에서 양측 동기 강제. 직접 SQL UPDATE 금지. 案 B(`tier` 정본화 + 읽기 13곳 이행)는 CC-5/후속 sprint 옵션 |
| plan_expire_at | timestamptz (nullable) | - | 플랜 만료일. **CC-3 案 A 동기** — `MembershipPlan.poolResetAt` 미러 (free → null / pro·premium → 다음 풀 리셋일 = `nextMonthStart(now)`). CC-5 PAY-P1-4 활성화 시 구독 결제 만기와 정합 재확인 |
| default_theme_id | uuid (nullable) | - | 기본 테마 ID |
| created_at | timestamptz | default(now()) | 가입일 |
| deleted_at | timestamptz (nullable) | - | **USER-SOFT-DELETE sprint (2026-05-15)** — Author soft delete 표식. NULL = 활성 / NOT NULL = soft deleted. 30일 후 cron hard delete 정합 (회계 8건 Restrict 차단 시 보류). @@index([deleted_at]) 정합. middleware 자동 변환 박제 (findUnique/findMany/findFirst → WHERE deletedAt IS NULL 자동 + delete → soft delete) |

관계: Theme (1:N), Work (1:N), SocialAccount (1:N), CreditLedger (1:N — Restrict), MembershipPlan (1:N — Restrict)

> **크레딧 개편 I Phase (2026-05-17) — 디노미네이션 1:1,000 + 포인트 출처 4종 분리 회계 (1-C 하이브리드)**: `credits` 단일 Int → `points_*` 4 필드(출처별 잔액 캐시) + `credit_ledgers` 입출금 원장. `points_*` 4 필드는 빠른 조회용 캐시, `credit_ledgers` 가 audit 정본. 정본: `research/CREDIT_PRICING_OVERHAUL_PLAN.md` §8 + ADR-012.

> **CC-4 Phase 3 (2026-05-21) — `Author.credits` 컬럼 DROP + `CreditLog` 테이블 폐기**: 비가역 마이그레이션 `20260521_author_credits_drop_credit_log_phase3` 적용. `ALTER TABLE "authors" DROP COLUMN "credits"` + `DROP TABLE IF EXISTS "credit_logs" CASCADE`. `CreditLedger`(원장 정본) + `Author.points_*`/`deficit_points`(4 출처 캐시) 단일 정본. 응답 키 `credits`(/auth/me 등)는 controller 측에서 `ledger.getBalance().total` 매핑으로 보존(案 P3-Y 옵션 A — web 영향 0건). 정본: `.claude/state/sprint-cc4-phase3-drop-plan-draft.md` + shared-contracts §30 박제.

### themes

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 테마 식별자 |
| author_id | uuid (nullable) | FK→authors | 작가 (1:N). null이면 시스템 테마 |
| name | text | default("기본 테마") | 테마 이름 |
| preset | text | default("midnight") | 프리셋명 (파생 출처 기록용) |
| overrides | jsonb (nullable) | - | AuthorTheme 전체 값 (독립 레코드) |
| raw_description | text (nullable) | - | 작가 원본 구술 텍스트 |
| baked_css_url | text (nullable) | - | Baking된 CSS 파일 URL. **항상 절대 URL(Blob CDN) 또는 NULL만 박제**. NULL이면 응답 시 server가 `${PUBLIC_API_BASE_URL}/themes/css/{slug}`로 동적 절대화하여 web에 반환 (P1-#7, 2026-05-03). 상대 경로 박제 금지 — 환경 전환 시 stale 방지 |
| is_slotted | boolean | default(true) | 활성 슬롯 배치 여부 (true=활성, false=보관) |
| source | text | default("user") | 테마 출처 ("system"=시스템 프리셋, "ai"=AI 생성, "user"=직접 편집) |
| updated_at | timestamptz | auto-update | 수정일 |

### works

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 작품 식별자 |
| author_id | uuid | FK→authors | 작가 |
| slug | text | unique(author_id, slug) | URL 경로 |
| title | text | - | 작품 제목 |
| subtitle | text (nullable) | - | 부제 |
| description | text (nullable) | - | 설명 |
| cover_image | text (nullable) | - | 커버 이미지 URL |
| context | text (nullable) | - | 작품 맥락/프로젝트 메모리 (AI 채팅 시 주입) |
| instructions | text (nullable) | - | 작품 지침 (문체 규칙, 톤 — AI 채팅 시 주입) |
| theme_id | uuid (nullable) | FK→themes | 작품별 테마 |
| view_count | integer | default(0) | 조회수 |
| created_at | timestamptz | default(now()) | 생성일 |

관계: Episode (1:N), Theme (N:1)

### episodes

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 에피소드 식별자 |
| work_id | uuid | FK→works | 작품 |
| slug | text | unique(work_id, slug) | URL 경로 |
| title | text | - | 제목 |
| subtitle | text (nullable) | - | 부제 |
| description | text (nullable) | - | 에피소드 설명 |
| order_num | integer | - | 순서 |
| blocks | jsonb | - | 파싱된 Block[] |
| raw_md | text | - | 원본 마크다운 |
| view_count | integer | default(0) | 조회수 |
| source_format | text | default("markdown") | 원고 포맷 (markdown/txt/docx) |
| status | text | default("upload") | 상태 (upload/public/nonPublic/shared) |
| is_indexed | boolean | default(false) | RAG 벡터 인덱싱 완료 여부 |
| shared_token | text (nullable) | unique | 공유 링크 토큰 |
| shared_expire_at | timestamptz (nullable) | - | 공유 링크 만료 시각 |
| created_at | timestamptz | default(now()) | 생성일 |

### ~~credit_logs~~ — **[CC-4 Phase 3 DROP, 2026-05-21]**

`DROP TABLE IF EXISTS "credit_logs" CASCADE` (마이그레이션 `20260521_author_credits_drop_credit_log_phase3`).
신 `credit_ledgers`(원장 정본 — `source`/`type`/`balanceAfter`/`expiresAt`/`relatedId` 5필드 확장)가 단일 정본.
적립/차감 8경로(T1~T8) 전부 신 `CreditLedger` 이행 완료(CC-1·CC-2a·CC-2b·CC-3).
PAY-P3-E archive `credit_logs_archive_pay_p3_e`(1 row, dev 영역)는 회계/감사 영구 보존 정합 박제(별도 테이블).

### social_accounts

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| author_id | uuid | FK→authors | 작가 |
| provider | text | unique(provider, provider_id) | OAuth 제공자 |
| provider_id | text | unique(provider, provider_id) | 제공자별 고유 ID |
| provider_email | text (nullable) | - | 제공자 이메일 |
| created_at | timestamptz | default(now()) | 연동일 |

### signup_history

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| provider_id | text | PK | OAuth provider ID |
| first_signup_at | timestamptz | default(now()) | 최초 가입일 |
| signup_count | integer | default(1) | 가입 횟수 |

### bookmarks

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| author_id | text | unique(author_id, episode_id) | 독자(작가) ID |
| episode_id | text | unique(author_id, episode_id) | 에피소드 ID |
| created_at | timestamptz | default(now()) | 북마크 생성일 |

### reading_progress

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| author_id | text | unique(author_id, episode_id) | 독자(작가) ID |
| episode_id | text | unique(author_id, episode_id) | 에피소드 ID |
| block_index | integer | - | 마지막으로 읽은 블록 인덱스 |
| updated_at | timestamptz | auto-update | 갱신일 |

### likes

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| author_id | text (nullable) | unique(author_id, episode_id) | 독자 ID (null=익명) |
| episode_id | text | index | 에피소드 ID |
| ip_address | text (nullable) | index(ip+cookie+episode) | 익명 좋아요 IP |
| cookie_id | text (nullable) | index(ip+cookie+episode) | 익명 브라우저 식별 |
| created_at | timestamptz | default(now()) | 좋아요 생성일 |

### subscriptions

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| subscriber_id | text | unique(subscriber_id, target_author_id) | 구독자 ID |
| target_author_id | text | unique(subscriber_id, target_author_id) | 구독 대상 작가 ID |
| created_at | timestamptz | default(now()) | 구독일 |

### comments

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| author_id | text (nullable) | - | 작성자 ID (null=익명) |
| episode_id | text | index(episode+created) | 에피소드 ID |
| content | text | - | 댓글 내용 (1~500자) |
| nickname | text (nullable) | - | 익명 댓글 닉네임 |
| password_hash | text (nullable) | - | 익명 댓글 비밀번호 (bcrypt) |
| ip_address | text (nullable) | - | 익명 댓글 IP |
| parent_id | uuid (nullable) | FK→comments, index | 부모 댓글 (대댓글용) |
| created_at | timestamptz | default(now()) | 작성일 |

### payments

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 결제 식별자 |
| author_id | text | - | 결제 작가 ID |
| product_id | text | - | 상품 ID |
| amount | integer | - | 결제 금액 (원) |
| points | integer | - | **[CC-4 Phase 2 rename, 2026-05-21]** 충전 총 포인트 (pt). 구 컬럼명 `credits`(CC-2a 의미 재해석 "패키지 수량"→"pt") → `points` 물리 rename 완료. 마이그레이션: `20260521_payment_credits_rename_phase2` (`ALTER TABLE "payments" RENAME COLUMN "credits" TO "points"`). 값 = `CREDIT_PRODUCTS.points` |
| external_transaction_id | text (nullable) | unique | 외부 결제 거래 번호 |
| status | text | default("pending") | 결제 상태 (pending/completed/failed/refunded/expired) |
| created_at | timestamptz | default(now()) | 결제 요청일 |
| completed_at | timestamptz (nullable) | - | 결제 완료일 |

**status enum 흐름** (2026-05-04 PAY-P1-3 갱신 / 2026-05-20 CC-2a 갱신):
- `pending`: 초기 생성 상태 (Polar Checkout URL 발급 직후)
- `completed`: webhook 'order.paid' 수신 → **`completePaymentWithPoints`** 트랜잭션 성공 (CC-2a — 충전 적립 신 경로. 단일 `$transaction` 으로 Payment 완료 + deficit 우선 상계 + `credit_ledgers` charged earn + `authors.points_charged`/`deficit_points` 캐시. 구 `completePaymentAtomically`(`authors.credits` Int + `credit_logs`)는 `@deprecated` — CC-2b 후 제거)
- `failed`: webhook 'fail' 수신 (PG 처리 실패)
- `refunded`: webhook 'order.refunded' 수신 → **`refundPaymentWithPoints`** 트랜잭션 성공 (CC-2b 신 경로 — 4 출처 환수 + 이중 외상 통합. 구 `refundPaymentAtomically`는 CC-4 Phase 1에서 제거 완료)
- `expired`: 24h 초과 pending row → cron이 마킹 (PAY-P0-2 reconciliation cron + PAY-P1-3 cleanup cron 양쪽에서 처리)
  - PAY-P1-3 재사용 정책: `findReusablePendingPayment`은 `status='pending' AND createdAt > now-24h` row만 반환 → expired 마킹된 row는 재사용 후보에서 제외
  - cleanup cron `payment-cleanup.job` (`@Cron('0 0 4 * * *')`): 매일 새벽 4시 1회, AuditLog operator='system_cleanup' action='payment_expire' 박제

### webhook_events (Sprint PAY-P0-1, 2026-05-03)

PG (Polar 등) 웹훅 재전송 시 동일 `event_id`로 두 번째 호출이 들어와도 `completePaymentWithPoints`(CC-2a 충전 적립) / `refundPaymentAtomically`가 단 1회만 실행되도록 멱등성 박제 테이블. DB unique 제약(`event_id`)으로 race condition 차단.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 박제 식별자 |
| event_id | text | unique | PG가 발급한 이벤트 ID (Polar의 `webhook-id` 헤더). 멱등성 키 |
| source | text | default("polar") | PG 식별 ('polar' / 향후 다른 PG) |
| event_type | text | - | PG 이벤트 타입 ('order.paid', 'order.refunded', ...) |
| payload | jsonb | - | 정규화된 NormalizedWebhookEvent 박제 (디버깅용) |
| status | text | default("processed") | 처리 상태 ('processed' \| 'skipped' \| 'failed') |
| error_message | text (nullable) | - | 실패/스킵 사유 ('unknown_trade', 'already_completed', 예외 메시지 등) |
| processed_at | timestamptz | default(now()) | 박제 시각 |

인덱스:
- `webhook_events_event_id_key` UNIQUE (`event_id`) — 멱등성 race 차단 (P2002 → safe skip)
- `webhook_events_event_type_processed_at_idx` (`event_type`, `processed_at`) — 최근 이벤트 조회

정본: `.claude/shared-contracts.md` §11 WebhookEventIdempotency

---

### reconciliation_checkpoints (Sprint PAY-P0-2, 2026-05-03)

PG↔DB 정합성 검증 cron의 단일 row checkpoint. cron이 매 실행 시 `lastRunAt` 기준으로 since 필터를 결정하고, 카운터(processed/boost/mismatch/expire)를 박제. **사용자 신고 의존 0건 + webhook 누락 자동 보정** 보장.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | text | PK, default('singleton') | 항상 'singleton' (단일 row 보장) |
| last_run_at | timestamptz(3) | - | 마지막 cron 시작 시각 (다음 cron의 since 필터) |
| processed_count | int | default(0) | 마지막 실행에서 처리한 row 수 (전체) |
| boost_count | int | default(0) | 자동 보정 row 수 (S1 PG=succeeded + DB=pending) |
| mismatch_count | int | default(0) | refund mismatch row 수 (S2 PG=refunded + DB=completed, P1-1 위임) |
| expire_count | int | default(0) | pending 만료 row 수 (S3 24h 경과) |
| error_message | text (nullable) | - | 마지막 실행 예외 메시지 (null이면 정상) |
| updated_at | timestamptz(3) | @updatedAt | 갱신 시각 |

인덱스:
- PK `(id)` — 단일 row 조회 (id='singleton')
- 추가 인덱스 0건 (1 row → index 불필요)

마이그레이션 seed:
```sql
INSERT INTO "reconciliation_checkpoints" ("id", "last_run_at")
VALUES ('singleton', CURRENT_TIMESTAMP - INTERVAL '24 hours')
ON CONFLICT ("id") DO NOTHING;
```

cron 주기: `@Cron('0 */10 * * * *')` 10분 (cost-accountant 권고 — Polar `/v1` rate limit 분당 500회 default 그룹, 사용률 1% 미만).

정본: `.claude/shared-contracts.md` §12 PaymentReconciliation

---

### refund_logs (Sprint PAY-P1-1, 2026-05-03; CC-2b 의미 재해석 2026-05-20; CC-4 Phase 2 보존 2026-05-21)

Polar 환불 webhook 수신 시 크레딧 환수 트랜잭션의 영구 박제 테이블. CC-2b 이후 RefundPaymentUseCase 가 `refundPaymentWithPoints` `$transaction` 내부에 박제 (4 출처 환수 + 이중 외상 통합).

**CC-4 Phase 2 컬럼 처리 결정 — 案 Y (보존 + 의미 박제 강화)**: `Payment.credits → Payment.points` 물리 rename 시 RefundLog의 `credits`·`deficit_credits` 컬럼은 **rename하지 않고 보존**. 사유: (a) 명명 충돌 회피 (`Author.deficitPoints` 외상 잔액 정본과 의미 충돌 방지) (b) 회귀 범위 최소화 (admin/audit 전용, HTTP 미노출 — 외부 사용자 영향 0) (c) CC-2b 의미 재해석은 schema 주석 + shared-contracts §13/§30 박제로 강화.

- `credits` Int — **[CC-2b 재해석 / CC-4 Phase 2 보존]** 실 환수 pt (`actualRefunded`). 4 출처(charged→gift→subscription→free)에서 실제 환수된 총합. **단위 = `Payment.points`와 일관 (디노미 1:1,000 pt)**.
- `deficit_credits` Int — **[CC-2b 재해석 / CC-4 Phase 2 보존]** 이 환불 1건이 유발한 외상 pt 기여분 (감사 추적용). **외상 잔액 정본은 `Author.deficitPoints` 단일화** — 다음 충전 시 CC-2a `completePaymentWithPoints` 가 자동 회수 (구 시스템 영구 외상 해소).

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 환불 로그 식별자 |
| payment_id | text | - | 환불 대상 Payment id (1:N — 부분 환불 호환 위해 unique 미부여) |
| amount | int | - | PG 환불 금액 (KRW) |
| credits | int | - | **실 환수 pt** (CC-2b 의미 재해석 — actualRefunded, 4 출처 합) |
| deficit_credits | int | default(0) | **이 환불이 유발한 외상 pt 기여분** (CC-2b 의미 재해석 — 외상 잔액 정본은 Author.deficitPoints) |
| reason | text | - | 환불 사유 (예: 'polar_webhook_order.refunded') |
| processed_at | timestamptz(3) | default(now()) | 환수 처리 시각 |
| source | text | - | 'webhook' (Polar 자동) / 'manual' (운영자 수동, P2) |

인덱스:
- `@@index([payment_id])` — Payment별 환불 이력 조회

정책 (CC-2b 갱신):
- **이중 외상 통합**: 잔액 부족분 → `Author.deficitPoints` 가산 + `CreditLedger type='deficit_incur'` row (reason=`refund_deficit:..`). 외상 정본 단일화 — 다음 충전 시 자동 회수.
- **4 출처 환수 우선순위**: charged → gift → subscription → free (`REFUND_RECOVERY_ORDER`). 출처별 `CreditLedger type='spend'` row 박제.
- **PAY-P3-A CAS race 차단**: `$executeRawUnsafe UPDATE ... WHERE 컬럼 >= 환수액` count=0 시 throw CAS_MISMATCH (DLQ retry 위임).
- **AdminAuditLog 후행**: `operator='system_refund'`, `action='refund_normal' | 'refund_partial' | 'refund_deficit' | 'refund_partial_deficit'` ($transaction 외부).

3중 멱등성:
- L1: PAY-P0-1 `webhook_events.eventId @unique` (재전송 차단)
- L2: payment.usecase 진입 시 status 체크 (`already_completed` / `already_refunded` / `already_partial_refunded` skip)
- L3: refund_logs 박제 (조회 + 추적)

정본: `.claude/shared-contracts.md` §13 RefundPaymentAtomically + §30 CreditOverhaul (CC-2b 변경 이력)

---

### daily_views

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 식별자 |
| work_id | uuid | unique(work_id, date), FK→works | 작품 |
| date | timestamptz | unique(work_id, date) | 날짜 (UTC 자정) |
| count | integer | default(0) | 일별 조회수 |

### chat_sessions

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 세션 식별자 |
| author_id | text | index(author+work) | 작가 ID |
| work_id | text | index(author+work) | 작품 ID |
| title | text | default("새 대화") | 세션 제목 |
| created_at | timestamptz | default(now()) | 생성일 |
| updated_at | timestamptz | auto-update | 수정일 |

관계: ChatMessage (1:N, cascade delete)

### chat_messages

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 메시지 식별자 |
| session_id | uuid | FK→chat_sessions, index(session+created) | 세션 |
| role | text | - | 역할 ("user" \| "assistant") |
| content | text | - | 메시지 내용 |
| input_tokens | integer (nullable) | - | **크레딧 개편 I Phase** — API 응답 usage.input_tokens. assistant 메시지만, 과거 무료 row 는 null (§8-8 #3 — 토큰 실측 선행) |
| output_tokens | integer (nullable) | - | **크레딧 개편 I Phase** — API 응답 usage.output_tokens |
| model | text (nullable) | - | **크레딧 개편 I Phase** — 'claude-sonnet-4-...' 모델 식별자 (차감 N 재산정 시 사용) |
| charged_points | integer (nullable) | - | **크레딧 개편 I Phase** — 이 턴에 차감된 pt (4구간 정액). null = 미차감(과거 무료) |
| charge_tier | text (nullable) | - | **크레딧 개편 I Phase** — 차감 구간 'short'\|'normal'\|'long'\|'xlong'. 경계 재확정 후에도 근거 보존 |
| created_at | timestamptz | default(now()) | 작성일 |

> **크레딧 개편 I Phase (2026-05-17)**: 채팅 4구간 사후 차감을 위해 토큰 실측 5 필드 추가. 전부 nullable — `role='user'` 메시지·과거 무료 시대 row 는 null("0 토큰"과 "미측정" 구분 보존). §8-8 CRITICAL #3.

### credit_ledgers (크레딧 개편 I Phase, 2026-05-17)

포인트 입출금 원장 (1-C 하이브리드의 원장 측 — `authors.points_*` 4 필드는 잔액 캐시, 본 테이블이 audit 정본).

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 원장 엔트리 식별자 |
| author_id | text | FK→authors (Restrict), index(author+created), index(author+source) | 작가. **Restrict** — 회계 영구 보존 (ADR-007 정합, Author hard delete 시 PG 차단) |
| source | text | - | 출처: free \| subscription \| gift \| charged (§8-2 분리 회계) |
| type | text | - | earn \| spend \| deficit_incur \| deficit_settle \| expire |
| amount | integer | - | 변동 포인트 (부호 有 — earn 양수 / spend·expire 음수) |
| balance_after | integer | - | 이 row 직후 총 잔액 (4 출처 합) |
| expires_at | timestamptz (nullable) | index(expires_at) | 구독풀 row 만 — 다음 리셋일. 만료 row 는 잔액 집계 제외 → **이월 구조적 차단** (§8-8 #2) |
| reason | text | - | 변동 사유 |
| related_id | text (nullable) | - | ChatMessage/Payment/AnalysisReport id 약결합 (FK 미설정 — 회계 row 영구 보존) |
| created_at | timestamptz | default(now()) | 기록일 |

관계: Author (N:1, Restrict)

### membership_plans (크레딧 개편 I Phase, 2026-05-17)

멤버십 등급 + 월 포인트 풀 (4-C 구조). 현행 `subscriptions`(독자→작가 팔로우)와 **완전히 다른 도메인** — 명명 충돌 회피 위해 `membership_plans`.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 멤버십 식별자 |
| author_id | text | FK→authors (Restrict), index(author_id) | 작가. **Restrict** — 구독 이력 영구 보존 (ADR-007 정합) |
| tier | text | default("free") | free \| pro \| premium |
| monthly_pool_points | integer | default(0) | 월 풀 크기 (free 0 / pro 93,000 / premium 191,500 — §8-3) |
| pool_balance | integer | default(0) | 현재 잔여 풀 (캐시 — 리셋 시 monthly_pool_points 로 재설정) |
| pool_reset_at | timestamptz | index(pool_reset_at) | 다음 리셋 시각 (cron + lazy 이중 안전망) |
| started_at | timestamptz | default(now()) | 멤버십 시작일 |
| expires_at | timestamptz (nullable) | - | 멤버십 만료일 |
| polar_subscription_id | text (nullable) | unique | Polar 구독 결제 연동 (별도 sprint PAY-P1-4 — 본 sprint 는 필드만) |
| status | text | default("active"), index(status) | active \| expired \| cancelled |
| created_at | timestamptz | default(now()) | 생성일 |
| updated_at | timestamptz | auto-update | 수정일 |

관계: Author (N:1, Restrict)

---

## 관계 다이어그램

```
Author ──1:N── Theme                  (onDelete: SetNull — 익명화)
Author ──1:N── Work                   (onDelete: Restrict — 작가 콘텐츠 영구 보존)
Work ──1:N── Episode                  (onDelete: Cascade — Work 삭제 시 동시)
Work ──N:1── Theme                    (onDelete: SetNull — Theme 삭제 시 default 유지)
Work ──1:N── DailyView                (onDelete: Cascade)
Author ──1:N── SocialAccount          (onDelete: Cascade — 계정 종속)
// [CC-4 Phase 3 DROP, 2026-05-21] Author ──1:N── CreditLog — 테이블/모델 폐기. 신 CreditLedger 단일 정본.
Author ──1:N── Payment                (onDelete: Restrict — 회계/세무 영구 보존)
Author ──1:N── AnalysisReport         (onDelete: Restrict — 환불 추적 + 감사)
Author ──1:N── AdminAuditLog (admin)  (onDelete: Restrict — 감사 영구 보존)
Author ──1:N── UserSanction (author)  (onDelete: Restrict — 재가입 추적)
Author ──1:N── UserSanction (admin)   (onDelete: SetNull — 운영자 변경 보존)
Author ──1:N── FeaturedWork (admin)   (onDelete: SetNull — 운영자 변경 보존)
Author ──1:N── RefreshToken           (onDelete: Cascade — 즉시 무효)
Author ──1:N── ChatSession            (onDelete: Cascade)
Author ──1:N── Bookmark               (onDelete: Cascade)
Author ──1:N── ReadingProgress        (onDelete: Cascade)
Author ──1:N── Like                   (onDelete: SetNull — 익명화, 카운트 보존)
Author ──1:N── Comment                (onDelete: SetNull — 익명화, 본문 보존)
Author ──1:N── AccessLog              (onDelete: SetNull — 보안 감사 영구 보존, 익명화)
Author ──1:N── Report (reporter/resolver) (onDelete: SetNull — 익명화)
Author ──1:N── Subscription (sub/target) (onDelete: Cascade)
Payment ──1:N── RefundLog              (onDelete: Restrict — 회계/세무 영구 보존)
ChatSession ──1:N── ChatMessage       (onDelete: Cascade)
Comment ──1:N── Comment (대댓글)      (onDelete: SetNull — 답글 보존)
SignupHistory (독립 — 재가입 방지)
SystemSetting (동적 설정값)
WebhookEvent (멱등성, FK 0건)
WebhookRetryQueue (DLQ, FK 0건)
ReconciliationCheckpoint (cron checkpoint, 단일 row)
```

**FK Cascade 정책 박제 (PAY-P3-E §3-1, 2026-05-10)**:
- 4 전략 분포: **Cascade 16건** (사용자 종속 + Work/Episode 종속) + **Restrict 8건** (회계/세무/감사 영구 보존) + **SetNull 9건** (익명화 + 운영자 변경 보존) + **NoAction 0건**
- Restrict 7 영역 (CC-4 Phase 3 후 — `credit_logs.authorId` 폐기): `payments.authorId` / `works.authorId` / `user_sanctions.authorId` / `analysis_reports.authorId` / `admin_audit_logs.adminId` / `refund_logs.paymentId` / `subscriptions.targetAuthorId` (PAY-P3-E 박제 영역) — 회계/세무/감사 영구 보존
- 정본: `prisma/schema.prisma` + `prisma/migrations/20260510_pay_p3_e_fk_cascade_policy/migration.sql` + `ADR.md ADR-007`
- archive 테이블 (옵션 C 강제 박제, 단계 2 dev 영역): `credit_logs_archive_pay_p3_e` (1 row) + `admin_audit_logs_archive_pay_p3_e` (2 row) — 회계/감사 영구 보존

### analysis_reports

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 리포트 식별자 |
| author_id | text | not null | 분석 실행자 (소유권) |
| work_id | text | not null | 분석 대상 작품 |
| episode_id | text | not null | 분석 대상 에피소드 |
| work_title | text | not null | 작품 제목 스냅샷 (작품 삭제 후에도 식별 가능) |
| episode_title | text | not null | 에피소드 제목 스냅샷 |
| types | text[] | not null | 실행된 분석 타입 (consistency/tone/character 조합) |
| results | jsonb | not null | AnalysisResult[] 전체 (점수/요약/이슈/제안) |
| credits_charged | integer | default 3 | 실제 차감된 크레딧 |
| created_at | timestamptz | default now | 실행 시각 |

인덱스: `(author_id, created_at DESC)`, `(episode_id)`

---

### user_sanctions

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 제재 식별자 |
| author_id | text | FK(authors) | 대상 작가 |
| type | text | not null | warning, suspend_1d, suspend_7d, suspend_30d, permanent |
| reason | text | not null | 욕설, 스팸, 저작권, 기타 |
| detail | text | nullable | 관리자 메모 |
| admin_id | text | not null | 제재를 건 관리자 ID |
| start_at | timestamptz | default now | 시작 시각 |
| end_at | timestamptz | nullable | 해제 시각 (null = 영구) |
| is_active | boolean | default true | 활성 여부 |
| created_at | timestamptz | default now | 기록 시각 |

인덱스: `(author_id, is_active)`, `(end_at)`

### reports

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 신고 식별자 |
| target_type | text | not null | work, episode, comment |
| target_id | text | not null | 신고 대상 ID |
| reporter_id | text | nullable | 신고자 (비로그인 시 null) |
| reason | text | not null | obscene, violence, copyright, spam, other |
| detail | text | nullable | 상세 사유 |
| status | text | default 'pending' | pending, approved, rejected |
| resolved_by | text | nullable | 처리한 관리자 ID |
| resolved_at | timestamptz | nullable | 처리 시각 |
| created_at | timestamptz | default now | 접수 시각 |

인덱스: `(status, created_at)`, `(target_type, target_id)`

### system_settings

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| key | text | PK | 설정 키 (maintenance_mode, recaptcha_enabled 등) |
| value | text | not null | 설정 값 |
| updated_by | text | nullable | 마지막 변경 관리자 |
| updated_at | timestamptz | auto | 변경 시각 |

### access_logs

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 로그 식별자 |
| action | text | not null | register, login_success, login_fail, login_blocked, password_change, admin_login_* |
| author_id | text | nullable | 사용자 (미식별 시 null) |
| email | text | nullable | 시도한 이메일 |
| ip | text | nullable | 클라이언트 IP |
| user_agent | text | nullable | 브라우저/봇 UA |
| detail | text | nullable | 실패 사유 등 |
| created_at | timestamptz | default now | 기록 시각 |

인덱스: `(action, created_at)`, `(ip)`, `(author_id)`

### admin_audit_logs

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 감사 로그 식별자 |
| admin_id | text | not null | 행위 관리자 또는 시스템 식별자 (`system_*` prefix) |
| action | text | not null | (인간 운영자) author_create, credit_grant, episode_status_change, user_sanction, report_resolve, setting_change 등 / (시스템) refund_normal, refund_deficit, payment_expire, **webhook_permanent_failed** (PAY-P3-B 신설), retry_skip_dedup (PAY-P3-C) |
| target_id | text | nullable | 대상 리소스 ID (시스템 박제 시 webhook eventId 또는 paymentId) |
| detail | jsonb | nullable | 변경 전/후 값, 사유 등 (PAY-P3-B `webhook_permanent_failed` 시 `{ reason: 'polar_4xx_no_retry', errorClass, httpStatus, paymentId, branch, originalMessage }` 박제) |
| created_at | timestamptz | default now | 기록 시각 |

인덱스: `(admin_id, created_at)`, `(action)`

**시스템 operator 매핑 (PAY-P3-B 정합)**:
- `system_refund` — RefundPaymentUseCase ($transaction 후행, action `refund_normal` / `refund_deficit`)
- `system_cleanup` — payment-cleanup.job (action `payment_expire`)
- `system_payment` — PaymentUseCase 결제 완료 (action `payment_completed`)
- `system_dlq` — webhook 영구 실패 박제. PAY-P2-2 MAX_RETRY 누적 후 + **PAY-P3-B Polar 4xx 즉시 permanent_failed (action `webhook_permanent_failed`, retry queue 박제 0건)** + PAY-P3-C dedup skip (action `retry_skip_dedup`).

---

## 참조

- `server/SCHEMA.md` — Prisma 구현 상세
- `docs/glossary.md` — Block 타입, 크레딧 사유 코드 정의
- `docs/theme-spec.md` — AuthorTheme JSON 스키마 (overrides 필드 형식)
