"use client"

/**
 * 크레딧 개편 I Phase (2026-05-17) — 멤버십(구독) 플랜 표시.
 *
 * 정본: shared-contracts §30 CreditOverhaul / S Phase Draft §14 (web — 구독 플랜 페이지)
 *       §8-3 — 멤버십 3등급(free/pro/premium) + 월 포인트 풀.
 *
 * 범위 경계 (S Phase Draft §6 #5): Polar 구독 결제 연동은 I Phase 외.
 * 본 컴포넌트는 플랜 표시·선택 UI 전용 — 실 결제 호출 없음.
 * onSelect 가 주어지면 선택 가능, 없으면 정보 표시만.
 *
 * 플랫폼 페이지 — neutral-* 스코핑.
 */

import { MEMBERSHIP_PLANS, formatPoints, type MembershipTier } from './credit-overhaul'

interface MembershipPlansProps {
  /** 현재 사용자 등급 — "현재 플랜" 배지 표시 (없으면 미표시) */
  currentTier?: MembershipTier
  /** 플랜 선택 콜백 — 주어지면 선택 가능 (I Phase: 안내만, 결제 연동은 별도 sprint) */
  onSelect?: (tier: MembershipTier) => void
  /** 선택된 등급 (onSelect 사용 시) */
  selectedTier?: MembershipTier
}

export function MembershipPlans({ currentTier, onSelect, selectedTier }: MembershipPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {MEMBERSHIP_PLANS.map((plan) => {
        const isCurrent = currentTier === plan.tier
        const isSelected = selectedTier === plan.tier
        const selectable = Boolean(onSelect)

        const baseClass =
          'p-6 rounded-xl border text-left transition flex flex-col h-full'
        const stateClass = isSelected
          ? 'border-black bg-neutral-50'
          : 'border-neutral-200 bg-[#f5f5f5] hover:border-neutral-300'

        const content = (
          <>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-bold text-black">{plan.label}</p>
              {isCurrent && (
                <span className="px-2 py-0.5 bg-black text-white text-xs rounded">현재 플랜</span>
              )}
            </div>
            <p className="text-[#e53e3e] text-2xl font-bold">
              {plan.priceKrw === 0 ? '무료' : `₩${plan.priceKrw.toLocaleString('ko-KR')}`}
              {plan.priceKrw > 0 && (
                <span className="text-sm font-normal text-neutral-400"> / 월</span>
              )}
            </p>
            {plan.monthlyPool > 0 && (
              <p className="text-sm text-neutral-500 mt-1 tabular-nums">
                월 {formatPoints(plan.monthlyPool)} pt 제공
              </p>
            )}
            <ul className="mt-4 space-y-1.5 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="text-sm text-neutral-600 flex gap-1.5">
                  <span className="text-neutral-300" aria-hidden>
                    ·
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </>
        )

        if (selectable) {
          return (
            <button
              key={plan.tier}
              type="button"
              onClick={() => onSelect?.(plan.tier)}
              className={`${baseClass} ${stateClass}`}
            >
              {content}
            </button>
          )
        }

        return (
          <div key={plan.tier} className={`${baseClass} ${stateClass}`}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
