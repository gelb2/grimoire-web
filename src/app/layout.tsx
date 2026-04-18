import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { EB_Garamond } from "next/font/google"
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

// 작가공간/대시보드/미리보기 공용 본문·제목 세리프 폰트 (라틴 전용).
// next/font/google 의 Noto_Serif_KR 은 `subsets: ['korean']` 을 지원하지 않아
// 한글 글리프가 포함되지 않음 → font-family 에 "Noto Serif KR" 을 지정하면
// 브라우저가 한글을 자모 단위로 해체 렌더하는 치명적 버그를 유발한다.
// 한글은 브라우저 시스템 세리프 폴백(Batang / Apple SD Gothic Neo / serif)에 맡긴다.
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--fn-garamond",
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
      <body className={`${garamondLogo.variable} ${garamond.variable}`}>
        {children}
        <Toaster theme="dark" position="bottom-center" richColors />
      </body>
    </html>
  )
}
