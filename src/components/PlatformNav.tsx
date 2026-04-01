'use client'

// 플랫폼 공용 네비게이션 바
// variant="platform" (기본): 에디토리얼 라이트 테마
// variant="author-space": 기존 다크 테마 (작가공간 grid/classic 레이아웃용)

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/features/auth'

interface PlatformNavProps {
  variant?: 'platform' | 'author-space'
}

// 스타일 세트 — variant별 분기
const styles = {
  platform: {
    header: 'border-b border-neutral-200 px-4 md:px-6 py-3 md:py-4 bg-white',
    logo: 'text-lg md:text-2xl font-light uppercase text-black hover:text-[#e53e3e] transition font-ci tracking-[0.15em] md:tracking-[0.2em]',
    divider: 'text-neutral-300',
    link: (active: boolean) => active
      ? 'text-xs uppercase tracking-widest text-black border-b-2 border-[#e53e3e] pb-0.5'
      : 'text-xs uppercase tracking-widest text-neutral-400 hover:text-black transition',
    loading: 'text-neutral-400 text-sm',
    credits: 'text-[#e53e3e] text-sm hover:opacity-80 transition',
    userName: 'flex items-center gap-1 text-neutral-700 hover:text-black text-sm transition',
    dropdown: 'absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 py-1',
    dropdownItem: 'block px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-black transition',
    dropdownAdmin: 'block px-4 py-2 text-sm text-[#e53e3e] hover:bg-neutral-50 transition',
    dropdownDivider: 'border-t border-neutral-200 my-1',
    dropdownLogout: 'block w-full text-left px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 disabled:cursor-not-allowed transition',
    loginLink: 'text-neutral-500 hover:text-black text-sm transition',
    registerBtn: 'px-4 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition',
  },
  'author-space': {
    header: 'border-b border-neutral-800 px-6 py-4',
    logo: 'text-xl font-light uppercase text-white hover:text-amber-500 transition font-ci tracking-[0.2em]',
    divider: 'text-neutral-600',
    link: (active: boolean) => active
      ? 'text-sm text-amber-500 transition'
      : 'text-sm text-neutral-400 hover:text-white transition',
    loading: 'text-neutral-600 text-sm',
    credits: 'text-amber-500 text-sm hover:text-amber-400 transition',
    userName: 'flex items-center gap-1 text-neutral-300 hover:text-white text-sm transition',
    dropdown: 'absolute right-0 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 py-1',
    dropdownItem: 'block px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition',
    dropdownAdmin: 'block px-4 py-2 text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 transition',
    dropdownDivider: 'border-t border-neutral-700 my-1',
    dropdownLogout: 'block w-full text-left px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 disabled:cursor-not-allowed transition',
    loginLink: 'text-neutral-400 hover:text-white text-sm transition',
    registerBtn: 'px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-500 transition',
  },
}

export function PlatformNav({ variant = 'platform' }: PlatformNavProps) {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const s = styles[variant]

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
    <header className={s.header} style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* 왼쪽: 로고 + 탐색 */}
        <div className="flex items-center gap-4">
          <Link href="/" className={s.logo}>
            Grimoire
          </Link>
          <span className={s.divider}>|</span>
          <Link href="/explore" className={s.link(isActive('/explore'))}>
            탐색
          </Link>

          {/* 로그인 상태에서만 추가 메뉴 (모바일에서는 드롭다운으로 이동) */}
          {!loading && user && (
            <>
              <Link href="/library" className={`hidden md:inline ${s.link(isActive('/library'))}`}>
                서재
              </Link>
              <Link href="/dashboard" className={`hidden md:inline ${s.link(isActive('/dashboard'))}`}>
                대시보드
              </Link>
            </>
          )}
        </div>

        {/* 오른쪽: 로그인/유저 메뉴 */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className={s.loading}>...</span>
          ) : user ? (
            <>
              {/* 크레딧 (모바일에서는 드롭다운으로 이동) */}
              <Link href="/dashboard/credits" className={`hidden md:inline ${s.credits}`}>
                {user.credits} 크레딧
              </Link>

              {/* 유저 드롭다운 */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={s.userName}
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
                  <div className={s.dropdown}>
                    {/* 모바일에서만 보이는 메뉴 */}
                    <Link href="/dashboard/credits" onClick={() => setDropdownOpen(false)} className={`md:hidden ${s.dropdownItem}`}>{user.credits} 크레딧</Link>
                    <Link href="/library" onClick={() => setDropdownOpen(false)} className={`md:hidden ${s.dropdownItem}`}>서재</Link>
                    <Link href="/dashboard" onClick={() => setDropdownOpen(false)} className={`md:hidden ${s.dropdownItem}`}>대시보드</Link>
                    <div className={`md:hidden ${s.dropdownDivider}`} />
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setDropdownOpen(false)}
                      className={s.dropdownItem}
                    >
                      프로필 설정
                    </Link>
                    <Link
                      href={`/${user.slug}`}
                      onClick={() => setDropdownOpen(false)}
                      className={s.dropdownItem}
                    >
                      내 공간 보기
                    </Link>
                    {/* 관리자 전용 메뉴 */}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className={s.dropdownAdmin}
                      >
                        관리자
                      </Link>
                    )}
                    <div className={s.dropdownDivider} />
                    <button
                      onClick={() => {
                        if (loggingOut) return
                        setLoggingOut(true)
                        setDropdownOpen(false)
                        logout()
                      }}
                      disabled={loggingOut}
                      className={s.dropdownLogout}
                    >
                      {loggingOut ? '로그아웃 중...' : '로그아웃'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={s.loginLink}>
                로그인
              </Link>
              <Link href="/register" className={s.registerBtn}>
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
