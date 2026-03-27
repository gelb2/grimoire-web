"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useThrottle'
import { PlatformNav } from '@/components/PlatformNav'
import { WorkCard } from '@/components/WorkCard'
import { HorizontalScroll } from '@/components/HorizontalScroll'
import { useExploreStore } from '@/stores/useExploreStore'

interface AuthorResult { id: string; slug: string; name: string }

const PAGE_SIZE = 12

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<AuthorResult[]>([])
  const [searching, setSearching] = useState(false)
  const [giftedAuthors, setGiftedAuthors] = useState<{ id: string; slug: string; name: string; bio: string | null; totalGifted: number }[]>([])
  const debounce = useDebounce(300)  // 검색 디바운스 300ms

  // Zustand 스토어 — 뒤로가기 시 데이터/스크롤 복원
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

  // 초기 데이터 로드
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

      // 양쪽 모두 빈 배열이면 서버 콜드스타트 가능성 — 캐시 안 함
      const hasData = popularRes.works.length > 0 || recentRes.works.length > 0
      if (hasData) {
        setLoaded(true)
      }
    } catch {
      // API 실패 시 loaded 설정 안 함 — 다음 방문에서 재시도
    }
  }, [setPopularWorks, setRecentWorks, setLoaded,
      setPopularHasMore, setRecentHasMore, setPopularPage, setRecentPage])

  useEffect(() => {
    // TTL 만료 시 캐시 무효화 후 재요청
    if (loaded && !isStale()) {
      // 스토어에 유효한 데이터가 있으면 스크롤만 복원
      window.scrollTo(0, scrollY)
      return
    }

    // TTL 만료된 경우 리셋
    if (loaded && isStale()) {
      reset()
    }

    fetchInitialData()
  }, [loaded, scrollY, isStale, reset, fetchInitialData])

  // 인기 작품 추가 로드
  const loadMorePopular = useCallback(async () => {
    if (popularLoading || !popularHasMore) return
    setPopularLoading(true)
    try {
      const nextPage = popularPage + 1
      const res = await api.getPopularWorksPaginated(nextPage, PAGE_SIZE)
      appendPopularWorks(res.works)
      setPopularPage(nextPage)
      setPopularHasMore(res.hasMore)
    } catch { /* 에러 무시 */ }
    finally { setPopularLoading(false) }
  }, [popularLoading, popularHasMore, popularPage,
      appendPopularWorks, setPopularPage, setPopularHasMore, setPopularLoading])

  // 최신 작품 추가 로드
  const loadMoreRecent = useCallback(async () => {
    if (recentLoading || !recentHasMore) return
    setRecentLoading(true)
    try {
      const nextPage = recentPage + 1
      const res = await api.getRecentWorksPaginated(nextPage, PAGE_SIZE)
      appendRecentWorks(res.works)
      setRecentPage(nextPage)
      setRecentHasMore(res.hasMore)
    } catch { /* 에러 무시 */ }
    finally { setRecentLoading(false) }
  }, [recentLoading, recentHasMore, recentPage,
      appendRecentWorks, setRecentPage, setRecentHasMore, setRecentLoading])

  // 스크롤 위치 저장
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY)
  }, [setScrollY])

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
    } catch { setAuthors([]) }
    finally { setSearching(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <PlatformNav />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 검색 */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">작가와 작품을 탐색하세요</h1>
          <p className="text-neutral-500 mb-6">그리모어에서 새로운 이야기를 발견하세요</p>
          <div className="flex gap-2">
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
              className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {searching ? '...' : '검색'}
            </button>
          </div>

          {authors.length > 0 && (
            <div className="mt-4 space-y-2">
              {authors.map(author => (
                <Link key={author.id} href={`/${author.slug}`} className="block p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-amber-600 transition">
                  <span className="text-white font-medium">{author.name}</span>
                  <span className="text-neutral-500 text-sm ml-2">/{author.slug}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 인기 작품 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">인기 작품</h2>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>
          {popularWorks.length === 0 && !popularLoading ? (
            <div className="flex items-center gap-4">
              <p className="text-neutral-500">아직 작품이 없습니다. 첫 번째 작가가 되어보세요!</p>
              <button
                onClick={() => { reset(); fetchInitialData() }}
                className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
              >
                새로고침
              </button>
            </div>
          ) : (
            <HorizontalScroll
              onLoadMore={loadMorePopular}
              hasMore={popularHasMore}
              loading={popularLoading}
            >
              {popularWorks.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={work.authorName ?? ''}
                  authorSlug={work.authorSlug ?? ''}
                  workSlug={work.slug}
                  genre={work.genre}
                  episodeCount={work.episodeCount ?? 0}
                  viewCount={work.viewCount}
                />
              ))}
            </HorizontalScroll>
          )}
        </section>

        {/* 최신 작품 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">최신 작품</h2>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>
          {recentWorks.length === 0 && !recentLoading ? (
            <div className="flex items-center gap-4">
              <p className="text-neutral-500">아직 작품이 없습니다.</p>
              <button
                onClick={() => { reset(); fetchInitialData() }}
                className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition"
              >
                새로고침
              </button>
            </div>
          ) : (
            <HorizontalScroll
              onLoadMore={loadMoreRecent}
              hasMore={recentHasMore}
              loading={recentLoading}
            >
              {recentWorks.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={work.authorName ?? ''}
                  authorSlug={work.authorSlug ?? ''}
                  workSlug={work.slug}
                  genre={work.genre}
                  episodeCount={work.episodeCount ?? 0}
                  viewCount={work.viewCount}
                />
              ))}
            </HorizontalScroll>
          )}
        </section>

        {/* 응원받는 작가 */}
        {giftedAuthors.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-white">응원받는 작가</h2>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
            >
              {giftedAuthors.map(author => (
                <a
                  key={author.id}
                  href={`/${author.slug}`}
                  className="group rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-amber-800/50"
                >
                  <h3 className="font-bold text-neutral-100 group-hover:text-amber-400 transition">
                    {author.name}
                  </h3>
                  {author.bio && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{author.bio}</p>
                  )}
                  <p className="text-xs text-amber-500 mt-2">
                    {author.totalGifted} 크레딧 응원
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
