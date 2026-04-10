"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.adminLogin(email, password)
      router.replace('/admin')
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500 text-center mb-3">ADMIN PANEL</p>
        <h1 className="text-3xl font-light uppercase text-white text-center mb-8 tracking-[0.15em]">Grimoire</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border-l-2 border-red-500 pl-3 text-red-400 text-sm py-1">{error}</div>
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="관리자 이메일" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white transition" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="비밀번호" className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white transition" />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-white hover:bg-neutral-200 disabled:bg-neutral-700 text-black font-medium rounded-lg transition">
            {loading ? '인증 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
