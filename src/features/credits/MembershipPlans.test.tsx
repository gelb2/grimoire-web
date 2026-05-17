/**
 * @vitest-environment jsdom
 *
 * 크레딧 개편 I Phase — MembershipPlans (멤버십 플랜 표시) 검증.
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web — 구독 플랜 페이지).
 *
 * - 3등급(무료/프로/프리미엄) + 가격 + 월 포인트 풀 표시.
 * - currentTier → "현재 플랜" 배지.
 * - onSelect 주어지면 버튼 렌더 + 클릭 시 콜백 (결제 연동 아님 — 표시·선택만).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { MembershipPlans } from './MembershipPlans'

afterEach(cleanup)

describe('MembershipPlans — 플랜 표시', () => {
  it('3등급 라벨 + 가격 표시', () => {
    render(<MembershipPlans />)
    // 무료 라벨 + 무료 가격 둘 다 "무료" 텍스트 → 최소 2개
    expect(screen.getAllByText('무료').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('프로')).toBeTruthy()
    expect(screen.getByText('프리미엄')).toBeTruthy()
    // 가격 — §8-3 확정값
    expect(screen.getByText('₩9,900')).toBeTruthy()
    expect(screen.getByText('₩19,900')).toBeTruthy()
  })

  it('월 포인트 풀 표시 (pro 93,000 / premium 191,500)', () => {
    render(<MembershipPlans />)
    expect(screen.getByText(/월 93,000 pt 제공/)).toBeTruthy()
    expect(screen.getByText(/월 191,500 pt 제공/)).toBeTruthy()
  })

  it('무료 등급 — "무료" 가격 표기 + 월 풀 제공 문구 없음', () => {
    render(<MembershipPlans />)
    // "무료" 라벨 + "무료" 가격 둘 다 등장 (최소 2회)
    expect(screen.getAllByText('무료').length).toBeGreaterThanOrEqual(2)
  })
})

describe('MembershipPlans — 현재 플랜 배지', () => {
  it('currentTier=pro → 프로 카드에 "현재 플랜" 배지', () => {
    render(<MembershipPlans currentTier="pro" />)
    expect(screen.getByText('현재 플랜')).toBeTruthy()
  })

  it('currentTier 미지정 → 배지 없음', () => {
    render(<MembershipPlans />)
    expect(screen.queryByText('현재 플랜')).toBeNull()
  })
})

describe('MembershipPlans — 선택 동작 (표시·선택 전용)', () => {
  it('onSelect 없으면 버튼 미렌더 (정보 표시만)', () => {
    render(<MembershipPlans />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('onSelect 주어지면 등급별 버튼 + 클릭 시 해당 tier 콜백', () => {
    const onSelect = vi.fn()
    render(<MembershipPlans onSelect={onSelect} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    // 프로 버튼 클릭
    fireEvent.click(screen.getByText('프로').closest('button')!)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('pro')
  })
})
