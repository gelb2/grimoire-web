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
        "inline-flex items-center gap-2 font-u-sans text-u-caption tracking-u-normal border border-u-border px-4 py-1.5 rounded-u-pill transition-all duration-200 hover:border-u-accent hover:text-u-accent2",
        variant === "dim"
          ? "text-u-text-dim opacity-60 hover:opacity-100"
          : "text-u-text-muted",
        "mt-12 md:mt-16",
        className
      )}
    >
      {label}
    </Link>
  )
}
