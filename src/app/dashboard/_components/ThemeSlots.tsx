"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const defaultThemeId = (slotInfo as any).defaultThemeId as string | null | undefined
  // id asc 안정 정렬 — 슬롯 토글/편집 시에도 순서가 출렁이지 않도록 고정 (서버 변경에 대한 이중 방어)
  const sortedThemes = [...slotInfo.themes].sort((a, b) => String(a.id).localeCompare(String(b.id)))

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-4 flex-1">
          <h2 className="text-2xl font-black text-black">내 테마</h2>
          <div className="flex-1 h-px bg-black" />
        </div>
        <div className="flex items-center gap-3 ml-4">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs text-neutral-500 hover:text-black flex items-center gap-1"
            aria-label="테마 상태 설명"
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-neutral-400 text-[10px] leading-none">?</span>
            <span>상태 설명</span>
          </button>
          <button onClick={onOpenPresetPicker} className="text-sm text-[#e53e3e] hover:underline">+ 새 테마</button>
        </div>
      </div>
      <p className="text-xs text-neutral-400 mb-2 uppercase tracking-widest">
        {slotInfo.plan} · 슬롯 {slotInfo.slottedCount} / {slotInfo.slotLimit == null ? '∞' : slotInfo.slotLimit}
        {slotInfo.isExpired && <span className="text-red-500 ml-2">만료됨</span>}
      </p>

      {showHelp && (
        <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600 leading-relaxed space-y-1">
          <p><span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold mr-1">활성</span> 슬롯에 담긴 테마. 즉시 작가 공간에 전환할 수 있는 후보.</p>
          <p><span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold mr-1">기본</span> 현재 작가 공간에 실제로 보여지는 테마(기본 적용 완료).</p>
          <p><span className="inline-block px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600 font-bold mr-1">보관</span> 슬롯에서 뺀 테마. 설정은 저장되어 있지만 즉시 전환은 불가.</p>
          <p className="pt-1 text-neutral-400">※ 테마 목록은 항상 같은 순서로 고정되어 표시됩니다. 상태를 바꿔도 순서는 변하지 않습니다.</p>
        </div>
      )}

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

      {sortedThemes.length === 0 && !showPresetPicker ? (
        <div className="text-center py-8 border-b border-neutral-200">
          <p className="text-sm text-neutral-400 mb-3">아직 테마가 없습니다</p>
          <button onClick={onOpenPresetPicker} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition">프리셋에서 선택하기</button>
        </div>
      ) : (
        sortedThemes.map((t: any, i: number) => {
          const isDefault = defaultThemeId === t.id
          return (
            <div
              key={t.id}
              className={`grid grid-cols-[50px_1fr_auto] items-center gap-4 py-3 border-b border-neutral-200 ${
                isDefault ? 'bg-indigo-50/60 -mx-2 px-2 rounded-sm border-l-2 border-l-indigo-500' : ''
              }`}
            >
              <span className="text-sm font-mono text-neutral-300">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <span className="text-sm font-bold text-black">{t.name}</span>
                {isDefault && <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-indigo-100 text-indigo-700 font-bold">기본 · 현재 적용 중</span>}
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
                  disabled={slotInfo.isExpired || isDefault}
                  title={isDefault ? '현재 기본 테마는 보관할 수 없습니다' : undefined}
                  className={`px-2 py-0.5 text-xs rounded disabled:opacity-50 ${t.isSlotted ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}
                >
                  {t.isSlotted ? '활성' : '보관'}
                </button>
                <Link href={`/dashboard/theme?id=${t.id}`} className="px-2 py-0.5 text-xs rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  편집
                </Link>
                {isDefault ? (
                  <span className="px-2 py-0.5 text-xs rounded bg-indigo-100 text-indigo-700 opacity-70 cursor-default">
                    적용됨
                  </span>
                ) : t.isSlotted && (
                  <button
                    onClick={async () => {
                      try {
                        await api.activateTheme(t.id)
                        await api.publishTheme(userSlug)
                        onReloadSlotInfo()
                        // 작가공간 SSR 캐시를 강제로 재검증 — 플리커 방지
                        router.refresh()
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
          )
        })
      )}
    </section>
  )
}
