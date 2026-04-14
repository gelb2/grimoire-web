"use client"

import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface EpisodeItem {
  id: string
  slug: string
  title: string
  status: string
  orderNum: number
}

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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  upload: { label: '업로드', color: 'bg-neutral-200 text-neutral-600' },
  public: { label: '공개', color: 'bg-green-100 text-green-700' },
  nonPublic: { label: '비공개', color: 'bg-yellow-100 text-yellow-700' },
  shared: { label: '공유중', color: 'bg-blue-100 text-blue-700' },
}

interface WorkListProps {
  userSlug: string
  works: Work[]
  worksLoading: boolean
  expandedWork: string | null
  episodes: Record<string, EpisodeItem[]>
  deletingWorks: Set<string>
  error: string
  showNewWork: boolean
  newWork: { title: string; slug: string; description: string }
  creating: boolean
  onSetShowNewWork: (show: boolean) => void
  onSetNewWork: (updater: (prev: { title: string; slug: string; description: string }) => { title: string; slug: string; description: string }) => void
  onCreateWork: () => void
  onDeleteWork: (workId: string, title: string) => void
  onLoadEpisodes: (workId: string, workSlug: string) => void
  onStatusChange: (workId: string, episodeId: string, status: 'upload' | 'public' | 'nonPublic') => void
  onOpenShareModal: (workId: string, episodeId: string, title: string) => void
  onUpdateWorks: (updater: (prev: Work[]) => Work[]) => void
}

export function WorkList({
  userSlug,
  works,
  worksLoading,
  expandedWork,
  episodes,
  deletingWorks,
  error,
  showNewWork,
  newWork,
  creating,
  onSetShowNewWork,
  onSetNewWork,
  onCreateWork,
  onDeleteWork,
  onLoadEpisodes,
  onStatusChange,
  onOpenShareModal,
  onUpdateWorks,
}: WorkListProps) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-4 flex-1">
          <h2 className="text-2xl font-black text-black">내 작품</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        <button onClick={() => onSetShowNewWork(true)} className="text-sm text-[#e53e3e] hover:underline ml-4">+ 새 작품</button>
      </div>

      {error && (
        <div className="border-l-2 border-[#e53e3e] pl-4 text-[#e53e3e] text-sm py-2 mb-4">{error}</div>
      )}

      {/* 새 작품 폼 */}
      {showNewWork && (
        <div className="border border-neutral-200 rounded-lg p-5 mb-4 space-y-3 bg-white2">
          <input type="text" placeholder="작품 제목" value={newWork.title}
            onChange={e => {
              onSetNewWork(prev => ({ ...prev, title: e.target.value }))
              if (!newWork.slug) onSetNewWork(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))
            }}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
          <input type="text" placeholder="작품 주소 (영문, 예: my-novel)" value={newWork.slug}
            onChange={e => onSetNewWork(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 focus:outline-none focus:border-black transition" />
          <textarea placeholder="설명 (선택)" value={newWork.description} rows={2}
            onChange={e => onSetNewWork(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-black text-sm placeholder-neutral-400 resize-none focus:outline-none focus:border-black transition" />
          <div className="flex gap-2">
            <button onClick={onCreateWork} disabled={creating}
              className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-sm rounded-lg transition">{creating ? '생성 중...' : '작품 만들기'}</button>
            <button onClick={() => onSetShowNewWork(false)}
              className="px-4 py-2 border border-neutral-300 text-neutral-500 text-sm rounded-lg hover:border-black hover:text-black transition">취소</button>
          </div>
        </div>
      )}

      {worksLoading ? (
        <p className="text-neutral-400 text-center py-8">로딩 중...</p>
      ) : works.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 mb-4">아직 작품이 없습니다</p>
          <button onClick={() => onSetShowNewWork(true)} className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition">
            첫 작품 만들기
          </button>
        </div>
      ) : (
        <div>
          {works.map((work, i) => (
            <div key={work.id} className="border-b border-neutral-200">
              <div className="grid grid-cols-[50px_1fr_auto] items-center gap-4 py-4">
                <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <button onClick={() => onLoadEpisodes(work.id, work.slug)} className="text-base font-bold text-black hover:text-[#e53e3e] transition text-left">
                    {work.title} <span className="text-xs font-normal text-neutral-400">{expandedWork === work.id ? '▲' : '▼'}</span>
                  </button>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {work.episodeCount}화{work.viewCount ? ` · ${work.viewCount.toLocaleString()}뷰` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/${userSlug}/${work.slug}`} className="text-xs text-neutral-500 hover:text-black underline transition">보기</Link>
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
                          onUpdateWorks(prev => prev.map(w => w.id === work.id ? { ...w, coverImage: result.coverImage } : w))
                          toast.success('커버 이미지가 업로드됐습니다')
                        } catch (err: any) {
                          toast.error(err.message || '커버 업로드에 실패했습니다')
                        }
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <button onClick={() => onDeleteWork(work.id, work.title)} disabled={deletingWorks.has(work.id)}
                    className="text-xs text-[#e53e3e] hover:underline disabled:text-neutral-400 disabled:cursor-not-allowed transition">
                    {deletingWorks.has(work.id) ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>

              {/* 에피소드 목록 (펼침) */}
              {expandedWork === work.id && (
                <div className="pl-[50px] pb-4 space-y-2">
                  {!episodes[work.id] ? (
                    <p className="text-xs text-neutral-400">로딩 중...</p>
                  ) : episodes[work.id].length === 0 ? (
                    <p className="text-xs text-neutral-400">에피소드가 없습니다</p>
                  ) : (
                    episodes[work.id].map(ep => {
                      const st = STATUS_LABELS[ep.status] || STATUS_LABELS.upload
                      return (
                        <div key={ep.id} className="flex items-center gap-3 py-1.5">
                          <span className="text-xs text-neutral-300 font-mono w-5">{ep.orderNum}</span>
                          <span className="text-sm text-black flex-1 truncate">{ep.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                          <select
                            value={ep.status === 'shared' ? 'shared' : ep.status}
                            onChange={e => onStatusChange(work.id, ep.id, e.target.value as any)}
                            className="text-xs bg-white border border-neutral-200 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            <option value="upload">업로드</option>
                            <option value="public">공개</option>
                            <option value="nonPublic">비공개</option>
                            {ep.status === 'shared' && <option value="shared" disabled>공유중</option>}
                          </select>
                          <button
                            onClick={() => onOpenShareModal(work.id, ep.id, ep.title)}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            공유
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
