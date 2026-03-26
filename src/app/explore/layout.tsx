import { AuthProvider } from '@/features/auth'
import type { ReactNode } from 'react'

// 탐색 페이지에 AuthProvider 제공 (PlatformNav 로그인 상태 확인용)
export default function ExploreLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
