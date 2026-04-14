"use client"

import Link from 'next/link'

interface CreditsSectionProps {
  credits: number
}

export function CreditsSection({ credits }: CreditsSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-4 flex-1">
          <h2 className="text-2xl font-black text-black">크레딧</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        <Link href="/dashboard/credits" className="text-sm text-[#e53e3e] hover:underline ml-4">충전하기 &rarr;</Link>
      </div>
      <div className="flex items-center gap-8">
        <div>
          <p className="text-4xl font-black text-black">{credits}</p>
          <p className="text-neutral-500 text-sm">잔여 크레딧</p>
        </div>
        <div className="text-neutral-400 text-sm">
          <p>테마 AI 생성: 1 크레딧</p>
          <p>수동 테마 수정: 무료</p>
        </div>
      </div>
    </section>
  )
}
