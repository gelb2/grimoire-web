"use client"

import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { ViewChart } from '@/components/ViewChart'

interface Work {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  episodeCount: number
  viewCount?: number
  coverImage?: string | null
}

interface WorkStatsData {
  dates: string[]
  counts: number[]
  totalViews: number
}

const quickActions = [
  { href: '/dashboard/upload', title: '원고 업로드', desc: 'MD, TXT, DOCX' },
  { href: '/dashboard/theme', title: '테마 에디터', desc: '작가공간 디자인' },
  { href: '/dashboard/chat', title: 'AI 어시스턴트', desc: '원고 분석·캐릭터·문체' },
  { href: '/dashboard/analytics', title: '작품 분석', desc: '조회수·좋아요·구독' },
  { href: '/dashboard/credits', title: '크레딧 충전', desc: '크레딧 관리' },
  { href: '/dashboard/profile', title: '프로필 설정', desc: '작가 정보 수정' },
  { href: '/library', title: '서재', desc: '작품 + 구독 관리' },
]

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
  const [selectedWorkId, setSelectedWorkId] = useState<string>('')
  const [statsData, setStatsData] = useState<WorkStatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [slotInfo, setSlotInfo] = useState<{ plan: string; slotLimit: number; slottedCount: number; isExpired: boolean; themes: any[] } | null>(null)
  const [showPresetPicker, setShowPresetPicker] = useState(false)
  const [presets, setPresets] = useState<{ name: string; label: string; tone: string; genre: string; preview: { bgPrimary: string; accent: string; textPrimary: string } }[]>([])
  const [creatingPreset, setCreatingPreset] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const loadSlotInfo = useCallback(async () => {
    try { setSlotInfo(await api.getSlotInfo()) } catch { /* 무시 */ }
  }, [])

  useEffect(() => {
    if (user) {
      api.getAuthorSpace<any>(user.slug)
        .then(data => setWorks(data.works || []))
        .catch(() => { setWorks([]); toast.error('작품 목록을 불러올 수 없습니다') })
        .finally(() => setWorksLoading(false))
      loadSlotInfo()
    }
  }, [user, loadSlotInfo])

  useEffect(() => {
    if (!selectedWorkId) { setStatsData(null); return }
    setStatsLoading(true)
    api.getWorkStats(selectedWorkId)
      .then(setStatsData)
      .catch(() => { setStatsData(null); toast.error('통계 데이터를 불러올 수 없습니다') })
      .finally(() => setStatsLoading(false))
  }, [selectedWorkId])

  useEffect(() => {
    if (works.length > 0 && !selectedWorkId) setSelectedWorkId(works[0].id)
  }, [works, selectedWorkId])

  const handleCreateWork = async () => {
    if (!newWork.title.trim() || !newWork.slug.trim()) return
    setCreating(true); setError('')
    try {
      const work = await api.createWork(newWork) as any
      setWorks(prev => [...prev, { ...work, episodeCount: 0 }])
      setShowNewWork(false); setNewWork({ title: '', slug: '', description: '' })
    } catch (err: any) { setError(err.message || '작품 생성에 실패했습니다') }
    finally { setCreating(false) }
  }

  const handleDeleteWork = async (workId: string, title: string) => {
    if (deletingWorks.has(workId)) return
    if (!confirm(`"${title}"을(를) 삭제하시겠습니까? 모든 에피소드가 함께 삭제됩니다.`)) return
    setDeletingWorks(prev => new Set(prev).add(workId))
    try {
      await api.deleteWork(workId)
      setWorks(prev => prev.filter(w => w.id !== workId))
    } catch (err: any) { alert(err.message || '삭제에 실패했습니다') }
    finally {
      setDeletingWorks(prev => { const next = new Set(prev); next.delete(workId); return next })
    }
  }

  const handleOpenPresetPicker = async () => {
    setShowPresetPicker(true)
    if (presets.length === 0) {
      try { setPresets(await api.getPresets()) } catch { toast.error('프리셋 목록을 불러올 수 없습니다') }
    }
  }

  const handleCreateFromPreset = async (presetName: string) => {
    setCreatingPreset(presetName)
    try {
      await api.createFromPreset(presetName)
      toast.success('테마가 생성되었습니다')
      setShowPresetPicker(false)
      loadSlotInfo()
    } catch (err: any) { toast.error(err.message || '테마 생성 실패') }
    finally { setCreatingPreset(null) }
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-neutral-400">로딩 중...</p></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 환영 — 에디토리얼 */}
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">YOUR SPACE</p>
          <h1 className="text-4xl md:text-5xl font-black text-black leading-tight mb-3">
            {user.name}
          </h1>
          <Link href={`/${user.slug}`} className="text-sm text-[#e53e3e] hover:underline" target="_blank">
            grimoire-book.com/{user.slug}
          </Link>
        </div>

        {/* 빠른 액션 — 넘버링 리스트 */}
        <section className="mb-12">
          <div className="flex items-baseline gap-4 mb-2">
            <h2 className="text-2xl font-black text-black">빠른 액션</h2>
            <div className="flex-1 h-px bg-black" />
          </div>
          {quickActions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className="group grid grid-cols-[50px_1fr_auto] items-baseline gap-4 py-4 border-b border-neutral-200 hover:border-black transition-colors"
            >
              <span className="text-sm font-mono text-neutral-300 group-hover:text-[#e53e3e] transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-base font-bold text-black group-hover:text-[#e53e3e] transition-colors">{action.title}</h3>
                <p className="text-xs text-neutral-500">{action.desc}</p>
              </div>
              <span className="text-xs text-neutral-400 group-hover:text-black transition-colors">&rarr;</span>
            </Link>
          ))}
        </section>

        {/* 내 테마 */}
        {slotInfo && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-4 flex-1">
                <h2 className="text-2xl font-black text-black">내 테마</h2>
                <div className="flex-1 h-px bg-black" />
              </div>
              <button onClick={handleOpenPresetPicker} className="text-sm text-[#e53e3e] hover:underline ml-4">+ 새 테마</button>
            </div>
            <p className="text-xs text-neutral-400 mb-4 uppercase tracking-widest">
              {slotInfo.plan} · 슬롯 {slotInfo.slottedCount} / {slotInfo.slotLimit == null ? '∞' : slotInfo.slotLimit}
              {slotInfo.isExpired && <span className="text-red-500 ml-2">만료됨</span>}
            </p>

            {/* 프리셋 선택 패널 */}
            {showPresetPicker && (
              <div className="mb-6 border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-black">테마 만들기</h3>
                  <button onClick={() => setShowPresetPicker(false)} className="text-xs text-neutral-400 hover:text-black">닫기</button>
                </div>

                {/* 생성 옵션 */}
                <div className="flex gap-2 mb-4">
                  <Link href="/dashboard/theme" className="px-3 py-1.5 text-xs rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-50">AI로 생성 (1 크레딧)</Link>
                  <Link href="/dashboard/theme" className="px-3 py-1.5 text-xs rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-50">직접 만들기</Link>
                </div>

                {/* 프리셋 그리드 */}
                <p className="text-xs text-neutral-500 mb-2">시스템 프리셋 (무료)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleCreateFromPreset(p.name)}
                      disabled={creatingPreset !== null || slotInfo.isExpired}
                      className="group flex flex-col items-start p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 transition text-left disabled:opacity-50"
                    >
                      <div className="flex gap-1 mb-2">
                        <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.preview.bgPrimary }} />
                        <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.preview.accent }} />
                        <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.preview.textPrimary }} />
                      </div>
                      <span className="text-xs font-bold text-black">{p.label}</span>
                      <span className="text-[10px] text-neutral-400">{p.genre}</span>
                      {creatingPreset === p.name && <span className="text-[10px] text-blue-500 mt-1">생성 중...</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {slotInfo.themes.length === 0 && !showPresetPicker ? (
              <div className="text-center py-8 border-b border-neutral-200">
                <p className="text-sm text-neutral-400 mb-3">아직 테마가 없습니다</p>
                <button onClick={handleOpenPresetPicker} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition">프리셋에서 선택하기</button>
              </div>
            ) : (
              slotInfo.themes.map((t: any, i: number) => (
                <div key={t.id} className="grid grid-cols-[50px_1fr_auto] items-center gap-4 py-3 border-b border-neutral-200">
                  <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="text-sm font-bold text-black">{t.name}</span>
                    <span className="ml-2 text-xs text-neutral-400">{t.source === 'ai' ? 'AI 생성' : t.source === 'system' ? '시스템' : '직접 편집'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          if (t.isSlotted) await api.removeThemeSlot(t.id)
                          else await api.assignThemeSlot(t.id)
                          loadSlotInfo()
                        } catch (e: any) { toast.error(e.message || '슬롯 변경 실패') }
                      }}
                      disabled={slotInfo.isExpired}
                      className={`px-2 py-0.5 text-xs rounded ${t.isSlotted ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      {t.isSlotted ? '활성' : '보관'}
                    </button>
                    <Link href={`/dashboard/theme?id=${t.id}`} className="px-2 py-0.5 text-xs rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                      편집
                    </Link>
                    {t.isSlotted && (
                      <button
                        onClick={async () => {
                          try {
                            await api.publishTheme(user.slug)
                            toast.success('퍼블리시 완료')
                          } catch { toast.error('퍼블리시 실패') }
                        }}
                        disabled={slotInfo.isExpired}
                        className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                      >
                        퍼블리시
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* 내 작품 */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-4 flex-1">
              <h2 className="text-2xl font-black text-black">내 작품</h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            <button onClick={() => setShowNewWork(true)} className="text-sm text-[#e53e3e] hover:underline ml-4">+ 새 작품</button>
          </div>

          {error && (
            <div className="border-l-2 border-[#e53e3e] pl-4 text-[#e53e3e] text-sm py-2 mb-4">{error}</div>
          )}

          {/* 새 작품 폼 */}
          {showNewWork && (
            <div className="border border-neutral-200 rounded-lg p-5 mb-4 space-y-3 bg-[#f5f5f5]">
              <input type="text" placeholder="작품 제목" value={newWork.title}
                onChange={e => {
                  setNewWork(prev => ({ ...prev, title: e.target.value }))
                  if (!newWork.slug) setNewWork(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))
                }}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
              <input type="text" placeholder="작품 주소 (영문, 예: my-novel)" value={newWork.slug}
                onChange={e => setNewWork(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
              <textarea placeholder="설명 (선택)" value={newWork.description} rows={2}
                onChange={e => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 resize-none focus:outline-none focus:border-black transition" />
              <div className="flex gap-2">
                <button onClick={handleCreateWork} disabled={creating}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-sm rounded-lg transition">{creating ? '생성 중...' : '작품 만들기'}</button>
                <button onClick={() => setShowNewWork(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-500 text-sm rounded-lg hover:border-black hover:text-black transition">취소</button>
              </div>
            </div>
          )}

          {worksLoading ? (
            <p className="text-neutral-400 text-center py-8">로딩 중...</p>
          ) : works.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">아직 작품이 없습니다</p>
              <button onClick={() => setShowNewWork(true)} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition">
                첫 작품 만들기
              </button>
            </div>
          ) : (
            <div>
              {works.map((work, i) => (
                <div key={work.id} className="grid grid-cols-[50px_1fr_auto] items-center gap-4 py-4 border-b border-neutral-200">
                  <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <Link href={`/${user.slug}/${work.slug}`} className="text-base font-bold text-black hover:text-[#e53e3e] transition">{work.title}</Link>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {work.episodeCount}화{work.viewCount ? ` · ${work.viewCount.toLocaleString()}뷰` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/upload?work=${work.id}`} className="text-xs text-neutral-500 hover:text-black underline transition">추가</Link>
                    <label className="text-xs text-neutral-500 hover:text-black underline transition cursor-pointer">
                      {work.coverImage ? '커버 변경' : '커버'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const result = await api.uploadCover(work.id, file)
                            setWorks(prev => prev.map(w => w.id === work.id ? { ...w, coverImage: result.coverImage } : w))
                            toast.success('커버 이미지가 업로드됐습니다')
                          } catch (err: any) {
                            toast.error(err.message || '커버 업로드에 실패했습니다')
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <button onClick={() => handleDeleteWork(work.id, work.title)} disabled={deletingWorks.has(work.id)}
                      className="text-xs text-[#e53e3e] hover:underline disabled:text-neutral-400 disabled:cursor-not-allowed transition">
                      {deletingWorks.has(work.id) ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 조회수 통계 */}
        {works.length > 0 && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-baseline gap-4 flex-1">
                <h2 className="text-2xl font-black text-black">조회수 통계</h2>
                <div className="flex-1 h-px bg-black" />
              </div>
              <select
                value={selectedWorkId}
                onChange={(e) => setSelectedWorkId(e.target.value)}
                className="bg-white border border-neutral-300 text-black text-sm rounded-lg px-3 py-1.5 ml-4 focus:outline-none focus:border-black"
              >
                {works.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            </div>

            {statsLoading ? (
              <p className="text-neutral-400 text-center py-8 text-sm">통계 로딩 중...</p>
            ) : statsData ? (
              <ViewChart dates={statsData.dates} counts={statsData.counts} totalViews={statsData.totalViews} />
            ) : (
              <p className="text-neutral-400 text-center py-8 text-sm">통계 데이터를 불러올 수 없습니다</p>
            )}
          </section>
        )}

        {/* 크레딧 현황 */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-4 flex-1">
              <h2 className="text-2xl font-black text-black">크레딧</h2>
              <div className="flex-1 h-px bg-black" />
            </div>
            <Link href="/dashboard/credits" className="text-sm text-[#e53e3e] hover:underline ml-4">충전하기 &rarr;</Link>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-4xl font-black text-black">{user.credits}</p>
              <p className="text-neutral-500 text-sm">잔여 크레딧</p>
            </div>
            <div className="text-neutral-400 text-sm">
              <p>테마 AI 생성: 1 크레딧</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
