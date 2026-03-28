"use client"

// 에피소드 뷰어 상단 네비게이션 바
// 뒤로가기 + 작가/작품 제목 + 목록 버튼

import Link from "next/link"

interface EpisodeNavProps {
  authorSlug: string
  workSlug: string
  authorName: string
  workTitle: string
}

export function EpisodeNav({ authorSlug, workSlug, authorName, workTitle }: EpisodeNavProps) {
  return (
    <nav className="sticky top-0 z-50 border-b border-g-border bg-g-bg/95 backdrop-blur-sm">
      <div className="max-w-g-reader mx-auto px-4 md:px-8 flex items-center justify-between h-12">
        {/* 왼쪽: 뒤로가기 */}
        <Link
          href={`/${authorSlug}/${workSlug}`}
          className="flex items-center gap-1 text-g-text-muted text-sm hover:text-g-accent transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">작품 목록</span>
        </Link>

        {/* 중앙: 작가 이름 + 작품 제목 */}
        <div className="flex-1 text-center min-w-0 px-4">
          <p className="text-sm text-g-text-muted truncate">
            <span className="text-g-text-dim">{authorName}</span>
            <span className="text-g-text-dim mx-1.5">·</span>
            <span>{workTitle}</span>
          </p>
        </div>

        {/* 오른쪽: 목록 버튼 */}
        <Link
          href={`/${authorSlug}/${workSlug}`}
          className="text-g-text-muted text-sm hover:text-g-accent transition shrink-0"
        >
          목록
        </Link>
      </div>
    </nav>
  )
}
