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
| DELETE | `/api/episodes/:id` | 에피소드 삭제 | JWT |
| PUT | `/api/works/:id/cover` | 커버 이미지 업로드 | JWT |
| PATCH | `/api/works/:workId/episodes/:episodeId/status` | 에피소드 상태 변경 | JWT |
| POST | `/api/works/:workId/episodes/:episodeId/share` | 공유 링크 생성 | JWT |

### Author (공개)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/authors/:slug` | 작가 공간 데이터 (테마 + 작품 목록) | - |
| GET | `/api/authors/:slug/profile` | 작가 공개 프로필 (통계 포함) | - |
| PATCH | `/api/authors/:slug/profile` | 작가 bio 수정 | JWT |

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
| GET | `/api/discover/authors/most-gifted` | 응원받는 작가 랭킹 (`?limit=8`) | - |

### Payment

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/payments/products` | 크레딧 상품 목록 | - |
| POST | `/api/payments/webhook` | PAYAPP 결제 콜백 | - |
| POST | `/api/payments/initiate` | 결제 시작 | JWT |
| GET | `/api/payments/history` | 결제 내역 | JWT |
| GET | `/api/payments/credits` | 내 크레딧 잔액 | JWT |

### Credits

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/api/credits/gift` | 크레딧 선물 (독자 → 작가) | JWT |
| GET | `/api/credits/ranking` | 응원받는 작가 랭킹 | - |
| GET | `/api/credits/balance` | 크레딧 잔액 조회 | JWT |
| GET | `/api/credits/logs` | 크레딧 로그 조회 | JWT |

### Stats

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/works/:workId/stats` | 작품 조회수 통계 (소유자만) | JWT |

### Admin

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| GET | `/api/admin/stats` | 플랫폼 통계 | JWT, admin |
| POST | `/api/admin/credits` | 크레딧 수동 부여 | JWT, admin |

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
| POST | `/api/analysis/check` | 설정 일관성 검사 | JWT, 크레딧 1 |
| GET | `/api/analysis/status/:workId` | 인덱싱 상태 조회 | JWT |

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
  "user": { "id": "uuid", "slug": "author-slug", "name": "작가명", "email": "...", "credits": 3 },
  "token": "jwt-token"
}

Error 400: 유효성 검증 실패
Error 409: 이메일/슬러그 중복
```

### POST /api/auth/login

```
Request:
{ "email": "author@example.com", "password": "..." }

Response 200:
{
  "user": { "id": "uuid", "slug": "author-slug", "name": "작가명", "email": "...", "credits": 5 },
  "token": "jwt-token"
}

Error 401: 이메일/비밀번호 불일치
```

### GET /api/auth/profile

```
Headers: Authorization: Bearer <token>

Response 200:
{ "id": "uuid", "slug": "author-slug", "name": "작가명", "email": "...", "credits": 5 }

Error 401: 인증 실패
```

### POST /api/auth/google

```
Request:
{ "token": "google-id-token" }

Response 200:
{
  "user": { "id": "uuid", "slug": "...", "name": "...", "email": "...", "credits": 5 },
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
Response 200: Theme (id, authorId, preset, overrides, rawDescription, updatedAt)
Error 404: 테마 없음
```

### POST /api/themes/publish/:authorSlug

테마를 CSS로 베이킹하고 bakedCssUrl을 갱신한다.

```
Response 200: { "bakedCssUrl": "..." }
Error 404: 테마 없음
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
{ "frontmatter": Frontmatter, "title": "제목", "blocks": Block[] }

Response 200 (preface):
{ "frontmatter": Frontmatter, "title": "일러두기", "paragraphs": string[], "lastLine": "..." }

Response 200 (afterword):
{ "frontmatter": Frontmatter, "title": "후기", "glitchText": "...", "footnote": "..." }

Error 400: MD 텍스트 비어있음 / frontmatter 누락
```

Block 타입은 `docs/glossary.md` 참조.

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
Request:
{ "title": "수정된 제목", "subtitle": "수정된 부제" }

Response 200: Work
Error 403: 본인 작품 아님
Error 404: 작품 없음
```

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

```
Response 200: [{ "id", "name", "credits", "price", "description" }]
```

### POST /api/payments/webhook

```
Request: { "paymentId": "...", "productId": "...", "authorId": "...", "status": "success" }
Response 200: { "processed": true }
```

### GET /api/payments/credits

```
Headers: Authorization: Bearer <token>
Response 200: { "credits": 5 }
```

### GET /api/admin/stats

```
Response 200: { "totalAuthors", "totalWorks", "totalEpisodes", "totalCreditsUsed" }
```

### POST /api/admin/credits

```
Request: { "authorId": "uuid", "amount": 10, "reason": "이벤트 보상" }
Response 200: CreditLog
```

### POST /api/analysis/index

```
Headers: Authorization: Bearer <token>
Request: { "episodeId": "uuid", "workId": "uuid", "rawText": "에피소드 본문..." }
Response 200: { "indexed": true }
```

### POST /api/analysis/check

```
Headers: Authorization: Bearer <token>
Request:
{
  "workId": "uuid",
  "newEpisodeText": "새 에피소드 본문...",
  "types": ["consistency", "tone", "character"]
}

Response 200: AnalysisResult
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
