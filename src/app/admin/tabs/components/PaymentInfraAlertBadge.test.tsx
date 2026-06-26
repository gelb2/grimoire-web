/**
 * @vitest-environment jsdom
 *
 * Sprint: PAY-S6 운영알림 최소안 (2026-06-27)
 *
 * - it-1: 초기 로딩 → "로딩 중..." → 모두 정상 → "정상" 배지 (경보 배너 0)
 * - it-2: Circuit OPEN → 경보 배너 + circuit-open 배지
 * - it-3: permanent_failed 누적 > 0 → 경보 배너 + permanent-failed 배지 (정확 count)
 * - it-4: reconciliation mismatch 누적 > 0 → 경보 배너 + mismatch 배지 (정확 count)
 * - it-5: audit action 정확매칭 — adminGetAuditLogs 호출 인자 검증 (2 action 문자열)
 * - it-6: circuit 단일 객체 응답(states 없음) catchall → OPEN 인식
 * - it-7: API 실패 → 에러 fallback (앱 깨지지 않음)
 *
 * 외부 mock: api.adminGetCircuitBreakerState / api.adminGetAuditLogs
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { PaymentInfraAlertBadge } from './PaymentInfraAlertBadge'

vi.mock('@/lib/api', () => ({
  api: {
    adminGetCircuitBreakerState: vi.fn(),
    adminGetAuditLogs: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const mockPolicy = {
  failureThreshold: 5,
  cooldownMs: 60_000,
  halfOpenTrial: 1,
  resetWindowMs: 600_000,
}

const mockState = (
  key: 'polar:checkouts:create' | 'polar:checkouts:list',
  state: 'closed' | 'open' | 'half_open',
) => ({
  key,
  state,
  failureCount: state === 'open' ? 5 : 0,
  halfOpenTrialCount: 0,
  halfOpenSuccessCount: 0,
  policy: mockPolicy,
})

/** adminGetAuditLogs 응답 형식 — { items, total } */
const mockAudit = (total: number) => ({ items: [], total })

describe('PaymentInfraAlertBadge — PAY-S6 운영 경보 배지', () => {
  beforeEach(() => {
    vi.mocked(api.adminGetCircuitBreakerState).mockReset()
    vi.mocked(api.adminGetAuditLogs).mockReset()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('it-1: 모두 정상 → 정상 배지, 경보 배너 0', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [
        mockState('polar:checkouts:create', 'closed'),
        mockState('polar:checkouts:list', 'closed'),
      ],
    })
    vi.mocked(api.adminGetAuditLogs).mockResolvedValue(mockAudit(0))

    render(<PaymentInfraAlertBadge />)

    expect(screen.getByTestId('alert-loading')).toBeTruthy()

    expect(await screen.findByTestId('alert-ok')).toBeTruthy()
    expect(screen.queryByTestId('alert-active')).toBeNull()
    expect(screen.getByTestId('alert-ok').textContent).toContain('정상')
  })

  it('it-2: Circuit OPEN → 경보 배너 + circuit-open 배지', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [
        mockState('polar:checkouts:create', 'open'),
        mockState('polar:checkouts:list', 'closed'),
      ],
    })
    vi.mocked(api.adminGetAuditLogs).mockResolvedValue(mockAudit(0))

    render(<PaymentInfraAlertBadge />)

    expect(await screen.findByTestId('alert-active')).toBeTruthy()
    const circuitBadge = screen.getByTestId('alert-circuit-open')
    expect(circuitBadge.textContent).toContain('OPEN')
    expect(circuitBadge.className).toContain('bg-red-900/50')
    expect(circuitBadge.className).toContain('text-red-400')
    // count 0이므로 count 배지 없음
    expect(screen.queryByTestId('alert-permanent-failed')).toBeNull()
    expect(screen.queryByTestId('alert-mismatch')).toBeNull()
  })

  it('it-3: permanent_failed 누적 > 0 → 경보 배너 + permanent-failed 배지 정확 count', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [mockState('polar:checkouts:create', 'closed')],
    })
    // permanent_failed=3, mismatch=0 순서로 호출됨 (Promise.all 인자 순서)
    vi.mocked(api.adminGetAuditLogs)
      .mockResolvedValueOnce(mockAudit(3))
      .mockResolvedValueOnce(mockAudit(0))

    render(<PaymentInfraAlertBadge />)

    expect(await screen.findByTestId('alert-active')).toBeTruthy()
    const badge = screen.getByTestId('alert-permanent-failed')
    expect(badge.textContent).toContain('3건')
    expect(badge.className).toContain('bg-yellow-900/50')
    expect(screen.queryByTestId('alert-circuit-open')).toBeNull()
    expect(screen.queryByTestId('alert-mismatch')).toBeNull()
  })

  it('it-4: reconciliation mismatch 누적 > 0 → 경보 배너 + mismatch 배지 정확 count', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [mockState('polar:checkouts:create', 'closed')],
    })
    // permanent_failed=0, mismatch=7
    vi.mocked(api.adminGetAuditLogs)
      .mockResolvedValueOnce(mockAudit(0))
      .mockResolvedValueOnce(mockAudit(7))

    render(<PaymentInfraAlertBadge />)

    expect(await screen.findByTestId('alert-active')).toBeTruthy()
    const badge = screen.getByTestId('alert-mismatch')
    expect(badge.textContent).toContain('7건')
    expect(screen.queryByTestId('alert-permanent-failed')).toBeNull()
  })

  it('it-5: audit action 정확매칭 — adminGetAuditLogs 호출 인자 검증', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [mockState('polar:checkouts:create', 'closed')],
    })
    vi.mocked(api.adminGetAuditLogs).mockResolvedValue(mockAudit(0))

    render(<PaymentInfraAlertBadge />)
    await screen.findByTestId('alert-ok')

    await waitFor(() => {
      expect(api.adminGetAuditLogs).toHaveBeenCalledWith({ action: 'webhook_permanent_failed' })
      expect(api.adminGetAuditLogs).toHaveBeenCalledWith({
        action: 'reconciliation_refund_mismatch',
      })
    })
  })

  it('it-6: circuit 단일 객체 응답(states 없음) catchall → OPEN 인식', async () => {
    // server `?key=` 단일 지정 시 단일 객체 반환 가능 — 본 컴포넌트는 전체 조회지만 방어
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce(
      mockState('polar:checkouts:create', 'open'),
    )
    vi.mocked(api.adminGetAuditLogs).mockResolvedValue(mockAudit(0))

    render(<PaymentInfraAlertBadge />)

    expect(await screen.findByTestId('alert-active')).toBeTruthy()
    expect(screen.getByTestId('alert-circuit-open')).toBeTruthy()
  })

  it('it-7: API 실패 → 에러 fallback (앱 깨지지 않음)', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockRejectedValueOnce(new Error('네트워크 오류'))
    vi.mocked(api.adminGetAuditLogs).mockResolvedValue(mockAudit(0))

    render(<PaymentInfraAlertBadge />)

    expect(await screen.findByTestId('alert-error')).toBeTruthy()
    expect(screen.getByTestId('alert-error').textContent).toContain('네트워크 오류')
    expect(screen.queryByTestId('alert-active')).toBeNull()
    expect(screen.queryByTestId('alert-ok')).toBeNull()
  })
})
