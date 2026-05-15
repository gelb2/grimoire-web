"use client"

/**
 * AccountDeleteDialog — 본인 계정 탈퇴 모달 (USER-SOFT-DELETE sprint §15-1 web 영역).
 *
 * 사용처: `/dashboard/profile` 마이페이지 탈퇴 버튼 → 본 모달 → 슬러그 재입력 + 사유 + 최종 확인 → `api.deleteMyAccount()`.
 *
 * 시각 정본 (사슴악마): Alert.tsx 동일 모달 골격 차용 (bg-white / border-neutral-200 / rounded-xl).
 * - 플랫폼 영역 → neutral-* 팔레트 + 경고 포인트 `#e53e3e` (Alert warning tone 정합)
 * - 작가 g-* 토큰 침범 0건 (VCK PASS 영역)
 *
 * USER-SOFT-DELETE 정책 (Sprint Draft §5 + §7-1 옵션 A 정합):
 * - 30일 유예 영역 — soft delete 후 cron `0 4 * * *` 매일 새벽 4시 hard delete
 * - 회계 8건 Restrict 정합 — 작품/episode/구독/결제 영역 영구 보존 (PAY-P3-E 정합)
 * - GDPR basic 익명화 — email/name/passwordHash/bio (옵션 A 권장)
 * - 본인 슬러그 재입력 검증 영역 (오작동 방지) + 사유 선택 입력 영역
 *
 * 보안 영역:
 * - JWT 인증 영역 (HttpOnly Cookie BFF 프록시 자동)
 * - localStorage 0 박제 (token/사용자 본문 영역 0)
 * - 작가 본문 영역 영역 영역 영역 0 (탈퇴 ≠ 작품 영역 삭제 영역)
 */

import { useEffect, useRef, useState } from 'react'

export interface AccountDeleteDialogProps {
  open: boolean
  /** 사용자 본인 슬러그 — 재입력 검증 영역 정합 강제 */
  slug: string
  /** 사용자 본인 이름 — 표시 영역 영역 정합 */
  name: string
  onClose: () => void
  /** confirm 시 호출 — 사유(선택 입력) 박제 영역 */
  onConfirm: (reason: string | null) => Promise<void>
}

export function AccountDeleteDialog({
  open,
  slug,
  name,
  onClose,
  onConfirm,
}: AccountDeleteDialogProps) {
  const [slugInput, setSlugInput] = useState('')
  const [reason, setReason] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slugInputRef = useRef<HTMLInputElement>(null)

  // 모달 영역 진입 시 슬러그 input에 포커스 — UX 영역 정합
  useEffect(() => {
    if (!open) return
    slugInputRef.current?.focus()
    // ESC로 닫기 (단 submitting 영역 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting])

  // 모달 영역 영역 시 입력 영역 초기화
  useEffect(() => {
    if (!open) {
      setSlugInput('')
      setReason('')
      setAcknowledged(false)
      setError(null)
    }
  }, [open])

  if (!open) return null

  const slugValid = slugInput.trim() === slug
  const canSubmit = slugValid && acknowledged && !submitting

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(reason.trim() || null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '탈퇴 처리에 실패했습니다.'
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-[#e53e3e]" aria-hidden />
            <h2 id="account-delete-title" className="text-lg font-bold text-black">계정 탈퇴</h2>
          </div>

          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            <span className="font-medium text-black">{name}</span> 님 (@{slug}) 계정 탈퇴 절차입니다.
          </p>

          {/* 정책 영역 영역 — 30일 유예 + 회계 보존 + GDPR 익명화 + 데이터 영역 영역 */}
          <ul
            data-testid="account-delete-policy"
            className="text-xs text-neutral-600 leading-relaxed mb-4 space-y-1.5 pl-1"
          >
            <li>• 탈퇴 즉시 로그인이 차단되며, <strong>30일 후 영구 삭제</strong>됩니다.</li>
            <li>• 본인 식별 정보(이메일/이름/소개)는 <strong>즉시 익명화</strong>됩니다.</li>
            <li>• 회계 보존 의무에 따라 결제/구독/크레딧 내역은 <strong>보존</strong>됩니다.</li>
            <li>• 업로드하신 <strong>작품/에피소드는 보존</strong>되며 작가명은 익명으로 표시됩니다.</li>
            <li>• 30일 이내 동일 이메일로 재가입은 불가합니다.</li>
          </ul>

          {/* 슬러그 재입력 영역 — 오작동 방지 검증 영역 정합 강제 */}
          <div className="mb-3">
            <label htmlFor="account-delete-slug" className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">
              본인 확인 — 슬러그 <span className="text-[#e53e3e]">{slug}</span> 입력
            </label>
            <input
              id="account-delete-slug"
              ref={slugInputRef}
              type="text"
              value={slugInput}
              onChange={e => setSlugInput(e.target.value)}
              placeholder={slug}
              disabled={submitting}
              className="w-full px-3 py-2 bg-[#f5f5f5] border border-neutral-300 rounded text-sm text-black focus:outline-none focus:border-black transition disabled:opacity-50"
            />
            {slugInput && !slugValid && (
              <p className="text-[#e53e3e] text-xs mt-1">슬러그가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 사유 입력 영역 — 선택 입력 (audit log 박제 영역) */}
          <div className="mb-3">
            <label htmlFor="account-delete-reason" className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">
              탈퇴 사유 (선택)
            </label>
            <textarea
              id="account-delete-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={500}
              rows={2}
              disabled={submitting}
              placeholder="개선에 활용됩니다 (선택, 최대 500자)"
              className="w-full px-3 py-2 bg-[#f5f5f5] border border-neutral-300 rounded text-sm text-black focus:outline-none focus:border-black transition resize-none disabled:opacity-50"
            />
          </div>

          {/* 최종 확인 체크박스 영역 영역 강제 */}
          <label className="flex items-start gap-2 cursor-pointer mb-2 select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              disabled={submitting}
              className="mt-0.5"
            />
            <span className="text-xs text-neutral-700">
              위 안내를 모두 확인했으며, 30일 후 영구 삭제에 동의합니다.
            </span>
          </label>

          {error && (
            <div className="border-l-2 border-[#e53e3e] px-3 py-2 text-xs text-[#e53e3e] mt-3">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-medium border border-neutral-300 text-neutral-600 rounded-lg hover:border-black hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-2.5 text-sm font-medium bg-[#e53e3e] hover:bg-[#c53030] text-white rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? '탈퇴 처리 중…' : '탈퇴'}
          </button>
        </div>
      </div>
    </div>
  )
}
