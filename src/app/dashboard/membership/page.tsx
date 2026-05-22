"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlatformNav } from '@/components/PlatformNav'
import { MembershipPlans, ComingSoonModal, type MembershipTier } from '@/features/credits'

/**
 * 멤버십(구독) 플랜 화면 (크레딧 개편 I Phase — §8-3 free/pro/premium).
 *
 * CC-5 web (2026-05-22) — 구독 UI 선노출 + "준비중" 가드.
 * server Polar 구독 API(`/subscriptions/checkout`·`/membership`)는 prod 라이브이나
 * Polar KYC + 한국 payout 승인 미완 → 실 구독 결제 불가. 본 화면은 플랜 카드 +
 * 구독/해지 액션 버튼을 노출하되, 모든 구독 액션은 ComingSoonModal 만 띄운다.
 * → server 구독 API 실호출 0건.
 *
 * 추후 전환 (Polar KYC 승인 시): handleSelect 의 setComingSoonOpen(true) 1줄을
 * 실 `api.checkoutSubscription(tier)` 호출로 교체하면 됨 — 액션 핸들러를 1곳에 모음.
 * 월 포인트 풀은 채팅·분석·테마 공용, 매월 리셋(이월 금지 — §8-8 #2).
 *
 * 정본: shared-contracts §30 / S Phase Draft §14 (web — 구독 플랜 페이지).
 */
export default function MembershipPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [comingSoonOpen, setComingSoonOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) return null

  // CC-5: 모든 구독 액션의 단일 진입점. 현재는 "준비중" 모달만.
  // Polar KYC 승인 시 이 한 곳을 실 checkout 호출로 교체.
  const handleSelect = (_tier: MembershipTier) => {
    setComingSoonOpen(true)
  }

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

        {/* 멤버십 플랜 3등급 — onSelect 전달 → 구독 액션 버튼 노출 (CC-5: 클릭 시 준비중 모달) */}
        <MembershipPlans onSelect={handleSelect} />

        {/* 구독 해지 — 멤버십 가입자용 액션. CC-5: 동일하게 준비중 모달 */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setComingSoonOpen(true)}
            className="text-sm text-neutral-400 hover:text-neutral-700 underline transition"
          >
            구독 해지
          </button>
        </div>

        <div className="mt-8 bg-[#f5f5f5] border border-neutral-200 rounded-xl p-6">
          <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">멤버십 안내</h3>
          <div className="space-y-2 text-sm text-neutral-500">
            <p>· 월 포인트 풀은 <span className="text-black">매월 갱신</span>되며, 남은 포인트는 다음 달로 이월되지 않습니다.</p>
            <p>· 포인트는 채팅·AI 분석·테마 생성에 공용으로 사용됩니다.</p>
            <p>· 월 포인트 풀이 부족하면 별도로 충전한 포인트가 사용됩니다.</p>
            <p>· 멤버십 구독 결제는 <span className="text-[#e53e3e]">준비 중</span>입니다. 현재는 <Link href="/dashboard/credits" className="text-[#e53e3e] underline">포인트 충전</Link>으로 이용해 주세요.</p>
          </div>
        </div>
      </main>

      {/* CC-5 준비중 가드 — 모든 구독 액션이 이 모달로 수렴 */}
      <ComingSoonModal open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
    </div>
  )
}
