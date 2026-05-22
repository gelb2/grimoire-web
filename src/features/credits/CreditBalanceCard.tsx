"use client"

/**
 * 크레딧 개편 I Phase (2026-05-17) — 포인트 잔액 표시 (4 출처 + deficit).
 *
 * 정본: shared-contracts §30 CreditOverhaul / S Phase Draft §14 (web — 잔액 표시)
 *
 * server `/credits/balance` 가 4 출처별 잔액 + deficit 를 반환하면 출처별로 분리 표시.
 * 디노미 전환 backward-compatible 단계에서는 정수 `credits` 만 올 수 있으므로,
 * 그 경우 총 포인트만 표시하고 출처 분해는 생략한다 (없는 값 추정 금지 — CLAUDE.md §0).
 *
 * 플랫폼 페이지 — neutral-* 스코핑 (CSS 스코핑 규칙). 사슴악마 정본 정합:
 * 좁은 헤드라인은 축약(abbreviatePoints), 상세는 천단위(formatPoints).
 */

import {
  CREDIT_CONSUMPTION_ORDER,
  CREDIT_SOURCE_LABEL,
  CREDIT_SOURCE_DESC,
  formatPoints,
  abbreviatePoints,
  type CreditSource,
} from './credit-overhaul'

/**
 * 포인트 잔액 — server `/credits/balance` 응답을 web 에서 정규화한 형태.
 * `bySource` 가 있으면 출처별 분해 표시, 없으면 총량만 표시.
 */
export interface PointBalanceView {
  /** 사용 가능 총 포인트 (4 출처 합 - deficit) */
  available: number
  /** 4 출처 합 (deficit 차감 전) — 표시 보조 */
  total?: number
  /** 외상(deficit) 포인트 — 0 이상, 잔액 부족 채팅 사후 차감분 */
  deficit?: number
  /** 출처별 잔액 — server 가 분리 회계 응답을 줄 때만 존재 */
  bySource?: Record<CreditSource, number>
}

interface CreditBalanceCardProps {
  balance: PointBalanceView
}

/** 출처별 잔액 1행 */
function SourceRow({ source, points }: { source: CreditSource; points: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm text-black">{CREDIT_SOURCE_LABEL[source]}</p>
        <p className="text-xs text-neutral-400">{CREDIT_SOURCE_DESC[source]}</p>
      </div>
      <span className="text-sm font-bold text-black tabular-nums">{formatPoints(points)} pt</span>
    </div>
  )
}

export function CreditBalanceCard({ balance }: CreditBalanceCardProps) {
  const { available, deficit = 0, bySource } = balance
  const hasDeficit = deficit > 0

  return (
    <div>
      {/* 잔액 헤드라인 — 축약 표기로 큰 숫자 완화 (§8-1) */}
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">사용 가능 포인트</p>
        <p className="text-5xl font-bold text-[#e53e3e] tabular-nums" title={`${formatPoints(available)} pt`}>
          {abbreviatePoints(available)}
        </p>
        <p className="text-neutral-400 text-sm mt-1">
          포인트 (pt) · 정확히 {formatPoints(available)} pt
        </p>
        {hasDeficit && (
          <p className="mt-3 inline-block px-3 py-1 rounded-full bg-[#e53e3e]/10 text-[#e53e3e] text-xs">
            외상 {formatPoints(deficit)} pt — 다음 충전 시 우선 차감됩니다
          </p>
        )}
      </div>

      {/* 출처별 분해 — server 가 출처 회계 응답을 줄 때만 표시 (없으면 추정 금지) */}
      {bySource && (
        <div className="mb-8">
          <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">포인트 출처</h3>
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            {CREDIT_CONSUMPTION_ORDER.map((source) => (
              <SourceRow key={source} source={source} points={bySource[source] ?? 0} />
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            사용 시 무료 적립 → 구독 포인트 → 응원 선물 → 충전 포인트 순으로 차감됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
