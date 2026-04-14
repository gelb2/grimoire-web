"use client"

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useThrottle'
import { useTypingPlaceholder } from '@/hooks/useTypingPlaceholder'

interface AuthorResult { id: string; slug: string; name: string }

// 검색 섹션 — 별도 컴포넌트 (타이핑 애니메이션 리렌더링 격리)
export function SearchSection() {
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
