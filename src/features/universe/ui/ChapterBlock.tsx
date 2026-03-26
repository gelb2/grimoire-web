import type { Block } from "@/features/universe/data"
import type { ReactNode } from "react"
import { SectionLabel } from "./SectionLabel"

// **볼드** 마크다운을 <strong>으로 변환
function parseInlineText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  if (parts.length === 1) return text
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-u-text-bright">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// 구분선 (점 세 개)
function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 my-u-section opacity-30">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-1 rounded-full bg-u-accent"
        />
      ))}
    </div>
  )
}

// 후렴구 (레프레인)
function Refrain({ text }: { text: string }) {
  return (
    <div className="italic text-u-accent2 border-l-2 border-u-accent pl-6 my-u-block text-[1.05rem]">
      {parseInlineText(text)}
    </div>
  )
}

// 리뷰 블록 (ep3 전용)
function ReviewsWrap({ children }: { children?: Block[] }) {
  if (!children?.length) return null
  return (
    <div className="bg-u-bg2 border border-u-border rounded-u-card p-5 md:p-8 my-8">
      {children.map((review, idx) => (
        <ReviewItem key={idx} block={review} isLast={idx === children.length - 1} />
      ))}
    </div>
  )
}

function ReviewItem({
  block,
  isLast,
}: {
  block: Block
  isLast: boolean
}) {
  const isProfessor = block.variant === "professor"
  return (
    <div
      className={`pt-5 ${isLast ? "pb-0" : "pb-5 border-b border-u-border"}`}
    >
      <div
        className={`text-[12px] tracking-u-normal mb-2 font-u-sans ${
          isProfessor ? "text-u-text-dim" : "text-u-accent2"
        }`}
      >
        {block.stars}
      </div>
      <div
        className={`text-sm leading-[1.7] font-u-sans ${
          isProfessor ? "text-u-text" : "text-u-text-muted"
        }`}
      >
        {block.reviewText}
      </div>
    </div>
  )
}

// 단일 블록 렌더
function SingleBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "chapter":
      return (
        <section className="mt-u-section">
          <SectionLabel className="text-u-label text-u-text-dim mb-1">{block.num}</SectionLabel>
          <div className="text-[1.1rem] font-medium text-u-accent2 mb-u-block italic">
            {block.title}
          </div>
        </section>
      )

    case "paragraph":
      return (
        <p className="mb-u-paragraph text-u-text">
          {parseInlineText(block.text ?? "")}
        </p>
      )

    case "italic":
      return (
        <p className="mb-u-paragraph italic text-u-text-muted">
          {parseInlineText(block.text ?? "")}
        </p>
      )

    case "refrain":
      return <Refrain text={block.text ?? ""} />

    case "divider":
      return <Divider />

    case "epilogue":
      return (
        <SectionLabel className="text-u-label text-u-text-dim mb-u-block mt-u-section">에필로그</SectionLabel>
      )

    case "reviews-wrap":
      return <ReviewsWrap children={block.children} />

    default:
      return null
  }
}

// 블록 배열 렌더러 (EpisodeViewer에서 사용)
export function ChapterBlock({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, idx) => (
        <SingleBlock key={idx} block={block} />
      ))}
    </>
  )
}
