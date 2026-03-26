import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '회원가입 | Grimoire',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
