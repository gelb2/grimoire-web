import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '작가 대시보드 | Grimoire',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
