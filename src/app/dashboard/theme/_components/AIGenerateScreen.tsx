// AI 테마 생성 모드 화면
export function AIGenerateScreen({ saving, message, onBack, onGenerate }: {
  saving: boolean
  message: string
  onBack: () => void
  onGenerate: (prompt: string) => Promise<void>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-sm text-neutral-400 hover:text-black mb-6 inline-block">&larr; 돌아가기</button>
        <h1 className="text-2xl font-bold text-black mb-2">AI 테마 생성</h1>
        <p className="text-sm text-neutral-500 mb-6">원하는 분위기를 자유롭게 설명하세요. 1 크레딧이 소모됩니다.</p>
        <textarea
          id="ai-prompt"
          rows={4}
          placeholder="어둡고 묵직한 A24 감성. 세리프 폰트. 타이핑 효과..."
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-black text-sm focus:outline-none focus:border-black transition resize-none mb-4"
        />
        <button
          onClick={async () => {
            const prompt = (document.getElementById('ai-prompt') as HTMLTextAreaElement)?.value
            if (!prompt?.trim()) return
            await onGenerate(prompt)
          }}
          disabled={saving}
          className="w-full py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition"
        >
          {saving ? '생성 중...' : 'AI로 생성하기 (1 크레딧)'}
        </button>
        {message && <p className="text-sm text-neutral-500 mt-3">{message}</p>}
      </div>
    </div>
  )
}
