/**
 * @vitest-environment jsdom
 *
 * Sprint: sprint-pay-s3-circuit-breaker-admin (PAY-S3 Phase B)
 * 계약: planner §6-1 C3f — 6 케이스
 *
 * - it-1: 초기 로딩 → "로딩 중..." 박제 → API resolve → 2 호출점 카드 렌더
 * - it-2: state 배지 3 상태 (CLOSED/OPEN/HALF_OPEN) 색상 정합
 * - it-3: Reset 버튼 → prompt + confirm 다이얼로그 → API 호출 + 자동 refresh
 * - it-4: Trip 버튼 → ⚠️ 경고 + prompt + confirm → API 호출 + 자동 refresh
 * - it-5: prompt에서 빈값 입력 → 클라이언트 차단 (API 호출 0)
 * - it-6: API 호출 mock 검증 (정상 인자 전달)
 *
 * 외부 mock: window.prompt / window.confirm / window.alert / api.adminGetCircuitBreakerState / adminResetCircuitBreaker / adminTripCircuitBreaker
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { CircuitBreakerPanel } from './CircuitBreakerPanel'

vi.mock('@/lib/api', () => ({
  api: {
    adminGetCircuitBreakerState: vi.fn(),
    adminResetCircuitBreaker: vi.fn(),
    adminTripCircuitBreaker: vi.fn(),
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
  openedAt: state !== 'closed' ? '2026-05-23T10:00:00.000Z' : undefined,
  halfOpenAt: state === 'half_open' ? '2026-05-23T10:01:00.000Z' : undefined,
  halfOpenTrialCount: state === 'half_open' ? 1 : 0,
  halfOpenSuccessCount: 0,
  lastSuccessAt: '2026-05-23T09:00:00.000Z',
  lastFailureAt: state !== 'closed' ? '2026-05-23T10:00:00.000Z' : undefined,
  policy: mockPolicy,
})

describe('CircuitBreakerPanel — 운영자 Circuit Breaker UI', () => {
  let promptSpy: ReturnType<typeof vi.spyOn>
  let confirmSpy: ReturnType<typeof vi.spyOn>
  let alertSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.mocked(api.adminGetCircuitBreakerState).mockReset()
    vi.mocked(api.adminResetCircuitBreaker).mockReset()
    vi.mocked(api.adminTripCircuitBreaker).mockReset()
    promptSpy = vi.spyOn(window, 'prompt')
    confirmSpy = vi.spyOn(window, 'confirm')
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    promptSpy.mockRestore()
    confirmSpy.mockRestore()
    alertSpy.mockRestore()
    vi.useRealTimers()
    cleanup()
  })

  it('it-1: 초기 로딩 → API resolve → 2 호출점 카드 렌더', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [
        mockState('polar:checkouts:create', 'closed'),
        mockState('polar:checkouts:list', 'closed'),
      ],
    })

    render(<CircuitBreakerPanel />)

    expect(screen.getByText(/Circuit Breaker 상태 로딩 중/)).toBeTruthy()

    await waitFor(() => {
      expect(api.adminGetCircuitBreakerState).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByTestId('cb-row-polar:checkouts:create')).toBeTruthy()
    expect(screen.getByTestId('cb-row-polar:checkouts:list')).toBeTruthy()
  })

  it('it-2: state 배지 3 상태 (CLOSED/OPEN/HALF_OPEN) 색상 정합', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [
        mockState('polar:checkouts:create', 'open'),
        mockState('polar:checkouts:list', 'half_open'),
      ],
    })

    render(<CircuitBreakerPanel />)

    const createBadge = await screen.findByTestId('cb-badge-polar:checkouts:create')
    const listBadge = await screen.findByTestId('cb-badge-polar:checkouts:list')

    // OPEN → 적색
    expect(createBadge.className).toContain('bg-red-900/50')
    expect(createBadge.className).toContain('text-red-400')
    expect(createBadge.textContent).toBe('OPEN')

    // HALF_OPEN → 황색
    expect(listBadge.className).toContain('bg-yellow-900/50')
    expect(listBadge.className).toContain('text-yellow-400')
    expect(listBadge.textContent).toBe('HALF_OPEN')

    // CLOSED 케이스도 확인 — 새 mock으로 다시 렌더
    cleanup()
    vi.mocked(api.adminGetCircuitBreakerState).mockReset()
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [mockState('polar:checkouts:create', 'closed')],
    })
    render(<CircuitBreakerPanel />)
    const closedBadge = await screen.findByTestId('cb-badge-polar:checkouts:create')
    expect(closedBadge.className).toContain('bg-green-900/50')
    expect(closedBadge.className).toContain('text-green-400')
    expect(closedBadge.textContent).toBe('CLOSED')
  })

  it('it-3: Reset 버튼 → prompt + confirm → adminResetCircuitBreaker 호출 + 자동 refresh', async () => {
    vi.mocked(api.adminGetCircuitBreakerState)
      .mockResolvedValueOnce({
        states: [mockState('polar:checkouts:create', 'open')],
      })
      .mockResolvedValueOnce({
        states: [mockState('polar:checkouts:create', 'closed')],
      })
    vi.mocked(api.adminResetCircuitBreaker).mockResolvedValueOnce({
      success: true,
      beforeState: 'open',
      afterState: 'closed',
    })
    promptSpy.mockReturnValueOnce('수동 복구 — 사고 대응 종료')
    confirmSpy.mockReturnValueOnce(true)

    render(<CircuitBreakerPanel />)

    await screen.findByTestId('cb-row-polar:checkouts:create')
    fireEvent.click(screen.getByTestId('cb-reset-polar:checkouts:create'))

    expect(promptSpy).toHaveBeenCalledTimes(1)
    expect(promptSpy.mock.calls[0][0]).toContain('강제 복구')
    expect(promptSpy.mock.calls[0][0]).toContain('polar:checkouts:create')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toContain('강제 복구')

    await waitFor(() => {
      expect(api.adminResetCircuitBreaker).toHaveBeenCalledTimes(1)
      expect(api.adminResetCircuitBreaker).toHaveBeenCalledWith(
        'polar:checkouts:create',
        '수동 복구 — 사고 대응 종료',
      )
    })

    // 자동 refresh — getState 2회째 호출
    await waitFor(() => {
      expect(api.adminGetCircuitBreakerState).toHaveBeenCalledTimes(2)
    })

    expect(api.adminTripCircuitBreaker).not.toHaveBeenCalled()
  })

  it('it-4: Trip 버튼 → ⚠️ 경고 + prompt + confirm → adminTripCircuitBreaker 호출 + 자동 refresh', async () => {
    vi.mocked(api.adminGetCircuitBreakerState)
      .mockResolvedValueOnce({
        states: [mockState('polar:checkouts:create', 'closed')],
      })
      .mockResolvedValueOnce({
        states: [mockState('polar:checkouts:create', 'open')],
      })
    vi.mocked(api.adminTripCircuitBreaker).mockResolvedValueOnce({
      success: true,
      beforeState: 'closed',
      afterState: 'open',
    })
    promptSpy.mockReturnValueOnce('연습 — 결제 차단 시뮬레이션')
    confirmSpy.mockReturnValueOnce(true)

    render(<CircuitBreakerPanel />)

    await screen.findByTestId('cb-row-polar:checkouts:create')

    // ⚠️ 버튼 텍스트 시각 강조 검증
    const tripBtn = screen.getByTestId('cb-trip-polar:checkouts:create')
    expect(tripBtn.textContent).toContain('⚠️')
    expect(tripBtn.className).toContain('bg-red-700/50')

    fireEvent.click(tripBtn)

    // prompt + confirm 메시지에 ⚠️ 경고 박제
    expect(promptSpy).toHaveBeenCalledTimes(1)
    expect(promptSpy.mock.calls[0][0]).toContain('⚠️')
    expect(promptSpy.mock.calls[0][0]).toContain('503')

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy.mock.calls[0][0]).toContain('⚠️')

    await waitFor(() => {
      expect(api.adminTripCircuitBreaker).toHaveBeenCalledTimes(1)
      expect(api.adminTripCircuitBreaker).toHaveBeenCalledWith(
        'polar:checkouts:create',
        '연습 — 결제 차단 시뮬레이션',
      )
    })

    await waitFor(() => {
      expect(api.adminGetCircuitBreakerState).toHaveBeenCalledTimes(2)
    })

    expect(api.adminResetCircuitBreaker).not.toHaveBeenCalled()
  })

  it('it-5: prompt에서 빈값 입력 → 클라이언트 차단 (API 호출 0)', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [mockState('polar:checkouts:create', 'open')],
    })
    promptSpy.mockReturnValueOnce('   ') // 공백만

    render(<CircuitBreakerPanel />)
    await screen.findByTestId('cb-row-polar:checkouts:create')

    fireEvent.click(screen.getByTestId('cb-reset-polar:checkouts:create'))

    expect(promptSpy).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith('사유(reason)는 필수입니다.')
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(api.adminResetCircuitBreaker).not.toHaveBeenCalled()
    expect(api.adminTripCircuitBreaker).not.toHaveBeenCalled()
  })

  it('it-6: confirm 취소 → API 호출 0 + trip prompt null cancel도 차단', async () => {
    vi.mocked(api.adminGetCircuitBreakerState).mockResolvedValueOnce({
      states: [mockState('polar:checkouts:create', 'closed')],
    })
    // Trip prompt 취소 (null 반환)
    promptSpy.mockReturnValueOnce(null)

    render(<CircuitBreakerPanel />)
    await screen.findByTestId('cb-row-polar:checkouts:create')

    fireEvent.click(screen.getByTestId('cb-trip-polar:checkouts:create'))

    expect(promptSpy).toHaveBeenCalledTimes(1)
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(api.adminTripCircuitBreaker).not.toHaveBeenCalled()

    // 두 번째 시도 — prompt 정상 입력 + confirm 취소
    promptSpy.mockReturnValueOnce('테스트 사유')
    confirmSpy.mockReturnValueOnce(false)
    fireEvent.click(screen.getByTestId('cb-trip-polar:checkouts:create'))

    expect(promptSpy).toHaveBeenCalledTimes(2)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(api.adminTripCircuitBreaker).not.toHaveBeenCalled()
    expect(api.adminResetCircuitBreaker).not.toHaveBeenCalled()
  })
})
