"use client"

// WorkPage - 작품 상세 페이지 (에피소드 목록)
// 에피소드가 1개인 경우 바로 본문 표시, 여러 개면 에피소드 리스트

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
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

interface WorkData {
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
}

export function WorkPage({ authorSlug, workSlug }: WorkPageProps) {
  const [work, setWork] = useState<WorkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // 에피소드 1개인 경우 직접 표시용
  const [singleEpisode, setSingleEpisode] = useState<Episode | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

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
  }, [authorSlug, workSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-platform-bg">
        <PlatformNav />
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center text-neutral-500">Loading...</div>
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
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link
          href={`/${authorSlug}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-amber-500 transition mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          작가 공간으로
        </Link>

        {/* 작품 헤더 */}
        <div className="mb-10 pb-8 border-b border-neutral-800">
          {work.genre && (
            <span className="inline-block mb-3 px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase text-amber-500/80 bg-amber-500/10 rounded">
              {work.genre}
            </span>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">{work.title}</h1>
          {work.subtitle && (
            <p className="text-lg text-neutral-400 mb-3">{work.subtitle}</p>
          )}
          {work.description && (
            <p className="text-neutral-500 leading-relaxed">{work.description}</p>
          )}
        </div>

        {/* 에피소드 목록 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-bold text-white">목차</h2>
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-sm text-neutral-500">{episodes.length}화</span>
          </div>

          {episodes.length === 0 ? (
            <p className="text-neutral-500 text-center py-12">
              아직 등록된 에피소드가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {episodes.map((ep, idx) => (
                <Link
                  key={ep.id}
                  href={`/${authorSlug}/${workSlug}/${ep.slug}`}
                  className="group flex items-center gap-4 p-4 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:border-amber-600/50 hover:bg-neutral-900 transition-all duration-200"
                >
                  {/* 에피소드 번호 */}
                  <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 text-sm font-medium group-hover:bg-amber-600/20 group-hover:text-amber-500 transition">
                    {ep.orderNum ?? idx + 1}
                  </span>

                  {/* 에피소드 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-amber-50 transition-colors">
                      {ep.title}
                    </h3>
                    {ep.subtitle && (
                      <p className="text-sm text-neutral-500 truncate">{ep.subtitle}</p>
                    )}
                  </div>

                  {/* 화살표 */}
                  <svg className="flex-shrink-0 w-4 h-4 text-neutral-700 group-hover:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
