"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
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
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      api.getLibrary()
        .then(data => { setBookmarked(data.bookmarked || []); setSubscribed(data.subscribed || []); setLoadError(false) })
        .catch(() => { setLoadError(true); toast.error('서재 데이터를 불러올 수 없습니다') })
        .finally(() => setDataLoading(false))
    }
  }, [user])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 헤더 — 에디토리얼 */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">YOUR LIBRARY</p>
          <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">내 서재</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-6 border-b border-neutral-200 mb-8">
          <button
            onClick={() => setTab('bookmarked')}
            className={`pb-3 text-xs uppercase tracking-widest font-medium transition ${tab === 'bookmarked' ? 'text-black border-b-2 border-platform-accent' : 'text-neutral-400 hover:text-black'}`}
          >
            내 서재 {bookmarked.length > 0 && `(${bookmarked.length})`}
          </button>
          <button
            onClick={() => setTab('subscribed')}
            className={`pb-3 text-xs uppercase tracking-widest font-medium transition ${tab === 'subscribed' ? 'text-black border-b-2 border-platform-accent' : 'text-neutral-400 hover:text-black'}`}
          >
            구독 작품 {subscribed.length > 0 && `(${subscribed.length})`}
          </button>
        </div>

        {dataLoading ? (
          <p className="text-neutral-400 text-center py-16">로딩 중...</p>
        ) : loadError ? (
          <div className="text-center py-16">
            <p className="text-platform-accent mb-4">서재 데이터를 불러오지 못했습니다</p>
            <button
              onClick={() => { setDataLoading(true); setLoadError(false); api.getLibrary().then(data => { setBookmarked(data.bookmarked || []); setSubscribed(data.subscribed || []) }).catch(() => setLoadError(true)).finally(() => setDataLoading(false)) }}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <>
            {/* 내 서재 탭 */}
            {tab === 'bookmarked' && (
              bookmarked.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-neutral-500 mb-4">북마크한 작품이 없습니다</p>
                  <Link href="/explore" className="text-sm text-platform-accent hover:underline">탐색하러 가기 &rarr;</Link>
                </div>
              ) : (
                <div>
                  {bookmarked.map((item, i) => (
                    <div key={item.workId} className="grid grid-cols-[50px_1fr_auto] items-start gap-4 py-5 border-b border-neutral-200">
                      <span className="text-sm font-mono text-neutral-300 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <Link href={`/${item.authorSlug}/${item.workSlug}`} className="text-base font-bold text-black hover:text-platform-accent transition">
                          {item.workTitle}
                        </Link>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          {item.authorName} · {item.episodeCount}화
                          {item.subscribed && <span className="ml-2 text-platform-accent text-xs">구독 중</span>}
                        </p>
                        {/* 진행도 */}
                        <div className="mt-2 max-w-xs">
                          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                            <span>{item.readEpisodeCount}/{item.episodeCount}화</span>
                            <span>{item.episodeCount > 0 ? Math.round((item.readEpisodeCount / item.episodeCount) * 100) : 0}%</span>
                          </div>
                          <div className="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-black rounded-full transition-all"
                              style={{ width: `${item.episodeCount > 0 ? (item.readEpisodeCount / item.episodeCount) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="pt-0.5">
                        {item.lastReadEpisodeSlug ? (
                          <Link href={`/${item.authorSlug}/${item.workSlug}/${item.lastReadEpisodeSlug}`}
                            className="text-xs text-platform-accent hover:underline">이어읽기</Link>
                        ) : (
                          <Link href={`/${item.authorSlug}/${item.workSlug}`}
                            className="text-xs text-neutral-500 hover:text-black underline transition">처음부터</Link>
                        )}
                      </div>
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
                  <Link href="/explore" className="text-sm text-platform-accent hover:underline">탐색하러 가기 &rarr;</Link>
                </div>
              ) : (
                <div>
                  {subscribed.map((work, i) => (
                    <Link key={work.workId} href={`/${work.authorSlug}/${work.workSlug}`}
                      className="group grid grid-cols-[50px_1fr_auto] items-baseline gap-4 py-5 border-b border-neutral-200 hover:border-black transition-colors">
                      <span className="text-sm font-mono text-neutral-300 group-hover:text-platform-accent transition-colors">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <h3 className="text-base font-bold text-black group-hover:text-platform-accent transition-colors">{work.workTitle}</h3>
                        <p className="text-sm text-neutral-500 mt-0.5">{work.authorName} · {work.episodeCount}화</p>
                      </div>
                      {work.latestEpisodeTitle && (
                        <span className="text-xs text-platform-accent">최신: {work.latestEpisodeTitle}</span>
                      )}
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
