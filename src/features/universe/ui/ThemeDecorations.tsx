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
  switch (decorations.dividerIcon) {
    case "antler":
      return (
        <div className={cn("flex items-center gap-4 opacity-30", className)}>
          <div className="flex-1 h-px bg-u-accent" />
          <AntlerSVG size={size} opacity={1} />
          <div className="flex-1 h-px bg-u-accent" />
        </div>
      )

    case "star":
      return (
        <div className={cn("flex items-center gap-4 opacity-30", className)}>
          <div className="flex-1 h-px bg-u-accent" />
          <StarIcon size={size} />
          <div className="flex-1 h-px bg-u-accent" />
        </div>
      )

    case "dot":
      return (
        <div className={cn("flex items-center justify-center gap-4 opacity-30", className)}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="block size-1 rounded-full bg-u-accent" />
          ))}
        </div>
      )

    case "line":
      return (
        <div className={cn("opacity-30", className)}>
          <div className="h-px bg-u-accent" />
        </div>
      )

    case "none":
    default:
      return null
  }
}
