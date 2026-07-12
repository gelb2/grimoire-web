// @vitest-environment jsdom
// F-1 회귀 — 충전 페이지가 server 실제 응답 shape(points/pricePerPoint/reason)를 소비한다.
// 구버전은 product.pricePerCredit.toLocaleString()에서 TypeError 렌더 크래시 +
// creditsToPoints(log.amount)로 pt를 1,000배 과표기했다. 본 spec은 둘 다 잠근다.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react"

const h = vi.hoisted(() => ({
  getProducts: vi.fn(),
  getPointBalance: vi.fn(),
  getCreditLogs: vi.fn(),
  getExpiring: vi.fn(),
  initiatePayment: vi.fn(),
  push: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  api: {
    getProducts: h.getProducts,
    getPointBalance: h.getPointBalance,
    getCreditLogs: h.getCreditLogs,
    getExpiring: h.getExpiring,
    initiatePayment: h.initiatePayment,
  },
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "a1", slug: "deerdevil", name: "사슴", email: "d@d.com", credits: 47560 },
    loading: false,
    refreshUser: vi.fn(),
  }),
}))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock("@/hooks/useThrottle", () => ({ useLoadingAction: () => ({ execute: vi.fn(), pending: false }) }))
vi.mock("@/components/PlatformNav", () => ({ PlatformNav: () => null }))
vi.mock("next/link", () => ({ default: ({ children }: { children: React.ReactNode }) => children }))

import CreditsPage from "./page"

// server GET /payments/products 실제 응답 shape (payment.usecase getProducts 정본)
const SERVER_PRODUCTS = [
  { id: "credit-starter", name: "입문 패키지", points: 25000, bonusRate: 0, price: 3000, pricePerPoint: 0.12 },
  { id: "credit-best", name: "베스트 패키지", points: 287500, bonusRate: 0.15, price: 30000, pricePerPoint: 0.10435 },
]

// server GET /credits/logs 실제 응답 shape (CreditLedgerEntry — reason/amount pt, spend 음수)
const SERVER_LOGS = [
  { id: "l1", source: "charged", type: "earn", amount: 50000, balanceAfter: 50000, reason: "충전 완료", relatedId: null, createdAt: "2026-07-01T00:00:00.000Z", expiresAt: null },
  { id: "l2", source: "charged", type: "spend", amount: -2440, balanceAfter: 47560, reason: "AI 분석", relatedId: null, createdAt: "2026-07-02T00:00:00.000Z", expiresAt: null },
]

describe("CreditsPage — server 실제 shape 소비 (F-1)", () => {
  beforeEach(() => {
    h.getProducts.mockResolvedValue(SERVER_PRODUCTS)
    h.getPointBalance.mockResolvedValue({ available: 47560 })
    h.getCreditLogs.mockResolvedValue(SERVER_LOGS)
    h.getExpiring.mockResolvedValue(null)
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("server products(points/pricePerPoint)를 크래시 없이 렌더한다", async () => {
    render(<CreditsPage />)
    // 구버전은 pricePerCredit.toLocaleString() 에서 렌더 크래시 → findBy 자체가 실패
    expect(await screen.findByText("25,000 pt")).toBeInTheDocument()
    expect(screen.getByText("287,500 pt")).toBeInTheDocument()
  })

  it("pt 당 단가를 pricePerPoint × 1,000(원화)로 표기한다", async () => {
    render(<CreditsPage />)
    // starter: 0.12 × 1000 = 120
    expect(await screen.findByText("1,000pt당 ₩120")).toBeInTheDocument()
    expect(screen.getByText("₩3,000")).toBeInTheDocument()
  })

  it("베스트 배지는 server id 'credit-best' 에 붙는다", async () => {
    render(<CreditsPage />)
    expect(await screen.findByText("베스트")).toBeInTheDocument()
  })

  it("크레딧 로그를 reason + pt 그대로(×1,000 과표기 금지)로 표기한다", async () => {
    render(<CreditsPage />)
    expect(await screen.findByText("충전 완료")).toBeInTheDocument()
    expect(screen.getByText("AI 분석")).toBeInTheDocument()
    // amount 는 이미 pt — +50,000 pt (구버전은 creditsToPoints로 50,000,000 과표기)
    expect(screen.getByText("+50,000 pt")).toBeInTheDocument()
    expect(screen.getByText("-2,440 pt")).toBeInTheDocument()
    expect(screen.queryByText(/50,000,000/)).toBeNull()
  })

  it("잔액 폴백은 user.credits(이미 pt)를 ×1,000 없이 사용한다", async () => {
    // balance 미수신(reject) 시 user.credits(47560) 폴백 — 47,560,000 과표기 금지
    h.getPointBalance.mockRejectedValue(new Error("no balance"))
    render(<CreditsPage />)
    await waitFor(() => expect(h.getCreditLogs).toHaveBeenCalled())
    expect(screen.queryByText(/47,560,000/)).toBeNull()
  })
})

describe("CreditsPage — F-21 기간 필터 + 만료 예정", () => {
  beforeEach(() => {
    h.getProducts.mockResolvedValue(SERVER_PRODUCTS)
    h.getPointBalance.mockResolvedValue({ available: 47560 })
    h.getCreditLogs.mockResolvedValue(SERVER_LOGS)
    h.getExpiring.mockResolvedValue(null)
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("초기 로드는 무파라미터로 getCreditLogs 를 호출한다 (기존 동작 회귀 0)", async () => {
    render(<CreditsPage />)
    await waitFor(() => expect(h.getCreditLogs).toHaveBeenCalled())
    // 첫 호출은 인자 없음 — server 기본(최신순 100건) 하위호환
    expect(h.getCreditLogs.mock.calls[0]).toEqual([])
  })

  it("기간 필터 클릭 시 from/to/limit/offset 로 재조회한다", async () => {
    render(<CreditsPage />)
    await screen.findByText("충전 완료") // 초기 로드 완료 대기
    fireEvent.click(screen.getByText("1개월"))
    await waitFor(() => {
      expect(h.getCreditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
          offset: 0,
          from: expect.any(String),
          to: expect.any(String),
        }),
      )
    })
  })

  it("구독 풀 소멸 예정을 pt + 날짜로 표시한다 (활성 유료 구독)", async () => {
    h.getExpiring.mockResolvedValue({ expiringAmount: 5000, expiresAt: "2026-08-01T00:00:00.000Z" })
    render(<CreditsPage />)
    expect(await screen.findByText("5,000 pt")).toBeInTheDocument()
    expect(screen.getByText(/소멸 예정/)).toBeInTheDocument()
  })

  it("만료 예정 없음(null)이면 소멸 예정 배너를 렌더하지 않는다", async () => {
    render(<CreditsPage />)
    await screen.findByText("충전 완료")
    expect(screen.queryByText(/소멸 예정/)).toBeNull()
  })
})
