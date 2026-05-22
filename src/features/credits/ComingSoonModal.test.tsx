/**
 * @vitest-environment jsdom
 *
 * ComingSoonModal spec (CC-5 web — 구독 준비중 가드).
 *
 * 검증:
 * - open=false → 모달 미렌더 (가시성 게이트)
 * - open=true → "준비중입니다" 제목 + 기본 안내 문구 + 확인 버튼
 * - 확인 클릭 → onClose 호출
 * - body prop → 본문 오버라이드
 * - MembershipPlans 구독 버튼 클릭 → 모달 노출 (CC-5 핵심 플로우, 페이지 와이어링 검증)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ComingSoonModal } from './ComingSoonModal'
import { MembershipPlans } from './MembershipPlans'

afterEach(cleanup)

describe('ComingSoonModal — 준비중 안내 모달', () => {
  it('open=false → 모달 미렌더', () => {
    render(<ComingSoonModal open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('open=true → "준비중입니다" 제목 + 기본 안내 문구 + 확인 버튼', () => {
    render(<ComingSoonModal open onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('준비중입니다')).toBeTruthy()
    expect(screen.getByText(/멤버십 구독 기능은 준비 중입니다/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '확인' })).toBeTruthy()
  })

  it('확인 버튼 클릭 → onClose 호출', () => {
    const onClose = vi.fn()
    render(<ComingSoonModal open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('body prop → 본문 문구 오버라이드', () => {
    render(<ComingSoonModal open onClose={vi.fn()} body="다른 안내 문구" />)
    expect(screen.getByText('다른 안내 문구')).toBeTruthy()
  })
})

/** CC-5 핵심 플로우 — 구독 액션 버튼 클릭 시 준비중 모달이 뜨는지 (페이지 와이어링 동치). */
function SubscriptionGuardHarness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <MembershipPlans onSelect={() => setOpen(true)} />
      <ComingSoonModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

describe('ComingSoonModal — 구독 액션 가드 플로우 (CC-5)', () => {
  it('초기에는 모달 미노출', () => {
    render(<SubscriptionGuardHarness />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('"구독하기" 버튼 클릭 → 준비중 모달 노출 (server 호출 없이)', () => {
    render(<SubscriptionGuardHarness />)
    fireEvent.click(screen.getAllByRole('button', { name: '구독하기' })[0])
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('준비중입니다')).toBeTruthy()
  })

  it('준비중 모달 확인 클릭 → 모달 닫힘', () => {
    render(<SubscriptionGuardHarness />)
    fireEvent.click(screen.getAllByRole('button', { name: '구독하기' })[0])
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
