// Apple App Store 스타일 가로 스크롤 컴포넌트
// - 페이지 단위 스냅 (데스크톱 4장, 태블릿 2장, 모바일 1장)
// - 좌우 화살표 버튼 (모바일 숨김)
// - 스크롤 인디케이터 점
// - 터치 스와이프 지원
// - 마지막 페이지 도달 시 추가 로드

'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'

interface HorizontalScrollProps {
  children: ReactNode[]
  /** 추가 페이지 로드 콜백 (없으면 인피니트 스크롤 비활성) */
  onLoadMore?: () => void
  /** 더 불러올 데이터가 있는지 */
  hasMore?: boolean
  /** 로딩 중인지 */
  loading?: boolean
}

export function HorizontalScroll({
  children,
  onLoadMore,
  hasMore = false,
  loading = false,
}: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // 현재 뷰포트에서 한 페이지당 카드 수 계산
  const getCardsPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 4
    const width = window.innerWidth
    if (width < 640) return 1   // 모바일
    if (width < 1024) return 2  // 태블릿
    return 4                     // 데스크톱
  }, [])

  // 스크롤 상태 업데이트
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const cardsPerPage = getCardsPerPage()
    const totalCards = children.length
    const pages = Math.ceil(totalCards / cardsPerPage)
    setTotalPages(pages)

    // 현재 페이지 계산 (스크롤 위치 기반)
    const scrollLeft = el.scrollLeft
    const scrollWidth = el.scrollWidth - el.clientWidth
    if (scrollWidth <= 0) {
      setCurrentPage(0)
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const progress = scrollLeft / scrollWidth
    const page = Math.round(progress * (pages - 1))
    setCurrentPage(page)

    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - 10)

    // 마지막 페이지 도달 시 추가 로드
    if (hasMore && !loading && scrollLeft >= scrollWidth - 50 && onLoadMore) {
      onLoadMore()
    }
  }, [children.length, getCardsPerPage, hasMore, loading, onLoadMore])

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollState()

    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  // children 변경 시 상태 재계산
  useEffect(() => {
    updateScrollState()
  }, [children.length, updateScrollState])

  // 페이지 이동
  const scrollToPage = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return

    const cardsPerPage = getCardsPerPage()
    // 카드 1개 너비 + gap 계산
    const firstCard = el.querySelector('[data-scroll-card]') as HTMLElement | null
    if (!firstCard) return

    const cardWidth = firstCard.offsetWidth
    const gap = 16 // gap-4 = 1rem = 16px
    const pageWidth = cardsPerPage * cardWidth + (cardsPerPage - 1) * gap

    const targetScroll = direction === 'right'
      ? el.scrollLeft + pageWidth
      : el.scrollLeft - pageWidth

    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [getCardsPerPage])

  // 인디케이터 점 클릭
  const scrollToPageIndex = useCallback((pageIndex: number) => {
    const el = scrollRef.current
    if (!el) return

    const cardsPerPage = getCardsPerPage()
    const firstCard = el.querySelector('[data-scroll-card]') as HTMLElement | null
    if (!firstCard) return

    const cardWidth = firstCard.offsetWidth
    const gap = 16
    const pageWidth = cardsPerPage * cardWidth + (cardsPerPage - 1) * gap

    el.scrollTo({ left: pageIndex * pageWidth, behavior: 'smooth' })
  }, [getCardsPerPage])

  if (children.length === 0) return null

  return (
    <div className="relative group/scroll">
      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            data-scroll-card
            className="snap-start shrink-0 w-[calc(100%-8px)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
          >
            {child}
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="snap-start shrink-0 w-[calc(100%-8px)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 좌측 화살표 */}
      {canScrollLeft && (
        <button
          onClick={() => scrollToPage('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 items-center justify-center rounded-full bg-neutral-800/90 border border-neutral-700 text-white hover:bg-neutral-700 hover:border-amber-600 transition-all opacity-0 group-hover/scroll:opacity-100"
          aria-label="이전 페이지"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 우측 화살표 */}
      {canScrollRight && (
        <button
          onClick={() => scrollToPage('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 items-center justify-center rounded-full bg-neutral-800/90 border border-neutral-700 text-white hover:bg-neutral-700 hover:border-amber-600 transition-all opacity-0 group-hover/scroll:opacity-100"
          aria-label="다음 페이지"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 스크롤 인디케이터 점 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => scrollToPageIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentPage
                  ? 'bg-amber-500 w-4'
                  : 'bg-neutral-700 hover:bg-neutral-500'
              }`}
              aria-label={`페이지 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
