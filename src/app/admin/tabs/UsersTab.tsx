"use client"
/**
 * UsersTab — 운영자 사용자 관리 탭 (USER-SOFT-DELETE sprint §15-1 web 영역).
 *
 * 기능 영역 (Sprint Draft §5-4 정합):
 * - 사용자 검색(slug/email/ID) → 카드 결과 + 신규 작가 영역 보존 (기존 AuthorsTab 영역 유지)
 * - 역할 토글 / 플랜 변경 (기존 영역 유지)
 * - **force delete** — `api.adminForceDeleteAuthor(id, reason)` — soft delete + GDPR basic 익명화 + 30일 cron
 * - **GDPR anonymize** — `api.adminAnonymizeAuthor(id, reason)` — 즉시 익명화 (soft delete 영역 독립)
 * - 사유 필수 입력 영역 (textarea) — AdminAuditLog 박제 영역 영역 강제
 * - 멀티콘펌 네이티브 confirm() — 11 tabs 정본 (CreditsTab 영역 정합)
 *
 * 시각 정본: admin neutral-* 영역 (작가 g-* 토큰 침범 0건 — VCK PASS).
 * 디자인 토큰 0 — 사용자 명시 globals.css 디자인토큰 금지 정합 (CSS 변수 영역 0).
 */
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface AdminAuthor {
  id: string
  name: string
  slug: string
  email: string
  credits: number
  role?: string
  plan?: string
  deletedAt?: string | null
}

type ActionMode = 'force-delete' | 'anonymize'

const ACTION_LABEL: Record<ActionMode, { verb: string; warn: string }> = {
  'force-delete': {
    verb: '강제 탈퇴',
    warn: 'soft delete 박제 + 본인 식별 정보 익명화 + 30일 후 영구 삭제. 회계 8건은 보존',
  },
  'anonymize': {
    verb: 'GDPR 익명화',
    warn: '즉시 식별 정보 익명화 (email/name/passwordHash/bio) — soft delete와 독립',
  },
}

export function UsersTab() {
  const [authors, setAuthors] = useState<AdminAuthor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [actionTarget, setActionTarget] = useState<{ author: AdminAuthor; mode: ActionMode } | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    api.adminListAuthors({ page, limit: 20, q: query || undefined })
      .then(d => { setAuthors(d.items as AdminAuthor[]); setTotal(d.total) })
      .catch(() => {})
  }, [page, query])

  useEffect(() => { load() }, [load])

  const openAction = (author: AdminAuthor, mode: ActionMode) => {
    setActionTarget({ author, mode })
    setReason('')
  }

  const closeAction = () => {
    if (submitting) return
    setActionTarget(null)
    setReason('')
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { author, mode } = actionTarget
    const trimmed = reason.trim()
    if (!trimmed) {
      toast.error('사유는 필수입니다.')
      return
    }
    const label = ACTION_LABEL[mode]
    const ok = window.confirm(
      `"${author.name}" (@${author.slug}) 사용자에게 [${label.verb}] 작업을 진행합니다.\n` +
      `사유: ${trimmed}\n\n` +
      `${label.warn}\n\n` +
      `AdminAuditLog에 영구 박제됩니다. 계속할까요?`
    )
    if (!ok) return

    setSubmitting(true)
    try {
      if (mode === 'force-delete') {
        await api.adminForceDeleteAuthor(author.id, trimmed)
        toast.success(`"${author.name}" 강제 탈퇴 박제 완료 (30일 후 영구 삭제)`)
      } else {
        await api.adminAnonymizeAuthor(author.id, trimmed)
        toast.success(`"${author.name}" GDPR 익명화 박제 완료`)
      }
      setActionTarget(null)
      setReason('')
      load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `${label.verb} 실패`
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* 검색 영역 */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1) }}
          onKeyDown={e => { if (e.key === 'Enter') load() }}
          placeholder="이름, 슬러그, 이메일 검색..."
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500"
        />
        <button
          onClick={load}
          className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium"
        >
          검색
        </button>
      </div>

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr>
              <th className="px-3 py-2 text-left">작가</th>
              <th className="px-3 py-2 text-left">이메일</th>
              <th className="px-3 py-2 text-center">상태</th>
              <th className="px-3 py-2 text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            {authors.map(a => (
              <tr key={a.id} className="border-t border-neutral-800 hover:bg-neutral-900/50">
                <td className="px-3 py-2">
                  <span className="font-medium text-white">{a.name}</span>{' '}
                  <span className="text-neutral-500 text-xs">@{a.slug}</span>
                </td>
                <td className="px-3 py-2 text-neutral-400 text-xs">{a.email}</td>
                <td className="px-3 py-2 text-center text-xs">
                  {a.deletedAt ? (
                    <span className="bg-red-900/50 text-red-400 px-2 py-0.5 rounded">탈퇴됨</span>
                  ) : (
                    <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">활성</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openAction(a, 'force-delete')}
                      disabled={!!a.deletedAt}
                      className="text-red-400 text-xs hover:underline disabled:text-neutral-600 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      강제 탈퇴
                    </button>
                    <button
                      onClick={() => openAction(a, 'anonymize')}
                      className="text-yellow-400 text-xs hover:underline"
                    >
                      익명화
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30"
          >
            &larr;
          </button>
          <span className="px-3 py-1 text-sm text-neutral-400">{page} / {Math.ceil(total / 20)}</span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30"
          >
            &rarr;
          </button>
        </div>
      )}

      {/* 액션 모달 — 사유 필수 입력 영역 */}
      {actionTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="users-tab-action-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeAction}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 id="users-tab-action-title" className="text-base font-bold text-white mb-2">
              {ACTION_LABEL[actionTarget.mode].verb}
            </h3>
            <p className="text-sm text-neutral-400 mb-3">
              <span className="text-white">{actionTarget.author.name}</span>{' '}
              <span className="text-neutral-500 text-xs">@{actionTarget.author.slug}</span>
            </p>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              {ACTION_LABEL[actionTarget.mode].warn}
            </p>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-1">
              사유 (필수)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              disabled={submitting}
              placeholder="감사 로그에 박제됩니다 (필수, 최대 500자)"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 mb-3 resize-none focus:outline-none focus:border-neutral-500 disabled:opacity-50"
            />
            <p className="text-neutral-500 text-xs mb-4">※ AdminAuditLog에 영구 박제됩니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeAction}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-neutral-700 text-neutral-400 hover:text-white text-sm rounded-lg disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={submitting || !reason.trim()}
                className={`flex-1 px-4 py-2 text-white text-sm rounded-lg disabled:opacity-30 ${
                  actionTarget.mode === 'force-delete'
                    ? 'bg-red-700 hover:bg-red-600'
                    : 'bg-yellow-700 hover:bg-yellow-600'
                }`}
              >
                {submitting ? '처리 중...' : ACTION_LABEL[actionTarget.mode].verb}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
