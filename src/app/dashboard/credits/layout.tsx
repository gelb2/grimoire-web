import { AuthProvider } from '@/features/auth'
export const metadata = { title: '크레딧 충전 | Grimoire' }
export default function CreditsLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
