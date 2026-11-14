// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, act } from "@testing-library/react"
import { TypeWriter } from "./TypeWriter"

describe("TypeWriter", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { cleanup(); vi.useRealTimers() })

  it("span 요소로 렌더링된다", () => {
    const { container } = render(<TypeWriter text="테스트" />)
    expect(container.querySelector("span")).toBeInTheDocument()
  })

  it("텍스트를 한 글자씩 타이핑한다", () => {
    render(<TypeWriter text="ABC" speed={10} />)

    // 초기 딜레이 0 + 첫 글자
    act(() => { vi.advanceTimersByTime(10) })
    expect(screen.getByText("A")).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(10) })
    expect(screen.getByText("AB")).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(10) })
    expect(screen.getByText("ABC")).toBeInTheDocument()
  })

  it("타이핑 완료 시 onComplete를 호출한다", () => {
    const onComplete = vi.fn()
    render(<TypeWriter text="AB" speed={10} onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(20) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("delay가 있으면 지연 후 타이핑을 시작한다", () => {
    const { container } = render(<TypeWriter text="A" speed={10} delay={100} />)

    act(() => { vi.advanceTimersByTime(50) })
    expect(container.querySelector("span")?.textContent).toBe("")

    act(() => { vi.advanceTimersByTime(60) }) // 100ms delay + 10ms speed
    expect(screen.getByText("A")).toBeInTheDocument()
  })

  it("언마운트 시 타이머를 정리한다", () => {
    const onComplete = vi.fn()
    const { unmount } = render(<TypeWriter text="ABCDEF" speed={10} onComplete={onComplete} />)

    act(() => { vi.advanceTimersByTime(20) }) // 2글자만 타이핑
    unmount()
    act(() => { vi.runAllTimers() })

    expect(onComplete).not.toHaveBeenCalled()
  })

  it("text가 변경되면 처음부터 다시 타이핑한다", () => {
    const { rerender } = render(<TypeWriter text="AB" speed={10} />)

    act(() => { vi.advanceTimersByTime(20) })
    expect(screen.getByText("AB")).toBeInTheDocument()

    rerender(<TypeWriter text="XY" speed={10} />)
    act(() => { vi.advanceTimersByTime(10) })
    expect(screen.getByText("X")).toBeInTheDocument()
  })

  it("순서가 오기 전에는 공간만 확보하고 타이머와 완료 콜백을 시작하지 않는다", () => {
    const onComplete = vi.fn()
    const { rerender } = render(<TypeWriter text="AB" speed={10} active={false} onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.queryByText('A')).not.toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
    rerender(<TypeWriter text="AB" speed={10} active onComplete={onComplete} />)
    act(() => { vi.advanceTimersByTime(20) })
    expect(screen.getByText('AB')).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
