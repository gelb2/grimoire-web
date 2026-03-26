import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import { EpisodeViewer } from "@/features/universe/ui/EpisodeViewer"
import { EpisodeFooter } from "@/features/universe/ui/EpisodeFooter"
import { EpisodeNav } from "@/features/universe/ui/EpisodeNav"

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string; slug: string; episode: string }>
}

// 에피소드 메타데이터
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author, slug, episode } = await params

  try {
    const episodeData = await api.getEpisode(author, slug, episode)
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
    // 에피소드 + 작가 정보 동시 로드
    const [episodeData, authorData] = await Promise.all([
      api.getEpisode(author, slug, episode),
      api.getAuthorSpace(author).catch(() => null),
    ])

    const meta = {
      slug: episodeData.slug || episode,
      type: episodeData.type || "episode" as const,
      num: episodeData.num,
      title: episodeData.title,
      subtitle: episodeData.subtitle,
      description: episodeData.description,
    }

    // 작가 이름: API 응답 > 작가 공간 > slug 폴백
    const authorName = episodeData.authorName || authorData?.name || author
    // 작품 제목: 에피소드 응답에 포함된 workTitle 또는 slug 폴백
    const workTitle = episodeData.workTitle || slug

    return (
      <>
        <EpisodeNav
          authorSlug={author}
          workSlug={slug}
          authorName={authorName}
          workTitle={workTitle}
        />
        <EpisodeViewer meta={meta} data={episodeData} authorName={authorName} />
        <EpisodeFooter
          episodeId={episodeData.id || episode}
          authorSlug={author}
          workSlug={slug}
          prevEpisodeSlug={episodeData.prevSlug ?? null}
          nextEpisodeSlug={episodeData.nextSlug ?? null}
        />
      </>
    )
  } catch {
    notFound()
  }
}
