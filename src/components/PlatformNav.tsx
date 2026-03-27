'use client'

// 플랫폼 공용 네비게이션 바
// 로그인 상태에 따라 다른 메뉴 표시

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth'

export function PlatformNav() {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 라우트 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <header className="border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* 왼쪽: 로고 + 데스크톱 탐색 */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white hover:text-amber-500 transition">
            Grimoire
          </Link>

          {/* 데스크톱 전용 메뉴 */}
          <span className="hidden sm:block text-neutral-600">|</span>
          <Link
            href="/explore"
            className={`hidden sm:block text-sm transition ${
              isActive('/explore') ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            탐색
          </Link>
          {!loading && user && (
            <>
              <Link
                href="/library"
                className={`hidden sm:block text-sm transition ${
                  isActive('/library') ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`}
              >
                서재
              </Link>
              <Link
                href="/dashboard"
                className={`hidden sm:block text-sm transition ${
                  isActive('/dashboard') ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`}
              >
                대시보드
              </Link>
            </>
          )}
        </div>

        {/* 오른쪽: 로그인/유저 메뉴 + 모바일 햄버거 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <span className="text-neutral-600 text-sm">...</span>
          ) : user ? (
            <>
              {/* 크레딧 — 데스크톱만 */}
              <Link
                href="/dashboard/credits"
                className="hidden sm:block text-amber-500 text-sm hover:text-amber-400 transition"
              >
                {user.credits} 크레딧
              </Link>

              {/* 유저 드롭다운 — 데스크톱 */}
              <div className="hidden sm:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1 text-neutral-300 hover:text-white text-sm transition"
                >
                  {user.name}
                  <svg
                    className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 py-1">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                    >
                      프로필 설정
                    </Link>
                    <Link
                      href={`/${user.slug}`}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
                    >
                      내 공간 보기
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 transition"
                    >
                      관리자
                    </Link>
                    <div className="border-t border-neutral-700 my-1" />
                    <button
                      onClick={() => {
                        if (loggingOut) return
                        setLoggingOut(true)
                        setDropdownOpen(false)
                        logout()
                      }}
                      disabled={loggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 disabled:cursor-not-allowed transition"
                    >
                      {loggingOut ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </div>
                )}
              </div>

              {/* 모바일 햄버거 버튼 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-neutral-400 hover:text-white transition"
                aria-label="메뉴"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-400 hover:text-white text-sm transition">
                로그인
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 sm:px-4 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-500 transition"
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {mobileMenuOpen && user && (
        <div className="sm:hidden mt-3 pb-3 border-t border-neutral-800">
          <nav className="flex flex-col">
            <Link href="/explore" className={`px-4 py-3 text-sm transition ${isActive('/explore') ? 'text-amber-500' : 'text-neutral-400'}`}>
              탐색
            </Link>
            <Link href="/library" className={`px-4 py-3 text-sm transition ${isActive('/library') ? 'text-amber-500' : 'text-neutral-400'}`}>
              서재
            </Link>
            <Link href="/dashboard" className={`px-4 py-3 text-sm transition ${isActive('/dashboard') ? 'text-amber-500' : 'text-neutral-400'}`}>
              대시보드
            </Link>
            <div className="border-t border-neutral-800 my-1" />
            <Link href="/dashboard/credits" className="px-4 py-3 text-sm text-amber-500">
              {user.credits} 크레딧
            </Link>
            <Link href="/dashboard/profile" className="px-4 py-3 text-sm text-neutral-400">
              프로필 설정
            </Link>
            <Link href={`/${user.slug}`} className="px-4 py-3 text-sm text-neutral-400">
              내 공간 보기
            </Link>
            <div className="border-t border-neutral-800 my-1" />
            <button
              onClick={() => {
                if (loggingOut) return
                setLoggingOut(true)
                setMobileMenuOpen(false)
                logout()
              }}
              disabled={loggingOut}
              className="text-left px-4 py-3 text-sm text-neutral-500 disabled:cursor-not-allowed"
            >
              {loggingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
