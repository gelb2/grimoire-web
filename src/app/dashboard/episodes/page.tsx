"use client"

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { Alert } from '@/components/Alert'

interface Work { id: string; slug: string; title: string }
interface EpisodeLite { id: string; slug: string; title: string; orderNum?: number; type?: string; status?: string }

/** 지원 파일 확장자 — 서버 텍스트 파서 지원 포맷과 정합 */
const ALLOWED_EXTS = ['md', 'txt', 'html', 'htm']
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 원고 관리 — 수정(파일 덮어쓰기) + 삭제 (2026-04-24 F4)
 *
 * 서비스 원칙 준수:
 *  - 본문 복붙/타이핑 UI 없음 — 파일 업로드(.md/.txt/.html)로만 덮어쓰기
 *  - 업로드된 파일의 본문이 기존 blocks/rawMd를 교체하고, RAG 자동 재인덱싱
 *  - 삭제는 Alert 확인 후 실행
 */
export default function EpisodeManagementPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const userSlug = user?.slug

  const [works, setWorks] = useState<Work[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [selectedWorkSlug, setSelectedWorkSlug] = useState('')
  const [episodes, setEpisodes] = useState<EpisodeLite[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  const [replaceTarget, setReplaceTarget] = useState<EpisodeLite | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EpisodeLite | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!userSlug) return
    api.getAuthorSpace<{ works: Work[] }>(userSlug)
      .then(data => {
        const list = data.works ?? []
        setWorks(list)
        if (list.length > 0) {
          setSelectedWorkId(prev => prev || list[0].id)
          setSelectedWorkSlug(prev => prev || list[0].slug)
        }
      })
      .catch(() => {})
  }, [userSlug])

  const reloadEpisodes = useMemo(() => () => {
    if (!userSlug || !selectedWorkSlug) { setEpisodes([]); return }
    setEpisodesLoading(true)
    api.getWork<{ episodes?: EpisodeLite[]; work?: { episodes?: EpisodeLite[] } }>(userSlug, selectedWorkSlug)
      .then(data => {
        const eps = data.episodes ?? data.work?.episodes ?? []
        setEpisodes(eps)
      })
      .catch(() => setEpisodes([]))
      .finally(() => setEpisodesLoading(false))
  }, [userSlug, selectedWorkSlug])

  useEffect(() => {
    reloadEpisodes()
  }, [reloadEpisodes])

  const handleFileChosen = async (ep: EpisodeLite, file: File) => {
    const ext = (file.name.split('.').pop() ?? '').toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      toast.error(`${ALLOWED_EXTS.join(', ')} 파일만 업로드할 수 있어요`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`파일이 너무 큽니다 (최대 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)`)
      return
    }
    const text = await file.text()
    if (text.trim().length < 10) {
      toast.error('본문이 너무 짧아 덮어쓰기할 수 없어요')
      return
    }

    const sourceFormat = ext === 'md' ? 'markdown' : ext === 'htm' ? 'html' : ext
    setBusyId(ep.id)
    setReplaceTarget(null)
    try {
      await api.reuploadEpisode(ep.id, { rawContent: text, sourceFormat })
      toast.success('회차 본문이 교체됐어요. RAG 재인덱싱은 백그라운드에서 진행됩니다.')
      reloadEpisodes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '덮어쓰기에 실패했어요')
    } finally {
      setBusyId(null)
    }
  }

  // F-20w — 위/아래 이동으로 순서 변경. 인접 스왑 후 작품 전체 에피소드 id 를 새 순서로 전송
  // (server 가 집합 일치 검증 — 부분 재정렬 금지). 낙관적 반영 후 실패 시 롤백.
  const moveEpisode = async (index: number, dir: 'up' | 'down') => {
    if (reordering) return
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= episodes.length) return
    const prev = episodes
    const reordered = [...episodes]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setEpisodes(reordered)
    setReordering(true)
    try {
      await api.reorderEpisodes(selectedWorkId, reordered.map(e => e.id))
      toast.success('순서를 변경했어요.')
    } catch (err) {
      setEpisodes(prev)
      toast.error(err instanceof Error ? err.message : '순서 변경에 실패했어요')
    } finally {
      setReordering(false)
    }
  }

  const handleDelete = async (ep: EpisodeLite) => {
    setBusyId(ep.id)
    setDeleteTarget(null)
    try {
      await api.deleteEpisode(ep.id)
      toast.success('회차를 삭제했어요.')
      setEpisodes(prev => prev.filter(x => x.id !== ep.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제에 실패했어요')
    } finally {
      setBusyId(null)
    }
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>
        <h1 className="text-3xl font-black text-black mb-2">원고 관리</h1>
        <p className="text-sm text-neutral-500 mb-8">
          업로드한 회차를 파일로 덮어쓰거나 삭제할 수 있어요. <span className="text-black font-semibold">위/아래 화살표</span>로 회차 순서도 바꿀 수 있어요. 본문 수정은 <span className="text-black font-semibold">파일 교체</span>로만 진행됩니다 — 그리모어는 복붙/타이핑 편집을 지원하지 않아요.
        </p>

        {/* 작품 선택 */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">작품 선택</label>
          {works.length === 0 ? (
            <p className="text-sm text-neutral-400">작품이 없습니다. <Link href="/dashboard/upload" className="text-[#e53e3e] underline">먼저 업로드해주세요.</Link></p>
          ) : (
            <select
              value={selectedWorkId}
              onChange={e => {
                const id = e.target.value
                setSelectedWorkId(id)
                const w = works.find(x => x.id === id)
                setSelectedWorkSlug(w?.slug ?? '')
              }}
              className="w-full px-4 py-3 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black focus:outline-none focus:border-black transition"
            >
              {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          )}
        </div>

        {/* 에피소드 리스트 */}
        {episodesLoading ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : episodes.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-500 mb-4">이 작품에 회차가 없어요.</p>
            <Link href="/dashboard/upload" className="inline-block text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition">
              새 회차 업로드
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {episodes.map((ep, index) => {
              const busy = busyId === ep.id
              const label =
                ep.type === 'preface' ? `일러두기 · ${ep.title}` :
                ep.type === 'afterword' ? `후기 · ${ep.title}` :
                ep.type === 'bonus' ? `번외 · ${ep.title}` :
                ep.orderNum != null ? `${String(ep.orderNum).padStart(2, '0')}화 · ${ep.title}` : ep.title
              return (
                <li key={ep.id} className={`py-4 px-2 flex items-center gap-3 ${busy ? 'opacity-50' : ''}`}>
                  {/* F-20w — 순서 변경 (위/아래 이동) */}
                  <div className="flex flex-col leading-none text-xs">
                    <button
                      type="button"
                      aria-label="위로 이동"
                      disabled={index === 0 || busy || reordering}
                      onClick={() => moveEpisode(index, 'up')}
                      className="px-1 py-0.5 text-neutral-400 hover:text-black disabled:opacity-25 disabled:hover:text-neutral-400 transition"
                    >▲</button>
                    <button
                      type="button"
                      aria-label="아래로 이동"
                      disabled={index === episodes.length - 1 || busy || reordering}
                      onClick={() => moveEpisode(index, 'down')}
                      className="px-1 py-0.5 text-neutral-400 hover:text-black disabled:opacity-25 disabled:hover:text-neutral-400 transition"
                    >▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{label}</p>
                    {ep.status && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">{statusLabel(ep.status)}</p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/episodes/${ep.id}/edit`}
                    className={`text-xs px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-lg hover:border-black hover:text-black transition ${busy ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    본문 편집
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setReplaceTarget(ep)}
                    className="text-xs px-3 py-1.5 border border-neutral-300 text-neutral-700 rounded-lg hover:border-black hover:text-black transition disabled:opacity-50"
                  >
                    파일로 덮어쓰기
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setDeleteTarget(ep)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-700 rounded-lg hover:border-red-500 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {/* 덮어쓰기 파일 선택 Alert */}
      <Alert
        open={replaceTarget !== null}
        onClose={() => setReplaceTarget(null)}
        title="파일로 덮어쓰기"
        body={
          <div className="space-y-3">
            <p>
              기존 본문 대신 업로드한 파일의 내용으로 <span className="font-semibold text-black">완전히 교체</span>됩니다. 이전 내용은 복구할 수 없어요.
            </p>
            <p className="text-neutral-500">지원 포맷: .md, .txt, .html (최대 10MB). RAG 인덱싱이 자동으로 다시 실행됩니다.</p>
            <input
              type="file"
              accept=".md,.txt,.html,.htm"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file && replaceTarget) void handleFileChosen(replaceTarget, file)
              }}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:border file:border-neutral-300 file:rounded-lg file:text-black file:bg-[#f5f5f5] file:text-sm file:cursor-pointer"
            />
          </div>
        }
        cancelLabel="취소"
        confirmLabel={null}
      />

      {/* 삭제 확인 Alert */}
      <Alert
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        tone="warning"
        title="회차를 삭제할까요?"
        body={
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-black">{deleteTarget?.title}</span> 회차가 완전히 삭제됩니다. 이 작업은 되돌릴 수 없어요.
            </p>
            <p className="text-neutral-500">독자 북마크·읽기 기록·좋아요 등 연동 데이터도 함께 정리됩니다.</p>
          </div>
        }
        cancelLabel="취소"
        confirmLabel="삭제"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </div>
  )
}

function statusLabel(status: string): string {
  switch (status) {
    case 'upload': return '업로드 (비공개 준비 중)'
    case 'public': return '공개 중'
    case 'nonPublic': return '비공개'
    case 'shared': return '공유 링크 중'
    default: return status
  }
}
