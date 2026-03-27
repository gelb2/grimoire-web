"use client"

import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'

interface Work {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  episodeCount: number
  viewCount?: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [works, setWorks] = useState<Work[]>([])
  const [worksLoading, setWorksLoading] = useState(true)
  const [showNewWork, setShowNewWork] = useState(false)
  const [newWork, setNewWork] = useState({ title: '', slug: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [deletingWorks, setDeletingWorks] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // 작품 목록 로드
  useEffect(() => {
    if (user) {
      api.getAuthorSpace(user.slug)
        .then(data => setWorks(data.works || []))
        .catch(() => setWorks([]))
        .finally(() => setWorksLoading(false))
    }
  }, [user])

  const handleCreateWork = async () => {
    if (!newWork.title.trim() || !newWork.slug.trim()) return
    setCreating(true)
    setError('')
    try {
      const work = await api.createWork(newWork)
      setWorks(prev => [...prev, { ...work, episodeCount: 0 }])
      setShowNewWork(false)
      setNewWork({ title: '', slug: '', description: '' })
    } catch (err: any) {
      setError(err.message || '작품 생성에 실패했습니다')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteWork = async (workId: string, title: string) => {
    if (deletingWorks.has(workId)) return  // 이미 삭제 중
    if (!confirm(`"${title}"을(를) 삭제하시겠습니까? 모든 에피소드가 함께 삭제됩니다.`)) return
    setDeletingWorks(prev => new Set(prev).add(workId))
    try {
      await api.deleteWork(workId)
      setWorks(prev => prev.filter(w => w.id !== workId))
    } catch (err: any) {
      alert(err.message || '삭제에 실패했습니다')
    } finally {
      setDeletingWorks(prev => {
        const next = new Set(prev)
        next.delete(workId)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400">로딩 중...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* 헤더 */}
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 환영 카드 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">환영합니다, {user.name}님!</h1>
          <p className="text-neutral-400">
            내 공간: <Link href={`/${user.slug}`} className="text-amber-500 hover:text-amber-400" target="_blank">grimoire.app/{user.slug}</Link>
          </p>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Link href="/dashboard/upload" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">원고 업로드</h3>
            <p className="text-neutral-500 text-sm mt-1">MD, TXT, DOCX 파일 업로드</p>
          </Link>
          <Link href="/dashboard/theme" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">테마 설정</h3>
            <p className="text-neutral-500 text-sm mt-1">AI로 나만의 공간을 꾸미세요</p>
          </Link>
          <Link href="/dashboard/credits" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">💳</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">크레딧 충전</h3>
            <p className="text-neutral-500 text-sm mt-1">크레딧을 충전하세요</p>
          </Link>
          <Link href="/dashboard/profile" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">👤</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">프로필 설정</h3>
            <p className="text-neutral-500 text-sm mt-1">작가 정보 수정</p>
          </Link>
          <Link href="/library" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">📚</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">서재</h3>
            <p className="text-neutral-500 text-sm mt-1">내 작품 + 구독 관리</p>
          </Link>
        </div>

        {/* 내 작품 목록 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">내 작품</h2>
            <button onClick={() => setShowNewWork(true)} className="text-sm text-amber-500 hover:text-amber-400">+ 새 작품</button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
          )}

          {/* 새 작품 폼 */}
          {showNewWork && (
            <div className="bg-neutral-800 rounded-lg p-4 mb-4 space-y-3">
              <input type="text" placeholder="작품 제목" value={newWork.title}
                onChange={e => {
                  setNewWork(prev => ({ ...prev, title: e.target.value }))
                  if (!newWork.slug) setNewWork(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))
                }}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500" />
              <input type="text" placeholder="슬러그 (URL 경로)" value={newWork.slug}
                onChange={e => setNewWork(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500" />
              <textarea placeholder="설명 (선택)" value={newWork.description} rows={2}
                onChange={e => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 resize-none" />
              <div className="flex gap-2">
                <button onClick={handleCreateWork} disabled={creating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white text-sm rounded-lg">{creating ? '생성 중...' : '작품 만들기'}</button>
                <button onClick={() => setShowNewWork(false)}
                  className="px-4 py-2 bg-neutral-700 text-neutral-300 text-sm rounded-lg">취소</button>
              </div>
            </div>
          )}

          {worksLoading ? (
            <p className="text-neutral-500 text-center py-8">로딩 중...</p>
          ) : works.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">아직 작품이 없습니다</p>
              <button onClick={() => setShowNewWork(true)} className="inline-block px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition">
                첫 작품 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {works.map(work => (
                <div key={work.id} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <Link href={`/${user.slug}/${work.slug}`} className="text-white font-medium hover:text-amber-500 transition">{work.title}</Link>
                    <p className="text-neutral-500 text-sm mt-1">
                      {work.episodeCount}화{work.viewCount ? ` · 조회 ${work.viewCount.toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/upload?work=${work.id}`} className="text-xs text-neutral-400 hover:text-amber-500 px-3 py-1 bg-neutral-700 rounded">에피소드 추가</Link>
                    <button onClick={() => handleDeleteWork(work.id, work.title)} disabled={deletingWorks.has(work.id)} className="text-xs text-red-500 hover:text-red-400 disabled:text-neutral-500 disabled:cursor-not-allowed px-3 py-1 bg-neutral-700 rounded">{deletingWorks.has(work.id) ? '삭제 중...' : '삭제'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 크레딧 현황 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">크레딧 현황</h2>
            <Link href="/dashboard/credits" className="text-sm text-amber-500 hover:text-amber-400">충전하기 &rarr;</Link>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-3xl font-bold text-amber-500">{user.credits}</p>
              <p className="text-neutral-500 text-sm">잔여 크레딧</p>
            </div>
            <div className="text-neutral-600 text-sm">
              <p>테마 AI 생성: 1 크레딧</p>
              <p>수동 테마 수정: 무료</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
