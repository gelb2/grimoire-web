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
| Preset | 시스템이 제공하는 기본 테마 (Midnight, Parchment 등) |
| Block | 파싱된 콘텐츠의 최소 단위 (paragraph, chapter, divider 등) |
| Manuscript | 작가가 업로드하는 원고 (MD 파일) |
| Viewer | 에피소드를 렌더링하는 읽기 화면 |
| Dashboard | 작가 전용 관리 화면 (원고, 테마, 설정) |

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
