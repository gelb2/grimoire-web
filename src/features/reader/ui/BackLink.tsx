"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface BackLinkProps {
  label?: string
  className?: string
  variant?: "default" | "dim"
}

export function BackLink({
  label = "← 전체 에피소드",
  className,
  variant = "default",
}: BackLinkProps) {
  const pathname = usePathname()
  const authorSlug = pathname.split("/").filter(Boolean)[0] ?? ""

  return (
    <Link
      href={`/${authorSlug}`}
      className={cn(
        "inline-flex items-center gap-2 font-g-sans text-caption tracking-normal-g border border-g-border px-4 py-1.5 pill-radius transition-all duration-200 hover:border-g-accent hover:text-g-accent2",
        variant === "dim"
          ? "text-g-text-dim opacity-60 hover:opacity-100"
          : "text-g-text-muted",
        "mt-12 md:mt-16",
        className
      )}
    >
      {label}
    </Link>
  )
}
