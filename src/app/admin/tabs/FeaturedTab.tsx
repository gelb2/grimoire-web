"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function FeaturedTab() {
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ workId: '', section: 'main', position: 0 })

  const load = useCallback(() => {
    api.adminListFeatured().then(setItems).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!form.workId.trim()) return
    try { await api.adminAddFeatured(form); setShowForm(false); setForm({ workId: '', section: 'main', position: 0 }); load() }
    catch (e: any) { alert(e.message) }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('추천을 해제하시겠습니까?')) return
    try { await api.adminRemoveFeatured(id); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <span className="text-sm text-neutral-500">총 {items.length}건</span>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-white text-black text-sm rounded-lg font-medium">{showForm ? '취소' : '+ 추천 추가'}</button>
      </div>

      {showForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 space-y-3">
          <input placeholder="작품 ID" value={form.workId} onChange={e => setForm(f => ({ ...f, workId: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
          <div className="flex gap-3">
            <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white">
              <option value="main">메인</option><option value="genre">장르별</option><option value="new">신작</option>
            </select>
            <input type="number" placeholder="순서" value={form.position} onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))}
              className="w-20 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white" />
            <button onClick={handleAdd} className="px-4 py-2 bg-white text-black text-sm rounded font-medium">추가</button>
          </div>
        </div>
      )}

      {items.length === 0 ? <p className="text-neutral-500 text-sm">추천 작품이 없습니다.</p> : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr><th className="px-4 py-2 text-left">작품 ID</th><th className="px-4 py-2 text-center">섹션</th><th className="px-4 py-2 text-center">순서</th><th className="px-4 py-2 text-left">등록일</th><th className="px-4 py-2 text-center">액션</th></tr>
            </thead>
            <tbody>
              {items.map((f: any) => (
                <tr key={f.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2 text-neutral-400 text-xs font-mono">{f.workId?.slice(0, 12)}</td>
                  <td className="px-4 py-2 text-center"><span className="bg-neutral-800 px-2 py-0.5 rounded text-xs">{f.section}</span></td>
                  <td className="px-4 py-2 text-center text-white">{f.position}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{new Date(f.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-2 text-center"><button onClick={() => handleRemove(f.id)} className="text-red-400 text-xs hover:underline">해제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
