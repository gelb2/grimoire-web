import { SeriesLanding } from '@/features/reader/ui/SeriesLanding'
import type { LayoutProps } from './types'

export function SeriesLayout({ author, theme }: LayoutProps) {
  const firstWork = (author.works ?? [])[0]
  const episodeContents = firstWork?.episodes?.map((ep) => ({
    slug: ep.slug,
    title: ep.title,
    subtitle: ep.subtitle,
    description: ep.description,
    type: (ep.type ?? 'episode') as 'episode' | 'bonus' | 'preface' | 'afterword',
    num: ep.orderNum != null ? String(ep.orderNum).padStart(2, '0') : undefined,
    orderNum: ep.orderNum,
  }))

  return (
    <div className="min-h-screen bg-g-bg text-g-text">
      <SeriesLanding
        authorName={author.name}
        workSlug={firstWork?.slug}
        contents={episodeContents}
        decorations={theme.decorations}
        heroStyle={theme.heroStyle}
      />
    </div>
  )
}
