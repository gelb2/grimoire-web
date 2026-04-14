// 테마 생성 방식 선택 화면
export function ThemeCreateModeSelector({ onSelectAI, onSelectPreset }: { onSelectAI: () => void; onSelectPreset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 text-center mb-3">CREATE YOUR THEME</p>
        <h1 className="text-3xl font-light text-black text-center mb-2">테마 만들기</h1>
        <p className="text-sm text-neutral-500 text-center mb-10">작가공간의 분위기를 만들어보세요</p>

        <div className="space-y-4">
          {/* AI 구술 — 1 크레딧 */}
          <button onClick={onSelectAI}
            className="w-full p-6 rounded-xl border-2 border-black bg-white text-left hover:bg-neutral-50 transition group">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-black">AI로 생성하기</h2>
              <span className="text-xs bg-black text-white px-2 py-0.5 rounded">1 크레딧</span>
            </div>
            <p className="text-sm text-neutral-500">분위기를 텍스트로 설명하면 AI가 맞춤 테마를 만들어줍니다</p>
            <p className="text-xs text-neutral-400 mt-2">&quot;어둡고 묵직한 A24 감성으로 해줘&quot;</p>
          </button>

          {/* 프리셋 선택 — 무료 */}
          <button onClick={onSelectPreset}
            className="w-full p-6 rounded-xl border border-neutral-200 bg-neutral-50 text-left hover:bg-neutral-100 transition group">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-black">프리셋에서 고르기</h2>
              <span className="text-xs bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded">무료</span>
            </div>
            <p className="text-sm text-neutral-500">미리 준비된 테마 중에서 골라 바로 사용합니다</p>
            <p className="text-xs text-neutral-400 mt-2">미드나잇, 파치먼트, 모닝, 네온 등 8종</p>
          </button>
        </div>

        <p className="text-xs text-neutral-400 text-center mt-8">생성 후 Color Picker로 미세 조정 가능 (무료, 무제한)</p>
      </div>
    </div>
  )
}
