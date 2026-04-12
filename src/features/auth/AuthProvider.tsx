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

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>
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

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    const result = await api.login({ email, password, recaptchaToken })
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
