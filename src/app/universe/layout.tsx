import type { ReactNode } from "react"
import { EB_Garamond, Noto_Serif_KR } from "next/font/google"
import { UniverseNav } from "@/features/universe/ui/UniverseNav"
import { CardTransitionProvider } from "@/features/universe/ui/CardTransition"

// Geist 오염 방지 — universe 스코프 안에서만 serif 폰트 적용
const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap",
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-noto-serif-kr",
  display: "swap",
})

export const metadata = {
  title: "사슴악마 — 단편소설 유니버스",
  description: "A24 감성의 K-다크 판타지. 결핍은 질문을 삼킨다.",
}

export default function UniverseLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${garamond.variable} ${notoSerifKR.variable} min-h-screen bg-u-bg text-u-text font-u-serif text-base md:text-[19px] leading-[1.75] md:leading-[1.85]`}
      style={
        {
          "--u-bg": "#07070a",
          "--u-bg2": "#0d0d12",
          "--u-text": "#cdc8bc",
          "--u-text-muted": "#7a7570",
          "--u-text-dim": "#4a4740",
          "--u-accent": "#9a8060",
          "--u-accent2": "#c4a46a",
          "--u-border": "#1e1e26",
          "--u-serif":
            "var(--font-garamond), var(--font-noto-serif-kr), Georgia, 'Batang', serif",
          "--u-sans": "system-ui, -apple-system, sans-serif",
        } as React.CSSProperties
      }
    >
      <CardTransitionProvider>
        <UniverseNav />
        {children}
      </CardTransitionProvider>
    </div>
  )
}
