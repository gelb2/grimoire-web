/**
 * 크레딧 개편 I Phase — credit-overhaul.ts 도메인 상수 + 디노미 표시 유틸 검증.
 *
 * 정본: shared-contracts §30 CreditOverhaul / S Phase Draft §8-1.
 *
 * - CREDIT_TO_POINT / CHAT_CHARGE_TIERS / MEMBERSHIP_* 가 §30 확정값과 일치 (수치 회귀 차단).
 * - creditsToPoints / formatPoints / abbreviatePoints / chatChargeTierInfo 동작.
 */
import { describe, it, expect } from 'vitest'
import {
  CREDIT_TO_POINT,
  CREDIT_CONSUMPTION_ORDER,
  CHAT_CHARGE_TIERS,
  ANALYSIS_POINT_COST,
  THEME_POINT_COST,
  MEMBERSHIP_MONTHLY_POOL,
  MEMBERSHIP_PRICE_KRW,
  MEMBERSHIP_PLANS,
  creditsToPoints,
  formatPoints,
  abbreviatePoints,
  chatChargeTierInfo,
} from './credit-overhaul'

describe('credit-overhaul — §30 확정 수치 (회귀 차단)', () => {
  it('CREDIT_TO_POINT — 디노미네이션 1크레딧 = 1,000pt', () => {
    expect(CREDIT_TO_POINT).toBe(1000)
  })

  it('CREDIT_CONSUMPTION_ORDER — 소진 우선순위 무료적립→구독→선물→충전', () => {
    expect(CREDIT_CONSUMPTION_ORDER).toEqual(['free', 'subscription', 'gift', 'charged'])
  })

  it('CHAT_CHARGE_TIERS — 4구간 (3구간 금지, §8-8 #4) + 차감 N §8 확정값', () => {
    expect(CHAT_CHARGE_TIERS).toHaveLength(4)
    expect(CHAT_CHARGE_TIERS.map((t) => t.tier)).toEqual(['short', 'normal', 'long', 'xlong'])
    expect(CHAT_CHARGE_TIERS.map((t) => t.points)).toEqual([190, 810, 3390, 5520])
  })

  it('ANALYSIS_POINT_COST / THEME_POINT_COST — §8-4 정액 차감', () => {
    expect(ANALYSIS_POINT_COST).toBe(2440)
    expect(THEME_POINT_COST).toBe(590)
  })

  it('MEMBERSHIP_MONTHLY_POOL — free 0 / pro 93,000 / premium 191,500 (§8-3)', () => {
    expect(MEMBERSHIP_MONTHLY_POOL).toEqual({ free: 0, pro: 93000, premium: 191500 })
  })

  it('MEMBERSHIP_PRICE_KRW — pro ₩9,900 / premium ₩19,900 (§8-3)', () => {
    expect(MEMBERSHIP_PRICE_KRW).toEqual({ free: 0, pro: 9900, premium: 19900 })
  })

  it('MEMBERSHIP_PLANS — 3등급, 풀/가격이 상수와 일치', () => {
    expect(MEMBERSHIP_PLANS.map((p) => p.tier)).toEqual(['free', 'pro', 'premium'])
    for (const plan of MEMBERSHIP_PLANS) {
      expect(plan.monthlyPool).toBe(MEMBERSHIP_MONTHLY_POOL[plan.tier])
      expect(plan.priceKrw).toBe(MEMBERSHIP_PRICE_KRW[plan.tier])
      expect(plan.features.length).toBeGreaterThan(0)
    }
  })
})

describe('credit-overhaul — creditsToPoints', () => {
  it('정수 크레딧 ×1,000 환산', () => {
    expect(creditsToPoints(5)).toBe(5000)
    expect(creditsToPoints(0)).toBe(0)
    expect(creditsToPoints(100)).toBe(100000)
  })

  it('음수 크레딧(차감 로그)도 부호 유지 환산', () => {
    expect(creditsToPoints(-4)).toBe(-4000)
  })
})

describe('credit-overhaul — formatPoints (천단위 구분)', () => {
  it('천단위 콤마 표기', () => {
    expect(formatPoints(93000)).toBe('93,000')
    expect(formatPoints(191500)).toBe('191,500')
    expect(formatPoints(190)).toBe('190')
  })

  it('0 / 소수 입력 — 0 및 반올림 표기', () => {
    expect(formatPoints(0)).toBe('0')
    expect(formatPoints(1234.6)).toBe('1,235')
  })
})

describe('credit-overhaul — abbreviatePoints (§8-1 큰 숫자 완화)', () => {
  it('1만 미만 — 천단위 그대로', () => {
    expect(abbreviatePoints(950)).toBe('950')
    expect(abbreviatePoints(9999)).toBe('9,999')
  })

  it('1만 이상 — 만 단위 축약 (소수점 1자리)', () => {
    expect(abbreviatePoints(93000)).toBe('9.3만')
    // 191,500 / 10,000 = 19.15 → toFixed(1) IEEE-754 절사 → '19.1만'
    expect(abbreviatePoints(191500)).toBe('19.1만')
    expect(abbreviatePoints(125000)).toBe('12.5만')
  })

  it('만 단위 정수 — 소수부 제거', () => {
    expect(abbreviatePoints(50000)).toBe('5만')
    expect(abbreviatePoints(10000)).toBe('1만')
  })

  it('1억 이상 — 억 단위 축약', () => {
    expect(abbreviatePoints(120000000)).toBe('1.2억')
    expect(abbreviatePoints(100000000)).toBe('1억')
  })
})

describe('credit-overhaul — chatChargeTierInfo', () => {
  it('유효 구간 식별자 → 구간 정보 반환', () => {
    expect(chatChargeTierInfo('short')?.points).toBe(190)
    expect(chatChargeTierInfo('xlong')?.points).toBe(5520)
    expect(chatChargeTierInfo('normal')?.label).toBe('보통 대화')
  })

  it('null / undefined / 미지의 구간 → null', () => {
    expect(chatChargeTierInfo(null)).toBeNull()
    expect(chatChargeTierInfo(undefined)).toBeNull()
    expect(chatChargeTierInfo('unknown')).toBeNull()
  })
})
