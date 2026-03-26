"use client"

// AuthorSpace — 모든 작가의 통합 공간 컴포넌트
// theme.layout에 따라 다른 UI를 렌더링한다:
// - "universe": DeerDevil 스타일 (UniverseNav + UniverseLanding)
// - "grid": 기본 작품 카드 그리드

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useTheme } from '@/features/theme'
import { PlatformNav } from '@/components/PlatformNav'
import { WorkCard } from '@/components/WorkCard'
import { ErrorPopup } from '@/components/ErrorPopup'
import { UniverseNav } from '@/features/universe/ui/UniverseNav'
import { UniverseLanding } from '@/features/universe/ui/UniverseLanding'

interface Work {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  genre?: string
  episodeCount?: number
  viewCount?: number
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

  const fetchAuthor = useCallback(() => {
    setLoading(true)
    setError(false)

    api.getAuthorSpace(authorSlug)
      .then(data => {
        setAuthor(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [authorSlug])

  useEffect(() => {
    fetchAuthor()
  }, [fetchAuthor])

  // 로딩 — 스켈레톤 UI
  if (loading) {
    return (
      <div className="min-h-screen bg-u-bg">
        <PlatformNav />
        <main className="max-w-6xl mx-auto px-6 py-16">
          {/* 작가 헤더 스켈레톤 */}
          <div className="mb-12 text-center">
            <div className="h-8 w-48 bg-u-bg2 rounded mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-80 bg-u-bg2 rounded mx-auto animate-pulse" />
          </div>
          {/* 작품 그리드 스켈레톤 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-6 w-24 bg-u-bg2 rounded animate-pulse" />
            <div className="flex-1 h-px bg-u-border" />
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-u-border bg-u-bg2 p-5 h-40 animate-pulse">
                <div className="h-4 w-16 bg-u-border rounded mb-3" />
                <div className="h-5 w-3/4 bg-u-border rounded mb-2" />
                <div className="h-4 w-1/2 bg-u-border rounded" />
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

  // layout: "universe" — DeerDevil 스타일 렌더링
  if (theme.layout === "universe") {
    return (
      <div className="min-h-screen bg-u-bg text-u-text">
        <UniverseNav authorName={author.name} />
        <UniverseLanding
          authorName={author.name}
          decorations={theme.decorations}
        />
      </div>
    )
  }

  // layout: "grid" (기본) — 일반 작품 카드 그리드
  const works = author.works ?? []

  return (
    <div className="min-h-screen bg-u-bg">
      <PlatformNav />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 작가 헤더 */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-u-text-bright mb-3">{author.name}</h1>
          {author.description && (
            <p className="text-u-text-muted max-w-xl mx-auto">{author.description}</p>
          )}
        </div>

        {/* 작품 그리드 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-u-text-bright">작품 목록</h2>
            <div className="flex-1 h-px bg-u-border" />
            <span className="text-sm text-u-text-dim">{works.length}개</span>
          </div>

          {works.length === 0 ? (
            <p className="text-u-text-muted text-center py-12">
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
                  episodeCount={work.episodeCount ?? 0}
                  viewCount={work.viewCount}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
