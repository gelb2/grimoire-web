"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useThrottle'
import { PlatformNav } from '@/components/PlatformNav'
import { WorkCard } from '@/components/WorkCard'

interface AuthorResult { id: string; slug: string; name: string }
interface WorkResult {
  id: string; slug: string; title: string
  authorSlug?: string; authorName?: string
  genre?: string; viewCount?: number; episodeCount?: number
}

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<AuthorResult[]>([])
  const [popularWorks, setPopularWorks] = useState<WorkResult[]>([])
  const [recentWorks, setRecentWorks] = useState<WorkResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounce = useDebounce(300)  // 검색 디바운스 300ms

  useEffect(() => {
    api.getPopularWorks(10).then(setPopularWorks).catch(() => {})
    api.getRecentWorks(10).then(setRecentWorks).catch(() => {})
  }, [])

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
          {popularWorks.length === 0 ? (
            <p className="text-neutral-500">아직 작품이 없습니다. 첫 번째 작가가 되어보세요!</p>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
            >
              {popularWorks.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={work.authorName ?? ''}
                  authorSlug={work.authorSlug ?? ''}
                  genre={work.genre}
                  episodeCount={work.episodeCount ?? 0}
                  viewCount={work.viewCount}
                />
              ))}
            </div>
          )}
        </section>

        {/* 최신 작품 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-white">최신 작품</h2>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>
          {recentWorks.length === 0 ? (
            <p className="text-neutral-500">아직 작품이 없습니다.</p>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
            >
              {recentWorks.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={work.authorName ?? ''}
                  authorSlug={work.authorSlug ?? ''}
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
