"use client"

/**
 * 크레딧 개편 I Phase (2026-05-17) — 채팅 메시지 차감 배지.
 *
 * server `sendMessage` 응답의 assistant 메시지에 붙는 `chargedPoints`/`chargeTier`
 * (채팅 4구간 사후 차감 결과 — shared-contracts §30 ChatMessage)를 표시.
 *
 * 차감 정보가 없으면(과거 무료 시대 메시지 / 차감 실패 / 미연동) 아무것도 렌더링하지 않는다.
 * 플랫폼 페이지 — neutral-* / 회색 톤. 사슴악마 정본: 본문을 가리지 않는 캡션 크기.
 */

import { chatChargeTierInfo, formatPoints } from '@/features/credits'

interface ChatChargeBadgeProps {
  chargedPoints?: number | null
  chargeTier?: string | null
}

export function ChatChargeBadge({ chargedPoints, chargeTier }: ChatChargeBadgeProps) {
  // 차감 정보 없으면 미표시 (없는 값 추정 금지)
  if (chargedPoints == null || chargedPoints <= 0) return null

  const tierInfo = chatChargeTierInfo(chargeTier)

  return (
    <p className="mt-1 px-1 text-[11px] text-neutral-400">
      {tierInfo ? `${tierInfo.label} · ` : ''}
      <span className="text-neutral-500">{formatPoints(chargedPoints)} pt 차감</span>
    </p>
  )
}
