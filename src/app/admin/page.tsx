"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [grantForm, setGrantForm] = useState({ authorId: '', amount: '', reason: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(() => {})
  }, [])

  const handleGrant = async () => {
    if (!grantForm.authorId || !grantForm.amount) return
    try {
      await api.adminGrantCredits(grantForm.authorId, parseInt(grantForm.amount), grantForm.reason || 'admin_grant')
      setMessage('크레딧이 부여되었습니다')
      setGrantForm({ authorId: '', amount: '', reason: '' })
    } catch (err: any) {
      setMessage(err.message || '실패')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-white">Grimoire</Link>
        <span className="text-neutral-600">|</span>
        <span className="text-red-400 font-medium">관리자 패널</span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">플랫폼 통계</h1>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-amber-500">{String(value)}</p>
                <p className="text-neutral-500 text-sm">{key}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 mb-8">통계 로딩 중... (서버 연결 필요)</p>
        )}

        <h2 className="text-xl font-bold text-white mb-4">크레딧 수동 부여</h2>
        {message && <div className="bg-amber-900/20 border border-amber-800/50 text-amber-300 px-4 py-3 rounded-lg text-sm mb-4">{message}</div>}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-3">
          <input type="text" placeholder="작가 ID (UUID)" value={grantForm.authorId}
            onChange={e => setGrantForm(prev => ({ ...prev, authorId: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500" />
          <input type="number" placeholder="크레딧 수" value={grantForm.amount}
            onChange={e => setGrantForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500" />
          <input type="text" placeholder="사유 (예: event_bonus)" value={grantForm.reason}
            onChange={e => setGrantForm(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500" />
          <button onClick={handleGrant}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg">크레딧 부여</button>
        </div>
      </main>
    </div>
  )
}
