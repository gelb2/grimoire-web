# Glossary — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화

## 용어 정의

| 용어 | 정의 |
|------|------|
| Author | 플랫폼에 가입한 작가. 자신만의 공간을 가진다 |
| Author Space | 작가의 독립된 URL 공간 (`/{slug}/`). 테마가 적용된 랜딩 + 뷰어 |
| Work | 작가의 작품 (소설 시리즈 1개 단위) |
| Episode | 작품의 개별 편 (에피소드, 챕터) |
| Theme | 작가 공간의 시각적 설정 (색상, 폰트, 애니메이션) |
| Theme Baking | 테마 JSON → CSS Variables 변환 + CSS 파일 생성 과정 |
| Preset | 시스템이 제공하는 기본 테마 8종 (DB: authorId=null, source='system'). deerDevil은 프리셋이 아닌 작가 테마 |
| Block | 파싱된 콘텐츠의 최소 단위 (paragraph, chapter, divider 등) |
| Manuscript | 작가가 업로드하는 원고 (MD/TXT/DOCX 파일) |
| Viewer | 에피소드를 렌더링하는 읽기 화면 |
| Dashboard | 작가 전용 관리 화면 (원고, 테마, 설정) |
| Bookmark | 독자가 저장한 에피소드 즐겨찾기 |
| ReadingProgress | 독자의 에피소드별 읽기 진행도 (마지막 블록 인덱스) |
| Like | 독자가 에피소드에 남긴 좋아요 |
| Subscription | 독자가 작가를 구독한 관계 |
| Comment | 독자가 에피소드에 남긴 댓글 |
| Payment | 크레딧 구매 결제 기록 |
| Credit | AI 기능 사용에 필요한 내부 화폐 단위 |
| Plan | 구독 플랜 (free/pro/premium). 슬롯 개수와 기능 제한을 결정 |
| Slot / isSlotted | 테마 활성화 슬롯. isSlotted=true면 공개 렌더링에 사용, false면 보관 상태 |
| Context | 작품 프로젝트 메모리 (Work.context). AI가 매일 자정 대화 기반으로 자동 재생성 |
| Instructions | 작품 지침 (Work.instructions). 작가가 직접 작성하는 문체 규칙/톤/금지사항 |
| ChatSession | 작가와 AI 어시스턴트의 대화 세션 (Work 단위 격리) |
| ChatMessage | 채팅 메시지. role: "user"(작가) 또는 "assistant"(AI) |
| isIndexed | 에피소드 RAG 벡터 인덱싱 완료 여부. 인덱싱된 원고만 AI 채팅에서 참조 |
| RAG | Retrieval-Augmented Generation — 소설 분석/채팅용 벡터 검색 |
| Vector/Embedding | 텍스트의 의미를 수치화한 벡터 표현 (소설 분석/채팅용) |

## Block 타입 (DeerDevil 기반)

| 타입 | 용도 |
|------|------|
| paragraph | 일반 본문 |
| chapter | 챕터 제목 (번호 + 제목) |
| divider | 구분선 |
| refrain | 반복구 (시적 표현) |
| italic | 이탤릭 텍스트 |
| epilogue | 에필로그 |
| review | 리뷰/감상 |
| reviews-wrap | 리뷰 묶음 |

## 크레딧 사유 코드

| reason | amount | 설명 |
|--------|--------|------|
| `signup_bonus` | +3 | 가입 보너스 |
| `first_work_bonus` | +2 | 첫 작품 등록 |
| `theme_generate` | -1 | 테마 최초 생성 |
| `theme_regenerate` | -1 | 테마 재생성 |
| `analysis_check` | -1 | 소설 일관성 분석 |
| `purchase_credit_N` | +N | 크레딧 구매 |
| `admin_set_by_{adminId}` | +N | 관리자 수동 부여 |
