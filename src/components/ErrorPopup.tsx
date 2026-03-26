"use client"

// ErrorPopup — API 실패 시 에러 팝업, 확인 누르면 이전 페이지로 이동
// 폴백 없이 에러를 명확히 알린다.

import { useRouter } from 'next/navigation'

interface ErrorPopupProps {
  message: string
}

export function ErrorPopup({ message }: ErrorPopupProps) {
  const router = useRouter()

  const handleConfirm = () => {
    router.back()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* 에러 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* 메시지 */}
        <h2 className="text-xl font-bold text-white text-center mb-3">오류 발생</h2>
        <p className="text-neutral-400 text-center mb-8 leading-relaxed">{message}</p>

        {/* 확인 버튼 */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition"
        >
          확인
        </button>
      </div>
    </div>
  )
}
