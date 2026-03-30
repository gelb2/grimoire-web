"use client"

import { useMemo } from 'react'

interface ViewChartProps {
  dates: string[]
  counts: number[]
  totalViews: number
}

/** 순수 SVG 기반 일별 조회수 차트 — 라이트 에디토리얼 테마 */
export function ViewChart({ dates, counts, totalViews }: ViewChartProps) {
  const { pathD, areaD, avgCount, trend, points } = useMemo(() => {
    if (counts.length === 0) {
      return { pathD: '', areaD: '', maxCount: 0, avgCount: 0, trend: 0, points: [] }
    }

    const max = Math.max(...counts, 1)
    const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length)

    const recent7 = counts.slice(-7)
    const prev7 = counts.slice(-14, -7)
    const recentAvg = recent7.reduce((a, b) => a + b, 0) / recent7.length
    const prevAvg = prev7.length > 0 ? prev7.reduce((a, b) => a + b, 0) / prev7.length : recentAvg
    const trendPct = prevAvg > 0 ? Math.round(((recentAvg - prevAvg) / prevAvg) * 100) : 0

    const chartW = 600
    const chartH = 200
    const padding = 2

    const pts = counts.map((c, i) => ({
      x: (i / (counts.length - 1)) * (chartW - padding * 2) + padding,
      y: chartH - (c / max) * (chartH - padding * 2) - padding,
    }))

    let line = `M ${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3
      line += ` C ${cp1x},${pts[i - 1].y} ${cp2x},${pts[i].y} ${pts[i].x},${pts[i].y}`
    }

    const area = `${line} L ${pts[pts.length - 1].x},${chartH} L ${pts[0].x},${chartH} Z`

    return { pathD: line, areaD: area, maxCount: max, avgCount: avg, trend: trendPct, points: pts }
  }, [counts])

  if (counts.length === 0) {
    return <div className="text-center py-8 text-neutral-400 text-sm">조회수 데이터가 없습니다</div>
  }

  return (
    <div>
      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-neutral-200 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">총 조회수 (30일)</p>
          <p className="text-lg font-black text-black">{totalViews.toLocaleString()}</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">일평균</p>
          <p className="text-lg font-black text-black">{avgCount.toLocaleString()}</p>
        </div>
        <div className="border border-neutral-200 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">주간 추세</p>
          <p className={`text-lg font-black ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-platform-accent' : 'text-neutral-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </p>
        </div>
      </div>

      {/* SVG 차트 */}
      <div className="border border-neutral-200 rounded-lg p-4">
        <svg viewBox="0 0 600 200" className="w-full h-auto" preserveAspectRatio="none">
          {/* 그리드 라인 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1="0" y1={200 - ratio * 196 - 2} x2="600" y2={200 - ratio * 196 - 2}
              stroke="#e5e5e5" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}

          {/* 면적 그라데이션 */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#areaGrad)" />

          {/* 라인 */}
          <path d={pathD} fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />

          {/* 데이터 포인트 */}
          {points.length > 0 && (
            <>
              <circle cx={points[0].x} cy={points[0].y} r="3" fill="#000000" />
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#e53e3e" />
            </>
          )}
        </svg>

        <div className="flex justify-between mt-2 text-xs text-neutral-400">
          <span>{dates[0]}</span>
          <span>{dates[Math.floor(dates.length / 2)]}</span>
          <span>{dates[dates.length - 1]}</span>
        </div>
      </div>
    </div>
  )
}
