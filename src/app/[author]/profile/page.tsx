"use client"

// 작가 공개 프로필 페이지 — /{author}/profile
// 작가 소개, 작품 목록, 구독자/좋아요 통계, 구독 버튼

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
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

  const [profile, setProfile] = useState<AuthorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const subscribeThrottle = useThrottledAction(1000)

  const fetchProfile = useCallback(() => {
    setLoading(true)
    setError(false)
    api.getAuthorProfile(authorSlug)
      .then((data: AuthorProfile) => {
        setProfile(data)
        setSubscriberCount(data.subscriberCount)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [authorSlug])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
      <div className="min-h-screen bg-u-bg">
        <PlatformNav />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="h-10 w-48 bg-u-bg2 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-4 w-32 bg-u-bg2 rounded mx-auto mb-6 animate-pulse" />
            <div className="h-20 w-96 max-w-full bg-u-bg2 rounded mx-auto animate-pulse" />
          </div>
          <div className="flex justify-center gap-8 mb-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-24 bg-u-bg2 rounded animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  // 에러
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-u-bg">
        <PlatformNav />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-u-text-muted">작가를 찾을 수 없습니다.</p>
          <Link href="/explore" className="text-u-accent mt-4 inline-block">
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
    <div className="min-h-screen bg-u-bg">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 작가 헤더 */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-u-text-bright mb-2">
            {author.name}
          </h1>
          <p className="text-sm text-u-text-dim mb-6">
            @{author.slug} &middot; {joinDate} 가입
          </p>

          {/* bio */}
          <div className="max-w-xl mx-auto mb-8">
            {author.bio ? (
              <p className="text-u-text leading-relaxed whitespace-pre-wrap">
                {author.bio}
              </p>
            ) : (
              <p className="text-u-text-muted italic">
                아직 소개를 작성하지 않았습니다
              </p>
            )}
          </div>

          {/* 통계 + 구독 */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-u-text-bright">{works.length}</p>
              <p className="text-xs text-u-text-muted">작품</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-u-text-bright">{subscriberCount}</p>
              <p className="text-xs text-u-text-muted">구독자</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-u-text-bright">{totalLikes}</p>
              <p className="text-xs text-u-text-muted">좋아요</p>
            </div>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={subscribeThrottle.pending}
            className={`px-8 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-50 ${
              subscribed
                ? 'border border-u-accent text-u-accent bg-transparent'
                : 'bg-u-accent text-u-bg'
            }`}
          >
            {subscribed ? '구독 중' : '구독하기'}
          </button>
        </section>

        {/* 작품 목록 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-u-text-bright">작품 목록</h2>
            <div className="flex-1 h-px bg-u-border" />
            <span className="text-sm text-u-text-dim">{works.length}개</span>
          </div>

          {works.length === 0 ? (
            <p className="text-u-text-muted text-center py-12">
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
                  context="author-space"
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
