// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { EpisodeViewer } from "./EpisodeViewer"
import type { ContentMeta, EpisodeData } from "@/features/universe/data"

// next/navigation mock
vi.mock("next/navigation", () => ({
  usePathname: () => "/deerdevil/ep-test",
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
  TypeWriter: ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
    if (onComplete) setTimeout(onComplete, 0)
    return <span>{text}</span>
  },
}))

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
    sessionStorage.setItem("visited:ep-test", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    expect(screen.getByText("Grimoire · Episode 01")).toBeInTheDocument()
    expect(screen.getByText("테스트 에피소드")).toBeInTheDocument()
    expect(screen.getByText("결핍은 질문을 삼킨다.")).toBeInTheDocument()
  })

  it("재방문 시 모든 본문 블록이 즉시 표시된다", () => {
    sessionStorage.setItem("visited:ep-test", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    expect(screen.getByText("첫 번째 문단")).toBeInTheDocument()
    expect(screen.getByText("두 번째 문단")).toBeInTheDocument()
    expect(screen.getByText("세 번째 문단")).toBeInTheDocument()
  })

  it("다른 slug의 방문 기록은 영향을 주지 않는다", () => {
    sessionStorage.setItem("visited:ep-other", "true")
    render(<EpisodeViewer meta={mockMeta} data={mockData} />)

    expect(document.querySelector("main")).not.toBeInTheDocument()
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
    expect(sessionStorage.getItem("visited:ep-test")).toBeNull()
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
