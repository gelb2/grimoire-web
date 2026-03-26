"use client"

import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white">Grimoire</Link>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400">작가 대시보드</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-amber-500 text-sm">{user.credits} 크레딧</span>
          <span className="text-neutral-400 text-sm">{user.name}</span>
          <button onClick={logout} className="text-neutral-500 hover:text-neutral-300 text-sm transition">
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 환영 카드 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">환영합니다, {user.name}님!</h1>
          <p className="text-neutral-400">
            내 공간: <Link href={`/${user.slug}`} className="text-amber-500 hover:text-amber-400">grimoire.app/{user.slug}</Link>
          </p>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/upload" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">원고 업로드</h3>
            <p className="text-neutral-500 text-sm mt-1">MD, TXT 파일을 업로드하세요</p>
          </Link>

          <Link href="/dashboard/theme" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-amber-600 transition group">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="text-white font-medium group-hover:text-amber-500 transition">테마 설정</h3>
            <p className="text-neutral-500 text-sm mt-1">AI로 나만의 공간을 꾸미세요</p>
          </Link>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-white font-medium">통계</h3>
            <p className="text-neutral-500 text-sm mt-1">조회수 통계 (준비 중)</p>
          </div>
        </div>

        {/* 내 작품 목록 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">내 작품</h2>
            <Link href="/dashboard/upload" className="text-sm text-amber-500 hover:text-amber-400">
              + 새 작품
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">아직 작품이 없습니다</p>
            <Link href="/dashboard/upload" className="inline-block px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition">
              첫 작품 업로드하기
            </Link>
          </div>
        </div>

        {/* 크레딧 현황 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-4">
          <h2 className="text-lg font-bold text-white mb-4">크레딧 현황</h2>
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
