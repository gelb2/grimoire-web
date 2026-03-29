import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Josefin_Sans } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

// CI 로고 폰트 — 바우하우스 기하학 (Josefin Sans)
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-logo",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      <body className={josefin.variable}>
        {children}
        <Toaster theme="dark" position="bottom-center" richColors />
      </body>
    </html>
  )
}
