"use client"
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { downloadCsv } from '@/lib/csv'

export function CommentsTab() {
  const [comments, setComments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    api.adminListComments({ page, limit: 20, q: query || undefined })
      .then(d => { setComments(d.items); setTotal(d.total); setSelected(new Set()) }).catch(() => {})
  }, [page, query])

  useEffect(() => { load() }, [load])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === comments.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(comments.map(c => c.id)))
    }
  }

  const handleDelete = async (id: string, content: string) => {
    if (!confirm(`댓글을 삭제하시겠습니까?\n"${content.slice(0, 50)}..."`)) return
    try { await api.adminDeleteComment(id); load() } catch (e: any) { toast.error(e.message) }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`선택한 ${selected.size}개 댓글을 삭제하시겠습니까?`)) return
    let success = 0
    for (const id of selected) {
      try { await api.adminDeleteComment(id); success++ } catch { /* skip */ }
    }
    toast.success(`${success}개 댓글 삭제 완료`)
    load()
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
          placeholder="댓글 내용 검색..." className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500" />
        <button onClick={() => downloadCsv(comments.map(c => ({
          content: c.content, nickname: c.nickname || '', authorId: c.authorId || '',
          ipAddress: c.ipAddress || '', createdAt: c.createdAt,
        })), 'comments')} className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 hover:text-white">CSV</button>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-400 hover:text-red-300">
            {selected.size}개 삭제
          </button>
        )}
      </div>

      {comments.length === 0 ? <p className="text-neutral-500 text-sm">댓글이 없습니다.</p> : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr>
                <th className="px-4 py-2 text-center w-8">
                  <input type="checkbox" checked={selected.size === comments.length && comments.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-4 py-2 text-left">내용</th>
                <th className="px-4 py-2 text-left">작성자</th>
                <th className="px-4 py-2 text-left">IP</th>
                <th className="px-4 py-2 text-left">작성일</th>
                <th className="px-4 py-2 text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c.id} className={`border-t border-neutral-800 ${selected.has(c.id) ? 'bg-neutral-800/50' : ''}`}>
                  <td className="px-4 py-2 text-center">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="px-4 py-2 text-white max-w-xs truncate">
                    {c.parentId && <span className="text-neutral-600 mr-1">↳</span>}
                    {c.content?.slice(0, 60)}
                  </td>
                  <td className="px-4 py-2 text-neutral-400">{c.nickname || c.authorId?.slice(0, 8) || '-'}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs font-mono">{c.ipAddress || '-'}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => handleDelete(c.id, c.content)} className="text-red-400 text-xs hover:underline">삭제</button>
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
