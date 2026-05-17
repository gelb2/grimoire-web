/**
 * 크레딧 개편 I Phase — point-balance.ts (server `/credits/balance` 응답 정규화) 검증.
 *
 * 정본: shared-contracts §30 CreditOverhaul.
 *
 * 3가지 server 응답 형태 모두 정규화:
 * 1. 출처 회계 응답 (bySource) — 출처별 분해 + total/available/deficit 산출.
 * 2. 포인트 총량만 (available) — 총량 표시, 출처 분해 없음.
 * 3. 정수 크레딧만 (credits — 현행 server backward-compatible) — ×1,000 환산.
 */
import { describe, it, expect } from 'vitest'
import { normalizePointBalance } from './point-balance'

describe('normalizePointBalance — 1) 출처 회계 응답 (bySource)', () => {
  it('4 출처 분해 + total/available 산출', () => {
    const view = normalizePointBalance({
      bySource: { free: 1000, subscription: 50000, gift: 3000, charged: 20000 },
      deficit: 0,
    })
    expect(view.bySource).toEqual({ free: 1000, subscription: 50000, gift: 3000, charged: 20000 })
    expect(view.total).toBe(74000)
    expect(view.available).toBe(74000) // deficit 0 → total 과 동일
    expect(view.deficit).toBe(0)
  })

  it('deficit 가 있으면 available = total - deficit', () => {
    const view = normalizePointBalance({
      bySource: { free: 0, subscription: 0, gift: 0, charged: 5000 },
      deficit: 2000,
    })
    expect(view.total).toBe(5000)
    expect(view.deficit).toBe(2000)
    expect(view.available).toBe(3000)
  })

  it('일부 출처 누락 → 0 으로 채움 (없는 값 추정 금지 — 0 명시)', () => {
    const view = normalizePointBalance({ bySource: { charged: 10000 } })
    expect(view.bySource).toEqual({ free: 0, subscription: 0, gift: 0, charged: 10000 })
    expect(view.total).toBe(10000)
  })

  it('server 가 available 을 명시하면 그 값을 우선 사용', () => {
    const view = normalizePointBalance({
      bySource: { free: 1000, subscription: 0, gift: 0, charged: 0 },
      available: 999, // server 가 직접 산출한 값
    })
    expect(view.available).toBe(999)
  })
})

describe('normalizePointBalance — 2) 포인트 총량만 (available)', () => {
  it('available 만 있으면 총량 표시, bySource 없음', () => {
    const view = normalizePointBalance({ available: 45000 })
    expect(view.available).toBe(45000)
    expect(view.bySource).toBeUndefined()
  })

  it('total 동반 시 함께 통과', () => {
    const view = normalizePointBalance({ available: 43000, total: 45000, deficit: 2000 })
    expect(view.available).toBe(43000)
    expect(view.total).toBe(45000)
    expect(view.deficit).toBe(2000)
  })
})

describe('normalizePointBalance — 3) 정수 크레딧만 (현행 server, backward compatible)', () => {
  it('credits ×1,000 환산해 available 산출', () => {
    const view = normalizePointBalance({ credits: 100 })
    expect(view.available).toBe(100000)
    expect(view.bySource).toBeUndefined()
  })

  it('credits 0 → available 0', () => {
    expect(normalizePointBalance({ credits: 0 }).available).toBe(0)
  })
})

describe('normalizePointBalance — 방어 처리', () => {
  it('null / undefined → available 0', () => {
    expect(normalizePointBalance(null).available).toBe(0)
    expect(normalizePointBalance(undefined).available).toBe(0)
  })

  it('빈 객체 → available 0 (credits 미지정 → 0 폴백)', () => {
    expect(normalizePointBalance({}).available).toBe(0)
  })

  it('음수 deficit → 0 으로 클램프', () => {
    const view = normalizePointBalance({ credits: 10, deficit: -5 })
    expect(view.deficit).toBe(0)
  })

  it('음수 출처 잔액 → 0 으로 클램프 (잔액은 음수 불가)', () => {
    const view = normalizePointBalance({
      bySource: { free: -100, subscription: 0, gift: 0, charged: 1000 },
    })
    expect(view.bySource?.free).toBe(0)
    expect(view.total).toBe(1000)
  })
})
