"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { Alert } from '@/components/Alert'
import type { IndexStatus } from '@/types/api'

interface Work { id: string; slug: string; title: string }
interface EpisodeLite { id: string; slug: string; title: string; orderNum?: number; type?: string }

const TYPE_LABELS: Record<string, string> = {
  consistency: '설정 일관성',
  tone: '문체 분석',
  character: '캐릭터 분석',
}

/**
 * AI 일관성 분석 화면 — Q1=(a) 모드 + 결과 히스토리 분리 (2026-04-24 F4)
 *
 * 원칙 (docs/ai-analysis-spec.md §6-1 Claude Projects 벤치마크):
 *  - 본문 복붙/타이핑 금지 → 작품 + 회차 선택만으로 분석 실행
 *  - 결과는 DB에 저장되며 이 화면에서는 직접 렌더링하지 않음 → 히스토리 화면에서 조회
 *  - 분석 시작 전 기본 Alert 컴포넌트로 소요 시간 안내
 *  - refreshUser 부작용(useEffect 재실행)을 막기 위해 user 의존성 대신 user.slug/id 고정
 */
export default function AnalysisPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const userSlug = user?.slug  // refreshUser 후에도 동일하면 effect 재실행 방지

  const [works, setWorks] = useState<Work[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [selectedWorkSlug, setSelectedWorkSlug] = useState('')
  const [episodes, setEpisodes] = useState<EpisodeLite[]>([])
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('')
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // "분석 시작됐어요" 안내 Alert — 확인 누르면 대시보드로 라우팅.
  // 분석 자체는 백그라운드로 계속 진행되고, 완료 시 DB에 저장되어 분석 기록에서 열람.
  const [startedOpen, setStartedOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['consistency', 'tone', 'character']))

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  // 작품 목록 — userSlug 기반 (refreshUser로 user 참조만 바뀌어도 재실행되지 않음)
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

  useEffect(() => {
    if (!selectedWorkId) return
    api.getAnalysisStatus(selectedWorkId)
      .then(setIndexStatus)
      .catch(() => setIndexStatus(null))
  }, [selectedWorkId])

  useEffect(() => {
    if (!userSlug || !selectedWorkSlug) {
      setEpisodes([])
      setSelectedEpisodeId('')
      return
    }
    api.getWork<{ episodes?: EpisodeLite[]; work?: { episodes?: EpisodeLite[] } }>(userSlug, selectedWorkSlug)
      .then(data => {
        const eps = data.episodes ?? data.work?.episodes ?? []
        setEpisodes(eps)
        setSelectedEpisodeId(eps[0]?.id ?? '')
      })
      .catch(() => setEpisodes([]))
  }, [userSlug, selectedWorkSlug])

  const selectedEpisode = useMemo(
    () => episodes.find(ep => ep.id === selectedEpisodeId),
    [episodes, selectedEpisodeId],
  )

  /**
   * Fire-and-forget 분석 실행.
   * - 요청은 보내고 이 화면에서 await 하지 않음 → 사용자는 대시보드/다른 화면에서 작업 가능
   * - 요청 자체는 브라우저가 유지 (SPA 이동 내내 살아있음). 서버가 끝나면 AnalysisReport DB에 저장됨
   * - 결과 확인: 사용자가 `/dashboard/analysis/history`에서 열람
   * - refreshUser는 최종 응답 시 재호출해 크레딧 UI 갱신 (성공·실패 양쪽에서)
   */
  const runAnalyze = () => {
    if (!selectedEpisodeId || submitting) return
    if (selectedTypes.size === 0) {
      toast.error('분석 항목을 최소 1개 이상 선택해주세요')
      return
    }
    const types = Array.from(selectedTypes) as ('consistency' | 'tone' | 'character')[]
    setSubmitting(true)

    // 백그라운드 실행 — 화면을 벗어나도 브라우저가 요청 유지
    api.analyzeEpisode(selectedEpisodeId, types)
      .then(() => {
        // 완료 시 크레딧 UI 동기화 (사용자가 다른 화면에 있어도 AuthProvider user 상태는 공유됨)
        refreshUser().catch(() => {})
        toast.success('AI 분석이 완료됐어요. 분석 기록에서 확인하세요.')
      })
      .catch((err: unknown) => {
        refreshUser().catch(() => {})
        // 실패는 toast로만 — 이미 사용자는 다른 작업 중일 수 있으므로 화면 전환 강제 X
        toast.error(err instanceof Error ? err.message : 'AI 분석에 실패했어요. 크레딧 잔액을 확인해주세요.')
      })

    // 사용자에게 즉시 "시작됐다" 안내 (Alert에서 확인 누르면 대시보드로 이동)
    setConfirmOpen(false)
    setStartedOpen(true)
  }

  const handleStart = () => {
    if (!selectedEpisodeId) {
      toast.error('분석할 회차를 선택하세요')
      return
    }
    if (selectedTypes.size === 0) {
      toast.error('분석 항목을 최소 1개 이상 선택해주세요')
      return
    }
    setConfirmOpen(true)
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) { if (next.size > 1) next.delete(type) }
      else next.add(type)
      return next
    })
  }

  if (loading || !user) return null

  const formatEpisodeOption = (ep: EpisodeLite) => {
    if (ep.orderNum != null && ep.type === 'episode') return `${String(ep.orderNum).padStart(2, '0')}화 · ${ep.title}`
    if (ep.type === 'preface') return `일러두기 · ${ep.title}`
    if (ep.type === 'afterword') return `후기 · ${ep.title}`
    if (ep.type === 'bonus') return `번외 · ${ep.title}`
    return ep.title
  }

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-black text-black">AI 일관성 분석</h1>
          <Link
            href="/dashboard/analysis/history"
            className="text-sm font-medium border border-neutral-300 px-3 py-1.5 rounded-lg text-neutral-600 hover:border-black hover:text-black transition whitespace-nowrap"
          >
            분석 기록 보기 →
          </Link>
        </div>

        <p className="text-sm text-neutral-500 mb-8">
          이미 업로드한 회차를 선택하면 같은 작품의 다른 회차들과 비교하여 설정·문체·캐릭터 일관성을 검증합니다.
          본문 복붙 없이 작품 → 회차 선택만으로 분석합니다. 완료 후 결과는 <span className="text-black font-semibold">분석 기록</span> 화면에서 언제든 다시 확인할 수 있어요.
        </p>

        {/* 작품 선택 */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">작품 선택</label>
          {works.length === 0 ? (
            <p className="text-sm text-neutral-400">작품이 없습니다. <Link href="/dashboard" className="text-[#e53e3e] underline">대시보드에서 작품을 먼저 만들어주세요.</Link></p>
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

        {/* 분석할 회차 선택 */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">분석할 회차</label>
          {episodes.length === 0 ? (
            <p className="text-sm text-neutral-400">
              이 작품에 회차가 없습니다. <Link href="/dashboard" className="text-[#e53e3e] underline">대시보드에서 회차를 먼저 업로드해주세요.</Link>
            </p>
          ) : (
            <>
              <select
                value={selectedEpisodeId}
                onChange={e => setSelectedEpisodeId(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black focus:outline-none focus:border-black transition"
              >
                {episodes.map(ep => (
                  <option key={ep.id} value={ep.id}>{formatEpisodeOption(ep)}</option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                선택한 회차의 본문이 같은 작품 내 다른 회차들과 비교됩니다. 자기 자신 청크는 RAG 컨텍스트에서 자동 제외됩니다.
              </p>
            </>
          )}
        </div>

        {/* 인덱싱 상태 */}
        {indexStatus && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-neutral-200 bg-[#f5f5f5]">
            <p className="text-sm text-black">
              인덱싱 상태: {indexStatus.isIndexed ? (
                <span className="text-green-700 font-medium">완료 ({indexStatus.chunkCount}개 청크)</span>
              ) : (
                <span className="text-neutral-500">미인덱싱 — 회차 업로드 시 자동 인덱싱됩니다. 회차가 1개뿐이거나 인덱싱 진행 중이면 비교할 다른 회차가 없을 수 있습니다.</span>
              )}
            </p>
          </div>
        )}

        {/* 분석 타입 선택 */}
        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">분석 항목</label>
          <div className="flex gap-2">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${selectedTypes.has(key) ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral-500 mb-2">
          분석 1회당 <span className="text-[#e53e3e] font-semibold">4 크레딧</span>이 차감됩니다. 서버가 분석을 실패로 확정한 경우 자동 환불되며, 진행 중 중단이면 잔액을 크레딧 페이지에서 확인해주세요.
        </p>
        <button
          onClick={handleStart}
          disabled={submitting || !selectedEpisodeId}
          className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition mb-8"
        >
          {submitting ? '분석 요청 중...' : '분석 시작 (4 크레딧)'}
        </button>
      </main>

      {/* 분석 시작 전 확인 Alert — 소요 시간 + 백그라운드 안내 */}
      <Alert
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="분석을 시작할까요?"
        body={
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-black">{selectedEpisode ? formatEpisodeOption(selectedEpisode) : '선택한 회차'}</span> 를 같은 작품의 다른 회차들과 비교합니다.
            </p>
            <p>분석은 <span className="font-semibold text-black">최소 1~2분</span>, 경우에 따라 더 소요될 수 있어요. 시작 후에는 대시보드로 돌아가 <span className="font-semibold text-black">다른 작업을 이어가셔도 됩니다</span>. 완료되면 결과가 <span className="font-semibold text-black">분석 기록</span>에 저장돼요.</p>
            <p className="text-[#e53e3e] font-semibold">지금 4 크레딧이 차감됩니다. (실패 시 자동 환불)</p>
          </div>
        }
        cancelLabel="취소"
        confirmLabel="확인하고 분석 시작"
        onConfirm={runAnalyze}
      />

      {/* 분석 시작 안내 Alert — 확인 누르면 대시보드로 이동, 분석은 백그라운드에서 계속 */}
      <Alert
        open={startedOpen}
        onClose={() => { setStartedOpen(false); router.push('/dashboard') }}
        tone="info"
        title="분석을 시작했어요"
        body={
          <div className="space-y-2">
            <p>
              선택하신 회차의 AI 일관성 분석이 백그라운드에서 실행 중입니다.
              <span className="font-semibold text-black"> 최대 2분</span> 정도 걸릴 수 있어요.
            </p>
            <p>이 페이지를 떠나 다른 작업을 이어가셔도 괜찮습니다. 완료되면 결과가 <span className="font-semibold text-black">분석 기록</span>에 자동으로 저장돼요.</p>
            <p className="text-neutral-500 text-xs">확인을 누르면 대시보드로 돌아갑니다.</p>
          </div>
        }
        cancelLabel={null}
        confirmLabel="확인 (대시보드로)"
        onConfirm={() => { setStartedOpen(false); router.push('/dashboard') }}
      />
    </div>
  )
}
