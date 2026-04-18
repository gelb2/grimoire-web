import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { EB_Garamond, Noto_Serif_KR } from "next/font/google"
import { Toaster } from "sonner"
import "./theme.css"

// CI 로고 폰트 — 클래식 세리프 (EB Garamond)
const garamondLogo = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
  variable: "--fn-logo",
  display: "swap",
})

// 작가공간/대시보드/미리보기 공용 본문·제목 세리프 폰트 체인
// ThemeProvider가 --g-serif / --g-heading-font 에서 이 변수들을 참조한다.
// root 레벨에서 한 번만 선언해 모든 라우트(/, /dashboard/*, /[author]/*, /explore)가
// 동일한 폰트를 쓰도록 강제 — 경로별 렌더링 차이 제거.
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--fn-garamond",
  display: "swap",
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--fn-noto-serif-kr",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  title: {
    default: "Grimoire — 작가별 맞춤 소설 퍼블리싱 플랫폼",
    template: "%s | Grimoire",
  },
  description:
    "작가별 맞춤 공간을 제공하는 소설 퍼블리싱 플랫폼. 자신만의 시각적 공간에서 소설을 퍼블리시하세요.",
  keywords: [
    "Grimoire",
    "소설",
    "웹소설",
    "퍼블리싱",
    "작가",
    "플랫폼",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Grimoire",
    title: "Grimoire — 작가별 맞춤 소설 퍼블리싱 플랫폼",
    description:
      "작가별 맞춤 공간을 제공하는 소설 퍼블리싱 플랫폼. 자신만의 시각적 공간에서 소설을 퍼블리시하세요.",
  },
  twitter: {
    card: "summary",
    title: "Grimoire — 작가별 맞춤 소설 퍼블리싱 플랫폼",
    description:
      "작가별 맞춤 공간을 제공하는 소설 퍼블리싱 플랫폼. 자신만의 시각적 공간에서 소설을 퍼블리시하세요.",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${garamondLogo.variable} ${garamond.variable} ${notoSerifKR.variable}`}>
        {children}
        <Toaster theme="dark" position="bottom-center" richColors />
      </body>
    </html>
  )
}
