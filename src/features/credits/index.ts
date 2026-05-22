/**
 * credits 슬라이스 Public API (FSD — slice index.ts 격리 규칙).
 *
 * 크레딧 개편 I Phase (2026-05-17) — 디노미네이션 + 포인트 출처 회계 +
 * 채팅 4구간 차감 안내 + 멤버십 플랜. 정본: shared-contracts §30.
 */

export {
  CREDIT_TO_POINT,
  CREDIT_CONSUMPTION_ORDER,
  CREDIT_SOURCE_LABEL,
  CREDIT_SOURCE_DESC,
  CHAT_CHARGE_TIERS,
  ANALYSIS_POINT_COST,
  THEME_POINT_COST,
  MEMBERSHIP_MONTHLY_POOL,
  MEMBERSHIP_PRICE_KRW,
  MEMBERSHIP_PLANS,
  creditsToPoints,
  formatPoints,
  abbreviatePoints,
  chatChargeTierInfo,
} from './credit-overhaul'

export type {
  CreditSource,
  ChatChargeTier,
  ChatChargeTierInfo,
  MembershipTier,
  MembershipPlanInfo,
} from './credit-overhaul'

export { CreditBalanceCard } from './CreditBalanceCard'
export type { PointBalanceView } from './CreditBalanceCard'
export { ChatChargeGuide } from './ChatChargeGuide'
export { MembershipPlans } from './MembershipPlans'
export { ComingSoonModal } from './ComingSoonModal'
export { normalizePointBalance } from './point-balance'
export type { CreditBalanceResponse } from './point-balance'
