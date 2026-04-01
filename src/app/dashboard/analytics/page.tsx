"use client"

import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { ViewChart } from '@/components/ViewChart'

interface WorkInfo {
  id: string
  slug: string
  title: string
  viewCount: number
  episodeCount: number
  episodes?: EpisodeInfo[]
}

interface EpisodeInfo {
  id: string
  slug: string
  title: string
  viewCount: number
  orderNum: number
}

interface ProfileData {
  subscriberCount: number
  totalLikes: number
  works: WorkInfo[]
}

interface StatsData {
  dates: string[]
  counts: number[]
  totalViews: number
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // 프로필 + 작품 데이터 로드
  useEffect(() => {
    if (!user) return
    setProfileLoading(true)

    Promise.all([
      api.getAuthorProfile<ProfileData>(user.slug).catch(() => null),
      api.getAuthorSpace<{ works: WorkInfo[] }>(user.slug).catch(() => null),
    ]).then(([profileRes, spaceRes]) => {
      if (profileRes) {
        const works = spaceRes?.works ?? []
        setProfile({
          subscriberCount: profileRes.subscriberCount ?? 0,
          totalLikes: profileRes.totalLikes ?? 0,
          works: works.map(w => ({
            ...w,
            viewCount: w.viewCount ?? 0,
            episodeCount: w.episodeCount ?? 0,
          })),
        })
        if (works.length > 0 && !selectedWorkId) {
          setSelectedWorkId(works[0].id)
        }
      }
    }).finally(() => setProfileLoading(false))
  }, [user])

  // 선택된 작품의 차트 데이터 로드
  useEffect(() => {
    if (!selectedWorkId) { setStatsData(null); return }
    setStatsLoading(true)
    api.getWorkStats(selectedWorkId)
      .then(setStatsData)
      .catch(() => setStatsData(null))
      .finally(() => setStatsLoading(false))
  }, [selectedWorkId])

  // 선택된 작품의 에피소드 목록 로드
  useEffect(() => {
    if (!user || !selectedWorkId || !profile) { setEpisodes([]); return }
    const work = profile.works.find(w => w.id === selectedWorkId)
    if (!work) { setEpisodes([]); return }

    api.getWork<{ work?: { episodes?: EpisodeInfo[] }; episodes?: EpisodeInfo[] }>(user.slug, work.slug)
      .then(res => {
        const eps = (res.work?.episodes ?? res.episodes ?? [])
        setEpisodes(eps.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)))
      })
      .catch(() => setEpisodes([]))
  }, [user, selectedWorkId, profile])

  const totalViews = profile?.works.reduce((sum, w) => sum + w.viewCount, 0) ?? 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-400">...</p>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="mb-12">
          <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-black transition">
            &larr; 대시보드
          </Link>
          <h1 className="text-4xl font-black text-black mt-4">작품 분석</h1>
          <p className="text-sm text-neutral-500 mt-1">{user.name}님의 작품 통계</p>
        </div>

        {/* 요약 카드 */}
        <section className="mb-12">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 className="text-2xl font-black text-black">요약</h2>
            <div className="flex-1 h-px bg-black" />
          </div>
          {profileLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-24 rounded-lg bg-neutral-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <SummaryCard label="총 조회수" value={totalViews.toLocaleString()} />
              <SummaryCard label="총 좋아요" value={(profile?.totalLikes ?? 0).toLocaleString()} />
              <SummaryCard label="구독자" value={(profile?.subscriberCount ?? 0).toLocaleString()} />
            </div>
          )}
        </section>

        {/* 조회수 차트 */}
        {(profile?.works.length ?? 0) > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-baseline gap-4 flex-1">
                <h2 className="text-2xl font-black text-black">조회수 추이</h2>
                <div className="flex-1 h-px bg-black" />
              </div>
              <select
                value={selectedWorkId}
                onChange={(e) => setSelectedWorkId(e.target.value)}
                className="bg-white border border-neutral-300 text-black text-sm rounded-lg px-3 py-1.5 ml-4 focus:outline-none focus:border-black"
              >
                {profile?.works.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>

            {statsLoading ? (
              <div className="h-64 rounded-lg bg-neutral-100 animate-pulse" />
            ) : statsData ? (
              <ViewChart dates={statsData.dates} counts={statsData.counts} totalViews={statsData.totalViews} />
            ) : (
              <p className="text-neutral-400 text-center py-8 text-sm">통계 데이터가 없습니다</p>
            )}
          </section>
        )}

        {/* 작품별 조회수 */}
        {(profile?.works.length ?? 0) > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-2xl font-black text-black">작품별 조회수</h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            <div>
              {profile?.works
                .sort((a, b) => b.viewCount - a.viewCount)
                .map((work, i) => (
                  <div key={work.id} className="grid grid-cols-[50px_1fr_auto] items-center gap-4 py-3 border-b border-neutral-200">
                    <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-base font-bold text-black">{work.title}</p>
                      <p className="text-xs text-neutral-500">{work.episodeCount}화</p>
                    </div>
                    <span className="text-sm font-mono text-black">{work.viewCount.toLocaleString()}뷰</span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 에피소드 순위 */}
        {episodes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline gap-4 mb-4">
              <h2 className="text-2xl font-black text-black">에피소드 순위</h2>
              <div className="flex-1 h-px bg-black" />
              <span className="text-sm text-neutral-400">
                {profile?.works.find(w => w.id === selectedWorkId)?.title}
              </span>
            </div>
            <div>
              {episodes.map((ep, i) => (
                <div key={ep.id ?? ep.slug} className="grid grid-cols-[50px_1fr_auto] items-center gap-4 py-3 border-b border-neutral-200">
                  <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-black">{ep.title}</p>
                  <span className="text-xs font-mono text-neutral-500">{(ep.viewCount ?? 0).toLocaleString()}뷰</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 데이터 없음 */}
        {!profileLoading && (profile?.works.length ?? 0) === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-4">아직 작품이 없습니다</p>
            <Link href="/dashboard" className="text-sm text-[#e53e3e] hover:underline">
              대시보드에서 작품 만들기 &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-black">{value}</p>
    </div>
  )
}
