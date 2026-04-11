"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

const TYPE_LABELS: Record<string, string> = {
  warning: '경고', suspend_1d: '1일 정지', suspend_7d: '7일 정지', suspend_30d: '30일 정지', permanent: '영구 정지',
}
const REASON_OPTIONS = ['욕설', '스팸', '저작권', '기타']

export function SanctionsTab() {
  const [sanctions, setSanctions] = useState<any[]>([])
  const [authorId, setAuthorId] = useState('')
  const [form, setForm] = useState({ authorId: '', type: 'warning', reason: '기타', detail: '' })
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    api.adminListSanctions(authorId || undefined).then(setSanctions).catch(() => {})
  }, [authorId])
  useEffect(() => { load() }, [load])

  const handleSanction = async () => {
    if (!form.authorId) return
    try { await api.adminSanctionUser(form); setShowForm(false); setForm(f => ({ ...f, authorId: '', detail: '' })); load() }
    catch (e: any) { alert(e.message) }
  }

  const handleLift = async (id: string) => {
    if (!confirm('제재를 해제하시겠습니까?')) return
    try { await api.adminLiftSanction(id); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={authorId} onChange={e => setAuthorId(e.target.value)} placeholder="작가 ID로 필터..."
          className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500" />
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-red-700 text-white text-sm rounded-lg">{showForm ? '취소' : '+ 제재'}</button>
      </div>

      {showForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 space-y-3">
          <input placeholder="작가 ID" value={form.authorId} onChange={e => setForm(f => ({ ...f, authorId: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white">
              {REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <input placeholder="상세 사유 (선택)" value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white placeholder-neutral-500" />
          <button onClick={handleSanction} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg">제재 적용</button>
        </div>
      )}

      {sanctions.length === 0 ? <p className="text-neutral-500 text-sm">제재 기록이 없습니다.</p> : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-neutral-500">
              <tr><th className="px-4 py-2 text-left">작가</th><th className="px-4 py-2 text-left">유형</th><th className="px-4 py-2 text-left">사유</th><th className="px-4 py-2 text-left">해제일</th><th className="px-4 py-2 text-center">상태</th><th className="px-4 py-2 text-center">액션</th></tr>
            </thead>
            <tbody>
              {sanctions.map((s: any) => (
                <tr key={s.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2 text-neutral-400 text-xs font-mono">{s.authorId?.slice(0, 8)}</td>
                  <td className="px-4 py-2"><span className="bg-red-900/50 text-red-400 px-2 py-0.5 rounded text-xs">{TYPE_LABELS[s.type] || s.type}</span></td>
                  <td className="px-4 py-2 text-neutral-400">{s.reason} {s.detail && <span className="text-neutral-600">— {s.detail}</span>}</td>
                  <td className="px-4 py-2 text-neutral-500 text-xs">{s.endAt ? new Date(s.endAt).toLocaleDateString('ko-KR') : '영구'}</td>
                  <td className="px-4 py-2 text-center">{s.isActive ? <span className="text-red-400 text-xs">활성</span> : <span className="text-neutral-600 text-xs">해제</span>}</td>
                  <td className="px-4 py-2 text-center">{s.isActive && <button onClick={() => handleLift(s.id)} className="text-green-400 text-xs hover:underline">해제</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
