"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'

export default function LibraryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'works' | 'subscriptions'>('works')
  const [works, setWorks] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      api.getAuthorSpace(user.slug).then(data => setWorks(data.works || [])).catch(() => {})
      api.getSubscriptions().then(setSubscriptions).catch(() => {})
      api.getBookmarks().then(setBookmarks).catch(() => {})
    }
  }, [user])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-neutral-950">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 환영 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white">환영합니다, {user.name}님!</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-4 border-b border-neutral-800 mb-6">
          <button onClick={() => setTab('works')} className={`pb-3 text-sm font-medium transition ${tab === 'works' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}>
            내 작품 {works.length}
          </button>
          <button onClick={() => setTab('subscriptions')} className={`pb-3 text-sm font-medium transition ${tab === 'subscriptions' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-500'}`}>
            구독 작품
          </button>
        </div>

        {/* 내 작품 */}
        {tab === 'works' && (
          works.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 mb-4">아직 작품이 없습니다</p>
              <Link href="/dashboard/upload" className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition">첫 작품 업로드하기</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((work: any) => (
                <Link key={work.id} href={`/${user.slug}/${work.slug}`} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-amber-600 transition">
                  <h3 className="text-white font-medium">{work.title}</h3>
                  <p className="text-neutral-500 text-sm mt-1">{work.episodeCount}화</p>
                </Link>
              ))}
            </div>
          )
        )}

        {/* 구독 작품 */}
        {tab === 'subscriptions' && (
          subscriptions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 mb-4">구독한 작품이 없습니다</p>
              <p className="text-neutral-600 text-sm mb-4">갤러리에서 마음에 드는 작품을 구독해 보세요.</p>
              <Link href="/explore" className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition">갤러리 보기</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((sub: any) => (
                <Link key={sub.id} href={`/${sub.authorSlug || sub.targetAuthorId}`} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-amber-600 transition">
                  <h3 className="text-white font-medium">{sub.authorName || '작가'}</h3>
                  <p className="text-neutral-500 text-sm mt-1">구독 중</p>
                </Link>
              ))}
            </div>
          )
        )}

        {/* 북마크 */}
        {bookmarks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4">북마크</h2>
            <div className="space-y-2">
              {bookmarks.map((bm: any) => (
                <div key={bm.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-400">
                  에피소드 {bm.episodeId}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
