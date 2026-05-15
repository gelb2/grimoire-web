/**
 * @vitest-environment jsdom
 *
 * UsersTab spec (USER-SOFT-DELETE sprint §15-1 web — 운영자 강제 탈퇴 + GDPR 익명화 영역).
 *
 * 검증 영역:
 * - it-1: 검색 → adminListAuthors 호출 + 카드 + 강제 탈퇴/익명화 버튼 영역 표시 (AC-1)
 * - it-2: 강제 탈퇴 버튼 → 사유 모달 영역 표시 + 사유 미박제 시 confirm + API 호출 0
 * - it-3: 강제 탈퇴 + 사유 박제 + confirm() 승인 → adminForceDeleteAuthor 1회 + toast.success (AC-3)
 * - it-4: 익명화 + 사유 박제 + confirm() 승인 → adminAnonymizeAuthor 1회 + toast.success (AC-4)
 * - it-5: confirm() 취소 → API 호출 0회 (AC-5)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { UsersTab } from './UsersTab'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/api', () => ({
  api: {
    adminListAuthors: vi.fn(),
    adminForceDeleteAuthor: vi.fn(),
    adminAnonymizeAuthor: vi.fn(),
  },
}))

import { toast } from 'sonner'
import { api } from '@/lib/api'

const mockUser = {
  id: 'author-uuid-12345',
  name: '홍길동',
  slug: 'gildong',
  email: 'gildong@example.com',
  credits: 100,
  role: 'user',
  plan: 'free',
  deletedAt: null,
}

describe('UsersTab — 운영자 force delete + GDPR anonymize', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.mocked(api.adminListAuthors).mockReset()
    vi.mocked(api.adminForceDeleteAuthor).mockReset()
    vi.mocked(api.adminAnonymizeAuthor).mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    confirmSpy = vi.spyOn(window, 'confirm')
  })

  afterEach(() => {
    confirmSpy.mockRestore()
    cleanup()
  })

  it('AC-1: 마운트 → adminListAuthors 호출 + 카드 렌더 + 강제 탈퇴/익명화 버튼 표시', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })

    render(<UsersTab />)

    await waitFor(() => {
      expect(api.adminListAuthors).toHaveBeenCalled()
    })

    expect(await screen.findByText('홍길동')).toBeTruthy()
    expect(screen.getByText('@gildong')).toBeTruthy()
    expect(screen.getByText('gildong@example.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: /강제 탈퇴/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /익명화/ })).toBeTruthy()
  })

  it('AC-3: 강제 탈퇴 클릭 → 사유 모달 영역 표시 + 사유 미박제 시 disabled', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValueOnce({
      items: [mockUser],
      total: 1,
    })
    render(<UsersTab />)

    await screen.findByText('홍길동')

    fireEvent.click(screen.getByRole('button', { name: /강제 탈퇴/ }))

    // 모달 영역 영역 박제 (role=dialog)
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getAllByText(/강제 탈퇴/).length).toBeGreaterThan(0)

    // 사유 미박제 → 액션 버튼 영역 disabled (모달 내부 confirm 버튼)
    const buttons = screen.getAllByRole('button', { name: /강제 탈퇴/ })
    const modalConfirmBtn = buttons[buttons.length - 1] as HTMLButtonElement
    expect(modalConfirmBtn.disabled).toBe(true)
  })

  it('AC-3: 강제 탈퇴 + 사유 박제 + confirm() 승인 → adminForceDeleteAuthor 1회 + toast.success', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValue({ items: [mockUser], total: 1 })
    vi.mocked(api.adminForceDeleteAuthor).mockResolvedValueOnce({ deletedAt: '2026-05-15T10:00:00Z' })
    confirmSpy.mockReturnValueOnce(true)

    render(<UsersTab />)
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /강제 탈퇴/ }))

    const reasonInput = await screen.findByPlaceholderText(/감사 로그/)
    fireEvent.change(reasonInput, { target: { value: '약관 위반 사유 영역' } })

    const buttons = screen.getAllByRole('button', { name: /강제 탈퇴/ })
    const modalConfirmBtn = buttons[buttons.length - 1] as HTMLButtonElement
    expect(modalConfirmBtn.disabled).toBe(false)
    fireEvent.click(modalConfirmBtn)

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    const confirmMsg = confirmSpy.mock.calls[0][0] as string
    expect(confirmMsg).toContain('홍길동')
    expect(confirmMsg).toContain('@gildong')
    expect(confirmMsg).toContain('강제 탈퇴')
    expect(confirmMsg).toContain('약관 위반 사유 영역')
    expect(confirmMsg).toContain('AdminAuditLog')

    await waitFor(() => {
      expect(api.adminForceDeleteAuthor).toHaveBeenCalledTimes(1)
      expect(api.adminForceDeleteAuthor).toHaveBeenCalledWith(
        'author-uuid-12345',
        '약관 위반 사유 영역'
      )
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1)
    })
    const toastMsg = vi.mocked(toast.success).mock.calls[0][0] as string
    expect(toastMsg).toContain('홍길동')
    expect(toastMsg).toContain('강제 탈퇴')

    expect(api.adminAnonymizeAuthor).not.toHaveBeenCalled()
  })

  it('AC-4: 익명화 + 사유 박제 + confirm() 승인 → adminAnonymizeAuthor 1회 + toast.success', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValue({ items: [mockUser], total: 1 })
    vi.mocked(api.adminAnonymizeAuthor).mockResolvedValueOnce({ anonymizedAt: '2026-05-15T10:00:00Z' })
    confirmSpy.mockReturnValueOnce(true)

    render(<UsersTab />)
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /익명화/ }))

    const reasonInput = await screen.findByPlaceholderText(/감사 로그/)
    fireEvent.change(reasonInput, { target: { value: 'GDPR 영역 요청' } })

    const buttons = screen.getAllByRole('button', { name: /GDPR 익명화/ })
    const modalConfirmBtn = buttons[buttons.length - 1] as HTMLButtonElement
    fireEvent.click(modalConfirmBtn)

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    const confirmMsg = confirmSpy.mock.calls[0][0] as string
    expect(confirmMsg).toContain('홍길동')
    expect(confirmMsg).toContain('GDPR 익명화')
    expect(confirmMsg).toContain('GDPR 영역 요청')

    await waitFor(() => {
      expect(api.adminAnonymizeAuthor).toHaveBeenCalledTimes(1)
      expect(api.adminAnonymizeAuthor).toHaveBeenCalledWith(
        'author-uuid-12345',
        'GDPR 영역 요청'
      )
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledTimes(1)
    })

    expect(api.adminForceDeleteAuthor).not.toHaveBeenCalled()
  })

  it('AC-5: confirm() 취소 → API 호출 0회', async () => {
    vi.mocked(api.adminListAuthors).mockResolvedValue({ items: [mockUser], total: 1 })
    confirmSpy.mockReturnValueOnce(false)

    render(<UsersTab />)
    await screen.findByText('홍길동')
    fireEvent.click(screen.getByRole('button', { name: /강제 탈퇴/ }))

    const reasonInput = await screen.findByPlaceholderText(/감사 로그/)
    fireEvent.change(reasonInput, { target: { value: '테스트 영역' } })

    const buttons = screen.getAllByRole('button', { name: /강제 탈퇴/ })
    const modalConfirmBtn = buttons[buttons.length - 1] as HTMLButtonElement
    fireEvent.click(modalConfirmBtn)

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(api.adminForceDeleteAuthor).not.toHaveBeenCalled()
    expect(api.adminAnonymizeAuthor).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
