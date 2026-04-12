"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { downloadCsv } from '@/lib/csv'

const ACTION_COLORS: Record<string, string> = {
  login_success: 'bg-green-900/50 text-green-400',
  login_fail: 'bg-red-900/50 text-red-400',
  register: 'bg-blue-900/50 text-blue-400',
  admin_login_success: 'bg-green-900/50 text-green-400',
  admin_login_fail: 'bg-red-900/50 text-red-400',
  password_change: 'bg-yellow-900/50 text-yellow-400',
}

export function AccessLogsTab() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [ipFilter, setIpFilter] = useState('')

  const load = useCallback(() => {
    api.adminListAccessLogs({ page, limit: 50, action: actionFilter || undefined, ip: ipFilter || undefined })
      .then(d => { setLogs(d.items); setTotal(d.total) }).catch(() => {})
  }, [page, actionFilter, ipFilter])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white">
          <option value="">전체 액션</option>
          <option value="login_success">로그인 성공</option>
          <option value="login_fail">로그인 실패</option>
          <option value="register">회원가입</option>
          <option value="admin_login_success">관리자 로그인</option>
          <option value="admin_login_fail">관리자 로그인 실패</option>
          <option value="password_change">비밀번호 변경</option>
        </select>
        <input value={ipFilter} onChange={e => { setIpFilter(e.target.value); setPage(1) }}
          placeholder="IP 필터..." className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500" />
        <button onClick={() => downloadCsv(logs.map(l => ({
          createdAt: l.createdAt, action: l.action, email: l.email || '',
          ip: l.ip || '', userAgent: l.userAgent || '', detail: l.detail || '',
        })), 'access_logs')} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 hover:text-white">CSV</button>
      </div>

      {logs.length === 0 ? <p className="text-neutral-500 text-sm">로그가 없습니다.</p> : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-left">시각</th>
                <th className="px-4 py-2 text-left">액션</th>
                <th className="px-4 py-2 text-left">이메일</th>
                <th className="px-4 py-2 text-left">IP</th>
                <th className="px-4 py-2 text-left">UA</th>
                <th className="px-4 py-2 text-left">상세</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(log.createdAt).toLocaleString('ko-KR')}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${ACTION_COLORS[log.action] || 'bg-neutral-800 text-neutral-400'}`}>{log.action}</span>
                  </td>
                  <td className="px-4 py-2 text-neutral-400 text-xs">{log.email || '-'}</td>
                  <td className="px-4 py-2 text-neutral-400 text-xs font-mono">{log.ip || '-'}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs max-w-[120px] truncate">{log.userAgent?.slice(0, 30) || '-'}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{log.detail || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30">&larr;</button>
          <span className="px-3 py-1 text-sm text-neutral-400">{page} / {Math.ceil(total / 50)}</span>
          <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-neutral-700 rounded text-sm disabled:opacity-30">&rarr;</button>
        </div>
      )}
    </div>
  )
}
