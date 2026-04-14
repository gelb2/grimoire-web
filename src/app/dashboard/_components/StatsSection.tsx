"use client"

import { ViewChart } from '@/components/ViewChart'

export interface WorkStatsData {
  dates: string[]
  counts: number[]
  totalViews: number
}

interface WorkOption {
  id: string
  title: string
}

interface StatsSectionProps {
  works: WorkOption[]
  selectedWorkId: string
  onSelectWork: (id: string) => void
  statsLoading: boolean
  statsData: WorkStatsData | null
}

export function StatsSection({ works, selectedWorkId, onSelectWork, statsLoading, statsData }: StatsSectionProps) {
  if (works.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-4 flex-1">
          <h2 className="text-2xl font-black text-black">조회수 통계</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        <select
          value={selectedWorkId}
          onChange={(e) => onSelectWork(e.target.value)}
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
  )
}
