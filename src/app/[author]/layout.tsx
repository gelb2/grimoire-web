import type { ReactNode } from "react"
import { EB_Garamond, Noto_Serif_KR } from "next/font/google"
import { UniverseNav } from "@/features/universe/ui/UniverseNav"
import { CardTransitionProvider } from "@/features/universe/ui/CardTransition"
import { PageFlipTransition } from "@/features/universe/ui/PageFlipTransition"
import { ThemeProvider } from "@/features/theme"
import { getThemeForAuthor } from "@/features/theme"
import type { AuthorTheme } from "@/features/theme"

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

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

// 서버에서 테마 로드 시도, 실패 시 로컬 프리셋 폴백
async function loadTheme(authorSlug: string): Promise<AuthorTheme> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/themes/${authorSlug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.overrides) {
        return { ...getThemeForAuthor(authorSlug), ...data.overrides }
      }
    }
  } catch {
    // 서버 미연결 시 로컬 프리셋 사용
  }
  return getThemeForAuthor(authorSlug)
}

interface Props {
  params: Promise<{ author: string }>
  children: ReactNode
}

export default async function AuthorLayout({ params, children }: Props) {
  const { author } = await params
  const theme = await loadTheme(author)

  return (
    <div className={`${garamond.variable} ${notoSerifKR.variable}`}>
      <ThemeProvider theme={theme}>
        <CardTransitionProvider>
          <UniverseNav />
          <PageFlipTransition>
            {children}
          </PageFlipTransition>
        </CardTransitionProvider>
      </ThemeProvider>
    </div>
  )
}
