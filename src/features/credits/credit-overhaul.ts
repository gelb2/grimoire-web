/**
 * 크레딧 개편 I Phase (2026-05-17) — web 도메인 상수 + 디노미 표시 유틸.
 *
 * 정본: `.claude/shared-contracts.md` §30 CreditOverhaul (server↔web 계약)
 *       `research/CREDIT_PRICING_OVERHAUL_PLAN.md` §8 (v6)
 *       `.claude/state/sprint-credit-overhaul-s-phase-draft.md` §8-1 (큰 숫자 완화 UI)
 *
 * server 도메인 정본은 grimoire-server `src/domain/model/credit-point.ts` /
 * `chat-charge-tier.ts` / `membership-tier.ts`. 본 파일은 그 §30 계약을 web 에 미러한다.
 * 수치 재산정 금지 — §30 변경 시 동시 갱신 (shared-contracts 규칙).
 */

/** 디노미네이션 상수 — 1 크레딧 = 1,000 pt (§8-1 확정) */
export const CREDIT_TO_POINT = 1000

/** 포인트 출처 4종 (§8-2 분리 회계) */
export type CreditSource = 'free' | 'subscription' | 'gift' | 'charged'

/** 소진 우선순위 (§8-2) — 인덱스 0이 최우선 소진 */
export const CREDIT_CONSUMPTION_ORDER: readonly CreditSource[] = [
  'free',
  'subscription',
  'gift',
  'charged',
]

/** 출처별 한국어 라벨 (잔액 표시 UI) */
export const CREDIT_SOURCE_LABEL: Record<CreditSource, string> = {
  free: '무료 적립',
  subscription: '구독 포인트',
  gift: '응원 선물',
  charged: '충전 포인트',
}

/** 출처별 설명 (잔액 표시 UI 보조 텍스트) */
export const CREDIT_SOURCE_DESC: Record<CreditSource, string> = {
  free: '가입·첫 작품 등록 보너스',
  subscription: '멤버십 월 포인트 풀 (매월 리셋)',
  gift: '독자에게 받은 응원',
  charged: '직접 충전한 포인트',
}

/** 채팅 차감 구간 4종 (§8-4 — 3구간 금지) */
export type ChatChargeTier = 'short' | 'normal' | 'long' | 'xlong'

/** 채팅 4구간 차감 정의 — §8-4 기본값 (server SystemSetting 으로 동적 오버라이드 가능) */
export interface ChatChargeTierInfo {
  tier: ChatChargeTier
  /** 한국어 라벨 */
  label: string
  /** 사용자 안내 문구 (input 토큰 범위) */
  range: string
  /** 차감 포인트 */
  points: number
}

/**
 * 채팅 4구간 차감 안내 (§8-4 cost-accountant v3 확정 — 재산정 금지).
 * - short:  ≤ 500 tok      → 190 pt
 * - normal: 501 ~ 4,000    → 810 pt
 * - long:   4,001 ~ 12,000 → 3,390 pt
 * - xlong:  > 12,000       → 5,520 pt
 */
export const CHAT_CHARGE_TIERS: readonly ChatChargeTierInfo[] = [
  { tier: 'short', label: '짧은 대화', range: '입력 500 토큰 이하', points: 190 },
  { tier: 'normal', label: '보통 대화', range: '입력 501 ~ 4,000 토큰', points: 810 },
  { tier: 'long', label: '긴 대화', range: '입력 4,001 ~ 12,000 토큰', points: 3390 },
  { tier: 'xlong', label: '아주 긴 대화', range: '입력 12,000 토큰 초과', points: 5520 },
] as const

/** 분석 1회 정액 차감 (§8-4 — 구 4 크레딧 디노미 환산) */
export const ANALYSIS_POINT_COST = 2440

/** 테마 AI 생성 1회 정액 차감 (§8-4 — 구 1 크레딧 디노미 환산) */
export const THEME_POINT_COST = 590

/** 멤버십 등급 3종 */
export type MembershipTier = 'free' | 'pro' | 'premium'

/** 등급별 월 포인트 풀 크기 (§8-3 cost-accountant v3 확정) */
export const MEMBERSHIP_MONTHLY_POOL: Record<MembershipTier, number> = {
  free: 0,
  pro: 93000,
  premium: 191500,
}

