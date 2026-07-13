/**
 * @vitest-environment jsdom
 *
 * Sprint: sprint-pay-p0-3-admin-credit-grant-ui (PAY-P0-3)
 * 계약: reports/sprint-pay-p0-3-admin-credit-grant-ui-progress.md AC-1~AC-6
 *
 * VCK AA-1~6 [MUST] + 사용자 명시 (실제 함수 호출 검증) 정합:
 * - it-1: 검색 → adminListAuthors 호출 + 카드 렌더 (AC-1)
 * - it-2: 사용자 선택 → 폼 표시 + 잔액 박제 (AC-1, AC-3)
 * - it-3: 사유 누락 → 지급/차감 버튼 disabled (AC-3)
 * - it-4: amount=0 → 지급/차감 버튼 disabled (AC-2, AC-3)
 * - it-5: 정상 입력 + confirm() 승인 → adminGrantCredits 1회 + toast.success + 잔액 즉시 갱신 (AC-2, AC-6)
 * - it-6: 음수 amount → adminDeductCredits 1회 (AC-2)
 * - it-7: confirm() 취소 → API 호출 0회 (AC-5)
 *
 * 외부 mock: window.confirm / sonner toast / api.{adminListAuthors, adminGrantCredits, adminDeductCredits}
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { CreditsTab } from './CreditsTab'

// sonner toast mock — 모듈 호출 시점 감지
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// api mock — 검색 + grant + deduct
vi.mock('@/lib/api', () => ({
  api: {
    adminListAuthors: vi.fn(),
    adminGrantCredits: vi.fn(),
    adminDeductCredits: vi.fn(),
  },
}))

// 본 spec 내부에서 mock된 모듈 핸들 가져오기
import { toast } from 'sonner'
import { api } from '@/lib/api'

const mockUser = {
  id: 'author-id-12345678',
  name: '홍길동',
  slug: 'gildong',
  email: 'gildong@example.com',
  credits: 100,
  role: 'user',
  plan: 'free',
}

describe('CreditsTab — 운영자 수동 포인트 지급/차감 UI', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.mocked(api.adminListAuthors).mockReset()
    vi.mocked(api.adminGrantCredits).mockReset()
    vi.mocked(api.adminDeductCredits).mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    confirmSpy = vi.spyOn(window, 'confirm')
  })

  afterEach(() => {
    confirmSpy.mockRestore()
    cleanup()
  })

  it('AC-1: 검색어 입력 + 검색 클릭 → adminListAuthors 호출 + 카드 렌더', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })

    render(<CreditsTab />)

    const input = screen.getByPlaceholderText(/작가 검색/)
    fireEvent.change(input, { target: { value: 'gildong' } })

    const searchBtn = screen.getByRole('button', { name: /검색/ })
    fireEvent.click(searchBtn)

    await waitFor(() => {
      expect(api.adminListAuthors).toHaveBeenCalledTimes(1)
      expect(api.adminListAuthors).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        q: 'gildong',
      })
    })

    // 카드 렌더 — name + slug + email + 잔액 박제
    expect(await screen.findByText('홍길동')).toBeTruthy()
    expect(screen.getByText('@gildong')).toBeTruthy()
    expect(screen.getByText('gildong@example.com')).toBeTruthy()
    // 잔액 100 박제 (검색 결과 카드)
    const balanceMatches = screen.getAllByText((_content, el) =>
      el?.textContent?.includes('100') === true && el?.textContent?.includes('포인트') === true
    )
    expect(balanceMatches.length).toBeGreaterThan(0)
  })

  it('AC-1+AC-3: 사용자 선택 → 폼 표시 + 잔액 박제 + 사유 누락 시 버튼 disabled', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    render(<CreditsTab />)

    fireEvent.change(screen.getByPlaceholderText(/작가 검색/), { target: { value: 'gildong' } })
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    await screen.findByText('홍길동')

    fireEvent.click(screen.getByRole('button', { name: /선택/ }))

    // "선택된 사용자" 카드 박제
    expect(await screen.findByText(/선택된 사용자/)).toBeTruthy()
    // 폼 입력 표시
    const amountInput = screen.getByPlaceholderText(/포인트 수량/)
    const reasonInput = screen.getByPlaceholderText(/사유/)
    expect(amountInput).toBeTruthy()
    expect(reasonInput).toBeTruthy()
    // helper text — VCK AA-7 [NICE] 박제
    expect(screen.getByText(/audit log에 영구 박제/)).toBeTruthy()

    // 사유 누락 + amount 입력 → 버튼 disabled
    fireEvent.change(amountInput, { target: { value: '50' } })
    const grantBtn = screen.getByRole('button', { name: /^지급$/ })
    const deductBtn = screen.getByRole('button', { name: /^차감$/ })
    expect((grantBtn as HTMLButtonElement).disabled).toBe(true)
    expect((deductBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('AC-3: amount=0 + 사유 입력 → 지급/차감 버튼 disabled', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    render(<CreditsTab />)

    fireEvent.change(screen.getByPlaceholderText(/작가 검색/), { target: { value: 'gildong' } })
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /선택/ }))

    fireEvent.change(screen.getByPlaceholderText(/포인트 수량/), { target: { value: '0' } })
    fireEvent.change(screen.getByPlaceholderText(/사유/), { target: { value: '테스트' } })

    const grantBtn = screen.getByRole('button', { name: /^지급$/ })
    expect((grantBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('AC-2+AC-5+AC-6: 정상 입력 → confirm() 승인 → adminGrantCredits 1회 + toast.success + 잔액 즉시 갱신', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    vi.mocked(api.adminGrantCredits).mockResolvedValueOnce({ credits: 150 })
    confirmSpy.mockReturnValueOnce(true)

    render(<CreditsTab />)
    fireEvent.change(screen.getByPlaceholderText(/작가 검색/), { target: { value: 'gildong' } })
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /선택/ }))

    fireEvent.change(screen.getByPlaceholderText(/포인트 수량/), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText(/사유/), { target: { value: '이벤트 보상' } })

    const grantBtn = screen.getByRole('button', { name: /^지급$/ })
    expect((grantBtn as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(grantBtn)

    // confirm() 호출 검증 — VCK AA-5 정본 (네이티브)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
    const confirmMsg = confirmSpy.mock.calls[0][0] as string
    expect(confirmMsg).toContain('홍길동')
    expect(confirmMsg).toContain('@gildong')
    expect(confirmMsg).toContain('50')
    expect(confirmMsg).toContain('지급')
    expect(confirmMsg).toContain('이벤트 보상')
    expect(confirmMsg).toContain('100') // 현재 잔액
    expect(confirmMsg).toContain('150') // 변경 후

    await waitFor(() => {
      expect(api.adminGrantCredits).toHaveBeenCalledTimes(1)
      expect(api.adminGrantCredits).toHaveBeenCalledWith(
        'author-id-12345678',
        50,
        '이벤트 보상'
      )
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1)
    })
    const toastMsg = vi.mocked(toast.success).mock.calls[0][0] as string
    expect(toastMsg).toContain('홍길동')
    expect(toastMsg).toContain('150')

    // 잔액 즉시 갱신 검증 — VCK AA-6 (선택된 사용자 카드의 잔액 텍스트가 150으로 갱신)
    await waitFor(() => {
      const balanceEl = screen.getByText('150')
      expect(balanceEl).toBeTruthy()
      // span.font-bold 잔액 노드여야 함 (CreditsTab에서 잔액은 <span className="font-bold">로 박제)
      expect(balanceEl.className).toContain('font-bold')
    })

    // deduct는 호출 0건
    expect(api.adminDeductCredits).not.toHaveBeenCalled()
  })

  it('AC-2: 음수 amount + 차감 버튼 → adminDeductCredits 1회 호출 (절대값)', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    vi.mocked(api.adminDeductCredits).mockResolvedValueOnce({ credits: 70 })
    confirmSpy.mockReturnValueOnce(true)

    render(<CreditsTab />)
    fireEvent.change(screen.getByPlaceholderText(/작가 검색/), { target: { value: 'gildong' } })
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /선택/ }))

    fireEvent.change(screen.getByPlaceholderText(/포인트 수량/), { target: { value: '-30' } })
    fireEvent.change(screen.getByPlaceholderText(/사유/), { target: { value: '오지급 회수' } })

    fireEvent.click(screen.getByRole('button', { name: /^차감$/ }))

    await waitFor(() => {
      expect(api.adminDeductCredits).toHaveBeenCalledTimes(1)
      expect(api.adminDeductCredits).toHaveBeenCalledWith(
        'author-id-12345678',
        30, // Math.abs(-30) — 백엔드는 양수 수령
        '오지급 회수'
      )
    })

    expect(api.adminGrantCredits).not.toHaveBeenCalled()
  })

  it('AC-5: confirm() 취소 → API 호출 0회 + toast 0회', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    confirmSpy.mockReturnValueOnce(false)

    render(<CreditsTab />)
    fireEvent.change(screen.getByPlaceholderText(/작가 검색/), { target: { value: 'gildong' } })
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /선택/ }))

    fireEvent.change(screen.getByPlaceholderText(/포인트 수량/), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText(/사유/), { target: { value: '테스트' } })
    fireEvent.click(screen.getByRole('button', { name: /^지급$/ }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(api.adminGrantCredits).not.toHaveBeenCalled()
    expect(api.adminDeductCredits).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('AC-6: API 실패 → toast.error 호출', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    vi.mocked(api.adminGrantCredits).mockRejectedValueOnce(new Error('네트워크 오류'))
    confirmSpy.mockReturnValueOnce(true)

    render(<CreditsTab />)
    fireEvent.change(screen.getByPlaceholderText(/작가 검색/), { target: { value: 'gildong' } })
    fireEvent.click(screen.getByRole('button', { name: /검색/ }))
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /선택/ }))

    fireEvent.change(screen.getByPlaceholderText(/포인트 수량/), { target: { value: '50' } })
    fireEvent.change(screen.getByPlaceholderText(/사유/), { target: { value: '테스트' } })
    fireEvent.click(screen.getByRole('button', { name: /^지급$/ }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1)
    })
    expect(vi.mocked(toast.error).mock.calls[0][0]).toContain('네트워크 오류')
  })
})
