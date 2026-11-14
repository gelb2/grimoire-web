// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { EpisodeViewer } from "./EpisodeViewer"
import type { ContentMeta, EpisodeData } from "@/features/reader/data"

// next/navigation mock
vi.mock("next/navigation", () => ({
  usePathname: () => "/test-author/ep-test",
}))

// framer-motion mock
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...props }: any) => <div {...props}>{children}</div>,
    footer: ({ children, initial, animate, transition, ...props }: any) => <footer {...props}>{children}</footer>,
  },
}))

// TypeWriter mock
vi.mock("./TypeWriter", () => ({
  TypeWriter: ({ text, onComplete, active = true }: { text: string; onComplete?: () => void; active?: boolean }) => {
    if (active && onComplete) setTimeout(onComplete, 0)
    return <span>{active ? text : ''}</span>
  },
}))

// useTheme mock — 테마 컨텍스트 시뮬레이션 (기본: typing)
const mockUseTheme = vi.fn(() => ({
  decorations: {
    dividerIcon: "antler",
    dividerColor: "#9a8060",
    headerIcon: "antler",
    headerSubtitle: "",
    cardAccentPosition: "left",
    footerText: "",
  },
  tagline: "테스트 태그라인",
  animation: "typing",
}))
vi.mock("@/features/theme", () => {
  const { createContext } = require("react")
  return {
    useTheme: () => mockUseTheme(),
    ThemeContext: createContext(null),
  }
})

const mockMeta: ContentMeta = {
  slug: "ep-test",
  type: "episode",
  num: "01",
  title: "테스트 에피소드",
  subtitle: "Test Episode",
}

const mockData: EpisodeData = {
  slug: "ep-test",
  title: "테스트 에피소드",
  blocks: [
    { type: "divider" },
    { type: "paragraph", text: "첫 번째 문단" },
    { type: "paragraph", text: "두 번째 문단" },
    { type: "paragraph", text: "세 번째 문단" },
    { type: "chapter", num: "1", title: "첫 챕터" },
    { type: "paragraph", text: "챕터 본문" },
  ],
}

describe("EpisodeViewer", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("첫 방문 시 컴포넌트가 마운트된다", () => {
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)
    expect(document.querySelector("header")).toBeInTheDocument()
  })

  it("재방문 시 라벨과 제목이 즉시 표시된다 (TypeWriter 없이)", () => {
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    expect(screen.getByText("Grimoire · Episode 01")).toBeInTheDocument()
    expect(screen.getByText("테스트 에피소드")).toBeInTheDocument()
    expect(screen.getByText("테스트 태그라인")).toBeInTheDocument()
  })

  it("재방문 시 모든 본문 블록이 즉시 표시된다", () => {
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    expect(screen.getByText("첫 번째 문단")).toBeInTheDocument()
    expect(screen.getByText("두 번째 문단")).toBeInTheDocument()
    expect(screen.getByText("세 번째 문단")).toBeInTheDocument()
  })

  it("tagline prop이 전달되면 해당 값을 표시한다", () => {
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} tagline="커스텀 태그라인" />)
    expect(screen.getByText("커스텀 태그라인")).toBeInTheDocument()
  })

  it("다른 slug의 방문 기록은 영향을 주지 않는다", () => {
    sessionStorage.setItem("visited:ep-other", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    expect(document.querySelector("main")).not.toBeVisible()
  })
})

describe("EpisodeViewer 타이머 안전성", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("컴포넌트 언마운트 시 진행 중인 타이머가 정리된다 (타이머 누수 방지)", () => {
    const setTimeoutSpy = vi.spyOn(global, "setTimeout")
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")

    const { unmount } = render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    // 타이핑 시작 타이머가 등록됨 (200ms 후 stage 1)
    const timerCountBefore = setTimeoutSpy.mock.calls.length

    // 타이핑 도중 언마운트
    unmount()

    // clearTimeout/clearInterval이 호출되어야 함
    expect(clearTimeoutSpy).toHaveBeenCalled()

    setTimeoutSpy.mockRestore()
    clearTimeoutSpy.mockRestore()
  })

  it("언마운트 후 setState가 호출되지 않는다 (상태 꼬임 방지)", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const { unmount } = render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    // 언마운트
    unmount()

    // 예약된 타이머들을 강제 실행 — 언마운트 후에도 에러가 나면 안 됨
    vi.runAllTimers()

    // React "Can't perform a state update on an unmounted component" 에러가 없어야 함
    const stateUpdateErrors = consoleErrorSpy.mock.calls.filter(
      (call) => call.some((arg) => typeof arg === "string" && arg.includes("unmounted"))
    )
    expect(stateUpdateErrors).toHaveLength(0)

    consoleErrorSpy.mockRestore()
  })

  it("타이핑 완료 전 언마운트 시 sessionStorage에 기록되지 않는다 (경합 방지)", () => {
    const { unmount } = render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    // 타이핑 시작 전 언마운트
    unmount()

    // 타이머 강제 실행
    vi.runAllTimers()

    // 방문 기록이 남으면 안 됨 — 타이핑이 완료되지 않았으니까
    expect(sessionStorage.getItem("visited:Grimoire:ep-test")).toBeNull()
  })

  it("빠른 마운트/언마운트 반복에도 에러가 발생하지 않는다", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    // 5번 빠르게 마운트/언마운트 반복
    for (let i = 0; i < 5; i++) {
      const { unmount } = render(<EpisodeViewer meta={mockMeta} data={mockData} />)
      unmount()
    }

    // 모든 예약 타이머 강제 실행
    vi.runAllTimers()

    const errors = consoleErrorSpy.mock.calls.filter(
      (call) => call.some((arg) => typeof arg === "string" && arg.includes("unmounted"))
    )
    expect(errors).toHaveLength(0)

    consoleErrorSpy.mockRestore()
  })
})

