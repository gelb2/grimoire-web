// ThemeDecorations — 테마 기반 장식 컴포넌트
// theme.decorations 설정에 따라 적절한 아이콘/구분선을 렌더링한다.
// 하드코딩 대신 테마 데이터가 렌더링을 결정한다.

import { cn } from "@/lib/utils"
import { AntlerSVG } from "./AntlerSVG"
import type { ThemeDecorations as DecorationConfig } from "@/features/theme"

// ── 구분선 아이콘 컴포넌트 ──

function StarIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={cn("text-u-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M10 2L12.5 7.5L18 8.5L14 12.5L15 18L10 15L5 18L6 12.5L2 8.5L7.5 7.5L10 2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function QuillIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M20 2C15 7 10 12 6 18L4 22L8 20C14 16 19 11 22 4L20 2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 18C8 16 10 14 12 12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BookIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
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

// ── 꽃 (5잎) ──

function FlowerIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
      <circle cx="8.5" cy="11" r="3" stroke="currentColor" strokeWidth="1" />
      <circle cx="15.5" cy="11" r="3" stroke="currentColor" strokeWidth="1" />
      <circle cx="9.5" cy="15" r="3" stroke="currentColor" strokeWidth="1" />
      <circle cx="14.5" cy="15" r="3" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

// ── 기하학 (겹친 삼각형) ──

function GeometricIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
      aria-hidden="true"
    >
      <path d="M12 3L20 17H4L12 3Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <path d="M12 21L4 7H20L12 21Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  )
}

// ── 붓 (서예 붓 획) ──

function BrushIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
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

// ── 나뭇잎 ──

function LeafIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
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

// ── 동백꽃 ──

function CamelliaIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
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

// ── 우산 ──

function UmbrellaIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
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

// ── 물레방아 ──

function WaterwheelIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("text-u-accent", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M12 4V12" stroke="currentColor" strokeWidth="1" />
      <path d="M12 12V20" stroke="currentColor" strokeWidth="1" />
      <path d="M4 12H12" stroke="currentColor" strokeWidth="1" />
      <path d="M12 12H20" stroke="currentColor" strokeWidth="1" />
      <path d="M6.34 6.34L12 12" stroke="currentColor" strokeWidth="1" />
      <path d="M12 12L17.66 17.66" stroke="currentColor" strokeWidth="1" />
      <path d="M6.34 17.66L12 12" stroke="currentColor" strokeWidth="1" />
      <path d="M12 12L17.66 6.34" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

// ── 아이콘 이름 → 컴포넌트 매핑 헬퍼 ──

function DividerIconComponent({ name, size }: { name: string; size: number }) {
  switch (name) {
    case "flower": return <FlowerIcon size={size} />
    case "geometric": return <GeometricIcon size={size} />
    case "brush": return <BrushIcon size={size} />
    case "leaf": return <LeafIcon size={size} />
    case "camellia": return <CamelliaIcon size={size} />
    case "umbrella": return <UmbrellaIcon size={size} />
    case "waterwheel": return <WaterwheelIcon size={size} />
    case "star": return <StarIcon size={size} />
    default: return null
  }
}

// ── 헤더 아이콘 ──

interface HeaderIconProps {
  decorations: DecorationConfig
  size?: number
  opacity?: number
  className?: string
}

/** 테마 설정에 따른 헤더 아이콘 렌더링 */
export function ThemeHeaderIcon({ decorations, size = 48, opacity = 0.6, className }: HeaderIconProps) {
  switch (decorations.headerIcon) {
    case "antler":
      return <AntlerSVG size={size} opacity={opacity} className={className} />
    case "quill":
      return <QuillIcon size={size} className={cn("opacity-60", className)} />
    case "book":
      return <BookIcon size={size} className={cn("opacity-60", className)} />
    case "none":
    default:
      return null
  }
}

// ── 구분선 ──

interface DividerProps {
  decorations: DecorationConfig
  size?: number
  className?: string
}

/** 테마 설정에 따른 구분선 렌더링 */
export function ThemeDivider({ decorations, size = 20, className }: DividerProps) {
  const iconName = decorations.dividerIcon

  // 아이콘 없음
  if (iconName === "none") return null

  // 점 3개 스타일
  if (iconName === "dot") {
    return (
      <div className={cn("flex items-center justify-center gap-4 opacity-30", className)}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="block size-1 rounded-full bg-u-accent" />
        ))}
      </div>
    )
  }

  // 단순 선
  if (iconName === "line") {
    return (
      <div className={cn("opacity-30", className)}>
        <div className="h-px bg-u-accent" />
      </div>
    )
  }

  // antler은 AntlerSVG 전용 컴포넌트 사용
  if (iconName === "antler") {
    return (
      <div className={cn("flex items-center gap-4 opacity-30", className)}>
        <div className="flex-1 h-px bg-u-accent" />
        <AntlerSVG size={size} opacity={1} />
        <div className="flex-1 h-px bg-u-accent" />
      </div>
    )
  }

  // 나머지 아이콘들: 공통 레이아웃 (선 — 아이콘 — 선)
  const icon = <DividerIconComponent name={iconName} size={size} />
  if (!icon) return null

  return (
    <div className={cn("flex items-center gap-4 opacity-30", className)}>
      <div className="flex-1 h-px bg-u-accent" />
      {icon}
      <div className="flex-1 h-px bg-u-accent" />
    </div>
  )
}
