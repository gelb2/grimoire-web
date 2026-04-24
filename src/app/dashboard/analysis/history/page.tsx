"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { AnalysisResultCards, TYPE_LABELS } from '../_components/AnalysisResultCards'
import type { AnalysisReport, AnalysisReportSummary } from '@/types/api'

/**
 * 분석 기록(히스토리) 화면 — 2026-04-24 F4
 * - 서버 `GET /analysis/reports` → 리스트
 * - 항목 클릭 → 모달에서 `GET /analysis/reports/:id` 상세 로드
 * - 결과 렌더링은 `AnalysisResultCards` 재사용
 */
export default function AnalysisHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<AnalysisReportSummary[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [detail, setDetail] = useState<AnalysisReport | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  const reload = useCallback(() => {
    setListLoading(true)
    api.getAnalysisReports()
      .then(setItems)
      .catch(() => toast.error('분석 기록을 불러오지 못했습니다'))
      .finally(() => setListLoading(false))
  }, [])

  useEffect(() => { if (user) reload() }, [user, reload])

  const openDetail = async (id: string) => {
    setModalOpen(true)
    setDetail(null)
    setDetailLoading(true)
    try {
      const report = await api.getAnalysisReport(id)
      setDetail(report)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '리포트를 불러오지 못했습니다')
      setModalOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    setDetail(null)
  }

  // ESC로 모달 닫기
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/dashboard/analysis" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; AI 일관성 분석</Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-black text-black">분석 기록</h1>
          <Link
            href="/dashboard/analysis"
            className="text-sm font-medium bg-black text-white px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition whitespace-nowrap"
          >
            + 새 분석 실행
          </Link>
        </div>
        <p className="text-sm text-neutral-500 mb-8">
          여태까지 실행한 AI 일관성 분석 결과를 언제든 다시 열람할 수 있어요. 항목을 눌러 상세 결과를 확인하세요.
        </p>

        {listLoading ? (
          <p className="text-sm text-neutral-400">불러오는 중...</p>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-500 mb-4">아직 분석 기록이 없어요.</p>
            <Link href="/dashboard/analysis" className="inline-block text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition">
              첫 분석 시작하기
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {items.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openDetail(item.id)}
                  className="w-full text-left py-4 hover:bg-[#f9f9f9] transition px-2"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-400 mb-0.5">{item.workTitle}</p>
                      <p className="text-base font-bold text-black truncate">{item.episodeTitle}</p>
                    </div>
                    <time className="text-xs text-neutral-400 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </time>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.scores.map(s => (
                      <span
                        key={s.type}
                        className={`text-[11px] px-2 py-0.5 rounded border ${scoreColor(s.score)}`}
                      >
                        {TYPE_LABELS[s.type] ?? s.type} {s.score < 0 ? '실패' : `${s.score}점`}
                      </span>
                    ))}
                    <span className="text-[11px] text-neutral-400 ml-auto">
                      {item.creditsCharged} 크레딧
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* 상세 모달 */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-10 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white border border-neutral-200 rounded-xl max-w-3xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-neutral-200">
              <div className="min-w-0">
                <p className="text-xs text-neutral-400 mb-1">
                  {detail ? detail.workTitle : '불러오는 중...'}
                </p>
                <h2 className="text-xl font-black text-black truncate">
                  {detail?.episodeTitle ?? ' '}
                </h2>
                {detail && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {formatDate(detail.createdAt)} · {detail.creditsCharged} 크레딧 차감
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="닫기"
                className="text-neutral-400 hover:text-black transition text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              {detailLoading && <p className="text-sm text-neutral-400">리포트를 불러오는 중...</p>}
              {detail && <AnalysisResultCards results={detail.results} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function scoreColor(score: number): string {
  if (score < 0) return 'border-neutral-300 text-neutral-500 bg-neutral-50'
  if (score >= 80) return 'border-green-200 text-green-700 bg-green-50'
  if (score >= 60) return 'border-yellow-200 text-yellow-700 bg-yellow-50'
  return 'border-red-200 text-red-700 bg-red-50'
}
