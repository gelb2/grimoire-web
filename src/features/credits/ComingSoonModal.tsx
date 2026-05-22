"use client"

/**
 * ComingSoonModal — "준비중입니다" 안내 모달 (CC-5 web — 구독 준비중 가드).
 *
 * 배경 (CC-5): server Polar 구독 정기결제 API(`/subscriptions/checkout`·`/membership`)는
 * prod 라이브이나 Polar KYC + 한국 payout 승인 미완 → 실 구독 결제 불가.
 * 구독 UI 는 선노출하되 모든 구독 액션 버튼은 본 모달만 띄운다 (server API 실호출 0건).
 *
 * 구현: 신규 시각 컴포넌트 아님 — 기존 `Alert`(사슴악마 시각 정본 PASS 컴포넌트)를
 * info 톤으로 래핑한 도메인 전용 얇은 어댑터. 새 색/레이아웃 0건.
 *
 * 추후 전환 (Polar KYC 승인 시): 구독 액션 핸들러에서 본 모달 호출 → 실 `checkout`
 * 호출로 교체. 본 컴포넌트는 그대로 두거나 제거. MembershipPage `handleSelect` 1곳만 수정.
 *
 * 시각 정본 (사슴악마): Alert 골격 그대로 — bg-white / border-neutral-200 / rounded-xl.
 * 플랫폼 영역 neutral-* 스코핑 (작가 g-* 토큰 침범 0건).
 */

import { Alert } from '@/components/Alert'

interface ComingSoonModalProps {
  open: boolean
  onClose: () => void
  /** 모달 본문 — 미지정 시 멤버십 구독 기본 문구 */
  body?: string
}

const DEFAULT_BODY =
  '멤버십 구독 기능은 준비 중입니다. 곧 만나보실 수 있습니다. 현재는 포인트 충전으로 이용해 주세요.'

export function ComingSoonModal({ open, onClose, body }: ComingSoonModalProps) {
  return (
    <Alert
      open={open}
      onClose={onClose}
      tone="info"
      title="준비중입니다"
      body={body ?? DEFAULT_BODY}
      confirmLabel="확인"
    />
  )
}
