import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '작가 대시보드 | Grimoire',
}

// 폰트 variable(--fn-garamond / --fn-noto-serif-kr)은 root layout이 body에 주입.
// dashboard 하위 모든 페이지(미리보기 모달 포함)가 그대로 상속.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
