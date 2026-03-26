# Data Model — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> Phase 1 구현 시 Prisma 스키마로 구체화 예정

## 테이블 (초안)

### authors
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| slug | text (unique) | URL 경로 |
| name | text | 작가명 |
| email | text (unique) | 이메일 |
| theme_id | uuid (FK) | 테마 |
| created_at | timestamptz | 생성일 |

### themes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| author_id | uuid (FK) | 작가 |
| preset | text | 프리셋명 (midnight, parchment 등) |
| overrides | jsonb | 커스텀 값 |
| raw_description | text | 작가 원본 구술 텍스트 |
| updated_at | timestamptz | 수정일 |

### works
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| author_id | uuid (FK) | 작가 |
| slug | text | URL 경로 |
| title | text | 작품 제목 |
| subtitle | text | 부제 |
| description | text | 설명 |
| created_at | timestamptz | 생성일 |

### episodes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| work_id | uuid (FK) | 작품 |
| slug | text | URL 경로 |
| title | text | 제목 |
| subtitle | text | 부제 |
| order_num | integer | 순서 |
| blocks | jsonb | 파싱된 Block[] |
| raw_md | text | 원본 마크다운 |
| created_at | timestamptz | 생성일 |
