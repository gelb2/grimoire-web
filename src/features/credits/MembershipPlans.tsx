"use client"

/**
 * 크레딧 개편 I Phase (2026-05-17) — 멤버십(구독) 플랜 표시.
 * CC-5 web (2026-05-22) — 표시 전용 → 액션 버튼 노출(구독하기/현재 플랜).
 *
 * 정본: shared-contracts §30 CreditOverhaul / S Phase Draft §14 (web — 구독 플랜 페이지)
 *       §8-3 — 멤버십 3등급(free/pro/premium) + 월 포인트 풀.
 *
 * 범위 경계 (CC-5): server 구독 API(`/subscriptions/checkout`)는 prod 라이브이나
 * Polar KYC 미완 → 본 컴포넌트는 플랜 카드 + 구독 액션 버튼만 렌더. onSelect 콜백이
 * 실 결제 흐름을 결정 — CC-5 단계에서는 "준비중" 모달, KYC 승인 시 실 checkout 호출.
 * onSelect 미전달 시 정보 표시만(버튼 미렌더).
 *
 * 플랫폼 페이지 — neutral-* 스코핑.
 */

import { MEMBERSHIP_PLANS, formatPoints, type MembershipTier } from './credit-overhaul'

interface MembershipPlansProps {
  /** 현재 사용자 등급 — "현재 플랜" 배지 + 버튼 비활성 (없으면 미표시) */
  currentTier?: MembershipTier
  /** 플랜 선택 콜백 — 주어지면 카드마다 액션 버튼 렌더. CC-5: "준비중" 모달 트리거 */
  onSelect?: (tier: MembershipTier) => void
}

/** 등급별 액션 버튼 라벨 — free 는 구독 대상이 아니므로 별도 문구 */
function actionLabel(tier: MembershipTier, isCurrent: boolean): string {
  if (isCurrent) return '현재 플랜'
  if (tier === 'free') return '무료 플랜'
  return '구독하기'
}

export function MembershipPlans({ currentTier, onSelect }: MembershipPlansProps) {
  const showActions = Boolean(onSelect)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {MEMBERSHIP_PLANS.map((plan) => {
        const isCurrent = currentTier === plan.tier
        // free 플랜은 결제 대상 아님 → 버튼은 렌더하되 항상 비활성 (액션 0)
        const isActionable = showActions && !isCurrent && plan.tier !== 'free'
        const highlight = plan.tier === 'pro'

        const cardClass = [
          'p-6 rounded-xl border text-left transition flex flex-col h-full',
          isCurrent
            ? 'border-black bg-neutral-50'
            : highlight
              ? 'border-neutral-300 bg-white'
              : 'border-neutral-200 bg-[#f5f5f5]',
        ].join(' ')

        return (
          <div key={plan.tier} className={cardClass}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-lg font-bold text-black">{plan.label}</p>
              {isCurrent && (
                <span className="px-2 py-0.5 bg-black text-white text-xs rounded">현재 플랜</span>
              )}
              {!isCurrent && highlight && (
                <span className="px-2 py-0.5 bg-[#e53e3e] text-white text-xs rounded">추천</span>
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

            {/* 구독 액션 버튼 — onSelect 주어질 때만. CC-5: 클릭 시 "준비중" 모달 */}
            {showActions && (
              <button
                type="button"
                disabled={!isActionable}
                onClick={() => onSelect?.(plan.tier)}
                className={[
                  'mt-5 w-full py-2.5 text-sm font-medium rounded-lg transition',
                  isActionable
                    ? 'bg-black hover:bg-neutral-800 text-white'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed',
                ].join(' ')}
              >
                {actionLabel(plan.tier, isCurrent)}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
