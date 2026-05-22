/**
 * @vitest-environment jsdom
 *
 * 크레딧 개편 I Phase — MembershipPlans (멤버십 플랜 표시) 검증.
 * CC-5 web (2026-05-22) — 표시 전용 → 구독 액션 버튼 노출 검증 추가.
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web — 구독 플랜 페이지).
 *
 * - 3등급(무료/프로/프리미엄) + 가격 + 월 포인트 풀 표시.
 * - currentTier → "현재 플랜" 배지 + 해당 카드 버튼 비활성.
 * - onSelect 주어지면 카드마다 액션 버튼 렌더 (free 는 비활성, pro/premium 은 "구독하기").
 *   클릭 시 해당 tier 콜백 (CC-5: 결제 연동 아님 — 준비중 모달 트리거용).
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

  it('무료 등급 — "무료" 가격 표기', () => {
    render(<MembershipPlans />)
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

describe('MembershipPlans — 구독 액션 버튼 (CC-5)', () => {
  it('onSelect 없으면 버튼 미렌더 (정보 표시만)', () => {
    render(<MembershipPlans />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('onSelect 주어지면 카드마다 액션 버튼 — 3개 렌더', () => {
    render(<MembershipPlans onSelect={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('pro/premium 은 "구독하기" 버튼, free 는 "무료 플랜" 비활성 버튼', () => {
    render(<MembershipPlans onSelect={vi.fn()} />)
    const subscribeButtons = screen.getAllByRole('button', { name: '구독하기' })
    expect(subscribeButtons).toHaveLength(2)
    subscribeButtons.forEach((btn) => expect(btn).not.toBeDisabled())
    const freeButton = screen.getByRole('button', { name: '무료 플랜' })
    expect(freeButton).toBeDisabled()
  })

  it('프로 "구독하기" 클릭 시 pro tier 콜백', () => {
    const onSelect = vi.fn()
    render(<MembershipPlans onSelect={onSelect} />)
    // "구독하기" 버튼 2개(pro/premium) — 첫 번째가 pro (MEMBERSHIP_PLANS 순서)
    fireEvent.click(screen.getAllByRole('button', { name: '구독하기' })[0])
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('pro')
  })

  it('currentTier=pro → 프로 카드 버튼은 "현재 플랜" 비활성, 클릭해도 콜백 없음', () => {
    const onSelect = vi.fn()
    render(<MembershipPlans currentTier="pro" onSelect={onSelect} />)
    const currentBtn = screen.getByRole('button', { name: '현재 플랜' })
    expect(currentBtn).toBeDisabled()
    fireEvent.click(currentBtn)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
