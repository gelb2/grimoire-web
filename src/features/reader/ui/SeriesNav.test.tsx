// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SeriesNav } from "./SeriesNav"

const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  usePathname: () => "/test-author",
  useRouter: () => ({ replace: mockReplace }),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock("@/features/reader/data", () => ({
  contents: [],
}))

const mockEpisodes = [
  { slug: "ep1", num: "01", type: "episode" },
  { slug: "ep2", num: "02", type: "episode" },
  { slug: "bonus1", type: "bonus" },
  { slug: "preface", type: "preface" },
  { slug: "afterword", type: "afterword" },
]

describe("SeriesNav", () => {
  it("작가 이름을 표시한다", () => {
    render(<SeriesNav authorName="김소월" apiEpisodes={[]} />)
    expect(screen.getByText("김소월")).toBeInTheDocument()
  })

  it("기본 작가 이름은 Grimoire이다", () => {
    render(<SeriesNav apiEpisodes={[]} />)
    expect(screen.getByText("Grimoire")).toBeInTheDocument()
  })

  it("전체 탭이 항상 표시된다", () => {
    render(<SeriesNav apiEpisodes={[]} />)
    expect(screen.getAllByText("전체").length).toBeGreaterThanOrEqual(1)
  })

  it("에피소드 탭을 번호로 표시한다", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} />)
    expect(screen.getAllByText("01").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("02").length).toBeGreaterThanOrEqual(1)
  })

  it("bonus 에피소드를 번외 라벨로 표시한다", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} />)
    expect(screen.getAllByText("번외1").length).toBeGreaterThanOrEqual(1)
  })

  it("preface를 일러두기로 표시한다", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} />)
    expect(screen.getAllByText("일러두기").length).toBeGreaterThanOrEqual(1)
  })

  it("afterword를 후기로 표시한다", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} />)
    expect(screen.getAllByText("후기").length).toBeGreaterThanOrEqual(1)
  })

  it("탐색으로 링크가 /explore를 가리킨다", () => {
    render(<SeriesNav apiEpisodes={[]} />)
    const backLinks = screen.getAllByText("← 탐색으로")
    expect(backLinks[0].closest("a")).toHaveAttribute("href", "/explore")
  })

  it("작가 이름 링크가 프로필 페이지를 가리킨다", () => {
    render(<SeriesNav authorName="테스트" apiEpisodes={[]} />)
    const nameLink = screen.getByText("테스트")
    expect(nameLink.closest("a")).toHaveAttribute("href", "/test-author/profile")
  })

  it("num이 없는 에피소드는 slug에서 번호를 추출한다", () => {
    render(<SeriesNav apiEpisodes={[{ slug: "ep3", type: "episode" }]} />)
    expect(screen.getByText("03")).toBeInTheDocument()
  })

  it("workSlug가 있으면 에피소드 탭이 렌더링된다", () => {
    render(<SeriesNav workSlug="my-work" apiEpisodes={[{ slug: "ep1", num: "01" }]} />)
    expect(screen.getAllByText("01").length).toBeGreaterThanOrEqual(1)
  })
})
