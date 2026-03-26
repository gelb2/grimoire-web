import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '로그인 | Grimoire',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
