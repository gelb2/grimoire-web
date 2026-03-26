import type { ReactNode } from "react"
import { EB_Garamond, Noto_Serif_KR } from "next/font/google"
import { UniverseNav } from "@/features/universe/ui/UniverseNav"
import { CardTransitionProvider } from "@/features/universe/ui/CardTransition"
import { ThemeProvider } from "@/features/theme"
import { getThemeForAuthor } from "@/features/theme"

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

interface Props {
  params: Promise<{ author: string }>
  children: ReactNode
}

export default async function AuthorLayout({ params, children }: Props) {
  const { author } = await params
  const theme = getThemeForAuthor(author)

  return (
    <div className={`${garamond.variable} ${notoSerifKR.variable}`}>
      <ThemeProvider theme={theme}>
        <CardTransitionProvider>
          <UniverseNav />
          {children}
        </CardTransitionProvider>
      </ThemeProvider>
    </div>
  )
}
