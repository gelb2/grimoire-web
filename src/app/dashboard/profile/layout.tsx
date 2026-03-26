import { AuthProvider } from '@/features/auth'
export const metadata = { title: '프로필 설정 | Grimoire' }
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
