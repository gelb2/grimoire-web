/**
 * @vitest-environment jsdom
 *
 * AccountDeleteDialog spec (USER-SOFT-DELETE sprint §15-1 web 영역).
 *
 * 검증 영역:
 * - it-1: open=false → 모달 영역 렌더 0건 (가시성 게이트)
 * - it-2: slug 영역 미일치 → 탈퇴 버튼 disabled + 에러 메시지 표시
 * - it-3: slug 정합 + 동의 체크박스 영역 → 탈퇴 버튼 활성 + onConfirm 영역 사유 박제 호출
 * - it-4: onConfirm 실패 시 → 에러 메시지 표시 + 모달 영역 영역 유지 (영역 영역 0)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { AccountDeleteDialog } from './AccountDeleteDialog'

describe('AccountDeleteDialog — 본인 계정 탈퇴 모달', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('open=false → 모달 영역 렌더 0건', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    const { container } = render(
      <AccountDeleteDialog
        open={false}
        slug="testuser"
        name="테스트 작가"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )
    // role=dialog가 박제되지 않아야 함
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('slug 미일치 + 동의 체크박스 미박제 → 탈퇴 버튼 disabled', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <AccountDeleteDialog
        open={true}
        slug="deerdevil"
        name="사슴악마"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    // 모달 영역 + 정책 매트릭스 영역 박제 검증
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('계정 탈퇴')).toBeTruthy()
    expect(screen.getByTestId('account-delete-policy')).toBeTruthy()
    // 정책 5개 항목 중 30일 + 익명화 + 회계 보존 + 작품 보존 + 재가입 검증
    const policyText = screen.getByTestId('account-delete-policy').textContent ?? ''
    expect(policyText).toContain('30일')
    expect(policyText).toContain('익명화')
    expect(policyText).toContain('보존')

    // slug 영역 미입력 영역 영역 → 탈퇴 버튼 disabled
    const deleteBtn = screen.getByRole('button', { name: /^탈퇴$/ })
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true)

    // slug 영역 영역 영역 영역 영역 영역 → 영역 영역 disabled 영역 영역
    const slugInput = screen.getByLabelText(/슬러그.*입력/)
    fireEvent.change(slugInput, { target: { value: 'wrong' } })
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('슬러그가 일치하지 않습니다.')).toBeTruthy()
  })

  it('slug 정합 + 동의 체크 + 사유 박제 → onConfirm 영역 사유 박제 호출', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <AccountDeleteDialog
        open={true}
        slug="deerdevil"
        name="사슴악마"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    // slug 입력 영역 정합
    const slugInput = screen.getByLabelText(/슬러그.*입력/)
    fireEvent.change(slugInput, { target: { value: 'deerdevil' } })
    // 사유 입력
    const reasonInput = screen.getByLabelText(/탈퇴 사유/)
    fireEvent.change(reasonInput, { target: { value: '서비스 종료 영역' } })
    // 동의 체크박스
    const ack = screen.getByRole('checkbox')
    fireEvent.click(ack)

    const deleteBtn = screen.getByRole('button', { name: /^탈퇴$/ })
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(onConfirm).toHaveBeenCalledWith('서비스 종료 영역')
    })
  })

  it('onConfirm 실패 → 에러 메시지 표시 + 모달 영역 유지', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error('서버 영역 502'))
    const onClose = vi.fn()
    render(
      <AccountDeleteDialog
        open={true}
        slug="deerdevil"
        name="사슴악마"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    const slugInput = screen.getByLabelText(/슬러그.*입력/)
    fireEvent.change(slugInput, { target: { value: 'deerdevil' } })
    const ack = screen.getByRole('checkbox')
    fireEvent.click(ack)
    fireEvent.click(screen.getByRole('button', { name: /^탈퇴$/ }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1)
      // 에러 영역 표시 + onClose 호출 0
      expect(screen.getByText('서버 영역 502')).toBeTruthy()
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
