# API Contract — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> 참조: `server/CLAUDE.md` §7, `server/TECH_STATUS.md`

---

## 엔드포인트 목록

| Method | Path | 용도 | Phase | 상태 |
|--------|------|------|-------|------|
| GET | `/api/health` | 헬스체크 | 1 | 구현 완료 |
| POST | `/api/themes/generate` | Claude API로 테마 생성 (1크레딧 차감) | 1 | 구현 완료 |
| GET | `/api/themes/:authorSlug` | 작가 테마 조회 | 1 | 구현 완료 |
| POST | `/api/manuscripts/parse` | MD 텍스트 → Block[] 파싱 | 1 | 구현 완료 |
| GET | `/api/authors/:slug` | 작가 공간 데이터 (테마 + 작품 목록) | 1 | 구현 완료 |
| GET | `/api/works/:authorSlug/:workSlug` | 작품 데이터 (에피소드 목록 포함) | 1 | 구현 완료 |
| GET | `/api/episodes/:authorSlug/:workSlug/:episodeSlug` | 에피소드 데이터 (Block[] 포함) | 1 | 구현 완료 |
| POST | `/api/auth/register` | 작가 가입 | 3 | 미구현 |
| POST | `/api/auth/login` | 로그인 | 3 | 미구현 |

---

## Phase 1 상세 명세

### GET /api/health

```
Response 200:
{ "status": "ok", "timestamp": "2026-03-26T..." }
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

---

## 공통 규칙

### 글로벌 접두사

모든 엔드포인트: `/api/` 접두사

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
