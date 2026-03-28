"use client"

import { useRef } from "react"
import { usePathname } from "next/navigation"
import { AntlerSVG } from "./AntlerSVG"
import { SectionLabel } from "./SectionLabel"
import { useCardTransition } from "./CardTransition"
import type { ContentMeta } from "@/features/universe/data"

export function EpisodeCard({ content, workSlug }: { content: ContentMeta; workSlug?: string }) {
  const isBonus = content.type === "bonus"
  // num이 없으면 orderNum에서 파생 (서버 API 데이터 호환)
  const displayNum = content.num ?? (content.orderNum != null ? String(content.orderNum).padStart(2, "0") : undefined)
  const cardRef = useRef<HTMLDivElement>(null)
  const ctx = useCardTransition()
  const pathname = usePathname()
  const authorSlug = pathname.split("/").filter(Boolean)[0] ?? ""

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // workSlug가 있으면 3단계 URL (/{author}/{work}/{episode}), 없으면 2단계 폴백
    const href = workSlug
      ? `/${authorSlug}/${workSlug}/${content.slug}`
      : `/${authorSlug}/${content.slug}`
    if (ctx && cardRef.current) {
      ctx.navigateWithTransition(href, cardRef.current)
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="group relative h-full overflow-hidden rounded-g-card border border-g-border bg-g-bg2 p-5 md:p-8 cursor-pointer transition-all duration-300 hover:border-g-accent hover:-translate-y-0.5"
    >
      {/* 좌측 accent 라인 */}
      <div className="absolute top-0 left-0 w-[3px] h-full bg-g-border transition-colors duration-300 group-hover:bg-g-accent" />

      {/* 번호 레이블 — num/orderNum 모두 없으면 제목만 표시 */}
      {displayNum && (
        <SectionLabel className="text-g-label text-g-text-dim mb-3">
          {isBonus ? displayNum : `Episode ${displayNum}`}
        </SectionLabel>
      )}

      {/* 제목 — 최대 2줄 */}
      <div className="text-lg md:text-xl italic text-g-text-bright mb-2 leading-[1.3] truncate">
        {content.title}
      </div>

      {/* 영문 부제 */}
      {content.subtitle && (
        <div className="font-g-sans text-g-caption text-g-text-muted mb-4 md:mb-6">
          {content.subtitle}
        </div>
      )}

      {/* 설명 */}
      {content.description && (
        <div className="text-sm md:text-[0.9rem] text-g-text-muted leading-relaxed mb-4 md:mb-6">
          {content.description}
        </div>
      )}

      {/* CTA */}
      <div className="font-g-sans text-g-caption tracking-g-normal text-g-accent2 uppercase">
        읽기 →
      </div>

      {/* 뿔 SVG 워터마크 */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
        <AntlerSVG size={36} opacity={0.15} />
      </div>
    </div>
  )
}
