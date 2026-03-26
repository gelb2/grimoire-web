"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Grimoire</h1>
        <p className="text-neutral-400 text-center mb-8">작가의 공간으로 돌아오세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-300 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white font-medium rounded-lg transition"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-neutral-500 text-sm text-center mt-6">
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className="text-amber-500 hover:text-amber-400">
            회원가입
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-neutral-800">
          <p className="text-neutral-600 text-xs text-center mb-3">테스트 계정</p>
          <button
            type="button"
            onClick={() => { setEmail('test@grimoire.app'); setPassword('password123') }}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-400 text-sm rounded-lg transition"
          >
            테스트 계정으로 채우기
          </button>
        </div>
      </div>
    </div>
  )
}
