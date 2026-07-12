"use client"

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

/**
 * 비밀번호 초기화 요청 (F-19, 비로그인).
 *
 * 이메일 입력 → server `POST /auth/password/reset-request`. enumeration 차단을 위해 성공/실패와
 * 무관하게 동일 안내를 노출한다. 이메일 발송은 server EMAIL_PROVIDER 종속 — 기본 NullAdapter
 * (미개통) 상태에서는 재설정 메일이 **도착하지 않으며**, 이메일 개통 시 즉시 활성화된다.
 * 로그인이 가능한 사용자는 [프로필 > 비밀번호 변경]으로 즉시 변경할 수 있음을 안내한다.
 *
 * 플랫폼 neutral 스타일 (login 페이지 패턴 재사용 — 새 시각 정본 0).
 */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.passwordResetRequest(email.trim())
    } catch {
      // 미개통(403)·네트워크 오류도 동일 안내 — enumeration 방지 + 발송 종속 안내로 수렴
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 text-center mb-4">RESET YOUR PASSWORD</p>
        <h1 className="text-5xl font-light uppercase text-black text-center mb-10 font-ci tracking-[0.2em]">
          <Link href="/" className="hover:text-[#e53e3e] transition">Grimoire</Link>
        </h1>

        {submitted ? (
          <div className="space-y-5">
            <div className="border-l-2 border-black pl-4 text-black text-sm py-2">
              입력하신 이메일이 가입되어 있다면 비밀번호 재설정 안내를 보냈습니다.
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              현재 이메일 발송 기능이 준비 중이라 재설정 메일이 도착하지 않을 수 있어요.
              로그인이 가능하시면 <Link href="/dashboard/profile" className="text-[#e53e3e] hover:underline">프로필 &gt; 비밀번호 변경</Link>에서
              바로 변경하실 수 있습니다.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-lg transition text-center"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">이메일</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition"
              >
                {loading ? '요청 중...' : '재설정 링크 요청'}
              </button>
            </form>

            <p className="text-neutral-500 text-sm text-center mt-8">
              <Link href="/login" className="text-[#e53e3e] hover:underline">로그인으로 돌아가기</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
