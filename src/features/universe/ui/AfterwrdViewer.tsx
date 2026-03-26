import { BackLink } from "./BackLink"
import { SectionLabel } from "./SectionLabel"

interface AfterwrdViewerProps {
  glitchText: string
  footnote: string
}

export function AfterwrdViewer({ glitchText, footnote }: AfterwrdViewerProps) {
  return (
    <div className="max-w-u-reader mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-16 md:pb-32">
      {/* 페이지 타이틀 */}
      <header className="mb-8 md:mb-12">
        <SectionLabel className="text-u-label text-u-text-dim">후기</SectionLabel>
      </header>

      {/* 깨진 문자 덩어리 */}
      <div
        aria-hidden="true"
        className="font-mono text-[11px] md:text-[13px] leading-relaxed text-u-text opacity-40 whitespace-pre-wrap break-all min-h-[60vh]"
      >
        {glitchText}
      </div>

      <div className="h-px bg-u-border opacity-50 mt-12 md:mt-16 mb-6 md:mb-8" />

      <p className="italic text-u-body-sm text-u-text-muted leading-[1.8] font-u-sans">
        {footnote}
      </p>

      <BackLink variant="dim" />
    </div>
  )
}
