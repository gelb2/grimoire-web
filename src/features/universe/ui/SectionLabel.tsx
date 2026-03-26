import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SectionLabelProps {
  children: ReactNode
  className?: string
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "font-u-sans tracking-u-wide uppercase",
        className
      )}
    >
      {children}
    </div>
  )
}
