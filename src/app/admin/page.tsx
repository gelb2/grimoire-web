"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [grantForm, setGrantForm] = useState({ authorId: '', amount: '', reason: '' })
  const [granting, setGranting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {
      toast.error('관리자 통계를 불러올 수 없습니다')
    })
  }, [])

  const handleGrant = async () => {
    if (!grantForm.authorId || !grantForm.amount || granting) return
    setGranting(true)
    try {
      await api.adminGrantCredits(grantForm.authorId, parseInt(grantForm.amount), grantForm.reason || 'admin_grant')
      setMessage('크레딧이 부여되었습니다')
      setGrantForm({ authorId: '', amount: '', reason: '' })
    } catch (err: any) { setMessage(err.message || '실패') }
    finally { setGranting(false) }
  }

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">ADMIN</p>
        <h1 className="text-3xl font-black text-black mb-8">플랫폼 통계</h1>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="border border-neutral-200 rounded-lg p-4">
                <p className="text-2xl font-black text-black">{String(value)}</p>
                <p className="text-neutral-500 text-xs uppercase tracking-widest">{key}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-400 mb-8">통계 로딩 중...</p>
        )}

        <div className="flex items-baseline gap-4 mb-4">
          <h2 className="text-2xl font-black text-black">크레딧 수동 부여</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        {message && <div className="border-l-2 border-[#e53e3e] pl-4 text-[#e53e3e] text-sm py-2 mb-4">{message}</div>}
        <div className="border border-neutral-200 rounded-lg p-6 space-y-3">
          <input type="text" placeholder="작가 ID (UUID)" value={grantForm.authorId}
            onChange={e => setGrantForm(prev => ({ ...prev, authorId: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
          <input type="number" placeholder="크레딧 수" value={grantForm.amount}
            onChange={e => setGrantForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
          <input type="text" placeholder="사유 (예: event_bonus)" value={grantForm.reason}
            onChange={e => setGrantForm(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
          <button onClick={handleGrant} disabled={granting}
            className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-sm rounded-lg transition">
            {granting ? '처리 중...' : '크레딧 부여'}
          </button>
        </div>
      </main>
    </div>
  )
}
