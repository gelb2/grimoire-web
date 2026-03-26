import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '테마 에디터 | Grimoire',
}

export default function ThemeEditorLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
