"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavEpisode {
  slug: string
  num?: string
  type?: string
}

interface NavWork {
  slug: string
  title: string
  episodeCount?: number
}

interface SeriesNavProps {
  /** 작가 이름 — 네비게이션 브랜드 표시 */
  authorName?: string
  /** 작품 슬러그 — 3단계 URL 생성에 사용 (/{author}/{work}/{episode}) */
  workSlug?: string
  /** API에서 받은 에피소드 목록 — 단일 작품일 때 사용 */
  apiEpisodes?: NavEpisode[]
  /** API에서 받은 작품 목록 — 다중 작품일 때 사용 */
  apiWorks?: NavWork[]
}

export function SeriesNav({ authorName = "Grimoire", workSlug, apiEpisodes, apiWorks }: SeriesNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // URL에서 작가 slug 추출
  const segments = pathname.split("/").filter(Boolean)
  const authorSlug = segments[0] ?? ""
  const base = `/${authorSlug}`

  const isLanding = pathname === base
  const isProfile = pathname === `${base}/profile`

  // 다중 작품 모드 vs 단일 작품(에피소드) 모드
  const isMultiWork = (apiWorks?.length ?? 0) > 1

  // 현재 작품/에피소드 slug 감지
  const currentWorkSlug = segments[1] ?? null
  const currentEpisodeSlug = segments.length >= 3 ? segments[2] : null

  // 에피소드 URL 생성
  const episodeUrl = (slug: string) =>
    workSlug ? `${base}/${workSlug}/${slug}` : `${base}/${slug}`

  // 에피소드 타입별 pill 라벨 생성
  const pillLabel = (ep: NavEpisode, idx: number): string => {
    const type = ep.type ?? "episode"
    switch (type) {
      case "preface": return "일러두기"
      case "afterword": return "후기"
      case "bonus": {
        const bonusNum = ep.slug.replace("bonus", "")
        return `번외${bonusNum}`
      }
      case "episode":
      default:
        if (ep.num) return ep.num
        const match = ep.slug.match(/\d+/)
        return match ? match[0].padStart(2, "0") : String(idx + 1).padStart(2, "0")
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-g-bg/95 backdrop-blur-sm border-b border-g-border px-4 md:px-8 py-2.5 md:py-3 flex items-center gap-4">
      {/* CI 로고 — 플랫폼 홈으로 이동 (대조색: g-text-bright로 어두운 배경에서 가독성 확보) */}
      <Link
        href="/explore"
        className="font-ci text-sm uppercase tracking-[0.15em] text-g-text-muted hover:text-g-accent2 transition-colors duration-200 shrink-0"
      >
        Grimoire
      </Link>
      <span className="text-g-border">|</span>
      {/* 작가명 — 클릭 시 프로필 페이지 */}
      <Link
        href={`${base}/profile`}
        className={cn(
          "font-g-sans text-[13px] font-medium tracking-g-tight transition-colors duration-200 hover:text-g-accent2 shrink-0",
          isProfile ? "text-g-accent2" : "text-g-text"
        )}
      >
        {authorName}
      </Link>

      {/* 탭 목록 — 다중 작품이면 작품 탭, 단일 작품이면 에피소드 탭 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <NavTab
          label="전체"
          active={isLanding}
          onClick={() => router.push(base)}
        />
        {isMultiWork ? (
          // 다중 작품: 작품명 탭
          apiWorks!.map((work, idx) => (
            <NavTab
              key={work.slug}
              label={work.title}
              active={currentWorkSlug === work.slug}
              onClick={() => router.push(`${base}/${work.slug}`)}
            />
          ))
        ) : (
          // 단일 작품: 에피소드 탭
          (apiEpisodes ?? []).map((ep, idx) => (
            <NavTab
              key={ep.slug}
              label={pillLabel(ep, idx)}
              active={currentEpisodeSlug === ep.slug}
              onClick={() => router.push(episodeUrl(ep.slug))}
            />
          ))
        )}
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
        "font-g-sans text-g-caption tracking-g-normal px-3 py-1 md:px-3.5 md:py-1.5 rounded-g-pill cursor-pointer transition-all duration-200 whitespace-nowrap border shrink-0",
        active
          ? "text-g-accent2 border-g-accent bg-g-accent/10"
          : "text-g-text-muted border-g-border bg-transparent hover:text-g-accent2 hover:border-g-accent"
      )}
    >
      {label}
    </button>
  )
}
