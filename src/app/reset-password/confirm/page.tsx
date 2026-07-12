"use client"

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

/**
 * 비밀번호 초기화 토큰 확인 (F-19, 비로그인).
 *
 * URL `?token=` 을 읽어 server `POST /auth/password/reset-confirm` 으로 검증한다. 현 단계 server 는
 * 토큰 **검증만** 수행하고 신 비밀번호 설정은 별 sprint(이메일 발송 개통과 함께)이므로, 본 화면은
 * 검증 결과만 노출하고 실제 재설정은 개통 시 활성화됨을 안내한다. 로그인이 가능하면
 * [프로필 > 비밀번호 변경]으로 즉시 변경하도록 유도한다.
 *
 * 플랫폼 neutral 스타일 (login 페이지 패턴 재사용 — 새 시각 정본 0).
 */
function ResetConfirmInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'checking' | 'valid' | 'invalid'>('checking')

  useEffect(() => {
    if (!token || token.length < 20) {
      setState('invalid')
      return
    }
    api.passwordResetConfirm(token)
      .then(res => setState(res.verified ? 'valid' : 'invalid'))
      .catch(() => setState('invalid'))
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 text-center mb-4">RESET YOUR PASSWORD</p>
        <h1 className="text-5xl font-light uppercase text-black text-center mb-10 font-ci tracking-[0.2em]">
          <Link href="/" className="hover:text-[#e53e3e] transition">Grimoire</Link>
        </h1>

        {state === 'checking' && (
          <p className="text-sm text-neutral-500 text-center">재설정 링크를 확인하는 중...</p>
        )}

        {state === 'valid' && (
          <div className="space-y-5">
            <div className="border-l-2 border-black pl-4 text-black text-sm py-2">
              재설정 링크가 확인되었습니다.
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              새 비밀번호 설정은 이메일 발송 개통과 함께 제공될 예정입니다. 지금 로그인이 가능하시면
              <Link href="/dashboard/profile" className="text-[#e53e3e] hover:underline"> 프로필 &gt; 비밀번호 변경</Link>에서
              바로 변경하실 수 있습니다.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-lg transition text-center"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        )}

        {state === 'invalid' && (
          <div className="space-y-5">
            <div className="border-l-2 border-[#e53e3e] pl-4 text-[#e53e3e] text-sm py-2">
              링크가 유효하지 않거나 만료되었습니다.
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              <Link href="/reset-password" className="text-[#e53e3e] hover:underline">재설정 링크를 다시 요청</Link>하거나,
              로그인이 가능하시면 프로필에서 비밀번호를 변경해 주세요.
            </p>
            <Link
              href="/login"
              className="block w-full py-3 bg-black hover:bg-neutral-800 text-white font-medium rounded-lg transition text-center"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ResetConfirmInner />
    </Suspense>
  )
}
