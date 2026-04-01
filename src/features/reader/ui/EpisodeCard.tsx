"use client"

import { useRef } from "react"
import { usePathname } from "next/navigation"
import { AntlerSVG } from "./AntlerSVG"
import { SectionLabel } from "./SectionLabel"
import { useCardTransition } from "./CardTransition"
import { useTheme } from "@/features/theme"
import type { ContentMeta } from "@/features/reader/data"

export function EpisodeCard({ content, workSlug }: { content: ContentMeta; workSlug?: string }) {
  const theme = useTheme()
  const accentPosition = theme.decorations?.cardAccentPosition ?? "left"
  const ctaText = theme.cardCtaText ?? "읽기 →"
  const watermarkOpacity = theme.cardWatermarkOpacity ?? 0.15
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
      className="group relative h-full overflow-hidden rounded-lg border border-g-border bg-g-bg2 p-5 md:p-8 cursor-pointer transition-all duration-300 hover:border-g-accent"
      style={{ '--hover-lift': `var(--g-card-hover-lift, 0.125rem)` } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.transform = `translateY(calc(-1 * var(--g-card-hover-lift, 0.125rem)))`)}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
    >
      {/* accent 라인 — 위치는 테마 decorations.cardAccentPosition에서 결정 */}
      {accentPosition === "left" && (
        <div className="absolute top-0 left-0 w-[3px] h-full bg-g-border transition-colors duration-300 group-hover:bg-g-accent" />
      )}
      {accentPosition === "top" && (
        <div className="absolute top-0 left-0 h-[3px] w-full bg-g-border transition-colors duration-300 group-hover:bg-g-accent" />
      )}

      {/* 번호 레이블 — num/orderNum 모두 없으면 제목만 표시 */}
      {displayNum && (
        <SectionLabel className="text-label text-g-text-dim mb-3">
          {isBonus ? displayNum : `Episode ${displayNum}`}
        </SectionLabel>
      )}

      {/* 제목 */}
      <div className="text-lg md:text-xl italic text-g-text-bright mb-2 leading-[1.3]">
        {content.title}
      </div>

      {/* 영문 부제 */}
      {content.subtitle && (
        <div className="font-g-sans text-caption text-g-text-muted mb-4 md:mb-6">
          {content.subtitle}
        </div>
      )}

      {/* 설명 */}
      {content.description && (
        <div className="text-sm md:text-[0.9rem] text-g-text-muted leading-relaxed mb-4 md:mb-6">
          {content.description}
        </div>
      )}

      {/* CTA — 테마에서 텍스트 결정 */}
      <div className="font-g-sans text-caption tracking-normal-g text-g-accent2 uppercase">
        {ctaText}
      </div>

      {/* 뿔 SVG 워터마크 — 투명도 테마에서 결정 */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
        <AntlerSVG size={36} opacity={watermarkOpacity} />
      </div>
    </div>
  )
}
