import { api } from "@/lib/api"
import type { AuthorTheme } from "@/features/theme/presets"
import { themePresets } from "@/features/theme/presets"

// 프리셋 선택 모드 화면
export function PresetSelectScreen({ message, onBack, onSelect }: {
  message: string
  onBack: () => void
  onSelect: (preset: AuthorTheme, themeId: string) => void
}) {
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-sm text-neutral-400 hover:text-black mb-6 inline-block">&larr; 돌아가기</button>
        <h1 className="text-2xl font-bold text-black mb-2">프리셋 선택</h1>
        <p className="text-sm text-neutral-500 mb-6">마음에 드는 테마를 골라 바로 사용하세요. 무료입니다.</p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(themePresets).map(([key, preset]) => (
            <button key={key} onClick={async () => {
              try {
                const result = await api.createFromPreset(key)
                onSelect(preset, result.themeId)
              } catch { /* message는 부모에서 관리 */ }
            }}
              className="p-4 rounded-xl border border-neutral-200 text-left hover:border-black transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg border border-neutral-200" style={{ backgroundColor: preset.bgPrimary }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ color: preset.accent }}>
                    <span className="text-xs font-bold">{key[0].toUpperCase()}</span>
                  </div>
                </div>
                <span className="font-medium text-black capitalize">{key}</span>
              </div>
              <div className="flex gap-1">
                {[preset.bgPrimary, preset.accent, preset.textPrimary].map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: c }} />
                ))}
                <span className="text-xs text-neutral-400 ml-1">{preset.tone} · {preset.fontBody}</span>
              </div>
            </button>
          ))}
        </div>
        {message && <p className="text-sm text-neutral-500 mt-4">{message}</p>}
      </div>
    </div>
  )
}
