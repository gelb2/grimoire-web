import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    default: "사슴악마 — K-다크 판타지 단편소설",
    template: "%s | 사슴악마",
  },
  description:
    "A24 감성의 K-다크 판타지. 전래동화 속 신수(神獸)의 눈으로 다시 읽는 단편소설 유니버스.",
  keywords: [
    "사슴악마",
    "K-다크 판타지",
    "단편소설",
    "전래동화",
    "A24",
    "웹소설",
    "한국 판타지",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "사슴악마",
    title: "사슴악마 — K-다크 판타지 단편소설",
    description:
      "A24 감성의 K-다크 판타지. 전래동화 속 신수(神獸)의 눈으로 다시 읽는 단편소설 유니버스.",
  },
  twitter: {
    card: "summary",
    title: "사슴악마 — K-다크 판타지 단편소설",
    description:
      "A24 감성의 K-다크 판타지. 전래동화 속 신수(神獸)의 눈으로 다시 읽는 단편소설 유니버스.",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
