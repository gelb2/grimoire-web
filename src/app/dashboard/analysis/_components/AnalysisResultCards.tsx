"use client"

import type { AnalysisResult } from '@/types/api'

/**
 * 분석 결과 카드 3종(consistency/tone/character) 렌더러.
 * 2026-04-24 F4 분리: `/dashboard/analysis` + `/dashboard/analysis/history` 상세 모달에서 공통 사용.
 */

const TYPE_LABELS: Record<string, string> = {
  consistency: '설정 일관성',
  tone: '문체 분석',
  character: '캐릭터 분석',
}

function ScoreBadge({ score }: { score: number }) {
  if (score < 0) {
    return <span className="px-2 py-0.5 rounded text-xs font-bold text-neutral-500 bg-neutral-100">분석 실패</span>
  }
  const color = score >= 80 ? 'text-green-700 bg-green-50' : score >= 60 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{score}점</span>
}

export function AnalysisResultCards({ results }: { results: AnalysisResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-neutral-400">분석 결과가 없습니다.</p>
  }

  return (
    <div className="space-y-6">
      {results.map(result => (
        <div key={result.type} className="border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-black">{TYPE_LABELS[result.type] ?? result.type}</h3>
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
  )
}

export { TYPE_LABELS }
