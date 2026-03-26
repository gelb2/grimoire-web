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

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <header className="border-b border-neutral-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* 왼쪽: 로고 + 탐색 */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white hover:text-amber-500 transition">
            Grimoire
          </Link>
          <span className="text-neutral-600">|</span>
          <Link
            href="/explore"
            className={`text-sm transition ${
              isActive('/explore') ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            탐색
          </Link>

          {/* 로그인 상태에서만 추가 메뉴 */}
          {!loading && user && (
            <>
              <Link
                href="/library"
                className={`text-sm transition ${
                  isActive('/library') ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`}
              >
                서재
              </Link>
              <Link
                href="/dashboard"
                className={`text-sm transition ${
                  isActive('/dashboard') ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`}
              >
                대시보드
              </Link>
            </>
          )}
        </div>

        {/* 오른쪽: 로그인/유저 메뉴 */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-neutral-600 text-sm">...</span>
          ) : user ? (
            <>
              {/* 크레딧 */}
              <Link
                href="/dashboard/credits"
                className="text-amber-500 text-sm hover:text-amber-400 transition"
              >
                {user.credits} 크레딧
              </Link>

              {/* 어드민 링크 */}
              {/* TODO: 서버에서 role 필드 추가 시 admin 체크 */}

              {/* 유저 드롭다운 */}
              <div className="relative" ref={dropdownRef}>
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
                        setDropdownOpen(false)
                        logout()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-400 hover:text-white text-sm transition">
                로그인
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-500 transition"
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
