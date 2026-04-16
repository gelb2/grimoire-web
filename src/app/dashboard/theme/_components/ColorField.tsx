// 색상 입력 컴포넌트 — Color Picker + Hex 텍스트 입력
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer shrink-0" />
      <input
        type="text"
        value={value}
        onChange={e => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
        }}
        onBlur={e => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
        }}
        className="w-20 px-1.5 py-0.5 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:border-gray-900"
        maxLength={7}
      />
      <span className="text-xs text-gray-500 truncate">{label}</span>
    </div>
  )
}
