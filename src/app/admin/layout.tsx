import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '관리자 패널 | Grimoire',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
