"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { contents } from "@/features/universe/data"
import { cn } from "@/lib/utils"

interface NavEpisode {
  slug: string
  num?: string
  type?: string
}

interface UniverseNavProps {
  /** 작가 이름 — 네비게이션 브랜드 표시 */
  authorName?: string
  /** 작품 슬러그 — 3단계 URL 생성에 사용 (/{author}/{work}/{episode}) */
  workSlug?: string
  /** API에서 받은 에피소드 목록 — 제공 시 로컬 데이터 대신 사용 */
  apiEpisodes?: NavEpisode[]
}

export function UniverseNav({ authorName = "Grimoire", workSlug, apiEpisodes }: UniverseNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  // URL에서 작가 slug 추출
  const segments = pathname.split("/").filter(Boolean)
  const authorSlug = segments[0] ?? ""
  const base = `/${authorSlug}`

  const isLanding = pathname === base

  // 탭 데이터: API 에피소드가 있으면 사용, 없으면 로컬 데이터 폴백
  const allEpisodes: NavEpisode[] = apiEpisodes
    ? apiEpisodes
    : contents.map((c) => ({ slug: c.slug, num: c.num, type: c.type }))

  // 현재 에피소드 slug 감지:
  // 3단계 URL /{author}/{work}/{episode} → segments[2]
  // 2단계 URL /{author}/{episode} → segments[1]
  const currentEpisodeSlug = segments.length >= 3 ? segments[2] : (segments.length >= 2 ? segments[1] : null)

  // 에피소드 URL 생성: workSlug가 있으면 3단계, 없으면 2단계
  const episodeUrl = (slug: string) =>
    workSlug ? `${base}/${workSlug}/${slug}` : `${base}/${slug}`

  // 에피소드 타입별 pill 라벨 생성
  const pillLabel = (ep: NavEpisode, idx: number): string => {
    const type = ep.type ?? "episode"
    switch (type) {
      case "preface": return "일러두기"
      case "afterword": return "후기"
      case "bonus": {
        // bonus1, bonus2, ... → 번외1, 번외2, ...
        const bonusNum = ep.slug.replace("bonus", "")
        return `번외${bonusNum}`
      }
      case "episode":
      default:
        // num이 있으면 그대로 사용, 없으면 slug에서 숫자 추출
        if (ep.num) return ep.num
        const match = ep.slug.match(/\d+/)
        return match ? match[0].padStart(2, "0") : String(idx + 1).padStart(2, "0")
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-u-bg/95 backdrop-blur-sm border-b border-u-border px-4 md:px-8 py-2.5 md:py-3 flex items-center gap-4">
      {/* 플랫폼 복귀 링크 */}
      <Link
        href="/explore"
        className="font-u-sans text-[11px] text-u-text-muted hover:text-u-accent2 transition-colors duration-200 shrink-0"
      >
        &larr; 탐색으로
      </Link>
      <span className="text-u-border">|</span>
      {/* 브랜드 — 클릭 시 프로필 페이지 이동 */}
      <Link
        href={`${base}/profile`}
        className={cn(
          "font-u-sans text-[13px] font-medium tracking-u-tight transition-colors duration-200 hover:text-u-accent2 shrink-0",
          isLanding ? "text-u-accent2" : "text-u-text"
        )}
      >
        {authorName}
      </Link>

      {/* 탭 목록 — 모바일에서 가로 스크롤, API 데이터 기반 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        <NavTab
          label="전체"
          active={isLanding}
          onClick={() => router.push(base)}
        />
        {allEpisodes.map((ep, idx) => (
          <NavTab
            key={ep.slug}
            label={pillLabel(ep, idx)}
            active={currentEpisodeSlug === ep.slug}
            onClick={() => router.push(episodeUrl(ep.slug))}
          />
        ))}
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
