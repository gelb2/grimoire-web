"use client"
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export function ThemesTab() {
  const [themes, setThemes] = useState<any[]>([])

  const load = useCallback(() => {
    api.adminListSystemThemes().then(setThemes).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`시스템 테마 "${name}"을 삭제하시겠습니까?`)) return
    try { await api.adminDeleteSystemTheme(id); load() } catch (e: any) { alert(e.message) }
  }

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-4">시스템 프리셋 테마 목록 (source: system, authorId: null)</p>

      {themes.length === 0 ? <p className="text-neutral-500 text-sm">시스템 테마가 없습니다.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((t: any) => {
            const o = t.overrides || {}
            return (
              <div key={t.id} className="border border-neutral-800 rounded-xl p-4 flex gap-4">
                {/* 프리뷰 */}
                <div className="w-16 h-16 rounded-lg shrink-0 border border-neutral-700 flex items-center justify-center"
                  style={{ backgroundColor: o.bgPrimary || '#111' }}>
                  <span style={{ color: o.accent || '#888' }} className="text-lg font-bold">{t.name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium">{t.name}</h3>
                  <p className="text-xs text-neutral-500">preset: {t.preset} · {o.tone || 'dark'} · {o.fontBody || 'serif'}</p>
                  <div className="flex gap-1 mt-2">
                    {[o.bgPrimary, o.accent, o.textPrimary].filter(Boolean).map((c: string, i: number) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-neutral-600" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
                <button onClick={() => handleDelete(t.id, t.name)} className="text-red-400 text-xs hover:underline shrink-0 self-start">삭제</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
