"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { downloadCsv } from '@/lib/csv'

export function PaymentsTab() {
  const [payments, setPayments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(() => {
    api.adminListPayments({ page, limit: 20, status: statusFilter || undefined })
      .then(d => { setPayments(d.items); setTotal(d.total) }).catch(() => {})
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const statusColor = (s: string) =>
    s === 'completed' ? 'bg-green-900/50 text-green-400' :
    s === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
    s === 'refunded' ? 'bg-blue-900/50 text-blue-400' :
    'bg-red-900/50 text-red-400'

  return (
    <div>
      <div className="flex gap-2 mb-4">
      <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white">
        <option value="">전체 상태</option>
        <option value="completed">완료</option>
        <option value="pending">대기</option>
        <option value="failed">실패</option>
        <option value="refunded">환불</option>
      </select>
      <button onClick={() => downloadCsv(payments.map(p => ({
        authorId: p.authorId, productId: p.productId, amount: p.amount,
        credits: p.credits, status: p.status, createdAt: p.createdAt, completedAt: p.completedAt || '',
      })), 'payments')} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 hover:text-white">CSV 내보내기</button>
      </div>

      {payments.length === 0 ? <p className="text-neutral-500 text-sm">결제 내역이 없습니다.</p> : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-left">작가 ID</th>
                <th className="px-4 py-2 text-left">상품</th>
                <th className="px-4 py-2 text-center">금액</th>
                <th className="px-4 py-2 text-center">포인트</th>
                <th className="px-4 py-2 text-center">상태</th>
                <th className="px-4 py-2 text-left">생성일</th>
                <th className="px-4 py-2 text-left">완료일</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2 text-neutral-400 text-xs font-mono">{p.authorId?.slice(0, 8)}</td>
                  <td className="px-4 py-2 text-white">{p.productId}</td>
                  <td className="px-4 py-2 text-center text-white">{p.amount?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">{p.credits?.toLocaleString('ko-KR')}</td>
                  <td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 rounded text-xs ${statusColor(p.status)}`}>{p.status}</span></td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{p.completedAt ? new Date(p.completedAt).toLocaleDateString('ko-KR') : '-'}</td>
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
