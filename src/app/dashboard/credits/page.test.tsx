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
  getMembership: vi.fn(),
  initiatePayment: vi.fn(),
  push: vi.fn(),
}))

vi.mock("@/lib/api", () => ({
  api: {
    getProducts: h.getProducts,
    getPointBalance: h.getPointBalance,
    getCreditLogs: h.getCreditLogs,
    getExpiring: h.getExpiring,
    getMembership: h.getMembership,
    initiatePayment: h.initiatePayment,
  },
}))

// server MembershipResponseDto free 기본 (미구독) — 모든 렌더 케이스 공용
const FREE_MEMBERSHIP = {
  tier: "free" as const,
  monthlyPoolPoints: 0,
  poolBalance: 0,
  poolResetAt: null,
  status: "active" as const,
  expiresAt: null,
}
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
    h.getMembership.mockResolvedValue(FREE_MEMBERSHIP)
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
    h.getMembership.mockResolvedValue(FREE_MEMBERSHIP)
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

describe("CreditsPage — F-22 멤버십 현황", () => {
  beforeEach(() => {
    h.getProducts.mockResolvedValue(SERVER_PRODUCTS)
    h.getPointBalance.mockResolvedValue({ available: 47560 })
    h.getCreditLogs.mockResolvedValue(SERVER_LOGS)
    h.getExpiring.mockResolvedValue(null)
    h.getMembership.mockResolvedValue(FREE_MEMBERSHIP)
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("유료 멤버십 현황(등급/월풀/잔여/리셋)을 표시한다", async () => {
    h.getMembership.mockResolvedValue({
      tier: "pro",
      monthlyPoolPoints: 93000,
      poolBalance: 40000,
      poolResetAt: "2026-08-01T00:00:00.000Z",
      status: "active",
      expiresAt: "2026-08-01T00:00:00.000Z",
    })
    render(<CreditsPage />)
    expect(await screen.findByText(/프로 플랜/)).toBeInTheDocument()
    expect(screen.getByText("40,000")).toBeInTheDocument() // poolBalance 잔여 풀
    expect(screen.getByText(/93,000 pt/)).toBeInTheDocument() // 월 풀 크기
  })

  it("무료 등급이면 구독 유도 CTA 를 표시한다 (현황 카드 미표시)", async () => {
    render(<CreditsPage />) // beforeEach: free
    expect(await screen.findByText(/멤버십 구독으로 매월 포인트 받기/)).toBeInTheDocument()
    // 유료 현황 카드 전용 라벨('월 포인트 풀 잔여')이 free 에서는 미표시
    expect(screen.queryByText(/월 포인트 풀 잔여/)).toBeNull()
  })

  it("비활성 상태(해지/만료)면 상태 라벨을 병기한다", async () => {
    h.getMembership.mockResolvedValue({
      tier: "premium",
      monthlyPoolPoints: 191500,
      poolBalance: 0,
      poolResetAt: "2026-08-01T00:00:00.000Z",
      status: "cancelled",
      expiresAt: "2026-08-01T00:00:00.000Z",
    })
    render(<CreditsPage />)
    // 유료 현황 카드 렌더 확인 (월 풀 크기 191,500 pt 는 카드 전용)
    expect(await screen.findByText(/191,500 pt/)).toBeInTheDocument()
    expect(screen.getByText(/해지/)).toBeInTheDocument()
  })
})
