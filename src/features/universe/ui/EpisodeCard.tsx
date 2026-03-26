"use client"

import { useRef } from "react"
import { AntlerSVG } from "./AntlerSVG"
import { SectionLabel } from "./SectionLabel"
import { useCardTransition } from "./CardTransition"
import type { ContentMeta } from "@/features/universe/data"

export function EpisodeCard({ content }: { content: ContentMeta }) {
  const isBonus = content.type === "bonus"
  const cardRef = useRef<HTMLDivElement>(null)
  const ctx = useCardTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (ctx && cardRef.current) {
      ctx.navigateWithTransition(`/universe/${content.slug}`, cardRef.current)
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="group relative h-full overflow-hidden rounded-u-card border border-u-border bg-u-bg2 p-5 md:p-8 cursor-pointer transition-all duration-300 hover:border-u-accent hover:-translate-y-0.5"
    >
      {/* 좌측 accent 라인 */}
      <div className="absolute top-0 left-0 w-[3px] h-full bg-u-border transition-colors duration-300 group-hover:bg-u-accent" />

      {/* 번호 레이블 */}
      <SectionLabel className="text-u-label text-u-text-dim mb-3">
        {isBonus ? content.num : `Episode ${content.num}`}
      </SectionLabel>

      {/* 제목 */}
      <div className="text-lg md:text-xl italic text-u-text-bright mb-2 leading-[1.3]">
        {content.title}
      </div>

      {/* 영문 부제 */}
      {content.subtitle && (
        <div className="font-u-sans text-u-caption text-u-text-muted mb-4 md:mb-6">
          {content.subtitle}
        </div>
      )}

      {/* 설명 */}
      {content.description && (
        <div className="text-sm md:text-[0.9rem] text-u-text-muted leading-relaxed mb-4 md:mb-6">
          {content.description}
        </div>
      )}

      {/* CTA */}
      <div className="font-u-sans text-u-caption tracking-u-normal text-u-accent2 uppercase">
        읽기 →
      </div>

      {/* 뿔 SVG 워터마크 */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
        <AntlerSVG size={36} opacity={0.15} />
      </div>
    </div>
  )
}
