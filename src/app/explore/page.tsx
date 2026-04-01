"use client"

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useThrottle'
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder'
import { PlatformNav } from '@/components/PlatformNav'
import { WorkCard } from '@/components/WorkCard'
import { useExploreStore } from '@/stores/useExploreStore'

interface AuthorResult { id: string; slug: string; name: string }

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

  const fetchInitialData = useCallback(async () => {
    setInitialLoading(true)
    // 개별 호출 에러 격리 — 하나 실패해도 나머지는 정상 표시
    const [popularRes, recentRes, giftedRes] = await Promise.all([
      api.getPopularWorksPaginated(1, PAGE_SIZE).catch(() => null),
      api.getRecentWorksPaginated(1, PAGE_SIZE).catch(() => null),
      api.getMostGiftedAuthors(8).catch(() => []),
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

  // 스크롤 복원은 페이지 진입 시 1번만. scrollY를 의존성에 넣지 않는다.
  // (scrollY가 의존성에 있으면 매 스크롤마다 effect 재실행 → window.scrollTo 충돌 → jank)
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
    } catch { /* 인라인 에러는 hasMore가 false로 유지되므로 버튼 자체가 사라짐 */ }
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

  // 스크롤 위치 저장 — 페이지를 떠날 때만 저장 (매 프레임 저장하지 않음 → jank 방지)
  useEffect(() => {
    return () => { setScrollY(window.scrollY) }
  }, [setScrollY])

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        {/* 히어로 + 검색 — 별도 컴포넌트로 리렌더링 격리 */}
        <SearchSection />

        {/* 인기 작품 — 매거진 비대칭 그리드 */}
        <section className="mb-24">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-2">Popular</p>
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-2xl font-bold text-black">인기 작품</h2>
            <div className="flex-1 h-px bg-neutral-200" />
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

        {/* 최신 작품 — 매거진 비대칭 그리드 */}
        <section className="mb-24">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-2">Recent</p>
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-2xl font-bold text-black">최신 작품</h2>
            <div className="flex-1 h-px bg-neutral-200" />
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

        {/* 응원받는 작가 — 에디토리얼 리스트 */}
        {giftedAuthors.length > 0 && (
          <section className="mb-24">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-2">Authors</p>
            <div className="flex items-baseline gap-4 mb-8">
              <h2 className="text-2xl font-bold text-black">응원받는 작가</h2>
              <div className="flex-1 h-px bg-neutral-200" />
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
        {/* 푸터 — 브랜드 마감 */}
        <footer className="border-t border-neutral-200 pt-12 pb-8 text-center">
          <p className="font-ci text-sm tracking-[0.15em] text-neutral-300 uppercase">Grimoire</p>
          <p className="text-[10px] text-neutral-400 mt-2">작가별 맞춤 소설 퍼블리싱 플랫폼</p>
        </footer>
      </main>
    </div>
  )
}

// ── 검색 섹션 — 별도 컴포넌트 (타이핑 애니메이션 리렌더링 격리) ──

function SearchSection() {
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<AuthorResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounce = useDebounce(300)
  const animatedPlaceholder = useTypingPlaceholder([
    '작가 이름으로 검색...',
    '작품 제목으로 검색...',
    '좋아하는 장르를 찾아보세요...',
  ])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await api.searchAuthors(searchQuery)
      setAuthors(results)
    } catch {
      setAuthors([])
      toast.error('검색에 실패했습니다')
    }
    finally { setSearching(false) }
  }, [])

  return (
    <div className="mb-24">
      {/* 브랜드 히어로 */}
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-6">Discover Stories</p>
        <h1 className="text-5xl md:text-8xl font-light text-black leading-[0.95] mb-4 font-ci tracking-[0.02em]">
          Grimoire
        </h1>
        <p className="text-lg md:text-xl text-neutral-500 font-light max-w-lg leading-relaxed">
          작가별 맞춤 공간에서<br className="md:hidden" /> 이야기를 만나보세요
        </p>
      </div>

      {/* 검색 — 밑줄 인풋 */}
      <div className="flex items-center gap-4 border-b border-neutral-300 pb-2">
        <input
          type="text"
          value={query}
          onChange={e => {
            const val = e.target.value
            setQuery(val)
            debounce(() => { if (val.trim()) handleSearch(val) })
          }}
          onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
          placeholder={query ? '' : animatedPlaceholder}
          className="flex-1 py-2 bg-transparent text-black placeholder-neutral-400 text-lg focus:outline-none"
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={searching}
          className="text-sm font-medium text-neutral-500 hover:text-black transition disabled:opacity-30 uppercase tracking-widest"
        >
          Search
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
              <span className="text-lg font-bold text-black group-hover:text-[#e53e3e] transition">{author.name}</span>
              <span className="text-sm text-neutral-400">/{author.slug}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 매거진 비대칭 그리드 (memo로 불필요한 리렌더링 방지) ──

interface MagazineWork {
  id: string
  title: string
  authorName?: string
  authorSlug?: string
  slug: string
  genre?: string
  episodeCount?: number
  viewCount?: number
}

const MagazineGrid = memo(function MagazineGrid({ works }: { works: MagazineWork[] }) {
  const groups: MagazineWork[][] = []
  for (let i = 0; i < works.length; i += 3) {
    groups.push(works.slice(i, i + 3))
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => {
        const isReversed = gi % 2 === 1
        const big = group[0]
        const smalls = group.slice(1)

        if (group.length < 3) {
          return (
            <div key={gi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={work.authorName ?? ''}
                  authorSlug={work.authorSlug ?? ''}
                  workSlug={work.slug}
                  genre={work.genre}
                  episodeCount={work.episodeCount ?? 0}
                  viewCount={work.viewCount}
                  variant="magazine"
                />
              ))}
            </div>
          )
        }

        const bigCard = (
          <WorkCard
            key={big.id}
            title={big.title}
            authorName={big.authorName ?? ''}
            authorSlug={big.authorSlug ?? ''}
            workSlug={big.slug}
            genre={big.genre}
            episodeCount={big.episodeCount ?? 0}
            viewCount={big.viewCount}
            variant="magazine"
          />
        )

        const smallCards = (
          <div className="flex flex-col gap-4">
            {smalls.map(work => (
              <WorkCard
                key={work.id}
                title={work.title}
                authorName={work.authorName ?? ''}
                authorSlug={work.authorSlug ?? ''}
                workSlug={work.slug}
                genre={work.genre}
                episodeCount={work.episodeCount ?? 0}
                viewCount={work.viewCount}
                variant="magazine"
              />
            ))}
          </div>
        )

        return (
          <div key={gi} className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            {isReversed ? (
              <>
                <div className="md:order-2">{bigCard}</div>
                <div className="md:order-1">{smallCards}</div>
              </>
            ) : (
              <>
                {bigCard}
                {smallCards}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
})

// ── 스켈레톤 로딩 그리드 ──

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
      <div className="h-48 rounded-lg bg-neutral-100 animate-pulse" />
      <div className="flex flex-col gap-4">
        <div className="h-[92px] rounded-lg bg-neutral-100 animate-pulse" />
        <div className="h-[92px] rounded-lg bg-neutral-100 animate-pulse" />
      </div>
    </div>
  )
}

// ── 인라인 에러 + 새로고침 ──

function InlineRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-neutral-500">
      <p>작품을 불러올 수 없습니다.</p>
      <button
        onClick={onRetry}
        className="mt-2 text-sm underline text-neutral-400 hover:text-black transition"
      >
        새로고침
      </button>
    </div>
  )
}
