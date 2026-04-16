// 에피소드 미리보기용 더미 데이터
import type { ContentMeta, EpisodeData, Block } from "@/features/reader/data"

export const DUMMY_META: ContentMeta = { slug: "preview", type: "episode", num: "001", title: "미리보기 에피소드", subtitle: "소제목 — 이탤릭 스타일 확인용", description: "테마 에디터 미리보기" }

export const DUMMY_BLOCKS: Block[] = [
  { type: "paragraph", text: "첫 번째 문단입니다. 타이핑 애니메이션과 본문 폰트, 행간, 자간이 이 영역에서 확인됩니다. 충분히 긴 텍스트를 넣어야 콘텐츠 폭과 본문 크기를 비교할 수 있습니다." },
  { type: "paragraph", text: "두 번째 문단. 섹션 간격(sectionSpacing)이 문단 사이의 여백을 결정합니다." },
  { type: "italic", text: "이것은 이탤릭 블록입니다. 강조 스타일로 렌더링됩니다." },
  { type: "divider" },
  { type: "heading-2", text: "소제목 확인" },
  { type: "paragraph", text: "구분선과 소제목 이후의 문단입니다. 디바이더 아이콘과 색상이 위에 표시됩니다." },
  { type: "refrain", text: "이것은 레프레인(반복구) 블록입니다. border-left accent 스타일로 렌더링됩니다." },
  { type: "paragraph", text: "**볼드 텍스트**와 *이탤릭 텍스트*가 인라인으로 포함된 문단입니다." },
  { type: "italic", text: "이탤릭 강조 텍스트입니다." },
  { type: "paragraph", text: "마지막 문단. 에피소드 라벨 포맷과 소제목 스타일은 상단 헤더 영역에서 확인할 수 있습니다." },
]

export const DUMMY_EPISODE: EpisodeData = { slug: "preview", title: "미리보기 에피소드", blocks: DUMMY_BLOCKS }
