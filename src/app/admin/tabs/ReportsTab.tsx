"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  approved: 'bg-green-900/50 text-green-400',
  rejected: 'bg-neutral-800 text-neutral-400',
}

export function ReportsTab() {
  const [reports, setReports] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')

  const load = useCallback(() => {
    api.adminListReports({ page, status: statusFilter || undefined })
      .then(d => { setReports(d.items); setTotal(d.total) }).catch(() => {})
  }, [page, statusFilter])
  useEffect(() => { load() }, [load])

  const handleResolve = async (id: string, action: 'approved' | 'rejected') => {
    const label = action === 'approved' ? '승인 (콘텐츠 삭제/비공개)' : '기각'
    if (!confirm(`신고를 ${label} 처리하시겠습니까?`)) return
    try { await api.adminResolveReport(id, action); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white mb-4">
        <option value="pending">미처리</option>
        <option value="approved">승인됨</option>
        <option value="rejected">기각됨</option>
        <option value="">전체</option>
      </select>

      {reports.length === 0 ? <p className="text-neutral-500 text-sm">신고가 없습니다.</p> : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-left">대상</th>
                <th className="px-4 py-2 text-left">사유</th>
                <th className="px-4 py-2 text-left">신고자</th>
                <th className="px-4 py-2 text-center">상태</th>
                <th className="px-4 py-2 text-left">접수일</th>
                <th className="px-4 py-2 text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => (
                <tr key={r.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2 text-white text-xs">{r.targetType} <span className="text-neutral-500 font-mono">{r.targetId?.slice(0, 8)}</span></td>
                  <td className="px-4 py-2 text-neutral-400">{r.reason} {r.detail && <span className="text-neutral-600">— {r.detail}</span>}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs font-mono">{r.reporterId?.slice(0, 8) || '익명'}</td>
                  <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span></td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-2 text-center">
                    {r.status === 'pending' && (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleResolve(r.id, 'approved')} className="text-red-400 text-xs hover:underline">승인</button>
                        <button onClick={() => handleResolve(r.id, 'rejected')} className="text-neutral-500 text-xs hover:underline">기각</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30">&larr;</button>
          <span className="px-3 py-1 text-sm text-neutral-400">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30">&rarr;</button>
        </div>
      )}
    </div>
  )
}
