"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  slug: string
  name: string
  email: string
  credits: number
  bio?: string
  role?: string
}

/**
 * 이메일 형식 정규식 (Sprint email-p0-3-slug-login §2 정본).
 *
 * `@` + `.` 모두 포함하면 email로 간주, 그 외는 slug로 간주.
 * server LoginDto가 email/slug XOR을 강제하므로 클라이언트는 양쪽 중 1택만 박제.
 *
 * 박제: 사용자 입력 trim 후 본 정규식으로 판별.
 *
 * @internal Sprint email-p0-3-slug-login Phase 2 정본 — 변경 시 server LoginDto + spec 회귀 동시 갱신
 */
export const EMAIL_OR_SLUG_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 입력 식별자가 email 형식인지 slug 형식인지 판별.
 *
 * @param input 사용자 입력 (trim 권장)
 * @returns `'email'` | `'slug'`
 */
export function detectIdentifierType(input: string): 'email' | 'slug' {
  return EMAIL_OR_SLUG_REGEX.test(input) ? 'email' : 'slug'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  /**
   * 로그인 — emailOrSlug + password.
   *
   * Sprint email-p0-3-slug-login (2026-05-04 EMAIL-P0-3 Phase 2):
   * 클라이언트가 정규식으로 자동 판별 후 server에 `{ email }` 또는 `{ slug }` XOR 박제.
   * 후향호환 — 기존 email 클라이언트 코드는 변경 0건 (`emailOrSlug`에 email 박제 시 동일 동작).
   */
  login: (emailOrSlug: string, password: string, recaptchaToken?: string) => Promise<void>
  googleLogin: (googleToken: string) => Promise<void>
  register: (data: { email: string; password: string; name: string; slug: string }, recaptchaToken?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 쿠키 기반: 프로필 요청으로 로그인 상태 확인
    api.getProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // 탭 포커스 복귀 / 가시성 전환 시 자동 크레딧 동기화
  // 다른 탭·디바이스·결제 webhook으로 크레딧이 차감/충전되더라도 현재 탭이 다시 활성화되는 순간
  // 프로필을 최신화 → 네비바/대시보드 크레딧 숫자가 자연스럽게 갱신된다.
  // 로그인 상태일 때만 폴링(서버 부하 방지).
  // 의존성은 `isLoggedIn` boolean만 — user 참조 변경(예: refreshUser 호출)에 의한 리스너 재바인딩 방지.
  const isLoggedIn = !loading && !!user
  useEffect(() => {
    if (!isLoggedIn) return
    let running = false
    const refresh = async () => {
      if (running || document.hidden) return
      running = true
      try {
        const profile = await api.getProfile()
        setUser(profile)
      } catch { /* 네트워크 일시 오류는 무시 — 다음 이벤트에서 재시도 */ }
      finally { running = false }
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [isLoggedIn])

  const login = async (emailOrSlug: string, password: string, recaptchaToken?: string) => {
    const trimmed = emailOrSlug.trim()
    const isEmail = EMAIL_OR_SLUG_REGEX.test(trimmed)
    const result = isEmail
      ? await api.login({ email: trimmed, password, recaptchaToken })
      : await api.login({ slug: trimmed, password, recaptchaToken })
    setUser(result.user)
  }

  const googleLogin = async (googleToken: string) => {
    const result = await api.googleLogin(googleToken)
    setUser(result.user)
  }

  const register = async (data: { email: string; password: string; name: string; slug: string }, recaptchaToken?: string) => {
    const result = await api.register({ ...data, recaptchaToken })
    setUser(result.user)
  }

  const refreshUser = async () => {
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch {
      // 실패 시 무시 (로그아웃 상태면 null 유지)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      // 서버 오류 시에도 클라이언트 상태는 초기화
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다')
  return ctx
}
