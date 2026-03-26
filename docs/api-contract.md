# API Contract — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화
> Phase 1 구현 시 상세 명세 작성 예정

## 엔드포인트 목록 (초안)

| Method | Path | 용도 | Phase |
|--------|------|------|-------|
| POST | `/api/auth/register` | 작가 가입 | 3 |
| POST | `/api/auth/login` | 로그인 | 3 |
| POST | `/api/themes/generate` | Claude API로 테마 생성 | 1 |
| GET | `/api/themes/:authorSlug` | 작가 테마 조회 | 1 |
| POST | `/api/manuscripts/parse` | MD → Block[] 파싱 | 2 |
| GET | `/api/authors/:slug` | 작가 공간 데이터 | 2 |
| GET | `/api/works/:authorSlug/:workSlug` | 작품 데이터 | 2 |
| GET | `/api/episodes/:authorSlug/:workSlug/:episodeSlug` | 에피소드 데이터 | 2 |
