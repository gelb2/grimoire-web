"use client"

// WorkPage - 작품 상세 페이지 (에피소드 목록)
// 에피소드가 1개인 경우 바로 본문 표시, 여러 개면 에피소드 리스트

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { ErrorPopup } from '@/components/ErrorPopup'
import { EpisodeViewer } from '@/features/reader/ui/EpisodeViewer'
import { EpisodeFooter } from '@/features/reader/ui/EpisodeFooter'
import type { ContentMeta, EpisodeData } from '@/features/reader/data'

interface Episode {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  orderNum?: number
  type?: string
  blocks?: any[]
  prevSlug?: string | null
  nextSlug?: string | null
}

export interface WorkData {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  genre?: string
  authorName?: string
  episodes?: Episode[]
}

interface WorkPageProps {
  authorSlug: string
  workSlug: string
  initialWork?: WorkData
  initialEpisode?: Episode
}

export function WorkPage({ authorSlug, workSlug, initialWork, initialEpisode }: WorkPageProps) {
  const [work, setWork] = useState<WorkData | null>(initialWork ?? null)
  const [loading, setLoading] = useState(!initialWork)
  const [error, setError] = useState(false)
  // 에피소드 1개인 경우 직접 표시용
  const [singleEpisode, setSingleEpisode] = useState<Episode | null>(initialEpisode ?? null)

  useEffect(() => {
    if (initialWork) {
      setWork(initialWork)
      setSingleEpisode(initialEpisode ?? null)
      setLoading(false)
      setError(false)
      return
    }
    let cancelled = false

    api.getWork<any>(authorSlug, workSlug)
      .then(async (data) => {
        if (cancelled) return

        setWork(data)

        // 에피소드가 정확히 1개이면 해당 에피소드를 바로 로드
        if (data.episodes && data.episodes.length === 1) {
          try {
            const ep = await api.getEpisode<any>(authorSlug, workSlug, data.episodes[0].slug)
            if (!cancelled) setSingleEpisode(ep)
          } catch {
            // 에피소드 로드 실패 — 목록으로 폴백
          }
        }

        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [authorSlug, workSlug, initialWork, initialEpisode])

  if (loading) {
    return (
      <div className="min-h-screen bg-g-bg">
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center text-g-text-muted">Loading...</div>
        </main>
      </div>
    )
  }

  if (error || !work) {
    return <ErrorPopup message="작품을 찾을 수 없습니다. 서버에 연결할 수 없거나 존재하지 않는 작품입니다." />
  }

  const episodes = work.episodes ?? []

  // 에피소드가 1개이고 로드 성공 시 바로 본문 표시
  if (singleEpisode && singleEpisode.blocks && singleEpisode.blocks.length > 0) {
    const meta: ContentMeta = {
      slug: singleEpisode.slug,
      type: (singleEpisode.type as ContentMeta['type']) || 'episode',
      title: singleEpisode.title,
      subtitle: singleEpisode.subtitle,
      description: singleEpisode.description,
    }

    const data: EpisodeData = {
      slug: singleEpisode.slug,
      title: singleEpisode.title,
      subtitle: singleEpisode.subtitle,
      blocks: singleEpisode.blocks,
    }

    return (
      <>
        <EpisodeViewer meta={meta} data={data} authorName={work.authorName} />
        <EpisodeFooter
          episodeId={singleEpisode.id || singleEpisode.slug}
          authorSlug={authorSlug}
          workSlug={workSlug}
          prevEpisodeSlug={null}
          nextEpisodeSlug={null}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-g-bg">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 작품 헤더 */}
        <div className="mb-10 pb-8 border-b border-g-border">
          {work.genre && (
            <span className="inline-block mb-3 px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase text-g-accent/80 bg-g-accent/10 rounded">
              {work.genre}
            </span>
          )}
          <h1 className="text-3xl font-bold text-g-text-bright mb-2">{work.title}</h1>
          {work.subtitle && (
            <p className="text-lg text-g-text-muted mb-3">{work.subtitle}</p>
          )}
          {work.description && (
            <p className="text-g-text-dim leading-relaxed">{work.description}</p>
          )}
        </div>

        {/* 에피소드 목록 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-g-text-bright">목차</h2>
            <div className="flex-1 h-px bg-g-border" />
            <span className="text-sm text-g-text-dim">{episodes.length}화</span>
          </div>

          {episodes.length === 0 ? (
            <p className="text-g-text-muted text-center py-12">
              아직 등록된 에피소드가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {episodes.map((ep, idx) => (
                <Link
                  key={ep.id}
                  href={`/${authorSlug}/${workSlug}/${ep.slug}`}
                  className="group flex items-center gap-4 p-4 rounded-lg border border-g-border bg-g-bg2/60 hover:border-g-accent/50 hover:bg-g-bg2 transition-all duration-200"
                >
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-g-bg2 text-g-text-muted text-sm font-medium group-hover:bg-g-accent/20 group-hover:text-g-accent transition">
                    {ep.orderNum ?? idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-g-text-bright font-medium truncate group-hover:text-g-accent2 transition-colors">
                      {ep.title}
                    </h3>
                    {ep.subtitle && (
                      <p className="text-sm text-g-text-dim truncate">{ep.subtitle}</p>
                    )}
                  </div>
                  <svg className="flex-shrink-0 w-4 h-4 text-g-text-dim group-hover:text-g-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
