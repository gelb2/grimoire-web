"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface AuthorResult { id: string; slug: string; name: string }
interface WorkResult { id: string; slug: string; title: string; authorSlug?: string; authorName?: string; viewCount?: number; episodeCount?: number }

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [authors, setAuthors] = useState<AuthorResult[]>([])
  const [popularWorks, setPopularWorks] = useState<WorkResult[]>([])
  const [recentWorks, setRecentWorks] = useState<WorkResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    api.getPopularWorks(6).then(setPopularWorks).catch(() => {})
    api.getRecentWorks(6).then(setRecentWorks).catch(() => {})
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
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-white">Grimoire</Link>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400">탐색</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-neutral-400 hover:text-white text-sm">로그인</Link>
            <Link href="/register" className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-500">시작하기</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 검색 */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-6">작가와 작품을 탐색하세요</h1>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="작가 이름 또는 슬러그 검색..."
              className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition"
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
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">인기 작품</h2>
          {popularWorks.length === 0 ? (
            <p className="text-neutral-500">아직 작품이 없습니다. 첫 번째 작가가 되어보세요!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularWorks.map(work => (
                <div key={work.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <h3 className="text-white font-medium">{work.title}</h3>
                  <p className="text-neutral-500 text-sm mt-1">
                    {work.authorName && <span>{work.authorName} · </span>}
                    {work.episodeCount}화
                    {work.viewCount ? ` · 조회 ${work.viewCount.toLocaleString()}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 최신 작품 */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">최신 작품</h2>
          {recentWorks.length === 0 ? (
            <p className="text-neutral-500">아직 작품이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentWorks.map(work => (
                <div key={work.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                  <h3 className="text-white font-medium">{work.title}</h3>
                  <p className="text-neutral-500 text-sm mt-1">
                    {work.authorName && <span>{work.authorName} · </span>}
                    {work.episodeCount}화
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
