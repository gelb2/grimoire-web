"use client"

import { usePathname, useRouter } from "next/navigation"
import { contents } from "@/features/universe/data"
import { cn } from "@/lib/utils"

export function UniverseNav() {
  const pathname = usePathname()
  const router = useRouter()

  // URL에서 작가 slug 추출: /deerdevil/ep1 → "deerdevil"
  const segments = pathname.split("/").filter(Boolean)
  const authorSlug = segments[0] ?? "deerdevil"
  const base = `/${authorSlug}`

  const isLanding = pathname === base

  const episodeContents = contents.filter(
    (c) => c.type === "episode" || c.type === "bonus"
  )

  const currentSlug = segments.length >= 2 ? segments[1] : null

  return (
    <nav className="sticky top-0 z-50 bg-u-bg/95 backdrop-blur-sm border-b border-u-border px-4 md:px-8 py-2.5 md:py-3 flex items-center gap-4">
      {/* 브랜드 */}
      <button
        onClick={() => router.push(base)}
        className={cn(
          "font-u-sans text-[13px] font-medium tracking-u-tight bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-u-accent2 shrink-0",
          isLanding ? "text-u-accent2" : "text-u-text"
        )}
      >
        사슴악마
      </button>

      {/* 탭 목록 — 모바일에서 가로 스크롤 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <NavTab
          label="전체"
          active={isLanding}
          onClick={() => router.push(base)}
        />
        <NavTab
          label="일러두기"
          active={currentSlug === "preface"}
          onClick={() => router.push(`${base}/preface`)}
        />
        {episodeContents.map((c) => (
          <NavTab
            key={c.slug}
            label={c.num ?? c.slug}
            active={currentSlug === c.slug}
            onClick={() => router.push(`${base}/${c.slug}`)}
          />
        ))}
        <NavTab
          label="후기"
          active={currentSlug === "afterword"}
          onClick={() => router.push(`${base}/afterword`)}
        />
      </div>
    </nav>
  )
}

function NavTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "font-u-sans text-u-caption tracking-u-normal px-3 py-1 md:px-3.5 md:py-1.5 rounded-u-pill cursor-pointer transition-all duration-200 whitespace-nowrap border shrink-0",
        active
          ? "text-u-accent2 border-u-accent bg-u-accent/10"
          : "text-u-text-muted border-u-border bg-transparent hover:text-u-accent2 hover:border-u-accent"
      )}
    >
      {label}
    </button>
  )
}
