"use client"
/**
 * Sprint: sprint-pay-p0-3-admin-credit-grant-ui (PAY-P0-3)
 * 계약: reports/sprint-pay-p0-3-admin-credit-grant-ui-progress.md AC-1~AC-6
 *
 * 운영자 수동 포인트 지급/차감 UI.
 * - 사용자 검색(slug/email/ID) → 카드 결과 → 선택 → 잔액 표시
 * - 금액(음수 = 차감 / 양수 = 지급) + 사유 필수 입력
 * - 지급/차감 분리 버튼 (mode-by-button — VCK AA-4 [MUST])
 * - 네이티브 confirm() 멀티콘펌 (VCK AA-5 [MUST] — 11 tabs 정본)
 * - sonner toast.success/error (VCK AA-6 [MUST] — CommentsTab 정합)
 * - 잔액 즉시 갱신 setUser({...user, credits: r.credits}) — 인라인 결과 <p> 제거
 *
 * 시각 정본: admin neutral-* 영역 (작가 g-* 토큰 침범 0건 — VCK PASS)
 */
import { useState } from 'react'
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
}

export function CreditsTab() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AdminAuthor[]>([])
  const [searching, setSearching] = useState(false)
  const [user, setUser] = useState<AdminAuthor | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const amountNum = parseInt(amount, 10)
  const amountValid = !Number.isNaN(amountNum) && amountNum !== 0
  const reasonValid = reason.trim().length > 0
  const canSubmit = !!user && amountValid && reasonValid && !submitting

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    try {
      const data = await api.adminListAuthors({ page: 1, limit: 20, q })
      setSearchResults(data.items as AdminAuthor[])
      if (data.items.length === 0) {
        toast.error('검색 결과가 없습니다.')
      }
    } catch (e: any) {
      toast.error(e?.message ?? '검색 실패')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = (a: AdminAuthor) => {
    setUser(a)
    setSearchResults([])
    setAmount('')
    setReason('')
  }

  const handleSubmit = async (mode: 'grant' | 'deduct') => {
    if (!user || !amountValid || !reasonValid) return
    const absAmount = Math.abs(amountNum)
    const after = mode === 'grant' ? user.credits + absAmount : user.credits - absAmount
    const verb = mode === 'grant' ? '지급' : '차감'
    const ok = window.confirm(
      `"${user.name}" (@${user.slug}) 사용자에게 ${absAmount.toLocaleString()} 포인트 ${verb}하시겠습니까?\n` +
      `사유: ${reason.trim()}\n\n` +
      `현재 잔액: ${user.credits.toLocaleString()} → 변경 후: ${after.toLocaleString()}`
    )
    if (!ok) return

    setSubmitting(true)
    try {
      const r = mode === 'grant'
        ? await api.adminGrantCredits(user.id, absAmount, reason.trim())
        : await api.adminDeductCredits(user.id, absAmount, reason.trim())
      const newBalance = (r as { credits: number }).credits
      setUser({ ...user, credits: newBalance })
      toast.success(
        `${user.name}에게 ${absAmount.toLocaleString()} 포인트 ${verb} 완료. 잔액: ${newBalance.toLocaleString()}`
      )
      setAmount('')
      setReason('')
    } catch (e: any) {
      toast.error(e?.message ?? `${verb} 실패`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* [1] 사용자 검색 — VCK AA-2 정본 (PaymentsTab + AuthorsTab 패턴) */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="작가 검색 (slug, email, ID)..."
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium disabled:opacity-30"
        >
          {searching ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* [2] 검색 결과 카드 — VCK AA-3 정본 */}
      {searchResults.length > 0 && (
        <div className="space-y-2 mb-4">
          {searchResults.map(a => (
            <div key={a.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-white">{a.name}</span>{' '}
                  <span className="text-neutral-500 text-xs">@{a.slug}</span>
                  <p className="text-neutral-400 text-xs mt-1">{a.email}</p>
                  <p className="text-white text-sm mt-2">
                    현재 잔액: <span className="font-bold">{(a.credits ?? 0).toLocaleString()}</span> 포인트
                  </p>
                </div>
                <button
                  onClick={() => handleSelect(a)}
                  className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium"
                >
                  선택
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* [3] 선택된 사용자 — 카드 (VCK AA-3 정본) */}
      {user && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">선택된 사용자</p>
              <span className="font-medium text-white">{user.name}</span>{' '}
              <span className="text-neutral-500 text-xs">@{user.slug}</span>
              <p className="text-neutral-400 text-xs mt-1">{user.email}</p>
              <p className="text-white text-sm mt-2">
                현재 잔액: <span className="font-bold">{(user.credits ?? 0).toLocaleString()}</span> 포인트
              </p>
            </div>
            <button
              onClick={() => setUser(null)}
              className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-400 hover:text-white"
            >
              해제
            </button>
          </div>
        </div>
      )}

      {/* [4] 금액 + 사유 입력 폼 — VCK AA-4 [MUST] 정본 */}
      {user && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="포인트 수량 (음수 = 차감, 양수 = 지급)"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500"
          />
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="사유 (필수)"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500"
          />
          <p className="text-neutral-500 text-xs">※ 이 작업은 audit log에 영구 박제됩니다.</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit('grant')}
              disabled={!canSubmit}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg disabled:opacity-30 disabled:hover:bg-green-700"
            >
              {submitting ? '처리 중...' : '지급'}
            </button>
            <button
              onClick={() => handleSubmit('deduct')}
              disabled={!canSubmit}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-30 disabled:hover:bg-red-700"
            >
              {submitting ? '처리 중...' : '차감'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
