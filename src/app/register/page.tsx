"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', slug: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // 슬러그 자동 생성 (이름 입력 시)
    if (field === 'name' && !form.slug) {
      const autoSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setForm(prev => ({ ...prev, slug: autoSlug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    setLoading(true)
    try {
      await register({ email: form.email, password: form.password, name: form.name, slug: form.slug })
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          <Link href="/" className="hover:text-amber-500 transition">Grimoire</Link>
        </h1>
        <p className="text-neutral-400 text-center mb-8">나만의 소설 공간을 만드세요</p>

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
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">비밀번호</label>
            <input
              type="password"
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              placeholder="6자 이상"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">비밀번호 확인</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={e => updateField('passwordConfirm', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">작가명</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              placeholder="필명 또는 닉네임"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">슬러그 (URL 경로)</label>
            <div className="flex items-center">
              <span className="text-neutral-500 text-sm mr-2">grimoire.app/</span>
              <input
                type="text"
                value={form.slug}
                onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required
                pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                placeholder="my-space"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white font-medium rounded-lg transition"
          >
            {loading ? '가입 중...' : '회원가입 (3 크레딧 보너스)'}
          </button>
        </form>

        <p className="text-neutral-500 text-sm text-center mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-amber-500 hover:text-amber-400">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
