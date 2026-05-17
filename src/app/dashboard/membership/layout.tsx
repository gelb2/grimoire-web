import { AuthProvider } from '@/features/auth'
export const metadata = { title: '멤버십 | Grimoire' }
export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
