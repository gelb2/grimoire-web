# DESIGN_REFERENCE_READYMAG.md — 레디맥 리서치 결과

> 리서치 일자: 2026-03-29
> 소스: https://readymag.com/examples, https://readymag.com/templates
> 목적: 그리모어 디자인 방향 수립 (플랫폼 디자인 + 작가 테마 시스템)

---

## 1. 리서치 요약

레디맥(Readymag)으로 만들어진 사이트들을 Editorials, Portfolios, Templates 카테고리로 나눠 분석했다.
그리모어에 적용할 수 있는 패턴을 **플랫폼 디자인**과 **작가 공간 테마**로 구분하여 정리한다.

---

## 2. 발견된 핵심 디자인 패턴

### 2-1. 타이포그래피 주도 (Typography-First)

모든 레디맥 수상작/에디토리얼에서 공통적으로 발견된 가장 강력한 패턴.

| 요소 | 설명 | 그리모어 적용 가능성 |
|------|------|-------------------|
| 초대형 타이틀 | 작가명/작품명이 화면의 50~80% 차지 | **현재 테마로 가능** — font-size 파라미터 추가 |
| 넘버링 | 01, 02, 03... 챕터/에피소드 넘버링 | **현재 구조로 가능** — 에피소드 순번 활용 |
| 세리프/이탤릭 | 문학적 권위 부여 | **현재 테마로 가능** — fontBody 옵션 확장 |
| 레터스페이싱 | 제목 텍스트 자간 넓히기 (TRACKING) | **파라미터 추가 필요** — letterSpacing |

