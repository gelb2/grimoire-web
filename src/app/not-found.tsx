import Link from "next/link"

/**
 * 플랫폼 공용 404 (F-16) — 없는 페이지/작품/회차/공유토큰이 수렴.
 *
 * 플랫폼 neutral 스타일(neutral 계열 · black · white — 임의 hex 없음). deerdevil g- 테마 스코프
 * 밖의 플랫폼 chrome 이므로 작가 테마는 미적용(의도). PlatformNav 는 AuthProvider 컨텍스트를
 * 요구하는데 루트 레이아웃은 이를 제공하지 않으므로 포함하지 않는다(컨텍스트 크래시 방지).
 *
 * 진짜 404(리소스 부재) vs 네트워크/5xx 일시 오류의 구분은 각 페이지 catch(ApiError.status)
 * 에서 처리하며, 일시 오류는 이 페이지가 아닌 오류 UI로 표시한다.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-400 mb-6">Error 404</p>
      <h1 className="text-6xl md:text-7xl font-light text-black mb-4">404</h1>
      <p className="text-lg text-neutral-600 mb-2">페이지를 찾을 수 없어요</p>
      <p className="max-w-sm text-sm leading-relaxed text-neutral-400 mb-10">
        주소가 바뀌었거나 삭제된 작품·회차일 수 있어요. 아래에서 다시 시작해보세요.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition"
        >
          홈으로
        </Link>
        <Link
          href="/explore"
          className="px-5 py-2.5 border border-neutral-300 text-neutral-700 text-sm rounded-lg hover:border-black hover:text-black transition"
        >
          작품 둘러보기
        </Link>
      </div>
    </main>
  )
}
