import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import { EpisodeViewer } from "@/features/universe/ui/EpisodeViewer"
import { EpisodeFooter } from "@/features/universe/ui/EpisodeFooter"

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
    const title = episodeData.title
    const description = episodeData.description ?? `${author} — ${title}`

    return {
      title: `${title} | Grimoire`,
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
    return {}
  }
}

export default async function EpisodePage({ params }: Props) {
  const { author, slug, episode } = await params

  try {
    const episodeData = await api.getEpisode(author, slug, episode)
    const meta = {
      slug: episodeData.slug || episode,
      type: episodeData.type || "episode" as const,
      num: episodeData.num,
      title: episodeData.title,
      subtitle: episodeData.subtitle,
      description: episodeData.description,
    }

    return (
      <>
        <EpisodeViewer meta={meta} data={episodeData} />
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
