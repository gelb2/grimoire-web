# ai-analysis-spec.md — AI 분석 + RAG + 시맨틱 캐싱 + 채팅 명세

> **정본 위치:** grimoire-server (이 파일)
> **동기 대상:** grimoire-web/docs/ai-analysis-spec.md (복사)
> 이 문서를 수정할 때는 서버에서 먼저, 웹에 복사.

---

## 1. 개요

그리모어의 AI 기능은 4개 레이어로 구성된다:

```
[1] RAG 파이프라인 (텍스트 청킹 → 임베딩 → 벡터 저장/검색)
[2] AI 작품 분석 (일관성/톤/캐릭터 분석 — 현재 동작 중)
[3] AI 채팅 (작가 어시스턴트 — 구현 예정)
[4] 시맨틱 캐싱 (분석+테마+채팅 응답 캐싱 — 구현 예정)
```

모든 레이어는 같은 인프라를 공유한다: **OpenAI 임베딩 + pgvector + Claude API**

---

## 2. 인프라 현황

| 컴포넌트 | 기술 | 상태 | 환경변수 |
|---------|------|------|---------|
| 임베딩 | OpenAI text-embedding-3-small (1536차원) | ✅ 3환경 활성 | `OPENAI_API_KEY` |
| 벡터 DB | pgvector (PostgreSQL 확장) | ✅ 3환경 활성 | DB 내장 |
| AI 분석/채팅 | Anthropic Claude API | ✅ 3환경 활성 | `ANTHROPIC_API_KEY` |
| 벡터 테이블 | novel_chunks | ✅ 3환경 생성 완료 | — |

---

## 3. 데이터 모델

### 3-1. 기존 (활성)

```
novel_chunks (pgvector 테이블 — Prisma 외부)
├── id: TEXT PK ('{episodeId}_{chunkIndex}')
├── work_id: TEXT
├── episode_id: TEXT
├── chunk_index: INTEGER
├── chunk_text: TEXT
└── embedding: vector(1536)
```

### 3-2. 채팅용 (구현 예정)

```prisma
model ChatSession {
  id        String   @id @default(uuid())
  authorId  String   @map("author_id")
  workId    String   @map("work_id")       // Work = 프로젝트
  title     String   @default("새 대화")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  messages  ChatMessage[]
  @@index([authorId, workId])
  @@map("chat_sessions")
}

model ChatMessage {
  id        String   @id @default(uuid())
  sessionId String   @map("session_id")
  session   ChatSession @relation(fields: [sessionId], references: [id])
  role      String   // "user" | "assistant"
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  @@index([sessionId, createdAt])
  @@map("chat_messages")
}
```

### 3-3. 시맨틱 캐싱용 (구현 예정)

```
semantic_cache (pgvector 테이블)
├── id: TEXT PK
├── cache_type: TEXT ('analysis' | 'theme' | 'chat')
├── query_text: TEXT (원본 요청 텍스트)
├── query_embedding: vector(1536)
├── response_json: JSONB (캐싱된 응답)
├── work_id: TEXT (nullable — 작품 범위 캐싱)
├── created_at: TIMESTAMPTZ
└── hit_count: INTEGER DEFAULT 0
```

---

## 4. RAG 파이프라인 상세

### 4-1. 텍스트 청킹

- **파일:** `src/lib/rag/chunker.ts`
- **청크 크기:** 800자, 오버랩 100자
- **경계 감지:** 문단(`\n\n`) → 문장(`.!?`) → 줄바꿈(`\n`)
- **입력:** `Episode.rawMd` (마크다운 원문)

### 4-2. 임베딩

- **파일:** `src/adapter/outbound/embedding/openai-embedding.adapter.ts`
- **모델:** text-embedding-3-small (1536차원)
- **배치:** 기본 100개씩, 분석용은 10개씩
- **재시도:** 429 에러 시 3회 (5초/10초/15초)
- **포트:** `EmbeddingPort` → DI 토큰 `'EmbeddingPort'`

### 4-3. 벡터 저장/검색

- **파일:** `src/adapter/outbound/vector/pgvector.adapter.ts`
- **테이블:** `novel_chunks` (런타임 생성, ensureTable())
- **인덱스:** work_id, episode_id, HNSW (10,000청크 이상)
- **검색:** 코사인 유사도, top-K (기본 30)
- **포트:** `VectorStorePort` → DI 토큰 `'VectorStorePort'`

---

## 5. AI 작품 분석 (레이어 2)

### 5-1. 흐름

```
POST /analysis/index { episodeId, workId, rawText }
  → 청킹 → 임베딩(배치) → pgvector 저장
  → { chunkCount, tokensUsed }

POST /analysis/check { workId, newEpisodeText, types? }
  → 새 텍스트 첫 2000자 임베딩 → pgvector 유사 검색(top 20)
  → 상위 15 청크를 맥락으로 Claude 분석 (3유형)
  → [{ type, score, summary, issues, suggestions }]

GET /analysis/status/:workId
  → { chunkCount, isIndexed }
```

### 5-2. 분석 유형

| 유형 | 파일 | 검사 대상 |
|------|------|----------|
| consistency | `src/lib/rag/novel-analyzer.ts` | 설정 모순, 시간대 불일치, 복선 충돌 |
| tone | 동일 | 문체 변화, 서술 톤, 어휘 수준 |
| character | 동일 | 성격 변화, 말투 일관성, 행동 동기 |