/** 등급별 월 가격 (KRW) — §8-3 */
export const MEMBERSHIP_PRICE_KRW: Record<MembershipTier, number> = {
  free: 0,
  pro: 9900,
  premium: 19900,
}

/** 멤버십 플랜 표시 정보 (구독 플랜 페이지 — 표시 전용) */
export interface MembershipPlanInfo {
  tier: MembershipTier
  label: string
  priceKrw: number
  monthlyPool: number
  /** 플랜 특징 (표시용) */
  features: string[]
}

/** 구독 플랜 카탈로그 (§8-3 — 표시·선택 전용, 실 결제 연동은 I Phase 외) */
export const MEMBERSHIP_PLANS: readonly MembershipPlanInfo[] = [
  {
    tier: 'free',
    label: '무료',
    priceKrw: 0,
    monthlyPool: MEMBERSHIP_MONTHLY_POOL.free,
    features: [
      '테마 슬롯 1개',
      '일일 무료 테마 생성 3회',
      '월 포인트 풀 없음 (충전 포인트로 이용)',
    ],
  },
  {
    tier: 'pro',
    label: '프로',
    priceKrw: MEMBERSHIP_PRICE_KRW.pro,
    monthlyPool: MEMBERSHIP_MONTHLY_POOL.pro,
    features: [
      '테마 슬롯 3개',
      '일일 무료 테마 생성 7회',
      `월 포인트 풀 ${MEMBERSHIP_MONTHLY_POOL.pro.toLocaleString('ko-KR')}pt`,
      '채팅·분석·테마 공용 사용',
    ],
  },
  {
    tier: 'premium',
    label: '프리미엄',
    priceKrw: MEMBERSHIP_PRICE_KRW.premium,
    monthlyPool: MEMBERSHIP_MONTHLY_POOL.premium,
    features: [
      '테마 슬롯 8개',
      '일일 무료 테마 생성 12회',
      `월 포인트 풀 ${MEMBERSHIP_MONTHLY_POOL.premium.toLocaleString('ko-KR')}pt`,
      '채팅·분석·테마 공용 사용',
    ],
  },
] as const

/**
 * 정수 크레딧 → 포인트 환산.
 * 디노미 전환 후 server `/credits/balance` 가 아직 정수 크레딧을 반환하는 경우
 * web 에서 표시 단위(pt)로 환산하기 위한 호환 함수.
 */
export function creditsToPoints(credits: number): number {
  return Math.round(credits * CREDIT_TO_POINT)
}

/**
 * 포인트를 천단위 구분 문자열로 표시 (§8-1 "큰 숫자 완화 UI" — 기본 표기).
 * 예: 93000 → "93,000"
 */
export function formatPoints(points: number): string {
  return Math.round(points).toLocaleString('ko-KR')
}

/**
 * 포인트를 축약 표기 (§8-1 "큰 숫자 완화 UI" — 큰 잔액 시 한국어 만/억 단위).
 * 천 단위 미만은 그대로, 1만 이상은 "N.N만", 1억 이상은 "N.N억".
 * 잔액 헤드라인 등 좁은 공간 표시용. 정밀 표시는 formatPoints 사용.
 *
 * 예: 950 → "950" / 93000 → "9.3만" / 191500 → "19.2만" / 120000000 → "1.2억"
 */
export function abbreviatePoints(points: number): string {
  const n = Math.round(points)
  const abs = Math.abs(n)
  if (abs < 10000) return n.toLocaleString('ko-KR')
  if (abs < 100000000) {
    const man = n / 10000
    // 정수면 소수점 제거, 아니면 소수점 1자리
    return `${trimDecimal(man)}만`
  }
  const eok = n / 100000000
  return `${trimDecimal(eok)}억`
}

/** 소수점 1자리 — 정수면 소수부 제거 (예: 9.0 → "9", 9.3 → "9.3") */
function trimDecimal(value: number): string {
  const fixed = value.toFixed(1)
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
}

/** ChatChargeTier 식별자로 구간 정보 조회 (채팅 응답 chargeTier 표시용) */
export function chatChargeTierInfo(tier: string | null | undefined): ChatChargeTierInfo | null {
  if (!tier) return null
  return CHAT_CHARGE_TIERS.find((t) => t.tier === tier) ?? null
}
