import { AuthProvider } from '@/features/auth'
export const metadata = { title: '서재 | Grimoire' }
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
