# Data Model — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> 단일 진실 공급원 (Single Source of Truth) — Prisma 스키마와 1:1 대응

---

## 테이블 (23개)

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
| credits | integer | default(3) | 크레딧 잔액 |
| plan | text | default("free") | 구독 플랜 (free/pro/premium) |
| plan_expire_at | timestamptz (nullable) | - | 플랜 만료일 (free=null, pro/premium=날짜) |
| default_theme_id | uuid (nullable) | - | 기본 테마 ID |
| created_at | timestamptz | default(now()) | 가입일 |

관계: Theme (1:N), Work (1:N), SocialAccount (1:N)

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

### credit_logs

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 로그 식별자 |
| author_id | text | - | 작가 ID (FK 없음 — 감사 로그) |
| amount | integer | - | 양수: 적립, 음수: 차감 |
| reason | text | - | 변동 사유 코드 |
| created_at | timestamptz | default(now()) | 기록일 |

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
| credits | integer | - | 부여 크레딧 수 |
| external_transaction_id | text (nullable) | unique | 외부 결제 거래 번호 |
| status | text | default("pending") | 결제 상태 (pending/completed/failed/refunded/expired) |
| created_at | timestamptz | default(now()) | 결제 요청일 |
| completed_at | timestamptz (nullable) | - | 결제 완료일 |

**status enum 흐름** (2026-05-04 PAY-P1-3 갱신):
- `pending`: 초기 생성 상태 (Polar Checkout URL 발급 직후)
- `completed`: webhook 'order.paid' 수신 → `completePaymentAtomically` 트랜잭션 성공
- `failed`: webhook 'fail' 수신 (PG 처리 실패)
- `refunded`: webhook 'order.refunded' 수신 → `refundPaymentAtomically` 트랜잭션 성공 (PAY-P1-1)
- `expired`: 24h 초과 pending row → cron이 마킹 (PAY-P0-2 reconciliation cron + PAY-P1-3 cleanup cron 양쪽에서 처리)
  - PAY-P1-3 재사용 정책: `findReusablePendingPayment`은 `status='pending' AND createdAt > now-24h` row만 반환 → expired 마킹된 row는 재사용 후보에서 제외
  - cleanup cron `payment-cleanup.job` (`@Cron('0 0 4 * * *')`): 매일 새벽 4시 1회, AuditLog operator='system_cleanup' action='payment_expire' 박제

### webhook_events (Sprint PAY-P0-1, 2026-05-03)

PG (Polar 등) 웹훅 재전송 시 동일 `event_id`로 두 번째 호출이 들어와도 `completePaymentAtomically`가 단 1회만 실행되도록 멱등성 박제 테이블. DB unique 제약(`event_id`)으로 race condition 차단.

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

### refund_logs (Sprint PAY-P1-1, 2026-05-03)

Polar 환불 webhook 수신 시 크레딧 환수 트랜잭션의 영구 박제 테이블. payment.usecase.processWebhook의 'cancel' 분기에서 RefundPaymentUseCase가 $transaction 내부에 박제. Author.credits 잔액 부족 시 0 fix + `deficit_credits` 박제로 적자 위험 차단.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | uuid | PK | 환불 로그 식별자 |
| payment_id | text | - | 환불 대상 Payment id (1:N — 향후 부분 환불 호환 위해 unique 미부여) |
| amount | int | - | PG 환불 금액 (KRW) |
| credits | int | - | 실제 환수된 크레딧 (잔액 충분 시 = 요청, 부족 시 = 잔액) |
| deficit_credits | int | default(0) | 잔액 부족분 (양수 = 외상, 0 = 정상 환수). 운영자 회수 정책 결정 입력 |
| reason | text | - | 환불 사유 (예: 'polar_webhook_order.refunded') |
| processed_at | timestamptz(3) | default(now()) | 환수 처리 시각 |
| source | text | - | 'webhook' (Polar 자동) / 'manual' (운영자 수동, P2) |

인덱스:
- `@@index([payment_id])` — Payment별 환불 이력 조회

정책:
- **잔액 부족 시 0 fix**: Author.credits < credits → Author.credits = 0 + deficit_credits = credits - 잔액. 음수 잔액 절대 차단.
- **CreditLog 음수 박제 대칭**: 같은 $transaction 내부에서 `credit_logs.amount = -actualDeducted` 박제 (계정 잔액 합산 정합)
- **AdminAuditLog 후행**: `operator='system_refund'`, `action='refund_normal' | 'refund_deficit'` ($transaction 외부 호출)

3중 멱등성:
- L1: PAY-P0-1 `webhook_events.eventId @unique` (재전송 차단)
- L2: payment.usecase 진입 시 `payment.status='completed'` 체크 (이미 환불된 payment skip)
- L3: refund_logs 박제 (조회 + 추적)

정본: `.claude/shared-contracts.md` §13 RefundPaymentAtomically

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
| created_at | timestamptz | default(now()) | 작성일 |

---

## 관계 다이어그램

```
Author ──1:N── Theme
Author ──1:N── Work ──1:N── Episode
Work ──N:1── Theme (작품별 테마)
Work ──1:N── DailyView (일별 조회 통계)
Author ──1:N── SocialAccount
Author ──1:N── CreditLog (비정규화)
ChatSession ──1:N── ChatMessage (cascade delete)
Comment ──1:N── Comment (대댓글, self-join)
SignupHistory (독립 — 재가입 방지)
Bookmark (독자 행위 기록)
ReadingProgress (독자 행위 기록)
Like (독자 행위 기록)
Subscription (구독 관계)
Payment (결제 기록)
UserSanction (제재/정지 — 작가별 이력)
Report (콘텐츠 신고 큐)
SystemSetting (동적 설정값)
AccessLog (보안 접근 로그)
AdminAuditLog (관리자 감사 로그)
AnalysisReport (AI 일관성 분석 리포트, 2026-04-24 F4)
```

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
| admin_id | text | not null | 행위 관리자 |
| action | text | not null | author_create, credit_grant, episode_status_change, user_sanction, report_resolve, setting_change 등 |
| target_id | text | nullable | 대상 리소스 ID |
| detail | jsonb | nullable | 변경 전/후 값, 사유 등 |
| created_at | timestamptz | default now | 기록 시각 |

인덱스: `(admin_id, created_at)`, `(action)`

---

## 참조

- `server/SCHEMA.md` — Prisma 구현 상세
- `docs/glossary.md` — Block 타입, 크레딧 사유 코드 정의
- `docs/theme-spec.md` — AuthorTheme JSON 스키마 (overrides 필드 형식)
