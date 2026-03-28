import { cn } from "@/lib/utils"

export function AntlerSVG({
  size = 40,
  opacity = 1,
  className,
}: {
  size?: number
  opacity?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={{ opacity }}
      className={cn("text-g-accent", className)}
      aria-hidden="true"
    >
      <path
        d="M20 38C20 38 20 20 20 15C20 10 16 6 12 4C14 8 14 12 12 14C10 10 8 6 6 4C8 10 10 14 10 18M20 15C20 10 24 6 28 4C26 8 26 12 28 14C30 10 32 6 34 4C32 10 30 14 30 18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="38" r="1.5" fill="currentColor" />
    </svg>
  )
}
