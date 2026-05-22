/**
 * @vitest-environment jsdom
 *
 * 크레딧 개편 I Phase — CreditBalanceCard (포인트 잔액 표시) 검증.
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web — 잔액 표시).
 *
 * - 헤드라인 축약 표기 (§8-1 큰 숫자 완화) + 정확한 pt 동반 표시.
 * - bySource 가 있으면 4 출처 분해 표시, 없으면 미표시 (없는 값 추정 금지).
 * - deficit > 0 이면 외상 안내 표시.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CreditBalanceCard } from './CreditBalanceCard'

afterEach(cleanup)

describe('CreditBalanceCard — 잔액 헤드라인', () => {
  it('총량만 주어지면 축약 표기 + 정확한 pt 동반', () => {
    render(<CreditBalanceCard balance={{ available: 93000 }} />)
    // 축약 헤드라인
    expect(screen.getByText('9.3만')).toBeTruthy()
    // 정확한 값 동반 표시 (천단위)
    expect(screen.getByText(/정확히 93,000 pt/)).toBeTruthy()
  })

  it('1만 미만 잔액 — 축약 없이 천단위 그대로', () => {
    render(<CreditBalanceCard balance={{ available: 950 }} />)
    expect(screen.getByText('950')).toBeTruthy()
  })
})

describe('CreditBalanceCard — 출처 분해', () => {
  it('bySource 없으면 출처 분해 섹션 미표시', () => {
    render(<CreditBalanceCard balance={{ available: 100000 }} />)
    expect(screen.queryByText('포인트 출처')).toBeNull()
  })

  it('bySource 있으면 4 출처 라벨 + 각 잔액 표시', () => {
    render(
      <CreditBalanceCard
        balance={{
          available: 74000,
          total: 74000,
          bySource: { free: 1000, subscription: 50000, gift: 3000, charged: 20000 },
        }}
      />,
    )
    expect(screen.getByText('포인트 출처')).toBeTruthy()
    expect(screen.getByText('무료 적립')).toBeTruthy()
    expect(screen.getByText('구독 포인트')).toBeTruthy()
    expect(screen.getByText('응원 선물')).toBeTruthy()
    expect(screen.getByText('충전 포인트')).toBeTruthy()
    // 각 출처 잔액 pt 표기
    expect(screen.getByText('50,000 pt')).toBeTruthy()
    expect(screen.getByText('20,000 pt')).toBeTruthy()
    // 소진 우선순위 안내
    expect(screen.getByText(/무료 적립 → 구독 포인트 → 응원 선물 → 충전 포인트/)).toBeTruthy()
  })
})

describe('CreditBalanceCard — deficit(외상) 안내', () => {
  it('deficit 0 — 외상 안내 미표시', () => {
    render(<CreditBalanceCard balance={{ available: 1000, deficit: 0 }} />)
    expect(screen.queryByText(/외상/)).toBeNull()
  })

  it('deficit > 0 — 외상 pt + 다음 충전 시 차감 안내 표시', () => {
    render(<CreditBalanceCard balance={{ available: 0, deficit: 3000 }} />)
    expect(screen.getByText(/외상 3,000 pt/)).toBeTruthy()
    expect(screen.getByText(/다음 충전 시 우선 차감/)).toBeTruthy()
  })
})
