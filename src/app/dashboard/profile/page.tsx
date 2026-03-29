"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlatformNav } from '@/components/PlatformNav'
import { useLoadingAction } from '@/hooks/useThrottle'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const saveAction = useLoadingAction()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user) setName(user.name)
  }, [user, loading, router])

  const handleSave = () => {
    saveAction.execute(async () => {
      // TODO: 프로필 업데이트 API 연동
      setMessage('프로필이 저장되었습니다 (서버 연동 후 활성화)')
    })
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">프로필 설정</h1>

        {message && (
          <div className="bg-amber-900/20 border border-amber-800/50 text-amber-300 px-4 py-3 rounded-lg text-sm mb-6">{message}</div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">이메일</label>
            <input type="email" value={user.email} disabled className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-500 cursor-not-allowed" />
            <p className="text-neutral-600 text-xs mt-1">이메일은 변경할 수 없습니다</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">작가명</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition" />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">슬러그 (URL)</label>
            <div className="flex items-center">
              <span className="text-neutral-500 text-sm mr-2">grimoire-book.com/</span>
              <input type="text" value={user.slug} disabled className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-500 cursor-not-allowed" />
            </div>
            <p className="text-neutral-600 text-xs mt-1">슬러그 변경은 추후 지원 예정</p>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-2">연동된 소셜 계정</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">Google</span>
                </div>
                <button className="text-sm text-amber-500 hover:text-amber-400">연동하기</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">Kakao</span>
                </div>
                <button className="text-sm text-neutral-500 cursor-not-allowed">준비 중</button>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saveAction.pending} className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white font-medium rounded-lg transition">
            {saveAction.pending ? '저장 중...' : '저장'}
          </button>
        </div>
      </main>
    </div>
  )
}
