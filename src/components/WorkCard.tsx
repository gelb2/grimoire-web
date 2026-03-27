// 작품 카드 — 탐색 페이지 그리드용
// 다크 배경 + hover glow 효과, EpisodeCard 스타일 참고

import Link from 'next/link'
import Image from 'next/image'

export interface WorkCardProps {
  title: string
  authorName: string
  authorSlug: string
  workSlug?: string
  genre?: string
  episodeCount: number
  viewCount?: number
  coverImage?: string | null
  /** "explore"면 작가 공간으로, "author-space"면 작품 상세/에피소드로 */
  context?: 'explore' | 'author-space'
  /** 단일 에피소드 작품일 때 바로 이동할 에피소드 slug */
  firstEpisodeSlug?: string
}

export function WorkCard({
  title,
  authorName,
  authorSlug,
  workSlug,
  genre,
  episodeCount,
  viewCount,
  coverImage,
  context = 'explore',
  firstEpisodeSlug,
}: WorkCardProps) {
  // explore: 작가 공간으로 이동
  // author-space: 단일 에피소드면 바로 에피소드, 다중이면 작품 상세
  let href = `/${authorSlug}`
  if (context === 'author-space' && workSlug) {
    if (episodeCount === 1 && firstEpisodeSlug) {
      href = `/${authorSlug}/${workSlug}/${firstEpisodeSlug}`
    } else {
      href = `/${authorSlug}/${workSlug}`
    }
  }

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 transition-all duration-300 hover:border-amber-600/60 hover:shadow-[0_0_24px_rgba(217,119,6,0.08)] hover:-translate-y-0.5"
    >
      {/* 커버 이미지 */}
      {coverImage ? (
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          <Image
            src={coverImage}
            alt={`${title} 커버`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
        </div>
      ) : (
        /* 커버 없을 때 플레이스홀더 */
        <div className="w-full aspect-[3/4] bg-neutral-800 flex items-center justify-center">
          <svg className="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      )}

      {/* 좌측 accent 라인 */}
      <div className="absolute top-0 left-0 w-[3px] h-full bg-neutral-800 transition-colors duration-300 group-hover:bg-amber-600" />

      {/* 텍스트 영역 */}
      <div className="p-4">
        {/* 장르 태그 */}
        {genre && (
          <span className="inline-block mb-2 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase text-amber-500/80 bg-amber-500/10 rounded">
            {genre}
          </span>
        )}

        {/* 작품 제목 */}
        <h3 className="text-base font-semibold text-white leading-snug mb-1 group-hover:text-amber-50 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* 작가 이름 */}
        <p className="text-sm text-neutral-400 mb-3">
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
      </div>
    </Link>
  )
}
