import type { Block } from "@/features/reader/data"
import type { ReactNode } from "react"
import { SectionLabel } from "./SectionLabel"
import { useTheme } from "@/features/theme"

// 인라인 마크다운 서식 → React 렌더링
// ***볼드이탤릭***, **볼드**, *이탤릭* 순서로 처리 (greedy 방지)
function parseInlineText(text: string): ReactNode {
  // 서식이 없으면 그대로 반환 (성능)
  if (!text.includes('*')) return text

  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/)
  if (parts.length === 1) return text

  return parts.map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return <strong key={i} className="font-semibold italic text-g-text-bright">{part.slice(3, -3)}</strong>
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-g-text-bright">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic text-g-text-warm">{part.slice(1, -1)}</em>
    }
    return part
  })
}

// 구분선 (점 세 개) — 테마 dividerColor 적용
function Divider() {
  let color: string | undefined
  try { color = useTheme().decorations?.dividerColor } catch { /* ThemeProvider 밖에서도 동작 */ }

  return (
    <div className="flex items-center justify-center gap-4 my-14 opacity-30">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block size-1 rounded-full"
          style={{ backgroundColor: color || 'var(--g-accent)' }}
        />
      ))}
    </div>
  )
}

// 후렴구 (레프레인)
function Refrain({ text }: { text: string }) {
  return (
    <div className="italic text-g-accent2 border-l-2 border-g-accent pl-6 my-7 text-[1.05rem]">
      {parseInlineText(text)}
    </div>
  )
}

// 리뷰 블록 (ep3 전용)
function ReviewsWrap({ children }: { children?: Block[] }) {
  if (!children?.length) return null
  return (
    <div className="bg-g-bg2 border border-g-border rounded-lg p-5 md:p-8 my-8">
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
      className={`pt-5 ${isLast ? "pb-0" : "pb-5 border-b border-g-border"}`}
    >
      <div
        className={`text-[12px] tracking-normal-g mb-2 font-g-sans ${
          isProfessor ? "text-g-text-dim" : "text-g-accent2"
        }`}
      >
        {block.stars}
      </div>
      <div
        className={`text-sm leading-[1.7] font-g-sans ${
          isProfessor ? "text-g-text" : "text-g-text-muted"
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
        <section className="mt-14">
          <SectionLabel className="text-label text-g-text-dim mb-1">{block.num}</SectionLabel>
          <div className="text-[1.1rem] font-medium text-g-accent2 mb-7 italic">
            {block.title}
          </div>
        </section>
      )

    case "paragraph":
      return (
        <p className="mb-5 text-g-text">
          {parseInlineText(block.text ?? "")}
        </p>
      )

    case "italic":
      return (
        <p className="mb-5 italic text-g-text-warm">
          {parseInlineText(block.text ?? "")}
        </p>
      )

    case "refrain":
      return <Refrain text={block.text ?? ""} />

    case "divider":
      return <Divider />

    case "heading-2":
      return (
        <h2 className="text-lg font-medium text-g-text-muted italic mb-7 mt-14">
          {block.title}
        </h2>
      )

    case "separator":
      return <hr className="border-t border-g-border my-14" />

    case "bold":
      return (
        <p className="mb-5 font-semibold text-g-text-bright">
          {block.text}
        </p>
      )

    case "epilogue":
      return (
        <SectionLabel className="text-label text-g-text-dim mb-7 mt-14">에필로그</SectionLabel>
      )

    case "reviews-wrap":
      return <ReviewsWrap>{block.children}</ReviewsWrap>

    case "heading-1":
      // EpisodeViewer 헤더에서 제목을 이미 표시하므로 본문에서는 생략
      return null

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
