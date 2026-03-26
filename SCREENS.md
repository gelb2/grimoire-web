# SCREENS.md — 화면/컴포넌트 카탈로그

## 라우트 구조

| 경로 | 파일 | 설명 |
|------|------|------|
| `/` | `app/page.tsx` | 루트 → `/universe`로 리다이렉트 |
| `/universe` | `app/universe/page.tsx` | 에피소드 목록 랜딩 |
| `/universe/[slug]` | `app/universe/[slug]/page.tsx` | 에피소드 읽기 (ep1~ep8, bonus1) |
| `/universe/preface` | `app/universe/preface/page.tsx` | 일러두기 |
| `/universe/afterword` | `app/universe/afterword/page.tsx` | 후기 |

### 레이아웃
- `app/layout.tsx` — 루트 레이아웃 (html/body, globals.css import, 메타데이터)
- `app/universe/layout.tsx` — Universe 전용 레이아웃 (serif 폰트, 다크 배경, 네비게이션)

---

## UI 컴포넌트 (`features/universe/ui/`)

### UniverseLanding.tsx
- 에피소드 카드 그리드 + 번외 섹션 + 특수 페이지 섹션
- 헤더: 타이틀 + AntlerSVG + 부제
- 의존: `EpisodeCard`, `SpecialCard`, `AntlerSVG`, `contents`

### UniverseNav.tsx (client component)
- Sticky 상단 네비게이션
- 브랜드 버튼 + 에피소드 탭 + 일러두기/후기 탭
- 현재 페이지 하이라이트
- 의존: `usePathname`, `useRouter`, `contents`

### EpisodeViewer.tsx
- 에피소드 본문 읽기 뷰어
- 히어로 헤더 + 본문 블록 + 클로즈 라인 + 뒤로가기
- 의존: `ChapterBlock`, `AntlerSVG`, `ContentMeta`, `EpisodeData`

### ChapterBlock.tsx
- 블록 배열 렌더러 (paragraph, chapter, divider, refrain, italic, epilogue, reviews-wrap)
- 내부 서브 컴포넌트: `Divider`, `Refrain`, `ReviewsWrap`, `ReviewItem`, `SingleBlock`
- 의존: `Block` 타입

### EpisodeCard.tsx
- 에피소드 목록 카드
- accent 라인 + 번호 + 제목 + 부제 + 설명 + CTA + AntlerSVG 워터마크
- hover: translateY(-2px) + accent 테두리
- 의존: `AntlerSVG`, `ContentMeta`

### SpecialCard.tsx
- 일러두기/후기 카드
- 후기: 깨진 문자 배경 효과
- 의존: `ContentMeta`

### PrefaceViewer.tsx
- 일러두기 본문 뷰어
- 단락 목록 + 구분선 + 마지막 이탤릭 줄
- Props: `paragraphs: string[]`, `lastLine: string`

### AfterwrdViewer.tsx
- 후기 뷰어 (글리치 효과)
- 깨진 문자 덩어리 (mono, opacity 0.4) + 각주
- Props: `glitchText: string`, `footnote: string`

### AntlerSVG.tsx
- 사슴뿔 SVG 아이콘
- Props: `size?: number`, `opacity?: number`
