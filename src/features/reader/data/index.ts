export type ContentType = "episode" | "bonus" | "preface" | "afterword"

export interface ContentMeta {
  slug: string
  type: ContentType
  /** 표시용 번호 (로컬 데이터) */
  num?: string
  /** 서버 API orderNum → num 매핑용 */
  orderNum?: number
  title: string
  subtitle?: string
  description?: string
}

export type BlockType =
  | "paragraph"
  | "chapter"
  | "divider"
  | "refrain"
  | "italic"
  | "bold"
  | "epilogue"
  | "review"
  | "reviews-wrap"
  | "heading-1"
  | "heading-2"
  | "separator"

export interface Block {
  type: BlockType
  num?: string
  title?: string
  text?: string
  stars?: string
  reviewText?: string
  comment?: string
  variant?: "professor"
  children?: Block[]
}

export interface EpisodeData {
  slug: string
  title: string
  subtitle?: string
  blocks: Block[]
}

// 로컬 콘텐츠 데이터는 제거됨 — 모든 작가(사슴악마 포함)가 서버 API에서 데이터를 로드
