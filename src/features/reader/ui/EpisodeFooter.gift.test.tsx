// @vitest-environment jsdom
// F-4 회귀 — 응원(선물)은 server GIFT_POINT_OPTIONS(pt) [1000,3000,5000] 를 전송한다.
// 구버전은 구 크레딧 정수 [1,3,5] 를 전송 → server(pt 만 허용) 400.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react"
import { GIFT_POINT_OPTIONS } from "@/features/credits"

const h = vi.hoisted(() => ({
  getLikeStatus: vi.fn(),
  getLikeCount: vi.fn(),
  getComments: vi.fn(),
  getBookmarks: vi.fn(),
  saveProgress: vi.fn(),
  giftCredits: vi.fn(),
  refreshUser: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  api: {
    getLikeStatus: h.getLikeStatus,
    getLikeCount: h.getLikeCount,
    getComments: h.getComments,
    getBookmarks: h.getBookmarks,
    saveProgress: h.saveProgress,
    giftCredits: h.giftCredits,
  },
}))
vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { slug: "reader1", credits: 5000 }, refreshUser: h.refreshUser }),
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => children }))

import { EpisodeFooter } from "./EpisodeFooter"

describe("EpisodeFooter 응원 전송값 (F-4)", () => {
  beforeEach(() => {
    h.getLikeStatus.mockResolvedValue({ liked: false, likeCount: 0 })
    h.getLikeCount.mockResolvedValue({ count: 0 })
    h.getComments.mockResolvedValue([])
    h.getBookmarks.mockResolvedValue([])
    h.saveProgress.mockResolvedValue({})
    h.giftCredits.mockResolvedValue({ senderCredits: 4000, receiverCredits: 1000 })
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("web 미러 상수는 server 허용 pt [1000,3000,5000] 와 동일하다", () => {
    expect([...GIFT_POINT_OPTIONS]).toEqual([1000, 3000, 5000])
  })

  it("응원 버튼은 pt 라벨(1,000pt/3,000pt/5,000pt)을 표기한다", async () => {
    render(<EpisodeFooter episodeId="ep1" authorSlug="deerdevil" workSlug="w1" />)
    fireEvent.click(await screen.findByText("응원 보내기"))
    expect(screen.getByText("1,000pt")).toBeInTheDocument()
    expect(screen.getByText("3,000pt")).toBeInTheDocument()
    expect(screen.getByText("5,000pt")).toBeInTheDocument()
  })

  it("응원 클릭 시 pt 값(1000)을 전송한다 (구 정수 1 아님)", async () => {
    render(<EpisodeFooter episodeId="ep1" authorSlug="deerdevil" workSlug="w1" />)
    fireEvent.click(await screen.findByText("응원 보내기"))
    fireEvent.click(screen.getByText("1,000pt"))
    await waitFor(() => expect(h.giftCredits).toHaveBeenCalledWith("deerdevil", 1000))
    expect(h.giftCredits).not.toHaveBeenCalledWith("deerdevil", 1)
  })
})
