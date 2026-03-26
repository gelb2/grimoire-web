// 작품 카드 — 탐색 페이지 그리드용
// 다크 배경 + hover glow 효과, EpisodeCard 스타일 참고

import Link from 'next/link'

export interface WorkCardProps {
  title: string
  authorName: string
  authorSlug: string
  workSlug?: string
  genre?: string
  episodeCount: number
  viewCount?: number
}

export function WorkCard({
  title,
  authorName,
  authorSlug,
  workSlug,
  genre,
  episodeCount,
  viewCount,
}: WorkCardProps) {
  // 항상 작가 공간으로 이동 — 작가 공간에서 작품/에피소드 선택
  const href = `/${authorSlug}`

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 transition-all duration-300 hover:border-amber-600/60 hover:shadow-[0_0_24px_rgba(217,119,6,0.08)] hover:-translate-y-0.5"
    >
      {/* 좌측 accent 라인 */}
      <div className="absolute top-0 left-0 w-[3px] h-full bg-neutral-800 transition-colors duration-300 group-hover:bg-amber-600" />

      {/* 장르 태그 */}
      {genre && (
        <span className="inline-block mb-3 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase text-amber-500/80 bg-amber-500/10 rounded">
          {genre}
        </span>
      )}

      {/* 작품 제목 */}
      <h3 className="text-lg font-semibold text-white leading-snug mb-1.5 group-hover:text-amber-50 transition-colors">
        {title}
      </h3>

      {/* 작가 이름 */}
      <p className="text-sm text-neutral-400 mb-4">
        {authorName}
      </p>

      {/* 통계 */}
      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {episodeCount}화
        </span>
        {viewCount != null && viewCount > 0 && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {viewCount.toLocaleString()}
          </span>
        )}
      </div>

      {/* CTA 화살표 */}
      <div className="absolute bottom-4 right-4 text-neutral-700 transition-colors duration-300 group-hover:text-amber-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
