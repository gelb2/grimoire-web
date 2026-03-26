import { contents as localContents, type ContentMeta } from "@/features/universe/data"
import { EpisodeCard } from "./EpisodeCard"
import { SpecialCard } from "./SpecialCard"
import { SectionLabel } from "./SectionLabel"
import { AntlerDivider } from "./AntlerDivider"
import { AntlerSVG } from "./AntlerSVG"

interface UniverseLandingProps {
  contents?: ContentMeta[]
}

// contents를 props로 받으면 사용, 없으면 로컬 데이터 폴백
export function UniverseLanding({ contents = localContents }: UniverseLandingProps) {
  const preface = contents.find((c) => c.type === "preface")
  const episodes = contents.filter((c) => c.type === "episode")
  const bonuses = contents.filter((c) => c.type === "bonus")
  const afterword = contents.find((c) => c.type === "afterword")

  return (
    <div className="max-w-u-landing mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-32">
      {/* 헤더 */}
      <header className="text-center mb-12 md:mb-20 pb-10 md:pb-16 border-b border-u-border">
        <SectionLabel className="text-u-caption text-u-text-muted mb-4 md:mb-6">
          Short Fiction Anthology
        </SectionLabel>

        <div className="flex justify-center mb-4">
          <AntlerSVG size={48} opacity={0.6} />
        </div>

        <h1 className="text-3xl md:text-5xl font-normal italic text-u-text-bright leading-tight mb-4">
          사슴악마
        </h1>

        <div className="font-u-sans text-[12px] text-u-text-dim tracking-u-normal">
          Inspired by the sensibility of A24
        </div>
      </header>

      {/* 일러두기 */}
      {preface && (
        <section className="mb-8 md:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
            <SpecialCard content={preface} />
          </div>
        </section>
      )}

      {/* 에피소드 그리드 */}
      <section className="mb-12 md:mb-16">
        <SectionLabel className="text-u-label text-u-text-dim mb-4 md:mb-6">에피소드</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
          {episodes.map((ep) => (
            <EpisodeCard key={ep.slug} content={ep} />
          ))}
        </div>
      </section>

      {/* 번외 섹션 */}
      {bonuses.length > 0 && (
        <section className="mb-12 md:mb-16">
          <SectionLabel className="text-u-label text-u-text-dim mb-4 md:mb-6">번외 에피소드</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
            {bonuses.map((b) => (
              <EpisodeCard key={b.slug} content={b} />
            ))}
          </div>
        </section>
      )}

      {/* 구분선 */}
      <AntlerDivider className="mb-8 md:mb-12" />

      {/* 후기 */}
      {afterword && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
            <SpecialCard content={afterword} />
          </div>
        </section>
      )}
    </div>
  )
}
