"use client"

// AuthorSpace — 모든 작가의 통합 공간 컴포넌트
// theme.episodeListLayout에 따라 다른 레이아웃 컴포넌트를 렌더링한다.
// 각 레이아웃은 layouts/ 디렉토리에 독립 컴포넌트로 분리되어 있다.

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useTheme } from '@/features/theme'
import { ErrorPopup } from '@/components/ErrorPopup'
import {
  SeriesLayout,
  GalleryLayout,
  MagazineLayout,
  MinimalLayout,
  GridLayout,
} from './layouts'
import type { AuthorData, Work } from './layouts'

interface AuthorSpaceProps {
  authorSlug: string
  /** 테마 에디터 프리뷰용: 데이터를 직접 주입하면 API 호출을 건너뛴다 */
  previewData?: AuthorData
}

export function AuthorSpace({ authorSlug, previewData }: AuthorSpaceProps) {
  const theme = useTheme()
  const [author, setAuthor] = useState<AuthorData | null>(previewData ?? null)
  const [loading, setLoading] = useState(!previewData)
  const [error, setError] = useState(false)

  useEffect(() => {
    // 프리뷰 모드: previewData가 도착하면 상태를 동기화하고 API 호출 생략
    if (previewData) {
      setAuthor(previewData)
      setLoading(false)
      setError(false)
      return
    }

    let mounted = true

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
  }, [authorSlug, previewData])

  // 로딩 스켈레톤
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
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
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

  if (error || !author) {
    return <ErrorPopup message="작가를 찾을 수 없습니다. 서버에 연결할 수 없거나 존재하지 않는 작가입니다." />
  }

  // 레이아웃 선택 — 각 레이아웃은 독립 컴포넌트
  const layoutProps = { author, authorSlug, theme }

  switch (theme.episodeListLayout) {
    case 'series':   return <SeriesLayout {...layoutProps} />
    case 'gallery':  return <GalleryLayout {...layoutProps} />
    case 'magazine': return <MagazineLayout {...layoutProps} />
    case 'minimal':  return <MinimalLayout {...layoutProps} />
    default:         return <GridLayout {...layoutProps} />
  }
}
