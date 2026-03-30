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
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>
        <h1 className="text-3xl font-black text-black mb-6">프로필 설정</h1>

        {message && (
          <div className="border-l-2 border-platform-accent text-platform-accent px-4 py-3 text-sm mb-6">{message}</div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">이메일</label>
            <input type="email" value={user.email} disabled className="w-full px-4 py-3 bg-platform-bg2 border border-neutral-300 rounded-lg text-neutral-500 cursor-not-allowed" />
            <p className="text-neutral-600 text-xs mt-1">이메일은 변경할 수 없습니다</p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">작가명</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-platform-bg2 border border-neutral-300 rounded-lg text-black focus:outline-none focus:border-black transition" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">내 공간 주소</label>
            <div className="flex items-center">
              <span className="text-neutral-400 text-sm mr-2">grimoire-book.com/</span>
              <input type="text" value={user.slug} disabled className="flex-1 px-4 py-3 bg-platform-bg2 border border-neutral-300 rounded-lg text-neutral-500 cursor-not-allowed" />
            </div>
            <p className="text-neutral-600 text-xs mt-1">공간 주소 변경은 추후 지원 예정</p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">연동된 소셜 계정</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-platform-bg2 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-black text-sm">Google</span>
                </div>
                <button className="text-sm text-platform-accent hover:text-platform-accent">연동하기</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-platform-bg2 border border-neutral-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-black text-sm">Kakao</span>
                </div>
                <button className="text-sm text-neutral-400 cursor-not-allowed">준비 중</button>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saveAction.pending} className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition">
            {saveAction.pending ? '저장 중...' : '저장'}
          </button>
        </div>
      </main>
    </div>
  )
}
