# Design Tokens — ProjectGrimoire

> 정본: grimoire-web → grimoire-server에 동기화
> Phase 1 구현 시 상세화 예정

## 기본 토큰 (DeerDevil 기반)

### 타이포그래피

| 토큰 | 값 | 용도 |
|------|-----|------|
| font-body-serif | Noto Serif KR, Georgia, serif | 본문 (세리프) |
| font-body-sans | Inter, system-ui, sans-serif | 본문 (산세리프) |
| font-body-mono | JetBrains Mono, monospace | 본문 (모노) |
| font-heading | 본문과 동일 또는 별도 설정 | 제목 |
| font-size-compact | 0.9rem | 콤팩트 모드 |
| font-size-normal | 1rem | 기본 |
| font-size-large | 1.1rem | 큰 글씨 |

### 간격

| 토큰 | 값 | 용도 |
|------|-----|------|
| spacing-paragraph | 1.6em | 문단 간격 |
| spacing-chapter | 3rem | 챕터 간격 |
| max-width-reader | 680px | 읽기 영역 최대 폭 |
| max-width-landing | 800px | 랜딩 최대 폭 |

### 색상

테마별로 달라지므로 `theme-spec.md`의 프리셋 참조.
