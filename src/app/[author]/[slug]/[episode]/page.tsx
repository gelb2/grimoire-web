import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import { ApiError } from "@/lib/api/client"
import { ErrorPopup } from "@/components/ErrorPopup"
import { EpisodeViewer } from "@/features/reader/ui/EpisodeViewer"
import { EpisodeFooter } from "@/features/reader/ui/EpisodeFooter"
// WorkNav 제거 — SeriesNav가 [author]/layout.tsx에서 항상 렌더링됨

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string; slug: string; episode: string }>
}

// 테마 레이아웃만 빠르게 확인 — series 여부 판별용
async function getThemeLayout(authorSlug: string): Promise<string> {
  try {
    // 서버 컴포넌트: 백엔드 직접 호출 (BFF 프록시 루프백 방지)
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/themes/${authorSlug}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      // data.theme (새 API) 우선, data.overrides (하위 호환) 폴백
      return data.theme?.episodeListLayout ?? data.overrides?.episodeListLayout ?? data.overrides?.layout ?? 'grid'
    }
  } catch {
    // 테마 로드 실패 — 기본 grid
  }
  return 'grid'
}

// 에피소드 메타데이터
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author, slug, episode } = await params

  try {
    const episodeData = await api.getEpisode<{ title: string; description?: string }>(author, slug, episode)
    const title = episodeData.title || episode
    const description = episodeData.description ?? `${author} — ${title}`

    // 루트 레이아웃 template이 "| Grimoire"를 자동 추가하므로 여기서는 제목만
    return {
      title,
      description,
      openGraph: {
        title: `${title} | Grimoire`,
        description,
        type: "article",
      },
      twitter: {
        card: "summary",
        title: `${title} | Grimoire`,
        description,
      },
    }
  } catch {
    return { title: episode }
  }
}

export default async function EpisodePage({ params }: Props) {
  const { author, slug, episode } = await params

  try {
    // 에피소드 + 작가 정보 + 테마 레이아웃 + 작품(에피소드 목록) 동시 로드
    const [episodeData, authorRes, themeLayout, workData] = await Promise.all([
      api.getEpisode<any>(author, slug, episode),
      api.getAuthorSpace<any>(author).catch(() => null),
      getThemeLayout(author),
      api.getWork<any>(author, slug).catch(() => null),
    ])

    // 에피소드 번호: 작품 내 episode 타입 순번으로 계산 (orderNum 갭 무시)
    let episodeNum = episodeData.num
    if (!episodeNum && episodeData.type !== 'preface' && episodeData.type !== 'afterword' && episodeData.type !== 'bonus') {
      const allEps = (workData?.episodes ?? workData?.work?.episodes ?? [])
        .map((ep: { slug: string; orderNum?: number; order_num?: number; type?: string }) => ({
          slug: ep.slug, orderNum: ep.orderNum ?? ep.order_num ?? 0, type: ep.type ?? 'episode',
        }))
        .sort((a: { orderNum: number }, b: { orderNum: number }) => a.orderNum - b.orderNum)
      let counter = 0
      for (const ep of allEps) {
        if (ep.type === 'episode') counter++
        if (ep.slug === episode) { episodeNum = String(counter).padStart(2, '0'); break }
      }
    }

    const meta = {
      slug: episodeData.slug || episode,
      type: (episodeData.type || "episode") as "episode" | "bonus" | "preface" | "afterword",
      num: episodeNum,
      title: episodeData.title,
      subtitle: episodeData.subtitle ?? undefined,
      description: episodeData.description,
    }

    // 작가 이름: API 응답 > 작가 공간(중첩 구조) > slug 폴백
    const authorName = episodeData.authorName || authorRes?.author?.name || (authorRes as Record<string, unknown>)?.name as string || author
    // 작품 제목: 에피소드 응답에 포함된 workTitle 또는 slug 폴백
    const workTitle = episodeData.workTitle ?? slug

    const isSeriesLayout = themeLayout === 'series'

    // 작품의 에피소드 목록 추출 (WorkNav pill 표시용)
    const workEpisodes: { slug: string; orderNum: number; title: string; type?: string }[] =
      (workData?.episodes ?? workData?.work?.episodes ?? [])
        .map((ep: { slug: string; orderNum?: number; order_num?: number; title: string; type?: string }) => ({
          slug: ep.slug,
          orderNum: ep.orderNum ?? ep.order_num ?? 0,
          title: ep.title,
          type: ep.type,
        }))
        .sort((a: { orderNum: number }, b: { orderNum: number }) => a.orderNum - b.orderNum)

    return (
      <>
        {/* 네비게이션: SeriesNav가 [author]/layout.tsx에서 항상 렌더링됨 */}
        <EpisodeViewer key={`${author}-${slug}-${episode}`} meta={meta} data={{ slug: episodeData.slug, title: episodeData.title, subtitle: episodeData.subtitle ?? undefined, blocks: (Array.isArray(episodeData.blocks) ? episodeData.blocks : episodeData.blocks?.blocks ?? []) as never[] }} authorName={authorName} />
        <EpisodeFooter
          episodeId={episodeData.id || episode}
          authorSlug={author}
          workSlug={slug}
          prevEpisodeSlug={episodeData.prevSlug ?? null}
          nextEpisodeSlug={episodeData.nextSlug ?? null}
        />
      </>
    )
  } catch (err) {
    // F-16: 진짜 404(회차/작품 부재)만 notFound 로 수렴. 네트워크/타임아웃/5xx 일시 오류는
    // 404 로 오분류하지 않고 오류 UI(재시도 유도)로 표시 — 부재와 장애를 구분한다.
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    return (
      <ErrorPopup message="회차를 불러오지 못했어요. 네트워크 문제이거나 일시적인 서버 오류일 수 있어요. 잠시 후 다시 시도해주세요." />
    )
  }
}
