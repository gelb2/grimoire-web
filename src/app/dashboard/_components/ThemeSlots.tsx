"use client"

import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'

interface PresetItem {
  name: string
  label: string
  tone: string
  genre: string
  preview: { bgPrimary: string; accent: string; textPrimary: string }
}

interface SlotInfoData {
  plan: string
  slotLimit: number
  slottedCount: number
  isExpired: boolean
  themes: any[]
}

interface ThemeSlotsProps {
  userSlug: string
  slotInfo: SlotInfoData
  showPresetPicker: boolean
  presets: PresetItem[]
  creatingPreset: string | null
  onOpenPresetPicker: () => void
  onClosePresetPicker: () => void
  onCreateFromPreset: (presetName: string) => void
  onReloadSlotInfo: () => void
}

export function ThemeSlots({
  userSlug,
  slotInfo,
  showPresetPicker,
  presets,
  creatingPreset,
  onOpenPresetPicker,
  onClosePresetPicker,
  onCreateFromPreset,
  onReloadSlotInfo,
}: ThemeSlotsProps) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-4 flex-1">
          <h2 className="text-2xl font-black text-black">내 테마</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        <button onClick={onOpenPresetPicker} className="text-sm text-[#e53e3e] hover:underline ml-4">+ 새 테마</button>
      </div>
      <p className="text-xs text-neutral-400 mb-4 uppercase tracking-widest">
        {slotInfo.plan} · 슬롯 {slotInfo.slottedCount} / {slotInfo.slotLimit == null ? '∞' : slotInfo.slotLimit}
        {slotInfo.isExpired && <span className="text-red-500 ml-2">만료됨</span>}
      </p>

      {/* 프리셋 선택 패널 */}
      {showPresetPicker && (
        <div className="mb-6 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-black">테마 만들기</h3>
            <button onClick={onClosePresetPicker} className="text-xs text-neutral-400 hover:text-black">닫기</button>
          </div>
          <div className="flex gap-2 mb-4">
            <Link href="/dashboard/theme" className="px-3 py-1.5 text-xs rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-50">AI로 생성 (1 크레딧)</Link>
            <Link href="/dashboard/theme" className="px-3 py-1.5 text-xs rounded border border-neutral-200 text-neutral-700 hover:bg-neutral-50">직접 만들기</Link>
          </div>
          <p className="text-xs text-neutral-500 mb-2">시스템 프리셋 (무료)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => onCreateFromPreset(p.name)}
                disabled={creatingPreset !== null || slotInfo.isExpired}
                className="group flex flex-col items-start p-3 rounded-lg border border-neutral-200 hover:border-neutral-400 transition text-left disabled:opacity-50"
              >
                <div className="flex gap-1 mb-2">
                  <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.preview.bgPrimary }} />
                  <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.preview.accent }} />
                  <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: p.preview.textPrimary }} />
                </div>
                <span className="text-xs font-bold text-black">{p.label}</span>
                <span className="text-[10px] text-neutral-400">{p.genre}</span>
                {creatingPreset === p.name && <span className="text-[10px] text-blue-500 mt-1">생성 중...</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {slotInfo.themes.length === 0 && !showPresetPicker ? (
        <div className="text-center py-8 border-b border-neutral-200">
          <p className="text-sm text-neutral-400 mb-3">아직 테마가 없습니다</p>
          <button onClick={onOpenPresetPicker} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition">프리셋에서 선택하기</button>
        </div>
      ) : (
        slotInfo.themes.map((t: any, i: number) => (
          <div key={t.id} className="grid grid-cols-[50px_1fr_auto] items-center gap-4 py-3 border-b border-neutral-200">
            <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <span className="text-sm font-bold text-black">{t.name}</span>
              <span className="ml-2 text-xs text-neutral-400">{t.source === 'ai' ? 'AI 생성' : t.source === 'system' ? '시스템' : '직접 편집'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    if (t.isSlotted) await api.removeThemeSlot(t.id)
                    else await api.assignThemeSlot(t.id)
                    onReloadSlotInfo()
                  } catch (e: any) { toast.error(e.message || '슬롯 변경 실패') }
                }}
                disabled={slotInfo.isExpired}
                className={`px-2 py-0.5 text-xs rounded ${t.isSlotted ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
              >
                {t.isSlotted ? '활성' : '보관'}
              </button>
              <Link href={`/dashboard/theme?id=${t.id}`} className="px-2 py-0.5 text-xs rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                편집
              </Link>
              {t.isSlotted && (
                <button
                  onClick={async () => {
                    try {
                      await api.activateTheme(t.id)
                      await api.publishTheme(userSlug)
                      onReloadSlotInfo()
                      toast.success('기본 테마로 적용됨')
                    } catch (e: any) { toast.error(e.message || '적용 실패') }
                  }}
                  disabled={slotInfo.isExpired}
                  className="px-2 py-0.5 text-xs rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                >
                  기본 적용
                </button>
              )}
              {!t.isSlotted && t.source !== 'system' && (
                <button
                  onClick={async () => {
                    if (!confirm(`"${t.name}" 테마를 삭제하시겠습니까?`)) return
                    try {
                      await api.deleteTheme(t.id)
                      onReloadSlotInfo()
                      toast.success('테마가 삭제됐습니다')
                    } catch (e: any) { toast.error(e.message || '삭제 실패') }
                  }}
                  className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-500 hover:bg-red-100"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </section>
  )
}
