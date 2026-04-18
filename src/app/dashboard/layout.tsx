import { EB_Garamond, Noto_Serif_KR } from 'next/font/google'
import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '작가 대시보드 | Grimoire',
}

// [author] layout과 동일한 웹폰트를 대시보드 트리에도 주입 — 테마 미리보기 모달의
// ThemeProvider가 --fn-garamond / --fn-noto-serif-kr CSS 변수를 참조하는데, 이
// 변수들이 없으면 폰트가 폴백(Georgia/Batang)으로 떨어져 미리보기와 실제 작가공간
// 렌더링이 달라진다.
const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--fn-garamond',
  display: 'swap',
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--fn-noto-serif-kr',
  display: 'swap',
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${garamond.variable} ${notoSerifKR.variable}`}>
      <AuthProvider>{children}</AuthProvider>
    </div>
  )
}
