"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function WorksTab() {
  const [works, setWorks] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)

  const load = useCallback(() => {
    api.adminListWorks({ page, limit: 20, q: query || undefined })
      .then(d => { setWorks(d.items); setTotal(d.total) }).catch(() => {})
  }, [page, query])

  useEffect(() => { load() }, [load])

  const toggleExpand = async (workId: string) => {
    if (expanded === workId) { setExpanded(null); setDetail(null); return }
    setExpanded(workId)
    try { setDetail(await api.adminGetWorkDetail(workId)) } catch { setDetail(null) }
  }

  const changeStatus = async (workId: string, episodeId: string, status: string) => {
    try {
      await api.adminChangeEpisodeStatus(workId, episodeId, status)
      setDetail(await api.adminGetWorkDetail(workId))
    } catch (e: any) { alert(e.message) }
  }

  const statusColor = (s: string) => s === 'public' ? 'bg-green-900/50 text-green-400' : s === 'nonPublic' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-neutral-800 text-neutral-400'

  return (
    <div>
      <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
        placeholder="작품명 검색..." className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 mb-4" />

      <div className="border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-500">
            <tr>
              <th className="px-4 py-2 text-left">작품명</th>
              <th className="px-4 py-2 text-left">작가</th>
              <th className="px-4 py-2 text-center">에피소드</th>
              <th className="px-4 py-2 text-center">조회수</th>
              <th className="px-4 py-2 text-left">생성일</th>
            </tr>
          </thead>
          <tbody>
            {works.map(w => (
              <tr key={w.id} onClick={() => toggleExpand(w.id)}
                className={`border-t border-neutral-800 cursor-pointer hover:bg-neutral-900/50 ${expanded === w.id ? 'bg-neutral-900' : ''}`}>
                <td className="px-4 py-2 font-medium text-white">{w.title}</td>
                <td className="px-4 py-2 text-neutral-400">{w.authorName} <span className="text-xs">@{w.authorSlug}</span></td>
                <td className="px-4 py-2 text-center">{w.episodeCount}</td>
                <td className="px-4 py-2 text-center">{w.viewCount.toLocaleString()}</td>
                <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(w.createdAt).toLocaleDateString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 에피소드 상세 (확장) */}
      {expanded && detail?.episodes && (
        <div className="mt-2 border border-neutral-700 rounded-xl bg-neutral-900 p-4">
          <h3 className="text-sm font-medium mb-3 text-neutral-300">{detail.title} — 에피소드 ({detail.episodes.length})</h3>
          <table className="w-full text-sm">
            <thead className="text-neutral-500">
              <tr><th className="text-left px-2 py-1">제목</th><th className="text-center px-2 py-1">상태</th><th className="text-center px-2 py-1">조회수</th></tr>
            </thead>
            <tbody>
              {detail.episodes.map((ep: any) => (
                <tr key={ep.id} className="border-t border-neutral-800">
                  <td className="px-2 py-1 text-white">{ep.title}</td>
                  <td className="px-2 py-1 text-center">
                    <select value={ep.status}
                      onChange={e => changeStatus(detail.id, ep.id, e.target.value)}
                      className={`px-2 py-0.5 rounded text-xs border-0 ${statusColor(ep.status)}`}>
                      <option value="upload">업로드</option>
                      <option value="public">공개</option>
                      <option value="nonPublic">비공개</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center text-neutral-400">{ep.viewCount}</td>
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
