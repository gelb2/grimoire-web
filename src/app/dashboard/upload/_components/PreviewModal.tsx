"use client"

import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { EpisodeViewer } from '@/features/reader/ui/EpisodeViewer'
import type { AuthorTheme } from '@/features/theme/presets'
import type { Theme } from '@/types/api'

interface PreviewModalProps {
  title: string
  preview: any[]
  authorName: string
  activeTheme: AuthorTheme
  themes: Theme[]
  presets: { name: string; label: string; overrides: Record<string, unknown> }[]
  selectedType: 'none' | 'theme' | 'preset'
  selectedThemeId: string
  onThemeChange: (type: 'none' | 'theme' | 'preset', id: string) => void
  onClose: () => void
}

// 풀스크린 미리보기 모달
export function PreviewModal({
  title, preview, authorName, activeTheme,
  themes, presets, selectedType, selectedThemeId,
  onThemeChange, onClose,
}: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-neutral-400 text-xs uppercase tracking-widest">미리보기</span>
          <select
            value={`${selectedType}:${selectedThemeId}`}
            onChange={e => {
              const [type, id] = e.target.value.split(':') as ['none' | 'theme' | 'preset', string]
              onThemeChange(type, id || '')
            }}
            className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none"
          >
            <option value="none:">테마 미적용</option>
            {presets.length > 0 && <optgroup label="프리셋">
              {presets.map(p => (
                <option key={p.name} value={`preset:${p.name}`}>{p.label}</option>
              ))}
            </optgroup>}
            {themes.length > 0 && <optgroup label="내 테마">
              {themes.map(t => (
                <option key={t.id} value={`theme:${t.id}`}>{t.name}{t.isSlotted ? ' ★' : ''}</option>
              ))}
            </optgroup>}
          </select>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white transition text-sm px-3 py-1.5 border border-neutral-700 rounded"
        >
          닫기
        </button>
      </div>

      {/* 본문 — ThemeProvider + EpisodeViewer (선택한 테마의 animation 그대로 반영) */}
      <div className="flex-1 overflow-y-auto">
        <ThemeProvider theme={activeTheme}>
          <EpisodeViewer
            key={`${selectedType}:${selectedThemeId}`}
            meta={{
              slug: 'preview',
              type: 'episode',
              num: '01',
              title: title || '제목 없음',
            }}
            data={{
              slug: 'preview',
              title: title || '제목 없음',
              blocks: preview,
            }}
            authorName={authorName}
          />
        </ThemeProvider>
      </div>
    </div>
  )
}
