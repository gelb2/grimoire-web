"use client"

// AuthorSpace — 모든 작가의 통합 공간 컴포넌트
// theme.layout에 따라 다른 UI를 렌더링한다:
// - "series": 시리즈 소설 스타일 (SeriesLanding)
// - "gallery": 풀스크린 작가명 + 미니멀 목록
// - "magazine": 넘버링 + 대형 제목
// - "minimal": 산발적 타이포
// - "grid"/"classic" (기본): 작품 카드 그리드
//
// 네비게이션: [author]/layout.tsx의 SeriesNav가 모든 레이아웃에 적용됨
// 개별 레이아웃에서 PlatformNav/MinimalNav를 렌더링하지 않음

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useTheme } from '@/features/theme'
import { WorkCard } from '@/components/WorkCard'
import { ErrorPopup } from '@/components/ErrorPopup'
import { SeriesLanding } from '@/features/reader/ui/SeriesLanding'

interface Episode {
  slug: string
  title: string
  subtitle?: string
  description?: string
  orderNum?: number
  type?: string
}

interface Work {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  genre?: string
  episodeCount?: number
  viewCount?: number
  episodes?: Episode[]
}

interface AuthorData {
  id: string
  slug: string
  name: string
  description?: string
  works?: Work[]
}

interface AuthorSpaceProps {
  authorSlug: string
}

export function AuthorSpace({ authorSlug }: AuthorSpaceProps) {
  const theme = useTheme()
  const [author, setAuthor] = useState<AuthorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(false)

    api.getAuthorSpace<any>(authorSlug)
      .then(async (res) => {
        if (!mounted) return
        const authorInfo = res.author ?? res
        const works: Work[] = res.works ?? authorInfo.works ?? []

        const worksWithEpisodes = works.length > 0
          ? await Promise.all(
              works.map(async (work: Work) => {
                try {
                  const workRes = await api.getWork<any>(authorSlug, work.slug)
                  const episodes = workRes.episodes ?? workRes.work?.episodes ?? []
                  return { ...work, episodes }
                } catch {
                  return work
                }
              })
            )
          : works

        if (!mounted) return
        setAuthor({
          id: authorInfo.id,
          slug: authorInfo.slug ?? authorSlug,
          name: authorInfo.name ?? authorSlug,
          description: authorInfo.description,
          works: worksWithEpisodes,
        })
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setError(true)
        setLoading(false)
      })

    return () => { mounted = false }
  }, [authorSlug])

  // 로딩 — 스켈레톤 UI (네비는 layout.tsx의 SeriesNav가 담당)
  if (loading) {
    return (
      <div className="min-h-screen bg-g-bg">
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="mb-12 text-center">
            <div className="h-8 w-48 bg-g-bg2 rounded mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-80 bg-g-bg2 rounded mx-auto animate-pulse" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-6 w-24 bg-g-bg2 rounded animate-pulse" />
            <div className="flex-1 h-px bg-g-border" />
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-g-border bg-g-bg2 p-5 h-40 animate-pulse">
                <div className="h-4 w-16 bg-g-border rounded mb-3" />
                <div className="h-5 w-3/4 bg-g-border rounded mb-2" />
                <div className="h-4 w-1/2 bg-g-border rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // 에러
  if (error || !author) {
    return <ErrorPopup message="작가를 찾을 수 없습니다. 서버에 연결할 수 없거나 존재하지 않는 작가입니다." />
  }

  // layout: "series" — 시리즈 소설 스타일
  if (theme.layout === "series") {
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

  // layout: "gallery" — 풀스크린 작가명 + 미니멀 목록
  if (theme.layout === "gallery") {
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

  // layout: "magazine" — 넘버링 + 대형 제목
  if (theme.layout === "magazine") {
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

  // layout: "minimal" — 산발적 타이포
  if (theme.layout === "minimal") {
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

  // layout: "grid" / "classic" (기본) — 작품 카드 그리드
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-g-bg">
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 작가 헤더 */}
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

        {/* 작품 그리드 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-g-text-bright">작품 목록</h2>
            <div className="flex-1 h-px bg-g-border" />
            <span className="text-sm text-g-text-dim">{works.length}개</span>
          </div>

          {works.length === 0 ? (
            <p className="text-g-text-muted text-center py-12">
              아직 작품이 없습니다.
            </p>
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
