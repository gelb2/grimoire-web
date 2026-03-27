"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'

interface LibraryItem {
  workId: string
  workTitle: string
  workSlug: string
  authorName: string
  authorSlug: string
  episodeCount: number
  readEpisodeCount: number
  lastReadEpisodeTitle: string | null
  lastReadEpisodeSlug: string | null
  subscribed: boolean
}

interface SubscribedWork {
  workId: string
  workTitle: string
  workSlug: string
  authorName: string
  authorSlug: string
  episodeCount: number
  latestEpisodeTitle: string | null
  createdAt: string
}

export default function LibraryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'bookmarked' | 'subscribed'>('bookmarked')
  const [bookmarked, setBookmarked] = useState<LibraryItem[]>([])
  const [subscribed, setSubscribed] = useState<SubscribedWork[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      api.getLibrary()
        .then(data => {
          setBookmarked(data.bookmarked || [])
          setSubscribed(data.subscribed || [])
        })
        .catch(() => {})
        .finally(() => setDataLoading(false))
    }
  }, [user])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-neutral-950">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white">내 서재</h1>
          <p className="text-neutral-400 text-sm mt-1">북마크한 작품과 구독 작가의 작품을 한눈에 확인하세요.</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 border-b border-neutral-800 mb-6">
          <button
            onClick={() => setTab('bookmarked')}
            className={`pb-3 text-sm font-medium transition ${tab === 'bookmarked' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}
          >
            내 서재 {bookmarked.length > 0 && `(${bookmarked.length})`}
          </button>
          <button
            onClick={() => setTab('subscribed')}
            className={`pb-3 text-sm font-medium transition ${tab === 'subscribed' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}
          >
            구독 작품 {subscribed.length > 0 && `(${subscribed.length})`}
          </button>
        </div>

        {dataLoading ? (
          <p className="text-neutral-500 text-center py-16">로딩 중...</p>
        ) : (
          <>
            {/* 내 서재 탭 */}
            {tab === 'bookmarked' && (
              bookmarked.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-neutral-500 mb-4">북마크한 작품이 없습니다</p>
                  <p className="text-neutral-600 text-sm mb-4">에피소드를 읽으며 북마크를 추가해 보세요.</p>
                  <Link href="/explore" className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition">
                    갤러리 보기
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarked.map((item) => (
                    <div key={item.workId} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition">
                      {/* 작품 정보 */}
                      <Link href={`/${item.authorSlug}/${item.workSlug}`} className="block mb-3">
                        <h3 className="text-white font-medium hover:text-amber-500 transition">{item.workTitle}</h3>
                        <p className="text-neutral-500 text-sm mt-1">
                          {item.authorName} · {item.episodeCount}화
                          {item.subscribed && <span className="ml-2 text-amber-600 text-xs">구독 중</span>}
                        </p>
                      </Link>

                      {/* 읽기 진행도 바 */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-neutral-500 mb-1">
                          <span>{item.readEpisodeCount}/{item.episodeCount}화 읽음</span>
                          <span>{item.episodeCount > 0 ? Math.round((item.readEpisodeCount / item.episodeCount) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full transition-all"
                            style={{ width: `${item.episodeCount > 0 ? (item.readEpisodeCount / item.episodeCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* 이어읽기 버튼 */}
                      {item.lastReadEpisodeSlug ? (
                        <Link
                          href={`/${item.authorSlug}/${item.workSlug}/${item.lastReadEpisodeSlug}`}
                          className="inline-block px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg transition"
                        >
                          이어읽기 — {item.lastReadEpisodeTitle}
                        </Link>
                      ) : (
                        <Link
                          href={`/${item.authorSlug}/${item.workSlug}`}
                          className="inline-block px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs rounded-lg transition"
                        >
                          처음부터 읽기
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* 구독 작품 탭 */}
            {tab === 'subscribed' && (
              subscribed.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-neutral-500 mb-4">구독한 작가의 작품이 없습니다</p>
                  <p className="text-neutral-600 text-sm mb-4">갤러리에서 마음에 드는 작가를 구독해 보세요.</p>
                  <Link href="/explore" className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition">
                    갤러리 보기
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscribed.map((work) => (
                    <Link
                      key={work.workId}
                      href={`/${work.authorSlug}/${work.workSlug}`}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-amber-600 transition"
                    >
                      <h3 className="text-white font-medium">{work.workTitle}</h3>
                      <p className="text-neutral-500 text-sm mt-1">{work.authorName}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                        <span>{work.episodeCount}화</span>
                        {work.latestEpisodeTitle && (
                          <span className="text-amber-600">최신: {work.latestEpisodeTitle}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  )
}
