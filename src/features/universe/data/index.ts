export type ContentType = "episode" | "bonus" | "preface" | "afterword"

export interface ContentMeta {
  slug: string
  type: ContentType
  num?: string
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
  | "epilogue"
  | "review"
  | "reviews-wrap"

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

// contents와 episodeSlugs는 MD 파일에서 자동 생성됨
// npm run parse 실행 시 generated/contents.ts에 출력
export { generatedContents as contents, generatedEpisodeSlugs as episodeSlugs } from "./contentDataSource/contents"
