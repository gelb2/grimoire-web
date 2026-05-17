"use client"

/**
 * 크레딧 개편 I Phase (2026-05-17) — 채팅 4구간 차감 안내.
 *
 * 정본: shared-contracts §30 CreditOverhaul / S Phase Draft §14 (web — 채팅 차감 안내)
 *       §8-4 — 채팅은 입력 토큰 기준 4구간 정액 사후 차감.
 *
 * 채팅은 토큰 사용량을 API 응답 후 확정 → 사후 차감. 사용자에게 4구간을 미리 안내.
 * 플랫폼 페이지 — neutral-* 스코핑. 정적 안내 (API 호출 없음).
 */

import { CHAT_CHARGE_TIERS, formatPoints } from './credit-overhaul'

interface ChatChargeGuideProps {
  /** 컴팩트 모드 — 채팅 화면 사이드 등 좁은 공간용 (기본 false) */
  compact?: boolean
}

export function ChatChargeGuide({ compact = false }: ChatChargeGuideProps) {
  if (compact) {
    return (
      <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-2">채팅 차감 안내</p>
        <ul className="space-y-1">
          {CHAT_CHARGE_TIERS.map((t) => (
            <li key={t.tier} className="flex items-center justify-between text-xs text-neutral-600">
              <span>{t.label}</span>
              <span className="font-bold text-[#e53e3e] tabular-nums">{formatPoints(t.points)} pt</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="bg-[#f5f5f5] border border-neutral-200 rounded-xl p-6">
      <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">AI 채팅 차감 안내</h3>
      <p className="text-xs text-neutral-400 mb-4">
        대화 길이(입력 토큰)에 따라 4개 구간으로 나누어 차감됩니다. 차감은 AI 응답 후 확정됩니다.
      </p>
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        {CHAT_CHARGE_TIERS.map((t) => (
          <div
            key={t.tier}
            className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 last:border-0"
          >
            <div>
              <p className="text-sm text-black">{t.label}</p>
              <p className="text-xs text-neutral-400">{t.range}</p>
            </div>
            <span className="text-sm font-bold text-[#e53e3e] tabular-nums">{formatPoints(t.points)} pt</span>
          </div>
        ))}
      </div>
    </div>
  )
}
