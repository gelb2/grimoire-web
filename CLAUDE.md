# CLAUDE.md — DeerDevil (사슴악마)

## 프로젝트 개요

"사슴악마" 단편소설 유니버스를 웹페이지 형태로 게시하는 프로젝트.
A24 감성의 K-다크 판타지 소설 시리즈를 읽기 좋은 웹 뷰어로 제공한다.

현재는 정적 콘텐츠 뷰어이나, 향후 Supabase/백엔드 도입 가능성 있음.

---

## 핵심 규칙

### 언어
- **코드**: 영어 (변수명, 함수명, 파일명)
- **주석/커밋/문서**: 한국어
- **소설 콘텐츠**: 한국어 원문 유지, 절대 수정 금지

### 아키텍처 — FSD (Feature-Sliced Design)
```
src/
├── app/           # Next.js App Router — 라우팅만
├── features/      # 도메인 로직 (현재: universe)
├── lib/           # 유틸리티 함수 (cn() 등)
├── shared/        # 공용 유틸, UI (향후)
└── components/    # shadcn/ui 컴포넌트 (향후)
```

### 패키지 매니저
- **npm** 사용 (yarn/pnpm 금지)

### 테스트 — 필수 규칙
- **모든 작업(기능 추가, 수정, 버그픽스, 원고 추가) 완료 시 아래 두 테스트 필수 통과**
- 테스트 미통과 상태로 커밋 금지

#### 유닛테스트 (Vitest)
- `npm test` — 파서, 데이터 무결성, UI 컴포넌트 검증
- `npm run test:watch` / `npm run test:coverage`
- 기능 구현과 유닛테스트는 항상 함께 작성

#### E2E 테스트 (Playwright)
- `npm run test:e2e` — 실제 브라우저에서 페이지 렌더링, 네비게이션, 404 처리 검증
- 새 에피소드 추가 시 해당 카드/뷰어 E2E 테스트도 추가

#### 전체 테스트 한 번에 실행
- `npm run test:all` — 유닛 + E2E 순차 실행

### Git 브랜치 정책

#### 브랜치 구조
```
main              ← 배포용 (직접 커밋 절대 금지)
develop           ← 통합 브랜치 (feature/bugfix 머지 대상)
├── feature/{name}   ← 기능 개발 브랜치
└── bugfix/{name}    ← 버그 수정 브랜치
```

#### 머지 흐름 (단방향)
```
feature/* ──→ develop ──→ main
bugfix/*  ──↗              ↓
                        tag: v{version}
```

#### 절대 금지 사항
- ❌ main에 직접 커밋/푸시
- ❌ main에서 feature/bugfix 브랜치 생성 (반드시 develop에서 분기)
- ❌ 역방향 머지 (main → develop)
- ❌ main/develop 브랜치 삭제

#### Claude 작업 규칙
1. 작업 시 `develop`에서 `feature/{name}` 또는 `bugfix/{name}` 브랜치 생성
2. 작업 완료 후 `develop`에 `--no-ff` 머지:
   ```bash
   git checkout develop
   git merge feature/{name} --no-ff
   git push origin develop
   ```
3. 머지 후 feature/bugfix 브랜치 삭제
4. develop → main 머지는 사용자가 직접 수행 (Claude는 요청 시에만)
5. 릴리즈 태그: `v{major}.{minor}.{patch}` (semver)

#### 커밋 메시지 컨벤션
- 형식: `{type}: {한국어 메시지}`
- 타입: `feat`, `fix`, `test`, `chore`, `docs`, `refactor`, `merge`
- 머지 커밋: `merge: feature/{name} → develop ({설명})`

---

## 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 16.1.6 |
| 언어 | TypeScript | 5.x |
| UI 프레임워크 | React | 19.x |
| 스타일 | Tailwind CSS 4 + @theme 디자인 토큰 + CSS Variables | 4.x |
| UI 라이브러리 | shadcn/ui (준비됨, 향후 도입) | - |
| 테스트 | Vitest + v8 coverage | 4.x |
| 린트 | ESLint 9 + next config | 9.x |
| 배포 | Vercel (예정) | - |

---

## 디렉토리 구조