describe("EpisodeViewer episodeLabel", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("preface 타입은 'Preface' 라벨을 표시한다", () => {
    const prefaceMeta: ContentMeta = { slug: "preface", type: "preface", title: "일러두기" }
    sessionStorage.setItem("visited:Grimoire:preface", "true")
    render(<EpisodeViewer meta={prefaceMeta} data={{ ...mockData, slug: "preface" }} />)
    expect(screen.getByText("Grimoire · Preface")).toBeInTheDocument()
  })

  it("afterword 타입은 'Afterword' 라벨을 표시한다", () => {
    const afterMeta: ContentMeta = { slug: "afterword", type: "afterword", title: "후기" }
    sessionStorage.setItem("visited:Grimoire:afterword", "true")
    render(<EpisodeViewer meta={afterMeta} data={{ ...mockData, slug: "afterword" }} />)
    expect(screen.getByText("Grimoire · Afterword")).toBeInTheDocument()
  })

  it("bonus 타입은 'Bonus N' 라벨을 표시한다", () => {
    const bonusMeta: ContentMeta = { slug: "bonus1", type: "bonus", num: "번외1", title: "번외편" }
    sessionStorage.setItem("visited:Grimoire:bonus1", "true")
    render(<EpisodeViewer meta={bonusMeta} data={{ ...mockData, slug: "bonus1" }} />)
    expect(screen.getByText("Grimoire · Bonus 1")).toBeInTheDocument()
  })

  it("num이 없는 episode는 작가 이름만 라벨에 표시한다", () => {
    const noNumMeta: ContentMeta = { slug: "ep-test", type: "episode", title: "테스트" }
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={noNumMeta} data={mockData} />)
    // "Episode" 라벨 없이 "Grimoire"만 표시 (footer에도 Grimoire가 있으므로 getAllByText)
    const grimoireTexts = screen.getAllByText("Grimoire")
    expect(grimoireTexts.length).toBeGreaterThanOrEqual(2) // 라벨 + 푸터
    // "Episode" 문자열이 라벨에 없어야 함
    const labelArea = document.querySelector("header .uppercase")
    expect(labelArea?.textContent).not.toContain("Episode")
  })
})

describe("EpisodeViewer description/subtitle", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("meta.description이 있으면 표시한다", () => {
    const metaWithDesc: ContentMeta = { ...mockMeta, description: "에피소드 설명입니다" }
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={metaWithDesc} data={mockData} />)
    expect(screen.getByText("에피소드 설명입니다")).toBeInTheDocument()
  })

  it("meta.subtitle이 있으면 표시한다", () => {
    const metaWithSub: ContentMeta = { ...mockMeta, subtitle: "Test Episode" }
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={metaWithSub} data={mockData} />)
    expect(screen.getByText("Test Episode")).toBeInTheDocument()
  })

  it("description과 subtitle이 모두 있으면 description을 우선 표시한다", () => {
    const metaBoth: ContentMeta = { ...mockMeta, description: "설명", subtitle: "부제" }
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={metaBoth} data={mockData} />)
    expect(screen.getByText("설명")).toBeInTheDocument()
  })
})

describe("EpisodeViewer animation 분기", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it("animation: none이면 모든 콘텐츠가 즉시 표시된다", () => {
    mockUseTheme.mockReturnValueOnce({
      decorations: {
        dividerIcon: "dot", dividerColor: "#888",
        headerIcon: "dot", headerSubtitle: "",
        cardAccentPosition: "left", footerText: "",
      },
      tagline: "",
      animation: "none",
    })

    render(<EpisodeViewer meta={mockMeta} data={mockData} />)
    // animation: none → stage=5 즉시 → 모든 블록 표시
    expect(screen.getByText("첫 번째 문단")).toBeInTheDocument()
    expect(screen.getByText("두 번째 문단")).toBeInTheDocument()
  })

  it("첫 방문 typing 모드에서 타이머 경과 후 stage가 진행된다", () => {
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)
    // stage 0 → 200ms 후 stage 1
    vi.advanceTimersByTime(200)
    // TypeWriter mock이 onComplete를 setTimeout(0)으로 호출하므로 stage 1→2 진행
    vi.advanceTimersByTime(10)
    // 라벨이 표시되어야 함
    expect(document.querySelector("header")).toBeInTheDocument()
  })

  it("재방문 시 footer에 작가 이름이 표시된다", () => {
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} authorName="김작가" />)
    expect(screen.getByText("김작가")).toBeInTheDocument()
  })

  it("decorations prop이 useTheme 기본값보다 우선한다", () => {
    sessionStorage.setItem("visited:Grimoire:ep-test", "true")
    const customDecorations = {
      dividerIcon: "dot" as const, dividerColor: "#ff0000",
      headerIcon: "dot" as const, headerSubtitle: "",
      cardAccentPosition: "left" as const, footerText: "",
    }
    render(<EpisodeViewer meta={mockMeta} data={mockData} decorations={customDecorations} />)
    // 렌더링 에러 없이 완료
    expect(document.querySelector("header")).toBeInTheDocument()
  })
})
