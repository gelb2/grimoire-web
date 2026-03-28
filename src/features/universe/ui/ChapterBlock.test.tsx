// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChapterBlock } from "./ChapterBlock"
import type { Block } from "@/features/universe/data"

describe("ChapterBlock", () => {
  it("빈 블록 배열을 렌더한다", () => {
    const { container } = render(<ChapterBlock blocks={[]} />)
    expect(container.innerHTML).toBe("")
  })

  it("paragraph 블록을 렌더한다", () => {
    const blocks: Block[] = [{ type: "paragraph", text: "테스트 문단" }]
    render(<ChapterBlock blocks={blocks} />)
    expect(screen.getByText("테스트 문단")).toBeInTheDocument()
  })

  it("paragraph 내 **볼드** 마크다운을 strong으로 변환한다", () => {
    const blocks: Block[] = [{ type: "paragraph", text: "일반 **굵은글** 텍스트" }]
    render(<ChapterBlock blocks={blocks} />)
    const strong = screen.getByText("굵은글")
    expect(strong.tagName).toBe("STRONG")
  })

  it("chapter 블록에 번호와 제목을 렌더한다", () => {
    const blocks: Block[] = [{ type: "chapter", num: "1", title: "을지로" }]
    render(<ChapterBlock blocks={blocks} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("을지로")).toBeInTheDocument()
  })

  it("divider 블록에 3개의 점을 렌더한다", () => {
    const blocks: Block[] = [{ type: "divider" }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    const dots = container.querySelectorAll(".rounded-full")
    expect(dots).toHaveLength(3)
  })

  it("refrain 블록을 이탤릭 인용으로 렌더한다", () => {
    const blocks: Block[] = [{ type: "refrain", text: "인용구" }]
    render(<ChapterBlock blocks={blocks} />)
    const el = screen.getByText("인용구")
    expect(el.closest(".italic")).toBeTruthy()
  })

  it("italic 블록을 이탤릭으로 렌더한다", () => {
    const blocks: Block[] = [{ type: "italic", text: "이탤릭 텍스트" }]
    render(<ChapterBlock blocks={blocks} />)
    const el = screen.getByText("이탤릭 텍스트")
    expect(el.closest(".italic")).toBeTruthy()
  })

  it("epilogue 블록에 '에필로그' 라벨을 렌더한다", () => {
    const blocks: Block[] = [{ type: "epilogue" }]
    render(<ChapterBlock blocks={blocks} />)
    expect(screen.getByText("에필로그")).toBeInTheDocument()
  })

  it("reviews-wrap에 children이 없으면 아무것도 렌더하지 않는다", () => {
    const blocks: Block[] = [{ type: "reviews-wrap", children: [] }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    expect(container.innerHTML).toBe("")
  })

  it("reviews-wrap에 리뷰를 렌더한다", () => {
    const blocks: Block[] = [
      {
        type: "reviews-wrap",
        children: [
          { type: "review", stars: "★★★★★", reviewText: "훌륭한 작품" },
          { type: "review", stars: "★☆☆☆☆", reviewText: "별로", variant: "professor" },
        ],
      },
    ]
    render(<ChapterBlock blocks={blocks} />)
    expect(screen.getByText("★★★★★")).toBeInTheDocument()
    expect(screen.getByText("훌륭한 작품")).toBeInTheDocument()
    expect(screen.getByText("★☆☆☆☆")).toBeInTheDocument()
    expect(screen.getByText("별로")).toBeInTheDocument()
  })

  it("text가 undefined인 paragraph도 에러 없이 렌더한다", () => {
    const blocks: Block[] = [{ type: "paragraph" }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    expect(container.querySelector("p")).toBeInTheDocument()
  })

  it("알 수 없는 블록 타입은 null을 반환한다", () => {
    const blocks = [{ type: "unknown" as any }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    expect(container.innerHTML).toBe("")
  })

  it("여러 블록 타입이 섞인 배열을 올바르게 렌더한다", () => {
    const blocks: Block[] = [
      { type: "chapter", num: "1", title: "시작" },
      { type: "paragraph", text: "첫 문단" },
      { type: "divider" },
      { type: "refrain", text: "인용" },
      { type: "italic", text: "기울임" },
      { type: "epilogue" },
      { type: "paragraph", text: "마지막" },
    ]
    render(<ChapterBlock blocks={blocks} />)
    expect(screen.getByText("시작")).toBeInTheDocument()
    expect(screen.getByText("첫 문단")).toBeInTheDocument()
    expect(screen.getByText("인용")).toBeInTheDocument()
    expect(screen.getByText("기울임")).toBeInTheDocument()
    expect(screen.getAllByText("에필로그").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("마지막")).toBeInTheDocument()
  })

  it("**볼드**가 여러 개 포함된 텍스트를 처리한다", () => {
    const blocks: Block[] = [
      { type: "paragraph", text: "**첫번째** 중간 **두번째**" },
    ]
    render(<ChapterBlock blocks={blocks} />)
    expect(screen.getByText("첫번째").tagName).toBe("STRONG")
    expect(screen.getByText("두번째").tagName).toBe("STRONG")
    expect(screen.getByText("중간")).toBeInTheDocument()
  })

  it("heading-1 블록은 렌더링하지 않는다 (헤더 중복 방지)", () => {
    const blocks: Block[] = [{ type: "heading-1", title: "메인 제목" }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    expect(container.innerHTML).toBe("")
  })

  it("heading-2 블록을 h2로 렌더링한다", () => {
    const blocks: Block[] = [{ type: "heading-2", title: "부제목 텍스트" }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    const h2 = container.querySelector("h2")
    expect(h2).toBeInTheDocument()
    expect(h2?.textContent).toBe("부제목 텍스트")
  })

  it("separator 블록을 hr로 렌더링한다", () => {
    const blocks: Block[] = [{ type: "separator" }]
    const { container } = render(<ChapterBlock blocks={blocks} />)
    expect(container.querySelector("hr")).toBeInTheDocument()
  })

  it("bold 블록을 굵은 텍스트로 렌더링한다", () => {
    const blocks: Block[] = [{ type: "bold", text: "강조 문단" }]
    render(<ChapterBlock blocks={blocks} />)
    const el = screen.getByText("강조 문단")
    expect(el).toBeInTheDocument()
    expect(el.classList.contains("font-semibold")).toBe(true)
  })
})
