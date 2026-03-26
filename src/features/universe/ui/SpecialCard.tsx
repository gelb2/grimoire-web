"use client"

import { useRef } from "react"
import { usePathname } from "next/navigation"
import { SectionLabel } from "./SectionLabel"
import { useCardTransition } from "./CardTransition"
import type { ContentMeta } from "@/features/universe/data"

export function SpecialCard({ content }: { content: ContentMeta }) {
  const isAfterword = content.type === "afterword"
  const cardRef = useRef<HTMLDivElement>(null)
  const ctx = useCardTransition()
  const pathname = usePathname()
  const authorSlug = pathname.split("/").filter(Boolean)[0] ?? "deerdevil"

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (ctx && cardRef.current) {
      ctx.navigateWithTransition(`/${authorSlug}/${content.slug}`, cardRef.current)
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="group relative overflow-hidden rounded-u-card border border-u-border/60 bg-u-bg2/60 px-5 py-5 md:px-8 md:py-7 cursor-pointer transition-all duration-300 hover:border-u-accent/40 hover:bg-u-bg2/80"
    >
      {/* 후기 카드 배경 깨진 문자 */}
      {isAfterword && (
        <div
          aria-hidden="true"
          className="absolute inset-0 font-mono text-[9px] leading-[1.4] text-u-text-dim opacity-25 overflow-hidden p-4 break-all pointer-events-none select-none"
        >
          ヲ가나다ラ∂ΩΦ바사アイウ∑∆라마바∇ψχξ가나다라マミムメモ
          ∂ΩΦ바사아자∑∆Λ라마바사아자차카타파하가나∇ψχξ다라마바사
        </div>
      )}

      <div className="relative z-10">
        {/* 레이블 */}
        <SectionLabel className="text-u-label text-u-text-dim mb-3">
          {isAfterword ? "Afterword" : "Preface"}
        </SectionLabel>

        {/* 제목 */}
        <div className="text-[1.2rem] italic text-u-text-soft mb-2.5">
          {content.title}
        </div>

        {/* 부제 */}
        <div className="font-u-sans text-u-caption text-u-text-dim tracking-u-tight">
          {isAfterword
            ? "국립민속박물관 관리번호 2019-UNK-047"
            : "편집자 서문 · 박물관 필사본"}
        </div>
      </div>
    </div>
  )
}
