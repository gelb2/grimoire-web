// 색상 입력 컴포넌트
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
