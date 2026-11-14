import { garamond } from '@/app/author-fonts'
import { AuthProvider } from '@/features/auth'

export const metadata = {
  title: '작가 대시보드 | Grimoire',
}

// [author] layout과 동일한 웹폰트를 대시보드 트리에도 주입 — 테마 미리보기 모달의
// ThemeProvider가 --fn-garamond / --fn-noto-serif-kr CSS 변수를 참조하는데, 이
// 변수들이 없으면 폰트가 폴백(Georgia/Batang)으로 떨어져 미리보기와 실제 작가공간
// 렌더링이 달라진다.


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <><link rel="stylesheet" href="/fonts/noto-serif-kr/font-faces.css" precedence="grimoire-fonts" /><div className={`${garamond.variable} font-noto-serif-kr`}>
      <AuthProvider>{children}</AuthProvider>
    </div></>
  )
}
