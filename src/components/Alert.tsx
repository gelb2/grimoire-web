"use client"

/**
 * Alert — 그리모어 톤앤매너 기본 모달 얼럿 컴포넌트
 *
 * 사용처: 시스템 alert() 대체. 작업 안내, 확인, 경고.
 * 디자인 기준: 플랫폼 light 테마 (neutral-* 팔레트, #e53e3e 포인트) — 작가공간(g-*) 변수 건드리지 않음.
 * 벤치마크: 사슴악마 시각 정본의 절제된 흑백 기조 준수.
 *
 * 사용 예:
 *   const [alertOpen, setAlertOpen] = useState(false)
 *   <Alert
 *     open={alertOpen}
 *     onClose={() => setAlertOpen(false)}
 *     title="분석이 진행됩니다"
 *     body="최소 2분 이상 소요될 수 있어요..."
 *     confirmLabel="확인하고 분석 시작"
 *     onConfirm={() => { setAlertOpen(false); doAnalyze() }}
 *   />
 */

import { useEffect, useRef } from 'react'

export type AlertTone = 'default' | 'info' | 'warning' | 'success'

interface AlertProps {
  open: boolean
  onClose: () => void
  title: string
  body?: string | React.ReactNode
  /** null이면 확인 버튼 숨김 (진행 중 로딩 알림 등) */
  confirmLabel?: string | null
  cancelLabel?: string | null  // null이면 확인 버튼만 표시
  onConfirm?: () => void
  tone?: AlertTone
  /** true면 ESC + backdrop 클릭으로도 닫히지 않음 (작업 진행 중 등) */
  locked?: boolean
}

const TONE_ACCENT: Record<AlertTone, string> = {
  default: 'bg-black hover:bg-neutral-800 text-white',
  info: 'bg-black hover:bg-neutral-800 text-white',
  warning: 'bg-[#e53e3e] hover:bg-[#c53030] text-white',
  success: 'bg-green-700 hover:bg-green-800 text-white',
}

const TONE_DOT: Record<AlertTone, string> = {
  default: 'bg-neutral-400',
  info: 'bg-black',
  warning: 'bg-[#e53e3e]',
  success: 'bg-green-700',
}

export function Alert({
  open,
  onClose,
  title,
  body,
  confirmLabel = '확인',
  cancelLabel = null,
  onConfirm,
  tone = 'default',
  locked = false,
}: AlertProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // ESC로 닫기 (locked 아닐 때만) + 포커스 이동
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !locked) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose, locked])

  if (!open) return null

  const handleBackdrop = () => { if (!locked) onClose() }
  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    else onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grimoire-alert-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white border border-neutral-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-block w-2 h-2 rounded-full ${TONE_DOT[tone]}`} aria-hidden />
            <h2 id="grimoire-alert-title" className="text-lg font-bold text-black">{title}</h2>
          </div>
          {body && (
            <div className="text-sm text-neutral-600 leading-relaxed">
              {typeof body === 'string' ? <p>{body}</p> : body}
            </div>
          )}
        </div>

        {(cancelLabel !== null || confirmLabel !== null) && (
          <div className="flex gap-2 px-6 pb-6 pt-2">
            {cancelLabel !== null && (
              <button
                type="button"
                onClick={onClose}
                disabled={locked}
                className="flex-1 py-2.5 text-sm font-medium border border-neutral-300 text-neutral-600 rounded-lg hover:border-black hover:text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLabel ?? '취소'}
              </button>
            )}
            {confirmLabel !== null && (
              <button
                ref={confirmRef}
                type="button"
                onClick={handleConfirm}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${TONE_ACCENT[tone]}`}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        )}
        {confirmLabel === null && locked && (
          <div className="flex items-center justify-center gap-2 px-6 pb-6 pt-2 text-sm text-neutral-500">
            <span className="inline-block w-2 h-2 rounded-full bg-neutral-400 animate-pulse" aria-hidden />
            잠시만 기다려주세요
          </div>
        )}
      </div>
    </div>
  )
}
