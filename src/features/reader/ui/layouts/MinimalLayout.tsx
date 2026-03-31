import Link from 'next/link'
import type { LayoutProps } from './types'

export function MinimalLayout({ author, authorSlug }: LayoutProps) {
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-g-bg text-g-text flex flex-col">
      <div className="flex-1 flex items-center justify-center px-8 min-h-[60vh] relative">
        <div className="text-center">
          <h1
            className="text-g-text-bright italic"
            style={{
              fontSize: 'clamp(2rem, 8vw, var(--g-title-size, 4rem))',
              fontWeight: 'var(--g-title-weight, 300)',
              letterSpacing: 'var(--g-letter-spacing, 0.1em)',
            }}
          >
            {author.name}
          </h1>
        </div>
      </div>
      <div className="px-8 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          {works.map((work, i) => (
            <Link
              key={work.id}
              href={`/${authorSlug}/${work.slug}`}
              className="inline-block mx-4 my-3 group"
            >
              <span
                className="text-g-text-bright group-hover:text-g-accent transition-colors italic"
                style={{
                  fontSize: 'clamp(1rem, 3vw, 2rem)',
                  fontWeight: 'var(--g-title-weight, 300)',
                  letterSpacing: 'var(--g-letter-spacing, 0.1em)',
                }}
              >
                {work.title}
              </span>
              <sup className="text-xs text-g-accent ml-1">[{i + 1}]</sup>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
