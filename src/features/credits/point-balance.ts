/**
 * 크레딧 개편 I Phase (2026-05-17) — server `/credits/balance` 응답 정규화.
 *
 * 정본: shared-contracts §30 CreditOverhaul.
 *
 * server `/credits/balance` 는 디노미 전환 backward-compatible 단계에서 정수
 * `credits` 만 반환할 수 있고(현행), 향후 ledger 연동 시 출처별 잔액 + deficit 를
 * 반환할 수 있다. 본 모듈은 두 형태를 모두 받아 web 표시 형태(PointBalanceView)로
 * 변환한다 — 없는 출처 값은 만들지 않는다 (CLAUDE.md §0 추정 금지).
 */

import { CREDIT_TO_POINT, type CreditSource } from './credit-overhaul'
import type { PointBalanceView } from './CreditBalanceCard'

/**
 * server `/credits/balance` 가 반환할 수 있는 응답 형태 (호환 범위).
 * - `credits`: 정수 크레딧 (디노미 전환 backward-compatible — 현행 server)
 * - `available` / `bySource` / `deficit`: ledger 연동 후 포인트 회계 응답
 */
export interface CreditBalanceResponse {
  credits?: number
  available?: number
  total?: number
  deficit?: number
  bySource?: Partial<Record<CreditSource, number>>
}

/** 출처 4종 — 누락 시 0 으로 채우기 위한 키 목록 */
const SOURCES: readonly CreditSource[] = ['free', 'subscription', 'gift', 'charged']

/**
 * server 응답을 PointBalanceView 로 정규화.
 *
 * 우선순위:
 * 1. server 가 `bySource`(출처 회계)를 주면 → 출처별 표시 + total/available/deficit 산출.
 * 2. server 가 `available`(포인트 총량)만 주면 → 총량 표시 (출처 분해 없음).
 * 3. server 가 정수 `credits` 만 주면(현행) → ×1,000 환산해 총 포인트로 표시.
 */
export function normalizePointBalance(raw: CreditBalanceResponse | null | undefined): PointBalanceView {
  if (!raw) {
    return { available: 0 }
  }

  const deficit = Math.max(0, Math.round(raw.deficit ?? 0))

  // 1) 출처 회계 응답 — server 가 ledger 잔액을 출처별로 반환
  if (raw.bySource) {
    const bySource = SOURCES.reduce(
      (acc, src) => {
        acc[src] = Math.max(0, Math.round(raw.bySource?.[src] ?? 0))
        return acc
      },
      {} as Record<CreditSource, number>,
    )
    const total = SOURCES.reduce((sum, src) => sum + bySource[src], 0)
    const available = typeof raw.available === 'number' ? Math.round(raw.available) : total - deficit
    return { available, total, deficit, bySource }
  }

  // 2) 포인트 총량만 반환 (출처 분해 없음 — 추정 금지)
  if (typeof raw.available === 'number') {
    return {
      available: Math.round(raw.available),
      total: typeof raw.total === 'number' ? Math.round(raw.total) : undefined,
      deficit,
    }
  }

  // 3) 정수 크레딧만 반환 (현행 server — backward compatible) → ×1,000 환산
  const credits = Math.max(0, Math.round(raw.credits ?? 0))
  return { available: credits * CREDIT_TO_POINT, deficit }
}
