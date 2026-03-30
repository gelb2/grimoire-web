import type { ReactNode } from "react"
import { EB_Garamond, Noto_Serif_KR } from "next/font/google"
import { CardTransitionProvider } from "@/features/reader/ui/CardTransition"
import { ThemeProvider } from "@/features/theme"
import type { AuthorTheme } from "@/features/theme"
import { AuthProvider } from "@/features/auth"
import { SeriesNav } from "@/features/reader/ui/SeriesNav"

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
  layout: "grid",
  decorations: {
    dividerIcon: "dot",
    dividerColor: "",
    headerIcon: "none",
    headerSubtitle: "",
    cardAccentPosition: "left",
    footerText: "",
  },
}

// API에서 테마를 로드한다. API가 단일 진실 공급원.
async function loadTheme(authorSlug: string): Promise<AuthorTheme> {
  try {
    // 서버 컴포넌트: 백엔드 직접 호출 (BFF 프록시 루프백 방지)
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/themes/${authorSlug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      // API에서 받은 overrides를 사용, 누락 필드는 기본값으로 보완
      if (data.overrides) {
        const overrides = data.overrides as Partial<AuthorTheme>
        return {
          ...DEFAULT_THEME,
          ...overrides,
          layout: overrides.layout ?? DEFAULT_THEME.layout,
          decorations: {
            ...DEFAULT_THEME.decorations,
            ...(overrides.decorations ?? {}),
          },
        }
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

// 작가 정보 로드 — 이름 + 작품 목록 + 에피소드 목록 (SeriesNav에 전달)
interface NavEpisode {
  slug: string
  num?: string
  type?: string
}

interface NavWork {
  slug: string
  title: string
  episodeCount?: number
}

interface AuthorInfo {
  name: string
  workSlug?: string
  episodes?: NavEpisode[]
  works?: NavWork[]
}

async function loadAuthorInfo(authorSlug: string): Promise<AuthorInfo> {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/authors/${authorSlug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      const name = data.author?.name ?? data.name ?? authorSlug
      const rawWorks: { slug: string; title: string; episodeCount?: number }[] = data.works ?? []
      const workSlug = rawWorks[0]?.slug

      // 다중 작품: 작품 목록을 SeriesNav에 전달
      const works: NavWork[] = rawWorks.map(w => ({
        slug: w.slug,
        title: w.title,
        episodeCount: w.episodeCount,
      }))

      // 단일 작품: 에피소드 목록도 로드 (SeriesNav 탭용)
      let episodes: NavEpisode[] | undefined
      if (rawWorks.length <= 1 && workSlug) {
        try {
          const workRes = await fetch(`${apiUrl}/works/${authorSlug}/${workSlug}`, {
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(3000),
          })
          if (workRes.ok) {
            const workData = await workRes.json()
            const rawEpisodes = workData.episodes ?? workData.work?.episodes ?? []
            episodes = rawEpisodes.map((ep: { slug: string; orderNum?: number; type?: string }) => {
              const epType = ep.type ?? 'episode'
              let num: string | undefined
              if (epType === 'episode') {
                const match = ep.slug.match(/\d+/)
                num = match ? match[0].padStart(2, '0') : undefined
              }
              return { slug: ep.slug, num, type: ep.type }
            })
          }
        } catch {
          // 에피소드 로드 실패
        }
      }

      return { name, workSlug, episodes, works }
    }
  } catch {
    // 작가 정보 로드 실패 — slug 폴백
  }
  return { name: authorSlug }
}

export default async function AuthorLayout({ params, children }: Props) {
  const { author } = await params
  const [theme, authorInfo] = await Promise.all([
    loadTheme(author),
    loadAuthorInfo(author),
  ])

  return (
    <div className={`${garamond.variable} ${notoSerifKR.variable}`}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CardTransitionProvider>
            {/* 모든 작가공간에 SeriesNav 표시 (네비 통일) */}
            <SeriesNav
              authorName={authorInfo.name}
              workSlug={authorInfo.workSlug}
              apiEpisodes={authorInfo.episodes}
              apiWorks={authorInfo.works}
            />
            {children}
          </CardTransitionProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  )
}
