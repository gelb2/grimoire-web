import type { ReactNode } from "react"
import { EB_Garamond, Noto_Serif_KR } from "next/font/google"
import { CardTransitionProvider } from "@/features/universe/ui/CardTransition"
import { ThemeProvider } from "@/features/theme"
import type { AuthorTheme } from "@/features/theme"
import { AuthProvider } from "@/features/auth"

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

// API 실패 시 기본 다크 테마 (로컬 프리셋 사용 안 함)
const DEFAULT_THEME: AuthorTheme = {
  bgPrimary: "#07070a",
  bgSecondary: "#0d0d12",
  textPrimary: "#cdc8bc",
  textMuted: "#7a7570",
  textDim: "#4a4740",
  textBright: "#e8e3d8",
  accent: "#9a8060",
  accent2: "#c4a46a",
  border: "#1e1e26",
  fontBody: "serif",
  fontHeading: "serif",
  animation: "typing",
  tone: "dark",
}

// API에서 테마를 로드한다. API가 단일 진실 공급원.
async function loadTheme(authorSlug: string): Promise<AuthorTheme> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/themes/${authorSlug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      // API에서 받은 overrides를 그대로 사용 (로컬 프리셋과 머지하지 않음)
      if (data.overrides) {
        return data.overrides as AuthorTheme
      }
    }
  } catch {
    // API 연결 실패 — 기본 다크 테마 사용
  }
  return DEFAULT_THEME
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
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CardTransitionProvider>
            {children}
          </CardTransitionProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  )
}
