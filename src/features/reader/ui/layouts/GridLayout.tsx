import Link from 'next/link'
import { WorkCard } from '@/components/WorkCard'
import type { LayoutProps } from './types'

export function GridLayout({ author, authorSlug }: LayoutProps) {
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-g-bg">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-12 text-center">
          <Link href={`/${authorSlug}/profile`} className="inline-block group">
            <h1 className="text-3xl font-bold text-g-text-bright mb-3 group-hover:text-g-accent transition-colors">
              {author.name}
            </h1>
          </Link>
          {author.description && (
            <p className="text-g-text-muted max-w-xl mx-auto">{author.description}</p>
          )}
        </div>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-g-text-bright">작품 목록</h2>
            <div className="flex-1 h-px bg-g-border" />
            <span className="text-sm text-g-text-dim">{works.length}개</span>
          </div>

          {works.length === 0 ? (
            <p className="text-g-text-muted text-center py-12">아직 작품이 없습니다.</p>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {works.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={author.name}
                  authorSlug={authorSlug}
                  workSlug={work.slug}
                  genre={work.genre}
                  episodeCount={work.episodeCount ?? work.episodes?.length ?? 0}
                  viewCount={work.viewCount}
                  context="author-space"
                  firstEpisodeSlug={work.episodes?.[0]?.slug}
                  variant="author-space"
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