```
DeerDevil/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # 루트 레이아웃 (html/body, globals.css)
│   │   ├── page.tsx               # 루트 페이지 → /universe 리다이렉트
│   │   ├── globals.css            # Tailwind 초기화 + 전역 스타일
│   │   └── universe/              # 소설 뷰어 라우트
│   │       ├── layout.tsx         # Universe 전용 레이아웃 (serif 폰트)
│   │       ├── page.tsx           # 랜딩 (에피소드 목록)
│   │       ├── [slug]/page.tsx    # 에피소드 동적 페이지
│   │       ├── preface/page.tsx   # 일러두기
│   │       └── afterword/page.tsx # 후기
│   ├── lib/
│   │   └── utils.ts              # cn() 유틸 (clsx + tailwind-merge)
│   └── features/universe/
│       ├── data/                  # 콘텐츠 데이터 (타입, 에피소드 본문)
│       │   ├── index.ts           # ContentMeta, Block 타입 + contents 배열
│       │   ├── episodes/          # ep1~ep8, bonus1 데이터
│       │   └── special/           # preface, afterword 데이터
│       └── ui/                    # UI 컴포넌트
│           ├── UniverseLanding.tsx # 에피소드 그리드 랜딩
│           ├── UniverseNav.tsx     # 상단 네비게이션 (client)
│           ├── EpisodeViewer.tsx   # 에피소드 읽기 뷰어
│           ├── ChapterBlock.tsx    # 블록 렌더러 (paragraph, chapter, divider 등)
│           ├── EpisodeCard.tsx     # 에피소드 카드 컴포넌트
│           ├── SpecialCard.tsx     # 특수 페이지 카드 (preface/afterword)
│           ├── PrefaceViewer.tsx   # 일러두기 뷰어
│           ├── AfterwrdViewer.tsx  # 후기 뷰어 (깨진 문자 효과)
│           └── AntlerSVG.tsx      # 사슴뿔 SVG 아이콘
├── scripts/
│   └── parse-md.ts               # MD → TS 자동 파서
├── DeerDevil_MDfiles/             # 원본 소설 마크다운 (parse 입력)
├── CLAUDE.md                      # 이 파일
├── MD_PARSER.md                   # MD 자동 파싱 시스템 상세 가이드
├── DESIGN.md                      # UI 디자인 시스템
├── SCREENS.md                     # 화면/컴포넌트 카탈로그
├── TODO.md                        # 작업 추적
├── CHANGELOG.md                   # 변경 이력
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json                # shadcn/ui 설정
└── .env.example                   # 환경변수 템플릿
```

---

## 콘텐츠 구조

### 에피소드 목록
| Slug | 타입 | 제목 |
|------|------|------|
| ep1 | episode | 선녀와 나무꾼: 숲속의 목격자 |
| ep2 | episode | 여우누이전 |
| ep3 | episode | 판교의 사승우 CTO |
| ep4 | episode | 금도끼 은도끼: 정직함의 무게 |
| ep5 | episode | 개구리 왕자 |
| ep6 | episode | 우렁각시: 세 번째 겨울 |
| ep7 | episode | 바리데기 |
| ep8 | episode | 손톱 먹은 쥐 |
| ep9 | episode | 도리안 그레이의 초상 |
| ep10 | episode | 장화홍련전: 예쁘게 민원 넣기 |
| ep11 | episode | 이름 없는 괴물 |
| ep12 | episode | 베를린 천사의 시 |
| bonus1 | bonus | 브란덴부르크 문 앞에서 |
| preface | preface | 일러두기 |
| afterword | afterword | 후기 |

### 데이터 모델
- `ContentMeta`: 에피소드 메타 (slug, type, title, subtitle, description)
- `Block`: 본문 블록 (paragraph, chapter, divider, refrain, italic, epilogue, review, reviews-wrap)
- `EpisodeData`: { slug, title, subtitle?, blocks[] }

---

## 공통 명령어

```bash
npm install          # 의존성 설치
npm run parse        # MD → TS 자동 파싱 (contentDataSource/ 출력)
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드 (prebuild에서 parse 자동 실행)
npm run lint         # ESLint 검사
npm test             # 테스트 실행
npm run test:coverage # 커버리지 리포트
```

### MD 자동 파싱 시스템

이 프로젝트의 핵심 시스템. 상세 내용은 **[MD_PARSER.md](MD_PARSER.md)** 참조.

```
DeerDevil_MDfiles/*.md → npm run parse → contentDataSource/*.ts → 웹 페이지
```

- `npm run parse`: MD → TS 자동 변환 (이 프로젝트 전용 커스텀 명령어)
- `npm run build` 시 prebuild 훅으로 자동 실행됨
- contentDataSource/ 폴더의 파일은 직접 수정 금지 — 항상 MD에서 재생성

---

## 문서 연동 규칙

| 변경 내용 | 업데이트 대상 |
|-----------|--------------|
| UI/스타일 변경 | DESIGN.md |
| 새 화면/컴포넌트 추가 | SCREENS.md |
| 파서/블록 타입/MD 규칙 변경 | MD_PARSER.md |
| 작업 완료/추가 | TODO.md |
| 버그/해결 방법 발견 | TROUBLESHOOTING.md |
| 모든 의미 있는 변경 | CHANGELOG.md |

---

## 향후 확장 계획

- Supabase 도입 (사용자 인증, 댓글, 조회수 등)
- 정식 백엔드 구축 가능성
- 배포: Vercel
