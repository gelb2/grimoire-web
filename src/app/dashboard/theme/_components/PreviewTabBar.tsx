import type { PreviewTab } from "@/stores/useThemeEditorStore"

// 미리보기 탭 바
export function PreviewTabBar({ current, onTabChange }: { current: PreviewTab; onTabChange: (tab: PreviewTab) => void }) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      {([["authorSpace", "작가공간"], ["episode", "에피소드"]] as const).map(([tab, label]) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${current === tab ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