### 5-3. 파일 구조

```
src/
├── lib/rag/
│   ├── chunker.ts           # 텍스트 청킹
│   ├── chunker.spec.ts
│   └── novel-analyzer.ts    # 순수 분석 함수 (consistency/tone/character)
├── application/analysis/
│   └── novel-analysis.usecase.ts   # 인덱싱 + 분석 오케스트레이션
├── adapter/outbound/
│   ├── embedding/openai-embedding.adapter.ts
│   └── vector/pgvector.adapter.ts
└── adapter/inbound/http/controller/
    └── analysis.controller.ts      # API 엔드포인트
```

---

## 6. AI 채팅 (레이어 3 — 구현 예정)

### 6-1. 콘셉

Claude 맥 앱의 **프로젝트 → 채팅** 경험을 재현:
- **프로젝트 = Work** (작품 단위 격리)
- **프로젝트 안의 원고 = Episodes** (rawMd가 인덱싱됨)
- **채팅 = ChatSession** (Work 안에서 여러 세션 생성 가능)

### 6-2. 흐름

```
작가가 Work "사슴악마" 채팅에서 질문 입력
  → 질문 임베딩
  → pgvector에서 해당 Work의 관련 청크 검색 (top 15)
  → Claude에 전달: [시스템 프롬프트] + [관련 청크] + [대화 히스토리 최근 10개] + [질문]
  → 응답 스트리밍 (SSE)
  → ChatMessage에 저장 (user + assistant)
```

### 6-3. API 설계 (예정)

| Method | Path | 용도 | 인증 |
|--------|------|------|------|
| POST | `/chat/sessions` | 새 채팅 세션 생성 | JWT |
| GET | `/chat/sessions?workId=` | 세션 목록 조회 | JWT |
| POST | `/chat/sessions/:sessionId/messages` | 메시지 전송 + AI 응답 | JWT |
| GET | `/chat/sessions/:sessionId/messages` | 히스토리 조회 | JWT |
| DELETE | `/chat/sessions/:sessionId` | 세션 삭제 | JWT |

### 6-4. 프론트 (예정)

- 대시보드 내 "AI 어시스턴트" 탭 또는 `/dashboard/chat`
- Work 선택 → 채팅 세션 목록 → 메시지 UI
- 스트리밍 응답 표시 (SSE or WebSocket)

---

## 7. 시맨틱 캐싱 (레이어 4 — 구현 예정)

### 7-1. 적용 대상

| 대상 | 캐시 키 | 캐시 값 | 유사도 임계값 |
|------|--------|--------|------------|
| 소설 분석 | 에피소드 텍스트 첫 2000자 임베딩 | AnalysisResult[] | 0.95 |
| 테마 생성 | 구술 텍스트 임베딩 | AuthorTheme JSON | 0.90 |
| 채팅 응답 | 질문 + workId 임베딩 | 응답 텍스트 | 0.95 |

### 7-2. 흐름

```
요청 텍스트 → 임베딩
  → semantic_cache에서 유사도 검색
  → 히트 (유사도 > 임계값) → 캐시 반환 + hit_count++
  → 미스 → Claude API 호출 → 결과 + 임베딩을 캐시에 저장
```

### 7-3. 캐시 무효화

- 에피소드 수정/삭제 시 → 해당 work_id의 분석 캐시 삭제
- 테마 캐시는 전역 (작가 무관)
- TTL: 30일 (cron으로 정리)

---

## 8. 비용 추정

| 작업 | OpenAI | Claude | 합계 (USD) |
|------|--------|--------|-----------|
| 에피소드 인덱싱 (17K자) | $0.004 | $0 | $0.004 |
| 분석 1회 (3유형) | $0.001 | $0.04 | $0.041 |
| 채팅 1턴 | $0.001 | $0.01 | $0.011 |
| 시맨틱 캐시 히트 | $0.001 | $0 | $0.001 |

→ 분석 1회 ≈ 5원, 채팅 1턴 ≈ 1.5원, 캐시 히트 ≈ 0.1원

---

## 9. 구현 순서

```
[완료] 레이어 1: RAG 인프라 (청킹+임베딩+pgvector)
[완료] 레이어 2: AI 작품 분석 (3유형 분석 API)
[다음] 레이어 3: AI 채팅 (ChatSession+Message+RAG+스트리밍)
[이후] 레이어 4: 시맨틱 캐싱 (분석+테마+채팅 공통)
```

---

## 10. 참조 문서

| 문서 | 위치 | 용도 |
|------|------|------|
| 이 문서 | `docs/ai-analysis-spec.md` (서버 정본) | AI 기능 전체 명세 |
| 시맨틱 캐싱 리뷰 | `docs/TECH_REVIEW_SEMANTIC_CACHING.md` | 기술 검토 |
| 채팅 연구 | `docs/CHAT_FEATURE_RESEARCH.md` | 채팅 UI/UX 연구 |
| AI 분석 콘셉 | `docs/FEATURE_AI_ANALYSIS.md` (루트) | 비즈니스 콘셉 + 로드맵 |
| 파서 규격 | `PARSER.md` | rawMd 생성 규칙 |
| 데이터 브로커리지 | `docs/PROPOSAL_DATA_BROKERAGE.md` (루트) | B2B 데이터 제안 |
