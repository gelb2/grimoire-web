import Link from 'next/link'
import type { LayoutProps } from './types'

export function GalleryLayout({ author, authorSlug }: LayoutProps) {
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-g-bg text-g-text">
      <div className="min-h-screen flex flex-col justify-end px-8 pb-16 relative">
        <h1
          className="text-g-text-bright leading-none"
          style={{
            fontSize: 'clamp(3rem, 12vw, var(--g-title-size, 6rem))',
            fontWeight: 'var(--g-title-weight, 900)',
            letterSpacing: 'var(--g-letter-spacing, 0.1em)',
          }}
        >
          {author.name}
        </h1>
        {author.description && (
          <p className="text-g-text-muted text-sm mt-4 max-w-md">{author.description}</p>
        )}
      </div>
      <div className="px-8 pb-24">
        <div className="border-t border-g-border pt-12">
          {works.map((work, i) => (
            <Link
              key={work.id}
              href={`/${authorSlug}/${work.slug}`}
              className="group flex items-baseline gap-6 py-6 border-b border-g-border hover:border-g-accent transition-colors"
            >
              <span className="text-sm text-g-text-dim font-mono">{String(i + 1).padStart(2, '0')}</span>
              <h2
                className="text-g-text-bright group-hover:text-g-accent transition-colors"
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 3rem)',
                  fontWeight: 'var(--g-title-weight, 700)',
                  letterSpacing: 'var(--g-letter-spacing, 0)',
                }}
              >
                {work.title}
              </h2>
              <span className="ml-auto text-xs text-g-text-dim">{work.episodeCount ?? work.episodes?.length ?? 0}화</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
