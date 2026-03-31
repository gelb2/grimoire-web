import Link from 'next/link'
import type { LayoutProps } from './types'

export function MagazineLayout({ author, authorSlug, theme }: LayoutProps) {
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-g-bg text-g-text">
      <div className="min-h-[70vh] flex items-center justify-center px-8 border-b border-g-border relative">
        <div className="text-center">
          {theme.decorations?.headerSubtitle && (
            <p className="text-xs tracking-widest text-g-text-dim mb-8 uppercase">{theme.decorations.headerSubtitle}</p>
          )}
          <h1
            className="text-g-text-bright leading-none"
            style={{
              fontSize: 'clamp(3rem, 10vw, var(--g-title-size, 6rem))',
              fontWeight: 'var(--g-title-weight, 900)',
              letterSpacing: 'var(--g-letter-spacing, -0.02em)',
            }}
          >
            {author.name}
          </h1>
          {author.description && (
            <p className="text-g-text-muted mt-6 max-w-lg mx-auto leading-relaxed">{author.description}</p>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-8 py-16">
        {works.map((work, i) => (
          <Link
            key={work.id}
            href={`/${authorSlug}/${work.slug}`}
            className="group grid grid-cols-[60px_1fr_auto] items-baseline gap-4 py-8 border-b border-g-border hover:border-g-accent transition-colors"
          >
            <span className="text-g-accent font-mono text-sm">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h2
                className="text-g-text-bright group-hover:text-g-accent transition-colors"
                style={{
                  fontSize: 'clamp(1.2rem, 3vw, 2.5rem)',
                  fontWeight: 'var(--g-title-weight, 700)',
                }}
              >
                {work.title}
              </h2>
              {work.description && (
                <p className="text-g-text-muted text-sm mt-2 line-clamp-2">{work.description}</p>
              )}
            </div>
            <span className="text-xs text-g-text-dim">{work.episodeCount ?? work.episodes?.length ?? 0}화</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
