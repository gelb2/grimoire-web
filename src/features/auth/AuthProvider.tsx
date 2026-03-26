"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  slug: string
  name: string
  email: string
  credits: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (googleToken: string) => Promise<void>
  register: (data: { email: string; password: string; name: string; slug: string }) => Promise<void>
  logout: () => void
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

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password })
    setUser(result.user)
  }

  const googleLogin = async (googleToken: string) => {
    const result = await api.googleLogin(googleToken)
    setUser(result.user)
  }

  const register = async (data: { email: string; password: string; name: string; slug: string }) => {
    const result = await api.register(data)
    setUser(result.user)
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
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다')
  return ctx
}
