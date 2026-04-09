"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import type { AnalysisResult, IndexStatus } from '@/types/api'

interface Work { id: string; slug: string; title: string }

const TYPE_LABELS: Record<string, string> = {
  consistency: '설정 일관성',
  tone: '문체 분석',
  character: '캐릭터 분석',
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-700 bg-green-50' : score >= 60 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{score}점</span>
}

export default function AnalysisPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [works, setWorks] = useState<Work[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [newText, setNewText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['consistency', 'tone', 'character']))

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    if (user) {
      api.getAuthorSpace<{ works: Work[] }>(user.slug)
        .then(data => {
          setWorks(data.works || [])
          if (data.works?.length > 0) setSelectedWorkId(data.works[0].id)
        })
        .catch(() => {})
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!selectedWorkId) return
    api.getAnalysisStatus(selectedWorkId)
      .then(setIndexStatus)
      .catch(() => setIndexStatus(null))
  }, [selectedWorkId])

  const handleAnalyze = async () => {
    if (!selectedWorkId || !newText.trim() || analyzing) return
    if (newText.length < 10) { toast.error('텍스트는 최소 10자 이상이어야 합니다'); return }
    setAnalyzing(true)
    setResults([])
    try {
      const types = Array.from(selectedTypes) as ('consistency' | 'tone' | 'character')[]
      const data = await api.analyzeEpisode(selectedWorkId, newText, types)
      setResults(data)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '분석에 실패했습니다')
    } finally {
      setAnalyzing(false)
    }
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

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-800 transition mb-6 inline-block">&larr; 대시보드</Link>
        <h1 className="text-3xl font-black text-black mb-2">AI 일관성 분석</h1>
        <p className="text-sm text-neutral-500 mb-8">새 에피소드를 기존 작품과 비교하여 설정, 문체, 캐릭터 일관성을 검증합니다.</p>

        {/* 작품 선택 */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">작품 선택</label>
          {works.length === 0 ? (
            <p className="text-sm text-neutral-400">작품이 없습니다. <Link href="/dashboard" className="text-[#e53e3e] underline">대시보드에서 작품을 먼저 만들어주세요.</Link></p>
          ) : (
            <select
              value={selectedWorkId}
              onChange={e => setSelectedWorkId(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black focus:outline-none focus:border-black transition"
            >
              {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          )}
        </div>

        {/* 인덱싱 상태 */}
        {indexStatus && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-neutral-200 bg-[#f5f5f5]">
            <p className="text-sm text-black">
              인덱싱 상태: {indexStatus.isIndexed ? (
                <span className="text-green-700 font-medium">완료 ({indexStatus.chunkCount}개 청크)</span>
              ) : (
                <span className="text-neutral-500">미인덱싱 — 기존 에피소드를 업로드하면 자동 인덱싱됩니다</span>
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

        {/* 텍스트 입력 */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">새 에피소드 텍스트</label>
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            rows={10}
            maxLength={50000}
            placeholder="분석할 에피소드 텍스트를 붙여넣으세요 (10~50,000자)"
            className="w-full px-4 py-3 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black text-sm leading-relaxed focus:outline-none focus:border-black transition resize-none"
          />
          <p className="text-neutral-400 text-xs mt-1 text-right">{newText.length.toLocaleString()}/50,000</p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing || !selectedWorkId || newText.length < 10}
          className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition mb-8"
        >
          {analyzing ? '분석 중... (최대 1분 소요)' : '분석 시작'}
        </button>

        {/* 결과 */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-4">
              <h2 className="text-2xl font-black text-black">분석 결과</h2>
              <div className="flex-1 h-px bg-black" />
            </div>

            {results.map(result => (
              <div key={result.type} className="border border-neutral-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-black">{TYPE_LABELS[result.type]}</h3>
                  <ScoreBadge score={result.score} />
                </div>

                <p className="text-sm text-neutral-700 mb-4">{result.summary}</p>

                {result.issues.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">발견된 문제</p>
                    <ul className="space-y-1">
                      {result.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-red-700 pl-3 border-l-2 border-red-200">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.suggestions.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">제안</p>
                    <ul className="space-y-1">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-neutral-600 pl-3 border-l-2 border-neutral-200">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
