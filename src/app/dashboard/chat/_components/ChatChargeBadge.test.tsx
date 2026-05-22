/**
 * @vitest-environment jsdom
 *
 * 크레딧 개편 I Phase — ChatChargeBadge (채팅 메시지 차감 배지) 검증.
 *
 * 정본: shared-contracts §30 ChatMessage / S Phase Draft §14 (web — 채팅 차감 안내).
 *
 * - chargedPoints/chargeTier 가 있으면 구간 라벨 + 차감 pt 표시.
 * - 없으면(과거 무료 메시지 / 차감 실패) 아무것도 렌더하지 않음 (없는 값 추정 금지).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ChatChargeBadge } from './ChatChargeBadge'

afterEach(cleanup)

describe('ChatChargeBadge — 차감 정보 표시', () => {
  it('chargedPoints + chargeTier → 구간 라벨 + 차감 pt 표시', () => {
    const { container } = render(<ChatChargeBadge chargedPoints={810} chargeTier="normal" />)
    expect(container.textContent).toContain('보통 대화')
    expect(container.textContent).toContain('810 pt 차감')
  })

  it('chargeTier 없어도 chargedPoints 만으로 차감 pt 표시', () => {
    const { container } = render(<ChatChargeBadge chargedPoints={3390} chargeTier={null} />)
    expect(container.textContent).toContain('3,390 pt 차감')
  })
})

describe('ChatChargeBadge — 미표시 케이스 (없는 값 추정 금지)', () => {
  it('chargedPoints null → 렌더 결과 없음', () => {
    const { container } = render(<ChatChargeBadge chargedPoints={null} chargeTier={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('chargedPoints undefined → 렌더 결과 없음 (과거 무료 시대 메시지)', () => {
    const { container } = render(<ChatChargeBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('chargedPoints 0 → 렌더 결과 없음 (차감 0 = 미차감 취급)', () => {
    const { container } = render(<ChatChargeBadge chargedPoints={0} chargeTier="short" />)
    expect(container.firstChild).toBeNull()
  })
})
