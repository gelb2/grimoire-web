"use client"

import Link from "next/link"

/**
 * 플랫폼 공용 에러 바운더리 (W-11) — 렌더/데이터 로딩 중 예기치 못한 예외가 수렴.
 *
 * not-found.tsx(F-16 404) 와 동일한 플랫폼 neutral 캐논을 미러(임의 hex 없음, 새 시각 언어 0).
 * App Router route error boundary 규약상 client 컴포넌트 + `{ error, reset }` 시그니처.
 * PlatformNav 는 AuthProvider 컨텍스트를 요구하는데 루트 레이아웃이 제공하지 않으므로 포함하지 않는다.
 *
 * 진짜 404(리소스 부재)는 not-found.tsx 가, 이 바운더리는 그 외 렌더/네트워크 예외를 담당한다.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-400 mb-6">Error</p>
      <h1 className="text-4xl md:text-5xl font-light text-black mb-4">문제가 발생했어요</h1>
      <p className="text-lg text-neutral-600 mb-2">잠시 후 다시 시도해 주세요</p>
      <p className="max-w-sm text-sm leading-relaxed text-neutral-400 mb-10">
        일시적인 오류일 수 있어요. 다시 시도하거나 홈으로 이동해 주세요.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border border-neutral-300 text-neutral-700 text-sm rounded-lg hover:border-black hover:text-black transition"
        >
          홈으로
        </Link>
      </div>
    </main>
  )
}
