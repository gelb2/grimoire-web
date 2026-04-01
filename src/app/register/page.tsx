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
    if (field === 'name' && !form.slug) {
      const autoSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setForm(prev => ({ ...prev, slug: autoSlug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
    setLoading(true)
    try {
      await register({ email: form.email, password: form.password, name: form.name, slug: form.slug })
      router.replace('/dashboard')
    } catch (err: any) { setError(err.message || '회원가입에 실패했습니다') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 text-center mb-6">Create Your Space</p>
        <h1 className="text-6xl md:text-7xl font-light text-black text-center mb-12 font-ci tracking-[0.05em]">
          <Link href="/" className="hover:text-[#e53e3e] transition">Grimoire</Link>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="border-l-2 border-[#e53e3e] pl-4 text-[#e53e3e] text-sm py-2">{error}</div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">이메일</label>
            <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} required
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="your@email.com" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">비밀번호</label>
            <input type="password" value={form.password} onChange={e => updateField('password', e.target.value)} required minLength={6}
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="6자 이상" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">비밀번호 확인</label>
            <input type="password" value={form.passwordConfirm} onChange={e => updateField('passwordConfirm', e.target.value)} required minLength={6}
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="비밀번호를 다시 입력하세요" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">작가명</label>
            <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} required
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="필명 또는 닉네임" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">내 공간 주소</label>
            <div className="flex items-center">
              <span className="text-neutral-400 text-sm mr-2">grimoire-book.com/</span>
              <input type="text" value={form.slug}
                onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
                placeholder="my-space" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition">
            {loading ? '가입 중...' : '회원가입 (3 크레딧 보너스)'}
          </button>
        </form>

        <p className="text-neutral-500 text-sm text-center mt-8">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-[#e53e3e] hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}
