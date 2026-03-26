# MD_PARSER.md — MD 자동 파싱 시스템

## 개요

이 프로젝트의 핵심 시스템.
`DeerDevil_MDfiles/` 폴더의 마크다운 파일을 자동으로 파싱하여
웹 페이지에 표시되는 TypeScript 데이터 파일을 생성한다.

**소설 작성자는 표준 마크다운만 쓰면 되고, 웹 코드를 만질 필요가 없다.**

---

## 흐름도

```
DeerDevil_MDfiles/*.md
        │
        │  npm run parse  (커스텀 명령어 — package.json에 등록됨)
        │  실행 파일: scripts/parse-md.ts
        ▼
src/features/universe/data/contentDataSource/
        ├── contents.ts      ← 메타데이터 배열 (랜딩 카드, 라우팅)
        ├── ep1.ts           ← 에피소드 1 본문 (Block[])
        ├── ep2.ts           ← ...
        ├── ...
        ├── bonus1.ts
        ├── preface.ts       ← 일러두기
        └── afterword.ts     ← 후기
        │
        ▼
웹 페이지 (Next.js가 contentDataSource/ 파일을 import해서 렌더링)
```

---

## 새 에피소드 추가 방법

1. `DeerDevil_MDfiles/` 폴더에 MD 파일 추가
2. 터미널에서 `npm run parse` 실행
3. `npm run dev`로 로컬에서 확인
4. 끝

- `npm run build` 할 때도 prebuild 훅으로 parse가 자동 실행됨
- Vercel 배포 시에도 build 과정에서 자동 실행됨

---

## MD 파일 작성 규칙

### 기본 템플릿

```markdown
---
slug: ep9
type: episode
num: "09"
subtitle: "The English Title"
description: "카드에 표시될 한 줄 설명"
---

# 에피소드 제목

## 부제 (무시됨 — subtitle은 frontmatter에서 관리)

---

### 1. 첫 번째 챕터 제목

일반 문단. **볼드 강조**도 가능.

*이 줄 전체가 이탤릭이면 italic 블록이 된다*

> 이 줄은 refrain(후렴구) 블록이 된다. 왼쪽 금색 선으로 표시됨.

---

### 2. 두 번째 챕터 제목

다음 챕터 내용...

---

### 에필로그

에필로그 내용...
```

### 문법 → 결과 매핑

| MD 문법 | 웹 결과 | 비고 |
|---------|---------|------|
| `---` (파일 상단) | frontmatter 메타데이터 | slug, type 필수 |
| `# 제목` | 에피소드 제목 | H1은 하나만 |
| `## 부제` | 무시됨 | subtitle은 frontmatter에서 |
| `### N. 챕터 제목` | 챕터 헤딩 (번호 + 제목) | 숫자+점 패턴 필수 |
| `### 에필로그` | 에필로그 마커 | "에필로그" 키워드로 인식 |
| `---` (본문 내) | 구분선 (점 세 개) | |
| `> 텍스트` | 후렴구 블록 (refrain) | 왼쪽 금색 선 + 강조 |
| `> ★★★★★` + `> 리뷰` | 리뷰 블록 (reviews-wrap) | ep3 전용 패턴 |
| `*전체 이탤릭*` | 이탤릭 문단 | 줄 전체가 `*...*`로 감싸짐 |
| `**볼드**` | 강조 텍스트 (밝은 크림색) | 문단 내 인라인 |
| 일반 텍스트 | 본문 문단 | 기본값 |

### frontmatter 필드

| 필드 | 필수 여부 | 설명 | 예시 |
|------|----------|------|------|
| `slug` | **필수** | URL 경로 + 파일명 | `ep9`, `bonus2` |
| `type` | **필수** | 콘텐츠 종류 | `episode`, `bonus`, `preface`, `afterword` |
| `num` | episode/bonus 필수 | 표시 번호 | `"09"`, `"번외2"` |
| `subtitle` | 선택 | 영문 부제 | `"The New Story"` |
| `description` | 선택 | 카드 설명 | `"한 줄 요약"` |

### type별 최소 frontmatter

```markdown
# episode/bonus
---
slug: ep9
type: episode
num: "09"
---

# preface
---
slug: preface
type: preface
---

# afterword
---
slug: afterword
type: afterword
---
```

---

## 구현 상세

### 파일 구조

```
scripts/
└── parse-md.ts          ← 파서 본체 (Node.js/TypeScript)

package.json scripts:
  "parse": "tsx scripts/parse-md.ts"       ← 수동 실행
  "prebuild": "tsx scripts/parse-md.ts"    ← build 전 자동 실행
```

### 파서 내부 함수

| 함수 | 역할 |
|------|------|
| `parseFrontmatter()` | `---`로 감싸진 메타데이터 추출 |
| `parseEpisodeBlocks()` | 본문을 Block[] 배열로 변환 (episode/bonus) |
| `collectReviews()` | ★ 패턴 리뷰를 reviews-wrap으로 묶기 (ep3 전용) |
| `parsePreface()` | 일러두기 → paragraphs[] + lastLine |
| `parseAfterword()` | 후기 → glitchText + footnote |
| `generateEpisodeTS()` | Block[] → TypeScript 파일 출력 |
| `generateContentsTS()` | 메타데이터 배열 → contents.ts 출력 |

### Block 타입 (8종)

| type | 용도 | 필드 |
|------|------|------|
| `paragraph` | 일반 문단 | `text` |
| `chapter` | 챕터 헤딩 | `num`, `title` |
| `divider` | 구분선 | — |
| `refrain` | 후렴구 (강조) | `text` |
| `italic` | 이탤릭 문단 | `text` |
| `epilogue` | 에필로그 마커 | — |
| `review` | 리뷰 항목 | `stars`, `reviewText`, `variant?` |
| `reviews-wrap` | 리뷰 묶음 | `children: Block[]` |

---

## 주의사항

- `npm run parse`는 npm 기본 명령어가 **아님** — 이 프로젝트 전용 커스텀 스크립트
- `contentDataSource/` 폴더의 파일은 **직접 수정 금지** — 항상 MD에서 재생성됨
- MD 파일명은 자유 (파서는 파일명이 아니라 frontmatter의 slug를 사용)
- 소설 텍스트 내용은 **절대 수정 금지** (한국어 원문 유지)
- frontmatter가 없는 MD 파일은 파서가 에러를 출력하고 건너뜀

---

## 향후 확장 가능성

- 새로운 Block 타입 추가 (이미지, 각주, 대화문 전용 블록 등)
- MD 파일 변경 감지 → 자동 parse (watch 모드)
- 파싱 결과 검증 테스트 (vitest)
- 여러 유니버스/시리즈 지원 (폴더 구분)
