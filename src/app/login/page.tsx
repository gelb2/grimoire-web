"use client"

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import Link from 'next/link'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''

function LoginForm() {
  const router = useRouter()
  const { login, googleLogin } = useAuth()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha('login') : undefined
      await login(email, password, recaptchaToken)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [email, password, executeRecaptcha, login, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 text-center mb-4">RETURN TO YOUR SPACE</p>
        <h1 className="text-5xl font-light uppercase text-black text-center mb-10 font-ci tracking-[0.2em]">
          <Link href="/" className="hover:text-[#e53e3e] transition">Grimoire</Link>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="border-l-2 border-[#e53e3e] pl-4 text-[#e53e3e] text-sm py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-neutral-400 uppercase text-xs tracking-widest">또는</span></div>
          </div>
          <div className="mt-4 flex justify-center">
            {GOOGLE_CLIENT_ID ? (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={async (response) => {
                    if (response.credential) {
                      setError('')
                      setLoading(true)
                      try {
                        await googleLogin(response.credential)
                        router.replace('/dashboard')
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : 'Google 로그인에 실패했습니다'
                        setError(message)
                      } finally {
                        setLoading(false)
                      }
                    }
                  }}
                  onError={() => setError('Google 로그인에 실패했습니다')}
                  theme="outline"
                  size="large"
                  width={400}
                  text="signin_with"
                  logo_alignment="left"
                />
              </GoogleOAuthProvider>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3 bg-white border border-neutral-300 text-neutral-500 font-medium rounded-lg flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google 로그인 (설정 필요)
              </button>
            )}
          </div>
        </div>

        <p className="text-neutral-500 text-sm text-center mt-8">
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className="text-[#e53e3e] hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  if (!RECAPTCHA_SITE_KEY) {
    return <LoginForm />
  }
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <LoginForm />
    </GoogleReCaptchaProvider>
  )
}
