// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SeriesLanding } from "./SeriesLanding"
import type { ContentMeta } from "@/features/reader/data"

vi.mock("next/navigation", () => ({
  usePathname: () => "/test-author",
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// CardTransition mock
vi.mock("./CardTransition", () => ({
  useCardTransition: () => ({ navigate: vi.fn() }),
}))

const mockContents: ContentMeta[] = [
  { slug: "preface", type: "preface", title: "일러두기", description: "서문입니다" },
  { slug: "ep1", type: "episode", num: "01", title: "첫 화", description: "설명1" },
  { slug: "ep2", type: "episode", num: "02", title: "둘째 화", description: "설명2" },
  { slug: "ep3", type: "episode", num: "03", title: "셋째 화", description: "설명3" },
  { slug: "bonus1", type: "bonus", num: "번외1", title: "번외편", description: "번외" },
  { slug: "afterword", type: "afterword", title: "후기", description: "끝" },
]

const minimalDecorations = {
  dividerIcon: "dot" as const,
  dividerColor: "#888",
  headerIcon: "none" as const,
  headerSubtitle: "",
  cardAccentPosition: "left" as const,
  footerText: "",
}

describe("SeriesLanding", () => {
  it("작가 이름을 헤더에 표시한다", () => {
    render(<SeriesLanding contents={[]} authorName="윤동주" decorations={minimalDecorations} />)
    expect(screen.getByText("윤동주")).toBeInTheDocument()
  })

  it("기본 작가 이름은 Grimoire이다", () => {
    render(<SeriesLanding contents={[]} decorations={minimalDecorations} />)
    expect(screen.getByText("Grimoire")).toBeInTheDocument()
  })

  it("에피소드 섹션 라벨을 표시한다", () => {
    render(<SeriesLanding contents={mockContents} decorations={minimalDecorations} />)
    expect(screen.getAllByText("에피소드").length).toBeGreaterThanOrEqual(1)
  })

  it("에피소드 카드를 렌더링한다", () => {
    render(<SeriesLanding contents={mockContents} decorations={minimalDecorations} />)
    expect(screen.getAllByText("첫 화").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("둘째 화").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("셋째 화").length).toBeGreaterThanOrEqual(1)
  })

  it("번외 에피소드가 있으면 번외 섹션을 표시한다", () => {
    render(<SeriesLanding contents={mockContents} decorations={minimalDecorations} />)
    expect(screen.getAllByText(/번외/).length).toBeGreaterThanOrEqual(1)
  })

  it("번외가 없으면 번외 섹션이 DOM에 없다", () => {
    const noBonus = mockContents.filter(c => c.type !== "bonus")
    const { container } = render(<SeriesLanding contents={noBonus} decorations={minimalDecorations} />)
    // SectionLabel로 "번외 에피소드"가 렌더되는 section이 없어야 함
    const sections = container.querySelectorAll("section")
    const hasBonusSection = Array.from(sections).some(s => s.textContent?.includes("번외 에피소드"))
    expect(hasBonusSection).toBe(false)
  })

  it("일러두기 카드를 렌더링한다", () => {
    render(<SeriesLanding contents={mockContents} decorations={minimalDecorations} />)
    expect(screen.getAllByText("일러두기").length).toBeGreaterThanOrEqual(1)
  })

  it("후기 카드를 렌더링한다", () => {
    render(<SeriesLanding contents={mockContents} decorations={minimalDecorations} />)
    expect(screen.getAllByText("후기").length).toBeGreaterThanOrEqual(1)
  })

  it("headerSubtitle이 있으면 표시한다", () => {
    const withSubtitle = { ...minimalDecorations, headerSubtitle: "Short Fiction Anthology" }
    render(<SeriesLanding contents={[]} decorations={withSubtitle} />)
    expect(screen.getByText("Short Fiction Anthology")).toBeInTheDocument()
  })

  it("footerText가 있으면 표시한다", () => {
    const withFooter = { ...minimalDecorations, footerText: "Inspired by A24" }
    render(<SeriesLanding contents={[]} decorations={withFooter} />)
    expect(screen.getByText("Inspired by A24")).toBeInTheDocument()
  })

  it("빈 콘텐츠 배열도 에러 없이 렌더링한다", () => {
    const { container } = render(<SeriesLanding contents={[]} decorations={minimalDecorations} />)
    expect(container.querySelector("header")).toBeInTheDocument()
  })
})

describe("SeriesLanding heroStyle 분기", () => {
  it("heroStyle=fullname이면 h1에 작가 이름을 표시한다", () => {
    const { container } = render(
      <SeriesLanding contents={[]} authorName="윤동주" decorations={minimalDecorations} heroStyle="fullname" />
    )
    const h1 = container.querySelector("h1")
    expect(h1).toBeInTheDocument()
    expect(h1?.textContent).toBe("윤동주")
    expect(h1?.classList.contains("italic")).toBe(true)
  })

  it("heroStyle=fullname에서 headerSubtitle이 있으면 표시한다", () => {
    const withSubtitle = { ...minimalDecorations, headerSubtitle: "단편 선집" }
    render(
      <SeriesLanding contents={[]} decorations={withSubtitle} heroStyle="fullname" />
    )
    expect(screen.getByText("단편 선집")).toBeInTheDocument()
  })

  it("heroStyle=cover이면 가운데 정렬 헤더를 표시한다", () => {
    const { container } = render(
      <SeriesLanding contents={[]} authorName="김소월" decorations={minimalDecorations} heroStyle="cover" />
    )
    const h1 = container.querySelector("h1")
    expect(h1?.textContent).toBe("김소월")
    const header = h1?.closest("header")
    expect(header?.classList.contains("text-center")).toBe(true)
  })

  it("heroStyle=cover에서 headerSubtitle이 있으면 표시한다", () => {
    const withSubtitle = { ...minimalDecorations, headerSubtitle: "A24 감성" }
    render(
      <SeriesLanding contents={[]} decorations={withSubtitle} heroStyle="cover" />
    )
    expect(screen.getByText("A24 감성")).toBeInTheDocument()
  })

  it("heroStyle=none이면 히어로 헤더가 없다", () => {
    const { container } = render(
      <SeriesLanding contents={[]} decorations={minimalDecorations} heroStyle="none" />
    )
    expect(container.querySelector("header")).toBeNull()
  })

  it("heroStyle=minimal (기본값)이면 아이콘과 작가명을 표시한다", () => {
    render(<SeriesLanding contents={[]} authorName="이상" decorations={minimalDecorations} />)
    expect(screen.getByText("이상")).toBeInTheDocument()
  })

  it("workSlug가 전달되어도 에러 없이 렌더링된다", () => {
    render(
      <SeriesLanding contents={mockContents} workSlug="my-novel" decorations={minimalDecorations} />
    )
    expect(screen.getAllByText("첫 화").length).toBeGreaterThanOrEqual(1)
  })
})