**참고 사이트:**
- UNLEARNED (https://readymag.com/readymag/unlearned/) — 넘버링 + 대형 타이포
- AHYEON RYU (https://ahyeonryu.com/) — 풀스크린 작가명
- Frame 템플릿 — 넘버링된 작품 목록, 세리프 이탤릭

### 2-2. 레이어링/오버랩 (Layering)

텍스트 위에 이미지, 이미지 위에 텍스트를 겹쳐 깊이감을 만드는 패턴.

| 요소 | 설명 | 그리모어 적용 가능성 |
|------|------|-------------------|
| 텍스트-이미지 오버랩 | 제목 뒤에 작가 사진/일러스트 | **커버 이미지 기능과 연계 가능** |
| 블러/글로우 배경 | 추상적 그라데이션 배경 | **CSS backdrop-filter로 구현 가능** |
| z-index 플레이 | 요소 간 겹침 순서 변경 | **테마 파라미터로는 어려움** — Phase 2+ |

### 2-3. 여백과 호흡 (Whitespace)

콘텐츠보다 빈 공간이 더 많은 디자인. "숨 쉬는" 느낌.

| 요소 | 설명 | 그리모어 적용 가능성 |
|------|------|-------------------|
| 넓은 마진 | 본문 좌우 20~30% 여백 | **현재 가능** — max-width 조정 |
| 섹션 간 간격 | 큰 수직 간격 (200px+) | **파라미터 추가 검토** — sectionGap |
| 미니멀 내비 | 요소 최소화, 텍스트만 | **현재 가능** — 작가 공간 네비 단순화 |

### 2-4. 다크 모드 우선 (Dark-First)

대부분의 수상작이 다크 배경을 기본으로 사용.

| 요소 | 설명 | 그리모어 적용 가능성 |
|------|------|-------------------|
| 검정 배경 + 흰 텍스트 | 기본 조합 | **현재 기본값** — 이미 구현 |
| 다크 그라데이션 | 단색이 아닌 미묘한 그라데이션 | **파라미터 추가 필요** — bgGradient |
| 악센트 컬러 팝 | 다크 위에 빨강/앰버/네온 | **현재 가능** — accent 파라미터 |

### 2-5. 콘텐츠 구조 패턴

| 패턴 | 설명 | 적용 대상 |
|------|------|----------|
| 사이드바 목차 고정 | 좌측에 챕터 목록, 스크롤과 무관 | 에피소드 읽기 영역 |
| 3컬럼 레이아웃 | 목차 - 본문 - 메타 정보 | 에피소드 읽기 영역 |
| 작품 목록 = 타이포 갤러리 | 그리드가 아닌 텍스트 나열 | 작가 공간 |
| 풀스크린 히어로 | 진입 시 이름/작품명 풀스크린 | 작가 공간 랜딩 |

---

## 3. 그리모어 적용 계획

### 3-1. 플랫폼 디자인 (neutral-* 스코프)

**현재 상태:** 다크 네이비(#0d0f1a) 배경, 앰버 악센트, 카드 그리드 레이아웃.

**개선 방향:**

| 영역 | 현재 | 개선안 | 레퍼런스 |
|------|------|--------|---------|
| 메인 페이지 히어로 | 없음 (바로 검색 + 작품 목록) | 브랜드 타이포 히어로 ("Grimoire" 풀스크린) | WOTY 2024 랜딩 |
| 탐색 페이지 | 카드 그리드 | 유지 (플랫폼은 기능성 우선) | — |
| 로그인 페이지 | 단순 폼 | 좌측 브랜드 비주얼 + 우측 폼 (스플릿) | — |
| 전체 톤 | 기능적 다크 | 약간의 그라데이션 추가로 깊이감 | AHYEON RYU 글로우 |

### 3-2. 작가 공간 테마 (--g-* 스코프)

**현재 테마 파라미터 (9색상 + 폰트 + 애니메이션):**

```
bgPrimary, bgSecondary, textPrimary, textBright, textMuted, textDim,
accent, accent2, border, fontBody, animation, tone
```

**추가 검토 파라미터 (레디맥 리서치 기반):**

| 파라미터 | 용도 | 우선순위 | 현재 CSS Variables 매핑 |
|---------|------|---------|---------------------|
| `titleSize` | 작가명/작품 제목 크기 (sm/md/lg/xl) | 높음 | 신규 --g-title-size |
| `titleWeight` | 제목 두께 (light/normal/bold/black) | 높음 | 신규 --g-title-weight |
| `letterSpacing` | 자간 (tight/normal/wide/ultra-wide) | 중간 | 신규 --g-letter-spacing |
| `lineHeight` | 본문 행간 (compact/normal/relaxed/loose) | 중간 | 신규 --g-line-height |
| `layoutStyle` | 레이아웃 프리셋 (classic/magazine/minimal) | 높음 | 신규 — CSS class 전환 |
| `bgGradient` | 배경 그라데이션 방향/강도 | 낮음 | 신규 --g-bg-gradient |
| `heroStyle` | 작가 랜딩 히어로 스타일 (fullname/cover/minimal) | 높음 | 신규 — 컴포넌트 분기 |

### 3-3. 에피소드 읽기 영역

**현재:** 중앙 단일 컬럼, 고정폭, 블록 단위 렌더링.

**개선 방향 (레디맥 UNLEARNED 참고):**

| 요소 | 현재 | 개선안 |
|------|------|--------|
| 본문 폭 | max-w-2xl (672px) | 테마별 조절 가능 (narrow/normal/wide) |
| 챕터 네비 | 없음 | 좌측 사이드바 목차 (선택적) |
| 제목 영역 | 단순 h1 + 작가명 | 풀스크린 히어로 타이틀 (선택적) |
| 인용문 | 기본 blockquote | 이탤릭 + accent2 색상 강조 (현재 구현) |

---

## 4. 테마 시스템 확장 제안

### Phase 1 (즉시 가능 — 파라미터 추가만)

기존 테마 JSON에 필드를 추가하고, CSS Variables로 매핑한다.
**아키텍처 변경 없음** — ThemeProvider에 변수 몇 개 추가.

```typescript
interface AuthorTheme {
  // 기존 (유지)
  bgPrimary: string
  bgSecondary: string
  textPrimary: string
  // ...기존 9색 + fontBody + animation + tone

  // 신규 (Phase 1 추가)
  titleSize?: 'sm' | 'md' | 'lg' | 'xl'      // 기본값: 'lg'
  titleWeight?: 'light' | 'normal' | 'bold' | 'black'  // 기본값: 'bold'
  letterSpacing?: 'tight' | 'normal' | 'wide'  // 기본값: 'normal'
  lineHeight?: 'compact' | 'normal' | 'relaxed'  // 기본값: 'relaxed'
  contentWidth?: 'narrow' | 'normal' | 'wide'  // 기본값: 'normal'
}
```

### Phase 2 (레이아웃 프리셋)

작가 공간의 전체 레이아웃을 바꾸는 프리셋 시스템.

```typescript
interface AuthorTheme {
  // Phase 2 추가
  layoutPreset?: 'classic' | 'magazine' | 'gallery' | 'minimal'
  heroStyle?: 'fullname' | 'cover' | 'minimal' | 'none'
  navStyle?: 'sidebar' | 'top' | 'hidden'
}
```

이 프리셋은 CSS class 전환이 아니라 **컴포넌트 분기**로 구현한다.
작가가 프리셋을 선택하면 SeriesLanding, EpisodeViewer 등의 레이아웃 컴포넌트가 교체된다.

---

## 5. AI 테마 생성 프롬프트 확장

현재 Claude AI가 테마를 생성할 때 색상 + 폰트 + 애니메이션만 생성한다.
Phase 1 파라미터가 추가되면 프롬프트도 확장해야 한다.

```
작가 설명: "어두운 고딕 분위기, 무거운 텍스트, 넓은 자간"
→ AI 생성: { ...기존 색상, titleSize: 'xl', titleWeight: 'black', letterSpacing: 'wide' }
```

---

## 6. 자동 디자인 수집 파이프라인 (구상)

### 6-1. 배경

현재 테마 프리셋(midnight, gallery, magazine 등)은 수동으로 레디맥 사이트를 탐색하여 디자인을 참고한 결과물이다.
이 과정을 자동화/반자동화하여, 주기적으로 새로운 디자인 레퍼런스를 수집하고 테마로 변환할 수 있는지 검토한다.

### 6-2. 현재 프로세스 (수동)

1. Claude 맥 앱에서 크롬 브라우저를 제어 (MCP + computer-use)
2. readymag.com/examples, awwwards.com 등 디자인 갤러리 페이지 순회
3. 스크린샷 촬영 + 페이지 텍스트 추출
4. 디자인 패턴 분석 (색상 팔레트, 타이포그래피, 레이아웃 구조)
5. 분석 결과를 테마 파라미터(AuthorTheme)로 변환
6. DB에 테마 프리셋으로 저장

### 6-3. 자동화 파이프라인 구상

```
[배치 스케줄러 (서버)]
    │
    ├── 1. 크롤링: 디자인 갤러리 사이트 순회
    │       - readymag.com/examples (에디토리얼, 포트폴리오)
    │       - awwwards.com (SOTD, 컬렉션)
    │       - 기타 디자인 레퍼런스 소스
    │
    ├── 2. 스크린샷 + 분석
    │       - Puppeteer/Playwright로 페이지 스크린샷
    │       - Claude Vision API로 디자인 패턴 추출
    │       - 색상 팔레트, 폰트, 레이아웃 구조 식별
    │
    ├── 3. 테마 변환
    │       - Claude API로 AuthorTheme JSON 생성
    │       - 작가공간 적합성 판단 (소설 읽기에 적합한가?)
    │       - 에피소드 공간 적합성 판단 (장시간 읽기에 피로하지 않은가?)
    │
    └── 4. 저장 + 리뷰
            - DB에 draft 상태로 저장
            - 관리자가 리뷰 후 published 상태로 전환
            - 작가가 테마 에디터에서 선택 가능
```

### 6-4. 기술적 가능성

| 단계 | 가능 여부 | 비고 |
|------|----------|------|
| 크롤링 | O | Puppeteer/Playwright 서버사이드 실행 |
| 스크린샷 | O | headless 브라우저 |
| 디자인 분석 | O | Claude Vision API (이미지 → 텍스트 분석) |
| 테마 변환 | O | 기존 generate-theme UseCase와 동일 로직 |
| 배치 스케줄 | O | NestJS @Cron 또는 Azure Functions Timer |
| 작가/에피소드 공간 구분 | △ | 프롬프트 엔지니어링으로 분류 가능하나 정확도 검증 필요 |

### 6-5. 주의사항

- 크롤링 대상 사이트의 robots.txt 및 이용약관 준수 필수
- 디자인 "참고"와 "복제"의 경계 — 색상/레이아웃 패턴만 추출, 저작물 복사 금지
- 생성된 테마는 반드시 관리자 리뷰 후 공개 (자동 공개 금지)
- 크레딧 소비 정책: 자동 생성 테마는 무료 프리셋으로 제공할지, 크레딧 소비 대상인지 결정 필요

---

## 7. 참조 문서

- `PROPOSAL_DIGITAL_SHOWROOM.md` — 디지털 쇼룸 기획 제안 (이 리서치의 상위 문서)
- `grimoire-web/DESIGN.md` — UI 디자인 시스템 (이 리서치 결과 반영 대상)
- `docs/theme-spec.md` — 테마 파라미터 명세 (Phase 1 파라미터 추가 시 업데이트)
- `PLANNING_GRIMOIRE.md` — 최상위 기획서
