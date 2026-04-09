// Apple App Store 스타일 가로 스크롤 컴포넌트
// - 2행 그리드 페이지 단위 스냅 (데스크톱 2x4, 태블릿 2x2, 모바일 2x1)
// - 좌우 화살표 버튼 (모바일 숨김)
// - 스크롤 인디케이터 점 (현재 로드된 페이지 수 기반)
// - 터치 스와이프 지원
// - 마지막 페이지 도달 시 추가 로드

'use client'

import { useRef, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'

interface HorizontalScrollProps {
  children: ReactNode[]
  /** 추가 페이지 로드 콜백 */
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

  // 뷰포트에 따른 열 수 (행은 항상 2). 초기값 4로 SSR/CSR 일치.
  const [columnsPerPage, setColumnsPerPage] = useState(4)

  useEffect(() => {
    const calcColumns = () => {
      const width = window.innerWidth
      if (width < 640) return 1   // 모바일: 2행 1열
      if (width < 1024) return 2  // 태블릿: 2행 2열
      return 4                     // 데스크톱: 2행 4열
    }
    setColumnsPerPage(calcColumns())
    const handleResize = () => setColumnsPerPage(calcColumns())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getColumnsPerPage = useCallback(() => columnsPerPage, [columnsPerPage])

  // 한 페이지당 카드 수 (2행 x 열수)
  const getCardsPerPage = useCallback(() => {
    return columnsPerPage * 2
  }, [columnsPerPage])

  // 카드를 2행 그리드 페이지로 그룹화 (메모이제이션)
  const pages = useMemo(() => {
    const cardsPerPage = getCardsPerPage()
    const result: ReactNode[][] = []
    for (let i = 0; i < children.length; i += cardsPerPage) {
      result.push(children.slice(i, i + cardsPerPage))
    }
    return result
  }, [children, getCardsPerPage])

  // 스크롤 상태 업데이트
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const pagesCount = pages.length
    setTotalPages(pagesCount)

    const scrollLeft = el.scrollLeft
    const scrollWidth = el.scrollWidth - el.clientWidth

    if (scrollWidth <= 0) {
      setCurrentPage(0)
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const progress = scrollLeft / scrollWidth
    const page = Math.round(progress * (pagesCount - 1))
    setCurrentPage(Math.min(page, pagesCount - 1))

    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - 10)

    // 마지막 페이지 도달 시 추가 로드
    if (hasMore && !loading && scrollLeft >= scrollWidth - 50 && onLoadMore) {
      onLoadMore()
    }
  }, [pages.length, hasMore, loading, onLoadMore])

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

  useEffect(() => {
    updateScrollState()
  }, [children.length, updateScrollState])

  // 페이지 이동
  const scrollToPage = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return

    const pageEl = el.querySelector('[data-scroll-page]') as HTMLElement | null
    if (!pageEl) return

    const pageWidth = pageEl.offsetWidth + 16 // gap-4
    const targetScroll = direction === 'right'
      ? el.scrollLeft + pageWidth
      : el.scrollLeft - pageWidth

    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [])

  // 인디케이터 점 클릭
  const scrollToPageIndex = useCallback((pageIndex: number) => {
    const el = scrollRef.current
    if (!el) return

    const pageEl = el.querySelector('[data-scroll-page]') as HTMLElement | null
    if (!pageEl) return

    const pageWidth = pageEl.offsetWidth + 16
    el.scrollTo({ left: pageIndex * pageWidth, behavior: 'smooth' })
  }, [])

  if (children.length === 0) return null

  const cols = columnsPerPage

  return (
    <div className="relative group/scroll">
      {/* 스크롤 컨테이너 — 각 페이지가 2행 그리드 */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {pages.map((pageCards, pageIdx) => (
          <div
            key={pageIdx}
            data-scroll-page
            className="snap-start shrink-0 w-full"
          >
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: 'repeat(2, 1fr)',
              }}
            >
              {pageCards.map((child, cardIdx) => (
                <div key={cardIdx}>
                  {child}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="snap-start shrink-0 w-full flex items-center justify-center min-h-[200px]">
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
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentPage
                  ? 'bg-amber-500 w-4'
                  : 'bg-neutral-700 hover:bg-neutral-500 w-2'
              }`}
              aria-label={`페이지 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
