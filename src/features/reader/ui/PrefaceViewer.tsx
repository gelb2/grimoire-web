import { BackLink } from "./BackLink"
import { SectionLabel } from "./SectionLabel"

interface PrefaceViewerProps {
  paragraphs: string[]
  lastLine: string
}

export function PrefaceViewer({ paragraphs, lastLine }: PrefaceViewerProps) {
  return (
    <div className="mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-32">
      {/* 헤더 */}
      <header className="mb-10 md:mb-16">
        <SectionLabel className="text-[19px] text-g-text-dim mb-4">
          Preface · 일러두기
        </SectionLabel>
        <div className="w-10 h-px bg-g-accent opacity-50" />
      </header>

      {/* 본문 단락 */}
      <main>
        {paragraphs.map((para, idx) => (
          <p
            key={idx}
            className="text-[15px] md:text-[17px] leading-[1.75] text-g-text mb-5"
          >
            {para}
          </p>
        ))}

        <div className="h-px bg-g-border mt-10 md:mt-12 mb-8 md:mb-10" />

        <p className="text-[15px] md:text-[17px] italic text-g-text-muted leading-[1.75]">
          {lastLine}
        </p>
      </main>

      <BackLink />
    </div>
  )
}
