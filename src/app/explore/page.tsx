"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useThrottle'
import { PlatformNav } from '@/components/PlatformNav'
import { WorkCard } from '@/components/WorkCard'
import { useExploreStore } from '@/stores/useExploreStore'

interface AuthorResult { id: string; slug: string; name: string }

const PAGE_SIZE = 12

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<AuthorResult[]>([])
  const [searching, setSearching] = useState(false)
  const [giftedAuthors, setGiftedAuthors] = useState<{ id: string; slug: string; name: string; bio: string | null; totalGifted: number }[]>([])
  const debounce = useDebounce(300)

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

  const fetchInitialData = useCallback(async () => {
    try {
      const [popularRes, recentRes, giftedRes] = await Promise.all([
        api.getPopularWorksPaginated(1, PAGE_SIZE),
        api.getRecentWorksPaginated(1, PAGE_SIZE),
        api.getMostGiftedAuthors(8).catch(() => []),
      ])
      setGiftedAuthors(giftedRes)
      setPopularWorks(popularRes.works)
      setPopularHasMore(popularRes.hasMore)
      setPopularPage(1)
      setRecentWorks(recentRes.works)
      setRecentHasMore(recentRes.hasMore)
      setRecentPage(1)
      const hasData = popularRes.works.length > 0 || recentRes.works.length > 0
      if (hasData) setLoaded(true)
    } catch {
      toast.error('작품 데이터를 불러올 수 없습니다')
    }
  }, [setPopularWorks, setRecentWorks, setLoaded,
      setPopularHasMore, setRecentHasMore, setPopularPage, setRecentPage])

  useEffect(() => {
    if (loaded && !isStale()) {
      window.scrollTo(0, scrollY)
      return
    }
    if (loaded && isStale()) reset()
    fetchInitialData()
  }, [loaded, scrollY, isStale, reset, fetchInitialData])

  const loadMorePopular = useCallback(async () => {
    if (popularLoading || !popularHasMore) return
    setPopularLoading(true)
    try {
      const nextPage = popularPage + 1
      const res = await api.getPopularWorksPaginated(nextPage, PAGE_SIZE)
      appendPopularWorks(res.works)
      setPopularPage(nextPage)
      setPopularHasMore(res.hasMore)
    } catch { toast.error('작품을 더 불러올 수 없습니다') }
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
    } catch { toast.error('작품을 더 불러올 수 없습니다') }
    finally { setRecentLoading(false) }
  }, [recentLoading, recentHasMore, recentPage,
      appendRecentWorks, setRecentPage, setRecentHasMore, setRecentLoading])

  const handleScroll = useCallback(() => { setScrollY(window.scrollY) }, [setScrollY])
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const results = await api.searchAuthors(query)
      setAuthors(results)
    } catch {
      setAuthors([])
      toast.error('검색에 실패했습니다')
    }
    finally { setSearching(false) }
  }

  return (
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 히어로 — 에디토리얼 대형 타이포 */}
        <div className="mb-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">DISCOVER STORIES</p>
          <h1 className="text-5xl md:text-7xl font-black text-black leading-none mb-6">
            작가와 작품을<br />탐색하세요
          </h1>

          {/* 검색 — 밑줄 인풋 */}
          <div className="flex items-center gap-4 border-b-2 border-black pb-2 mt-8">
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                const val = e.target.value
                debounce(() => { if (val.trim()) handleSearch() })
              }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="작가 이름 또는 슬러그 검색..."
              className="flex-1 py-2 bg-transparent text-black placeholder-neutral-400 text-lg focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="text-sm font-medium text-neutral-500 hover:text-black transition disabled:opacity-50 uppercase tracking-widest"
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>

          {/* 검색 결과 */}
          {authors.length > 0 && (
            <div className="mt-6 border-t border-neutral-200 pt-4">
              {authors.map(author => (
                <Link
                  key={author.id}
                  href={`/${author.slug}`}
                  className="group flex items-baseline gap-3 py-3 border-b border-neutral-200 hover:border-black transition-colors"
                >
                  <span className="text-lg font-bold text-black group-hover:text-platform-accent transition">{author.name}</span>
                  <span className="text-sm text-neutral-400">/{author.slug}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 인기 작품 — 넘버링 리스트 */}
        <section className="mb-16">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-3xl font-black text-black">인기 작품</h2>
            <div className="flex-1 h-px bg-black" />
          </div>
          {popularWorks.length === 0 && !popularLoading ? (
            <div className="py-8 text-neutral-500">
              <p>아직 작품이 없습니다.</p>
              <button
                onClick={() => { reset(); fetchInitialData() }}
                className="mt-2 text-sm underline text-neutral-400 hover:text-black transition"
              >
                새로고침
              </button>
            </div>
          ) : (
            <>
              <div>
                {popularWorks.map((work, i) => (
                  <WorkCard
                    key={work.id}
                    title={work.title}
                    authorName={work.authorName ?? ''}
                    authorSlug={work.authorSlug ?? ''}
                    workSlug={work.slug}
                    genre={work.genre}
                    episodeCount={work.episodeCount ?? 0}
                    viewCount={work.viewCount}
                    index={i}
                  />
                ))}
              </div>
              {popularHasMore && (
                <button
                  onClick={loadMorePopular}
                  disabled={popularLoading}
                  className="mt-4 text-sm underline text-neutral-500 hover:text-black transition disabled:opacity-50"
                >
                  {popularLoading ? '불러오는 중...' : '더 보기'}
                </button>
              )}
            </>
          )}
        </section>

        {/* 최신 작품 — 넘버링 리스트 */}
        <section className="mb-16">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-3xl font-black text-black">최신 작품</h2>
            <div className="flex-1 h-px bg-black" />
          </div>
          {recentWorks.length === 0 && !recentLoading ? (
            <div className="py-8 text-neutral-500">
              <p>아직 작품이 없습니다.</p>
              <button
                onClick={() => { reset(); fetchInitialData() }}
                className="mt-2 text-sm underline text-neutral-400 hover:text-black transition"
              >
                새로고침
              </button>
            </div>
          ) : (
            <>
              <div>
                {recentWorks.map((work, i) => (
                  <WorkCard
                    key={work.id}
                    title={work.title}
                    authorName={work.authorName ?? ''}
                    authorSlug={work.authorSlug ?? ''}
                    workSlug={work.slug}
                    genre={work.genre}
                    episodeCount={work.episodeCount ?? 0}
                    viewCount={work.viewCount}
                    index={i}
                  />
                ))}
              </div>
              {recentHasMore && (
                <button
                  onClick={loadMoreRecent}
                  disabled={recentLoading}
                  className="mt-4 text-sm underline text-neutral-500 hover:text-black transition disabled:opacity-50"
                >
                  {recentLoading ? '불러오는 중...' : '더 보기'}
                </button>
              )}
            </>
          )}
        </section>

        {/* 응원받는 작가 — 에디토리얼 리스트 */}
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
                  <span className="text-sm font-mono text-neutral-300 group-hover:text-platform-accent transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-black group-hover:text-platform-accent transition-colors">
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
