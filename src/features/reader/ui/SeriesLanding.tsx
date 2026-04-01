import { type ContentMeta } from "@/features/reader/data"
import { EpisodeCard } from "./EpisodeCard"
import { SpecialCard } from "./SpecialCard"
import { SectionLabel } from "./SectionLabel"
import { ThemeHeaderIcon, ThemeDivider } from "./ThemeDecorations"
import { useTheme } from "@/features/theme"
import type { ThemeDecorations as DecorationConfig } from "@/features/theme"

// 기본 장식 — ThemeProvider에서 받지 못했을 때 폴백
const DEFAULT_DECORATIONS: DecorationConfig = {
  dividerIcon: "antler",
  dividerColor: "#9a8060",
  headerIcon: "antler",
  headerSubtitle: "Short Fiction Anthology",
  cardAccentPosition: "left",
  footerText: "Inspired by the sensibility of A24",
}

interface SeriesLandingProps {
  contents?: ContentMeta[]
  /** 작가 이름 — 헤더에 표시 */
  authorName?: string
  /** 작품 슬러그 — 에피소드 링크에 사용 */
  workSlug?: string
  /** 장식 설정 — 테마에서 전달 */
  decorations?: DecorationConfig
  /** 히어로 스타일 — Phase 2 (레디맥 리서치 기반) */
  heroStyle?: "fullname" | "cover" | "minimal" | "none"
}

// contents를 props로 받으면 사용, 없으면 로컬 데이터 폴백
export function SeriesLanding({
  contents = [],
  authorName = "Grimoire",
  workSlug,
  decorations = DEFAULT_DECORATIONS,
  heroStyle = "minimal",
}: SeriesLandingProps) {
  const theme = useTheme()
  const showPreface = theme.showPreface ?? true
  const showAfterword = theme.showAfterword ?? true

  const preface = contents.find((c) => c.type === "preface")
  const episodes = contents.filter((c) => c.type === "episode")
  const bonuses = contents.filter((c) => c.type === "bonus")
  const afterword = contents.find((c) => c.type === "afterword")

  return (
    <div className="mx-auto px-4 md:px-8 pt-12 md:pt-20 pb-16 md:pb-32">
      {/* 히어로 — heroStyle에 따라 분기 */}
      {heroStyle === "fullname" && (
        <header className="mb-12 md:mb-20 pb-10 md:pb-16 border-b border-g-border">
          <h1
            className="italic text-g-text-bright leading-none mb-4"
            style={{ fontSize: 'var(--g-title-size, 4rem)', fontWeight: 'var(--g-title-weight, 700)', letterSpacing: 'var(--g-letter-spacing, 0)' }}
          >
            {authorName}
          </h1>
          {decorations.headerSubtitle && (
            <p className="text-sm text-g-text-dim" style={{ letterSpacing: 'var(--g-letter-spacing, 0.1em)' }}>
              {decorations.headerSubtitle}
            </p>
          )}
        </header>
      )}

      {heroStyle === "cover" && (
        <header className="text-center mb-12 md:mb-20 pb-10 md:pb-16 border-b border-g-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-g-bg opacity-80" />
          <div className="relative z-10">
            {decorations.headerSubtitle && (
              <p className="text-xs tracking-widest text-g-text-dim mb-6">{decorations.headerSubtitle}</p>
            )}
            <h1
              className="italic text-g-text-bright leading-tight mb-4"
              style={{ fontSize: 'var(--g-title-size, 4rem)', fontWeight: 'var(--g-title-weight, 700)', letterSpacing: 'var(--g-letter-spacing, 0)' }}
            >
              {authorName}
            </h1>
          </div>
        </header>
      )}

      {heroStyle === "minimal" && (
        <header className="text-center mb-12 md:mb-20 pb-10 md:pb-16 border-b border-g-border">
          {decorations.headerSubtitle && (
            <SectionLabel className="text-label text-g-text-muted mb-4 md:mb-6">
              {decorations.headerSubtitle}
            </SectionLabel>
          )}

          <div className="flex justify-center mb-4">
            <ThemeHeaderIcon decorations={decorations} size={48} opacity={0.6} />
          </div>

          <h1 className="text-3xl md:text-5xl font-normal italic text-g-text-bright leading-tight mb-4">
            {authorName}
          </h1>

          {decorations.footerText && (
            <div className="font-g-sans text-[12px] text-g-text-dim tracking-normal-g">
              {decorations.footerText}
            </div>
          )}
        </header>
      )}

      {/* heroStyle === "none" → 히어로 없음 */}

      {/* 일러두기 — showPreface 테마값으로 제어 */}
      {showPreface && preface && (
        <section className="mb-8 md:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
            <SpecialCard content={preface} workSlug={workSlug} />
          </div>
        </section>
      )}

      {/* 에피소드 그리드 */}
      <section className="mb-12 md:mb-16">
        <SectionLabel className="text-label text-g-text-dim mb-4 md:mb-6">에피소드</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
          {episodes.map((ep) => (
            <EpisodeCard key={ep.slug} content={ep} workSlug={workSlug} />
          ))}
        </div>
      </section>

      {/* 번외 섹션 */}
      {bonuses.length > 0 && (
        <section className="mb-12 md:mb-16">
          <SectionLabel className="text-label text-g-text-dim mb-4 md:mb-6">번외 에피소드</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
            {bonuses.map((b) => (
              <EpisodeCard key={b.slug} content={b} workSlug={workSlug} />
            ))}
          </div>
        </section>
      )}

      {/* 구분선 — 테마 장식 시스템 사용 */}
      <ThemeDivider decorations={decorations} className="mb-8 md:mb-12" />

      {/* 후기 — showAfterword 테마값으로 제어 */}
      {showAfterword && afterword && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 md:gap-6">
            <SpecialCard content={afterword} workSlug={workSlug} />
          </div>
        </section>
      )}
    </div>
  )
}
