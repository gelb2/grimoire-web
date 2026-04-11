"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function AnnouncementsTab() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', isPinned: false, target: 'all' })

  const load = useCallback(() => {
    api.adminListAnnouncements().then(d => { setItems(d.items); setTotal(d.total) }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    try { await api.adminCreateAnnouncement(form); setShowForm(false); setForm({ title: '', content: '', isPinned: false, target: 'all' }); load() }
    catch (e: any) { alert(e.message) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('공지를 삭제하시겠습니까?')) return
    try { await api.adminDeleteAnnouncement(id); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <span className="text-sm text-neutral-500">총 {total}건</span>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium">{showForm ? '취소' : '+ 새 공지'}</button>
      </div>

      {showForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 space-y-3">
          <input placeholder="제목" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
          <textarea placeholder="내용" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500 resize-none" />
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-1 text-xs text-neutral-400">
              <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} /> 고정
            </label>
            <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-xs text-white">
              <option value="all">전체</option><option value="authors">작가</option><option value="readers">독자</option>
            </select>
            <button onClick={handleCreate} className="px-4 py-1.5 bg-white text-black text-sm rounded font-medium">작성</button>
          </div>
        </div>
      )}

      {items.length === 0 ? <p className="text-neutral-500 text-sm">공지가 없습니다.</p> : (
        <div className="space-y-3">
          {items.map((a: any) => (
            <div key={a.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-medium">{a.isPinned && <span className="text-yellow-400 mr-1">📌</span>}{a.title}</h3>
                  <p className="text-sm text-neutral-400 mt-1">{a.content.slice(0, 100)}</p>
                  <p className="text-xs text-neutral-600 mt-2">{new Date(a.createdAt).toLocaleDateString('ko-KR')} · {a.target}</p>
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-red-400 text-xs hover:underline shrink-0">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
