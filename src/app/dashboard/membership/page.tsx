"use client"

import { useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlatformNav } from '@/components/PlatformNav'
import { MembershipPlans } from '@/features/credits'

/**
 * 멤버십(구독) 플랜 화면 (크레딧 개편 I Phase — §8-3 free/pro/premium).
 *
 * 범위 경계 (S Phase Draft §6 #5): Polar 구독 결제 연동은 I Phase 외.
 * 본 화면은 멤버십 3등급 플랜 표시 전용 — 실 결제 연동은 별도 sprint(PAY-P1-4).
 * 월 포인트 풀은 채팅·분석·테마 공용, 매월 리셋(이월 금지 — §8-8 #2).
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web — 구독 플랜 페이지).
 */
export default function MembershipPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard/credits" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 포인트 충전</Link>

        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">멤버십</p>
          <h1 className="text-2xl font-bold text-black">월 포인트 풀로 더 많이 사용하기</h1>
          <p className="text-neutral-400 text-sm mt-2">
            멤버십에 가입하면 매월 포인트 풀이 충전됩니다. 채팅·AI 분석·테마 생성에 공용으로 사용됩니다.
          </p>
        </div>

        {/* 멤버십 플랜 3등급 — 표시 전용 (결제 연동은 별도 sprint) */}
        <MembershipPlans />

        <div className="mt-8 bg-[#f5f5f5] border border-neutral-200 rounded-xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">멤버십 안내</h3>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>· 월 포인트 풀은 <span className="text-black">매월 갱신</span>되며, 남은 포인트는 다음 달로 이월되지 않습니다.</p>
            <p>· 포인트는 채팅·AI 분석·테마 생성에 공용으로 사용됩니다.</p>
            <p>· 월 포인트 풀이 부족하면 별도로 충전한 포인트가 사용됩니다.</p>
            <p>· 멤버십 구독 결제는 준비 중입니다. 현재는 <Link href="/dashboard/credits" className="text-[#e53e3e] underline">포인트 충전</Link>으로 이용해 주세요.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
