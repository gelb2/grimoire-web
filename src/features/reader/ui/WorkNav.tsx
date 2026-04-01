"use client"

// WorkNav — 범용 에피소드 pill 네비게이션
// SeriesNav의 디자인을 그대로 사용하되, 에피소드 목록을 동적으로 받는다.
// 작가 테마 CSS 변수(--g-*)가 ThemeProvider에 의해 설정되므로
// 동일한 Tailwind 토큰(bg-g-bg, text-g-accent2 등)으로 자동 테마 적용.

import Link from "next/link"
import { cn } from "@/lib/utils"

interface WorkNavEpisode {
  slug: string
  orderNum: number
  title: string
  type?: string
}

interface WorkNavProps {
  authorSlug: string
  authorName: string
  workSlug: string
  workTitle: string
  episodes: WorkNavEpisode[]
  currentEpisodeSlug: string
}

export function WorkNav({
  authorSlug,
  authorName,
  workSlug,
  episodes,
  currentEpisodeSlug,
}: WorkNavProps) {
  const base = `/${authorSlug}`
  const episodeUrl = (slug: string) => `${base}/${workSlug}/${slug}`

  return (
    <nav className="sticky top-0 z-50 bg-g-bg/95 backdrop-blur-sm border-b border-g-border px-4 md:px-8 py-2.5 md:py-3 flex items-center gap-4">
      {/* 작가 공간 복귀 링크 */}
      <Link
        href={base}
        className="font-g-sans text-[11px] text-g-text-muted hover:text-g-accent2 transition-colors duration-200 shrink-0"
      >
        &larr; 작가 공간으로
      </Link>
      <span className="text-g-border">|</span>
      {/* 작가 이름 */}
      <Link
        href={base}
        className="font-g-sans text-[13px] font-medium tracking-tight-g text-g-text hover:text-g-accent2 transition-colors duration-200 shrink-0"
      >
        {authorName}
      </Link>

      {/* 에피소드 pill 목록 — 모바일에서 가로 스크롤 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {episodes.map((ep) => {
          const epType = ep.type ?? "episode"
          let label: string
          switch (epType) {
            case "preface": label = "일러두기"; break
            case "afterword": label = "후기"; break
            case "bonus": {
              const bonusNum = ep.slug.replace("bonus", "")
              label = `번외${bonusNum}`; break
            }
            default: {
              const match = ep.slug.match(/\d+/)
              label = match ? match[0].padStart(2, "0") : String(ep.orderNum).padStart(2, "0")
            }
          }
          const active = ep.slug === currentEpisodeSlug
          return (
            <Link
              key={ep.slug}
              href={episodeUrl(ep.slug)}
              className={cn(
                "font-g-sans fs-caption tracking-normal-g px-3 py-1 md:px-3.5 md:py-1.5 pill-radius cursor-pointer transition-all duration-200 whitespace-nowrap border shrink-0 inline-block text-center",
                active
                  ? "text-g-accent2 border-g-accent bg-g-accent/10"
                  : "text-g-text-muted border-g-border bg-transparent hover:text-g-accent2 hover:border-g-accent"
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
