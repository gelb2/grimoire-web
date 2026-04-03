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
  variable: "--fn-garamond",
  display: "swap",
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--fn-noto-serif-kr",
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
  episodeListLayout: "grid",
  decorations: {
    dividerIcon: "dot",
    dividerColor: "",
    headerIcon: "none",
    headerSubtitle: "",
    cardAccentPosition: "left",
    footerText: "",
  },
}

// API에서 테마를 로드한다. 백엔드가 preset + overrides를 merge한 완전한 테마를 반환.
async function loadTheme(authorSlug: string): Promise<AuthorTheme> {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/themes/${authorSlug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      // 백엔드가 merge한 완전한 테마 사용 (data.theme)
      // 하위 호환: data.theme 없으면 기존 overrides 방식 폴백
      if (data.theme) return data.theme as AuthorTheme
      if (data.overrides) return { ...DEFAULT_THEME, ...data.overrides } as AuthorTheme
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
            const rawEpisodes: { slug: string; orderNum?: number; type?: string }[] =
              workData.episodes ?? workData.work?.episodes ?? []
            // orderNum 기준 정렬 후 탭 번호 생성
            const sorted = [...rawEpisodes].sort(
              (a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0),
            )
            episodes = sorted.map((ep, idx) => {
              const epType = ep.type ?? 'episode'
              let num: string | undefined
              if (epType === 'episode') {
                // orderNum 우선, 없으면 slug에서 추출, 최종 폴백은 인덱스
                if (ep.orderNum != null) {
                  num = String(ep.orderNum).padStart(2, '0')
                } else {
                  const match = ep.slug.match(/\d+/)
                  num = match ? match[0].padStart(2, '0') : String(idx + 1).padStart(2, '0')
                }
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
    <>
      {/* 모바일: status bar + body 배경색을 테마와 통일 (safe-area 틈 방지) */}
      <meta name="theme-color" content={theme.bgPrimary} />
      <style>{`html, body { background-color: ${theme.bgPrimary}; }`}</style>
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
    </>
  )
}
