// DividerIcons — 테마 구분선 아이콘 SVG 9종 프리셋
// 작가별 고유 아이콘을 모노라인 스타일로 제공한다.
// antler(사슴악마), flower(김소월), star(윤동주), geometry(이상),
// brush(채만식), leaf(이효석), camellia(김유정), umbrella(현진건), wave(나도향)

import { cn } from "@/lib/utils"

interface DividerIconProps {
  size?: number
  color?: string
  className?: string
}

// ── antler: 사슴뿔 (사슴악마) ──
// AntlerSVG.tsx에서 이미 제공 — 여기서는 구분선 전용 간소화 버전

export function AntlerDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M12 22V10M12 10C12 7 10 4.5 8 3.5C9 5.5 9 8 8 9.5C7 7.5 5.5 5 4.5 3.5C5.5 7 7 9.5 7 12M12 10C12 7 14 4.5 16 3.5C15 5.5 15 8 16 9.5C17 7.5 18.5 5 19.5 3.5C18.5 7 17 9.5 17 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── flower: 진달래 꽃잎 3장 (김소월) ──

export function FlowerDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      {/* 꽃잎 3장 — 진달래풍 타원형 */}
      <ellipse cx="12" cy="7.5" rx="3" ry="4.5" stroke="currentColor" strokeWidth="1" />
      <ellipse
        cx="7.5" cy="14"
        rx="3" ry="4.5"
        stroke="currentColor" strokeWidth="1"
        transform="rotate(-35 7.5 14)"
      />
      <ellipse
        cx="16.5" cy="14"
        rx="3" ry="4.5"
        stroke="currentColor" strokeWidth="1"
        transform="rotate(35 16.5 14)"
      />
      {/* 중심 */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

// ── star: 5각별 (윤동주) ──

export function StarDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M12 2L14.5 8.5L21.5 9.5L16.5 14L18 21L12 17.5L6 21L7.5 14L2.5 9.5L9.5 8.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── geometry: 겹친 삼각형 (이상) ──

export function GeometryDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M12 3L20 17H4L12 3Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M12 21L4 7H20L12 21Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── brush: 붓/먹물 한 획 (채만식) ──

export function BrushDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M3 21C5 17 8 13 12 10C16 7 20 5 22 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 21C4 19 6 17 9 15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── leaf: 나뭇잎/메밀꽃 (이효석) ──

export function LeafDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M12 22C12 22 4 16 4 10C4 4 12 2 12 2C12 2 20 4 20 10C20 16 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 22V8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M8 13L12 10L16 13" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}

// ── camellia: 동백꽃 (김유정) ──

export function CamelliaDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="7" rx="3" ry="4" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="7" cy="13" rx="3" ry="4" stroke="currentColor" strokeWidth="1" transform="rotate(-30 7 13)" />
      <ellipse cx="17" cy="13" rx="3" ry="4" stroke="currentColor" strokeWidth="1" transform="rotate(30 17 13)" />
      <ellipse cx="9" cy="18" rx="3" ry="4" stroke="currentColor" strokeWidth="1" transform="rotate(-60 9 18)" />
      <ellipse cx="15" cy="18" rx="3" ry="4" stroke="currentColor" strokeWidth="1" transform="rotate(60 15 18)" />
      <circle cx="12" cy="13" r="2" fill="currentColor" />
    </svg>
  )
}

// ── umbrella: 우산/빗방울 (현진건) ──

export function UmbrellaDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M12 2C6 2 2 8 2 12H22C22 8 18 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 2V19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 19C12 21 10 22 9 21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ── wave: 물결/물레방아 (나도향) ──

export function WaveDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      {/* 물결 3줄 */}
      <path
        d="M2 8C4 6 6 6 8 8C10 10 12 10 14 8C16 6 18 6 20 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M2 12C4 10 6 10 8 12C10 14 12 14 14 12C16 10 18 10 20 12"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M2 16C4 14 6 14 8 16C10 18 12 18 14 16C16 14 18 14 20 16"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── book: 펼친 책 ──

export function BookDividerIcon({ size = 24, className }: DividerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H20V21H5.5C4.67 21 4 20.33 4 19.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 19.5C4 18.67 4.67 18 5.5 18H20"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── 아이콘 키 → 컴포넌트 매핑 ──

export function getDividerIcon(
  name: string,
  size: number,
): React.ReactElement | null {
  switch (name) {
    case "antler": return <AntlerDividerIcon size={size} />
    case "flower": return <FlowerDividerIcon size={size} />
    case "star": return <StarDividerIcon size={size} />
    case "geometric": return <GeometryDividerIcon size={size} />
    case "brush": return <BrushDividerIcon size={size} />
    case "leaf": return <LeafDividerIcon size={size} />
    case "camellia": return <CamelliaDividerIcon size={size} />
    case "umbrella": return <UmbrellaDividerIcon size={size} />
    case "waterwheel": return <WaveDividerIcon size={size} />
    case "book": return <BookDividerIcon size={size} />
    default: return null
  }
}
