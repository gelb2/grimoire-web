"use client"

// AuthorSpace — 모든 작가의 통합 공간 컴포넌트
// theme.layout에 따라 다른 UI를 렌더링한다:
// - "series": 시리즈 소설 스타일 (탭 네비게이션 + SeriesLanding)
// - "grid": 기본 작품 카드 그리드

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useTheme } from '@/features/theme'
import { PlatformNav } from '@/components/PlatformNav'
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

  // 로딩 — 스켈레톤 UI
  if (loading) {
    return (
      <div className="min-h-screen bg-g-bg">
        <PlatformNav />
        <main className="max-w-6xl mx-auto px-6 py-16">
          {/* 작가 헤더 스켈레톤 */}
          <div className="mb-12 text-center">
            <div className="h-8 w-48 bg-g-bg2 rounded mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-80 bg-g-bg2 rounded mx-auto animate-pulse" />
          </div>
          {/* 작품 그리드 스켈레톤 */}
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

  // 에러 — 팝업 후 뒤로가기
  if (error || !author) {
    return <ErrorPopup message="작가를 찾을 수 없습니다. 서버에 연결할 수 없거나 존재하지 않는 작가입니다." />
  }

  // layout: "series" — 시리즈 소설 스타일 렌더링
  if (theme.layout === "series") {
    // 작품이 1개이면 그 작품의 에피소드를 SeriesLanding에 전달
    const firstWork = (author.works ?? [])[0]
    const episodeContents = firstWork?.episodes?.map((ep: { slug: string; title: string; subtitle?: string; description?: string; orderNum?: number; type?: string }) => ({
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
        {/* SeriesNav는 [author]/layout.tsx에서 렌더링 — 여기서는 생략 */}
        <SeriesLanding
          authorName={author.name}
          workSlug={firstWork?.slug}
          contents={episodeContents}
          decorations={theme.decorations}
        />
      </div>
    )
  }

  // layout: "grid" (기본) — 일반 작품 카드 그리드
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-g-bg">
      <PlatformNav />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 작가 헤더 — 이름 클릭 시 프로필 페이지 이동 */}
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
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
