"use client"

// 작가 공개 프로필 페이지 — /{author}/profile
// 작가 소개, 작품 목록, 구독자/좋아요 통계, 구독 버튼

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/features/auth/AuthProvider'
import { useTheme } from '@/features/theme'
import { WorkCard } from '@/components/WorkCard'
import { useThrottledAction } from '@/hooks/useThrottle'

interface WorkWithStats {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  episodeCount: number
  viewCount: number
}

interface AuthorProfile {
  author: {
    id: string
    slug: string
    name: string
    bio?: string
    credits: number
    createdAt: string
  }
  works: WorkWithStats[]
  subscriberCount: number
  totalLikes: number
}

export default function AuthorProfilePage() {
  const params = useParams()
  const authorSlug = params.author as string
  const theme = useTheme()
  const { user, refreshUser } = useAuth()
  // 본인 작가공간에서는 자기 자신을 구독/응원하는 버튼을 숨긴다
  const isOwner = user?.slug === authorSlug

  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [showGift, setShowGift] = useState(false)
  const [giftMsg, setGiftMsg] = useState('')
  const subscribeThrottle = useThrottledAction(1000)

  useEffect(() => {
    let mounted = true
    api.getAuthorProfile<any>(authorSlug)
      .then((data: AuthorProfile) => {
        if (!mounted) return
        setProfile(data)
        setSubscriberCount(data.subscriberCount)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setError(true)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [authorSlug])

  const handleSubscribe = () => {
    if (!profile) return
    subscribeThrottle.execute(async () => {
      try {
        const result = await api.toggleSubscription(profile.author.id)
        setSubscribed(result.subscribed)
        setSubscriberCount(prev => result.subscribed ? prev + 1 : prev - 1)
      } catch {
        // 로그인 필요
      }
    })
  }

  // 로딩 스켈레톤
  if (loading) {
    return (
      <div className="min-h-screen bg-g-bg">

        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="h-10 w-48 bg-g-bg2 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-32 bg-g-bg2 rounded mx-auto mb-6 animate-pulse" />
            <div className="h-20 w-96 max-w-full bg-g-bg2 rounded mx-auto animate-pulse" />
          </div>
          <div className="flex justify-center gap-8 mb-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-24 bg-g-bg2 rounded animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  // 에러
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-g-bg">

        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-g-text-muted">작가를 찾을 수 없습니다.</p>
          <Link href="/explore" className="text-g-accent mt-4 inline-block">
            탐색으로 돌아가기
          </Link>
        </main>
      </div>
    )
  }

  const { author, works, totalLikes } = profile
  const joinDate = new Date(author.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-g-bg">
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 작가 헤더 */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-g-text-bright mb-2">
            {author.name}
          </h1>
          <p className="text-sm text-g-text-dim mb-6">
            @{author.slug} &middot; {joinDate} 가입
          </p>

          {/* bio */}
          <div className="max-w-xl mx-auto mb-8">
            {author.bio ? (
              <p className="text-g-text leading-relaxed whitespace-pre-wrap">
                {author.bio}
              </p>
            ) : (
              <p className="text-g-text-muted italic">
                아직 소개를 작성하지 않았습니다
              </p>
            )}
          </div>

          {/* 통계 + 구독 */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-g-text-bright">{works.length}</p>
              <p className="text-xs text-g-text-muted">작품</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-g-text-bright">{subscriberCount}</p>
              <p className="text-xs text-g-text-muted">구독자</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-g-text-bright">{totalLikes}</p>
              <p className="text-xs text-g-text-muted">좋아요</p>
            </div>
          </div>

          {!isOwner && (
            <div className="flex gap-3 items-center">
              <button
                onClick={handleSubscribe}
                disabled={subscribeThrottle.pending}
                className={`px-8 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-50 ${
                  subscribed
                    ? 'border border-g-accent text-g-accent bg-transparent'
                    : theme.subscribeButtonStyle === 'filled'
                      ? 'bg-g-accent text-g-bg'
                      : 'border border-g-accent text-g-accent bg-transparent'
                }`}
              >
                {subscribed ? '구독 중' : '구독하기'}
              </button>

              <div className="relative">
                <button onClick={() => setShowGift(!showGift)}
                  className="px-5 py-2.5 rounded-full text-sm font-medium border border-g-border text-g-text-muted hover:text-g-accent hover:border-g-accent transition">
                  🎁 응원
                </button>
                {showGift && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-g-bg2 border border-g-border rounded-xl p-3 shadow-lg z-10 min-w-[160px]">
                    <p className="text-xs text-g-text-muted text-center mb-2">크레딧 선물</p>
                    <div className="flex gap-2 justify-center">
                      {[1, 3, 5].map(amount => (
                        <button key={amount} onClick={async () => {
                          try {
                            await api.giftCredits(authorSlug, amount)
                            setGiftMsg(`${amount} 크레딧을 선물했습니다!`)
                            setShowGift(false)
                            setTimeout(() => setGiftMsg(''), 3000)
                            // 본인 크레딧 차감분 네비바 동기화
                            refreshUser().catch(() => {})
                          } catch { setGiftMsg('선물 실패 (로그인 필요)'); setTimeout(() => setGiftMsg(''), 3000) }
                        }}
                          className="px-3 py-1.5 bg-g-accent/20 text-g-accent text-sm rounded-lg hover:bg-g-accent/30 transition">
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {!isOwner && giftMsg && <p className="text-sm text-g-accent mt-2">{giftMsg}</p>}
        </section>

        {/* 작품 목록 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-g-text-bright">작품 목록</h2>
            <div className="flex-1 h-px bg-g-border" />
            <span className="text-sm text-g-text-dim">{works.length}개</span>
          </div>

          {works.length === 0 ? (
            <p className="text-g-text-muted text-center py-12">
              아직 작품이 없습니다.
            </p>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {works.map(work => (
                <WorkCard
                  key={work.id}
                  title={work.title}
                  authorName={author.name}
                  authorSlug={authorSlug}
                  workSlug={work.slug}
                  episodeCount={work.episodeCount}
                  viewCount={work.viewCount}
                  context="explore"
                  variant="author-space"
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
