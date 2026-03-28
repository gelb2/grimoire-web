import { AntlerSVG } from "./AntlerSVG"
import { cn } from "@/lib/utils"

interface AntlerDividerProps {
  size?: number
  className?: string
}

export function AntlerDivider({ size = 20, className }: AntlerDividerProps) {
  return (
    <div className={cn("flex items-center gap-4 opacity-30", className)}>
      <div className="flex-1 h-px bg-g-accent" />
      <AntlerSVG size={size} opacity={1} />
      <div className="flex-1 h-px bg-g-accent" />
    </div>
  )
}
