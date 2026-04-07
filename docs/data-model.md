# Data Model — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> 단일 진실 공급원 (Single Source of Truth) — Prisma 스키마와 1:1 대응

---

## 테이블 (16개)

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
| baked_css_url | text (nullable) | - | Baking된 CSS 파일 URL |
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
| status | text | default("pending") | 결제 상태 (pending/completed/failed) |
| created_at | timestamptz | default(now()) | 결제 요청일 |
| completed_at | timestamptz (nullable) | - | 결제 완료일 |

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
```

---

## 참조

- `server/SCHEMA.md` — Prisma 구현 상세
- `docs/glossary.md` — Block 타입, 크레딧 사유 코드 정의
- `docs/theme-spec.md` — AuthorTheme JSON 스키마 (overrides 필드 형식)
