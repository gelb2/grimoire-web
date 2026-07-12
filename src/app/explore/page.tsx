"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { useExploreStore } from '@/stores/useExploreStore'

import { SearchSection } from './_components/SearchSection'
import { MagazineGrid } from './_components/MagazineGrid'
import { SkeletonGrid } from './_components/SkeletonGrid'
import { InlineRetry } from './_components/InlineRetry'

const PAGE_SIZE = 12

export default function ExplorePage() {
  const [giftedAuthors, setGiftedAuthors] = useState<{ id: string; slug: string; name: string; bio: string | null; totalGifted: number }[]>([])

  const {
    popularWorks, recentWorks, scrollY, loaded,
    popularPage, recentPage, popularHasMore, recentHasMore,
    popularLoading, recentLoading,
    setPopularWorks, appendPopularWorks, setRecentWorks, appendRecentWorks,
    setScrollY, setLoaded,
    setPopularPage, setRecentPage,
    setPopularHasMore, setRecentHasMore,
    setPopularLoading, setRecentLoading,
    isStale, reset,
  } = useExploreStore()

  const [initialLoading, setInitialLoading] = useState(!loaded)

  // cold start(min-instances=0) 대응: rawFetch 타임아웃 15초 × 재시도 4회 × 2.5초 간격 = 최대 ~70초 커버.
  // GCP Cloud Run 이 간헐적으로 30~60초 걸려 깨어나는 경우까지 감내(2026-05-27 GCP 이관, W-15).
  const fetchWithRetry = useCallback(async <T,>(fn: () => Promise<T>, retries = 4, delayMs = 2500): Promise<T | null> => {
    for (let i = 0; i < retries; i++) {
      try { return await fn() } catch {
        if (i < retries - 1) await new Promise(r => setTimeout(r, delayMs))
      }
    }
    return null
  }, [])

  const fetchInitialData = useCallback(async () => {
    setInitialLoading(true)
    // Warm-up ping (fire-and-forget). cold start 중인 컨테이너를 본 요청과 병렬로 깨워 첫 timeout 확률을 낮춘다.
    api.getHealth().catch(() => {})
    const [popularRes, recentRes, giftedRes] = await Promise.all([
      fetchWithRetry(() => api.getPopularWorksPaginated(1, PAGE_SIZE)),
      fetchWithRetry(() => api.getRecentWorksPaginated(1, PAGE_SIZE)),
      fetchWithRetry(() => api.getMostGiftedAuthors(8)).then(r => r ?? []),
    ])
    setGiftedAuthors(giftedRes)
    if (popularRes) {
      setPopularWorks(popularRes.works)
      setPopularHasMore(popularRes.hasMore)
      setPopularPage(1)
    }
    if (recentRes) {
      setRecentWorks(recentRes.works)
      setRecentHasMore(recentRes.hasMore)
      setRecentPage(1)
    }
    const hasData = (popularRes?.works.length ?? 0) > 0 || (recentRes?.works.length ?? 0) > 0
    if (hasData) setLoaded(true)
    setInitialLoading(false)
  }, [setPopularWorks, setRecentWorks, setLoaded,
      setPopularHasMore, setRecentHasMore, setPopularPage, setRecentPage])

  // 스크롤 복원
  const scrollYRef = useRef(scrollY)
  scrollYRef.current = scrollY

  useEffect(() => {
    if (loaded && !isStale()) {
      window.scrollTo(0, scrollYRef.current)
      return
    }
    if (loaded && isStale()) reset()
    fetchInitialData()
  }, [loaded, isStale, reset, fetchInitialData])

  const loadMorePopular = useCallback(async () => {
    if (popularLoading || !popularHasMore) return
    setPopularLoading(true)
    try {
      const nextPage = popularPage + 1
      const res = await api.getPopularWorksPaginated(nextPage, PAGE_SIZE)
      appendPopularWorks(res.works)
      setPopularPage(nextPage)
      setPopularHasMore(res.hasMore)
    } catch { /* hasMore가 false로 유지 */ }
    finally { setPopularLoading(false) }
  }, [popularLoading, popularHasMore, popularPage,
      appendPopularWorks, setPopularPage, setPopularHasMore, setPopularLoading])

  const loadMoreRecent = useCallback(async () => {
    if (recentLoading || !recentHasMore) return
    setRecentLoading(true)
    try {
      const nextPage = recentPage + 1
      const res = await api.getRecentWorksPaginated(nextPage, PAGE_SIZE)
      appendRecentWorks(res.works)
      setRecentPage(nextPage)
      setRecentHasMore(res.hasMore)
    } catch { /* 더 보기 실패 시 조용히 처리 */ }
    finally { setRecentLoading(false) }
  }, [recentLoading, recentHasMore, recentPage,
      appendRecentWorks, setRecentPage, setRecentHasMore, setRecentLoading])

  // 스크롤 위치 저장
  useEffect(() => {
    return () => { setScrollY(window.scrollY) }
  }, [setScrollY])

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <SearchSection />

        {/* 인기 작품 */}
        <section className="mb-16">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 className="text-3xl font-black text-black">인기 작품</h2>
            <div className="flex-1 h-px bg-black" />
          </div>
          {initialLoading ? (
            <SkeletonGrid />
          ) : popularWorks.length === 0 ? (
            <InlineRetry onRetry={() => { reset(); fetchInitialData() }} />
          ) : (
            <>
              <MagazineGrid works={popularWorks} />
              {popularHasMore && (
                <button
                  onClick={loadMorePopular}
                  disabled={popularLoading}
                  className="mt-6 text-sm underline text-neutral-500 hover:text-black transition disabled:opacity-50"
                >
                  {popularLoading ? '불러오는 중...' : '더 보기'}
                </button>
              )}
            </>
          )}
        </section>

        {/* 최신 작품 */}
        <section className="mb-16">
          <div className="flex items-baseline gap-4 mb-6">
            <h2 className="text-3xl font-black text-black">최신 작품</h2>
            <div className="flex-1 h-px bg-black" />
          </div>
          {initialLoading ? (
            <SkeletonGrid />
          ) : recentWorks.length === 0 ? (
            <InlineRetry onRetry={() => { reset(); fetchInitialData() }} />
          ) : (
            <>
              <MagazineGrid works={recentWorks} />
              {recentHasMore && (
                <button
                  onClick={loadMoreRecent}
                  disabled={recentLoading}
                  className="mt-6 text-sm underline text-neutral-500 hover:text-black transition disabled:opacity-50"
                >
                  {recentLoading ? '불러오는 중...' : '더 보기'}
                </button>
              )}
            </>
          )}
        </section>

        {/* 응원받는 작가 */}
        {giftedAuthors.length > 0 && (
          <section className="mb-16">
            <div className="flex items-baseline gap-4 mb-2">
              <h2 className="text-3xl font-black text-black">응원받는 작가</h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            <div>
              {giftedAuthors.map((author, i) => (
                <Link
                  key={author.id}
                  href={`/${author.slug}`}
                  className="group grid grid-cols-[50px_1fr_auto] items-baseline gap-4 py-5 border-b border-neutral-200 hover:border-black transition-colors"
                >
                  <span className="text-sm font-mono text-neutral-300 group-hover:text-[#e53e3e] transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-black group-hover:text-[#e53e3e] transition-colors">
                      {author.name}
                    </h3>
                    {author.bio && (
                      <p className="text-sm text-neutral-500 mt-0.5 line-clamp-1">{author.bio}</p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {author.totalGifted} 크레딧
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
