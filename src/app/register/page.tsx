"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import Link from 'next/link'

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

function RegisterForm() {
  const router = useRouter()
  const { register } = useAuth()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', slug: '' })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'name' && !form.slug) {
      const autoSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      setForm(prev => ({ ...prev, slug: autoSlug }))
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!agreed) { setError('이용약관 및 개인정보보호방침에 동의해주세요'); return }
    if (form.password !== form.passwordConfirm) { setError('비밀번호가 일치하지 않습니다'); return }
    setLoading(true)
    try {
      const recaptchaToken = RECAPTCHA_SITE_KEY && executeRecaptcha ? await executeRecaptcha('register') : undefined
      await register({ email: form.email, password: form.password, name: form.name, slug: form.slug }, recaptchaToken)
      router.replace('/dashboard')
    } catch (err: any) { setError(err.message || '회원가입에 실패했습니다') }
    finally { setLoading(false) }
  }, [form, agreed, executeRecaptcha, register, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 text-center mb-4">CREATE YOUR SPACE</p>
        <h1 className="text-5xl font-light uppercase text-black text-center mb-10 font-ci tracking-[0.2em]">
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
              <span className="text-neutral-400 text-sm mr-2">/</span>
              <input type="text" value={form.slug}
                onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                required pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
                placeholder="my-space" />
            </div>
          </div>

          {/* 이용약관 + 개인정보보호방침 동의 */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-neutral-300 text-black focus:ring-black" />
            <span className="text-xs text-neutral-500 leading-relaxed">
              <Link href="/terms" target="_blank" className="text-[#e53e3e] underline">이용약관</Link>
              {' '}및{' '}
              <Link href="/privacy" target="_blank" className="text-[#e53e3e] underline">개인정보보호방침</Link>
              에 동의합니다.
            </span>
          </label>

          <button type="submit" disabled={loading || !agreed}
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

export default function RegisterPage() {
  if (!RECAPTCHA_SITE_KEY) {
    return <RegisterForm />
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <RegisterForm />
    </GoogleReCaptchaProvider>
  )
}
