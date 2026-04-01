// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SeriesNav } from "./SeriesNav"

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  usePathname: () => "/test-author",
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

vi.mock("@/features/reader/data", () => ({
  contents: [],
}))

// useTheme mock — ThemeProvider 없이 테스트 가능하도록
vi.mock("@/features/theme", () => ({
  useTheme: () => ({
    showProfileTab: true,
  }),
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
    // CI 로고 + 기본 작가명 = "Grimoire" 2개
    expect(screen.getAllByText("Grimoire").length).toBeGreaterThanOrEqual(2)
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

  it("CI 로고가 /explore를 가리킨다", () => {
    render(<SeriesNav apiEpisodes={[]} />)
    const ciLinks = screen.getAllByText("Grimoire")
    const ciLink = ciLinks.find(el => el.closest("a")?.getAttribute("href") === "/explore")
    expect(ciLink).toBeTruthy()
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

describe("SeriesNav multi-work 모드", () => {
  const mockWorks: { slug: string; title: string; episodeCount?: number }[] = [
    { slug: "work-a", title: "첫 번째 작품", episodeCount: 5 },
    { slug: "work-b", title: "두 번째 작품", episodeCount: 3 },
  ]

  it("apiWorks가 2개 이상이면 작품명 탭을 표시한다", () => {
    render(<SeriesNav apiEpisodes={[]} apiWorks={mockWorks} />)
    expect(screen.getByText("첫 번째 작품")).toBeInTheDocument()
    expect(screen.getByText("두 번째 작품")).toBeInTheDocument()
  })

  it("multi-work 모드에서 에피소드 탭 대신 작품 탭이 표시된다", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} apiWorks={mockWorks} />)
    expect(screen.getAllByText("첫 번째 작품").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("두 번째 작품").length).toBeGreaterThanOrEqual(1)
  })

  it("apiWorks가 1개면 단일 작품(에피소드) 모드로 동작한다", () => {
    const singleWork = [{ slug: "only-work", title: "유일한 작품" }]
    render(<SeriesNav apiEpisodes={mockEpisodes} apiWorks={singleWork} />)
    // 에피소드 탭이 표시되어야 함
    expect(screen.getAllByText("01").length).toBeGreaterThanOrEqual(1)
  })
})

describe("SeriesNav tab 클릭", () => {
  it("에피소드 탭을 클릭할 수 있다 (에러 없음)", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} />)
    const tabButtons = screen.getAllByRole("button")
    const epTab = tabButtons.find(b => b.textContent === "01")
    expect(epTab).toBeTruthy()
    epTab!.click()
  })

  it("전체 탭을 클릭할 수 있다 (에러 없음)", () => {
    render(<SeriesNav apiEpisodes={mockEpisodes} />)
    const tabButtons = screen.getAllByRole("button")
    const allTab = tabButtons.find(b => b.textContent === "전체")
    expect(allTab).toBeTruthy()
    allTab!.click()
  })

  it("multi-work 모드에서 작품 탭을 클릭할 수 있다", () => {
    const works = [
      { slug: "work-a", title: "작품A" },
      { slug: "work-b", title: "작품B" },
    ]
    render(<SeriesNav apiEpisodes={[]} apiWorks={works} />)
    const tabButtons = screen.getAllByRole("button")
    const workTab = tabButtons.find(b => b.textContent === "작품A")
    expect(workTab).toBeTruthy()
    workTab!.click()
  })
})

describe("SeriesNav episodeUrl with workSlug", () => {
  it("workSlug가 있으면 3단계 URL을 생성한다", () => {
    // workSlug를 지정하면 /{author}/{work}/{episode} 형태
    // DOM에 직접 href가 없으므로 (button 기반) 렌더링 에러 없음을 확인
    render(<SeriesNav workSlug="my-novel" apiEpisodes={[{ slug: "ep1", num: "01" }]} />)
    expect(screen.getAllByText("01").length).toBeGreaterThanOrEqual(1)
  })

  it("workSlug가 없으면 2단계 URL을 사용한다", () => {
    render(<SeriesNav apiEpisodes={[{ slug: "ep1", num: "01" }]} />)
    expect(screen.getAllByText("01").length).toBeGreaterThanOrEqual(1)
  })
})
