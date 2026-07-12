"use client"

import Link from 'next/link'
import { formatPoints, THEME_POINT_COST } from '@/features/credits'

interface CreditsSectionProps {
  /** 보유 포인트 (pt — server /auth/profile 이 신 ledger 4 출처 합을 pt 단위로 매핑) */
  credits: number
}

export function CreditsSection({ credits }: CreditsSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-4 flex-1">
          <h2 className="text-2xl font-black text-black">포인트</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        <div className="flex items-baseline gap-4 ml-4">
          <Link href="/dashboard/membership" className="text-sm text-neutral-500 hover:text-black hover:underline">멤버십 &rarr;</Link>
          <Link href="/dashboard/credits" className="text-sm text-[#e53e3e] hover:underline">충전하기 &rarr;</Link>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div>
          <p className="text-4xl font-black text-black tabular-nums">{formatPoints(credits)}</p>
          <p className="text-neutral-500 text-sm">잔여 포인트 (pt)</p>
        </div>
        <div className="text-neutral-400 text-sm">
          <p>테마 AI 생성: {formatPoints(THEME_POINT_COST)} pt</p>
          <p>수동 테마 수정: 무료</p>
        </div>
      </div>
    </section>
  )
}
