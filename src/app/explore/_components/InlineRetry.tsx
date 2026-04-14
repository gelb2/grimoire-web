// 인라인 에러 + 새로고침
export function InlineRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-8 text-neutral-500">
      <p>작품을 불러올 수 없습니다.</p>
      <button
        onClick={onRetry}
        className="mt-2 text-sm underline text-neutral-400 hover:text-black transition"
      >
        새로고침
      </button>
    </div>
  )
}
