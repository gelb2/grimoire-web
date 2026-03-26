import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { api } from "@/lib/api"
import { EpisodeViewer } from "@/features/universe/ui/EpisodeViewer"
import { EpisodeFooter } from "@/features/universe/ui/EpisodeFooter"

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string; slug: string }>
}

// 에피소드별 동적 메타데이터
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author, slug } = await params

  try {
    // 서버 API에서 에피소드 메타데이터 로드
    const episode = await api.getEpisode(author, slug, slug)
    const title = episode.title
    const description = episode.description ?? `${author} — ${title}`

    return {
      title,
      description,
      openGraph: {
        title: `${title} | ${author}`,
        description,
        type: "article",
      },
      twitter: {
        card: "summary",
        title: `${title} | ${author}`,
        description,
      },
    }
  } catch {
    // API 연결 안 되면 로컬 데이터에서 메타데이터 로드
    try {
      const { contents } = await import("@/features/universe/data")
      const meta = contents.find((c) => c.slug === slug)
      if (!meta) return {}

      const title = meta.title
      const description = meta.description ?? `사슴악마 — ${meta.title}`

      return {
        title,
        description,
        openGraph: {
          title: `${title} | 사슴악마`,
          description,
          type: "article",
        },
        twitter: {
          card: "summary",
          title: `${title} | 사슴악마`,
          description,
        },
      }
    } catch {
      return {}
    }
  }
}

export default async function EpisodePage({ params }: Props) {
  const { author, slug } = await params

  try {
    // 서버 API에서 에피소드 로드
    const episode = await api.getEpisode(author, slug, slug)
    const meta = {
      slug: episode.slug || slug,
      type: episode.type || "episode" as const,
      num: episode.num,
      title: episode.title,
      subtitle: episode.subtitle,
      description: episode.description,
    }

    return (
      <>
        <EpisodeViewer meta={meta} data={episode} />
        <EpisodeFooter
          episodeId={episode.id || slug}
          authorSlug={author}
          workSlug={slug}
          prevEpisodeSlug={episode.prevSlug ?? null}
          nextEpisodeSlug={episode.nextSlug ?? null}
        />
      </>
    )
  } catch {
    // DeerDevil 폴백 — 로컬 데이터에서 로드
  }

  // 폴백: 로컬 데이터
  try {
    const { contents, episodeSlugs } = await import("@/features/universe/data")

    if (!episodeSlugs.includes(slug)) {
      notFound()
    }

    const meta = contents.find((c) => c.slug === slug)
    if (!meta) notFound()

    const mod = await import(`@/features/universe/data/contentDataSource/${slug}`)
    const data = mod.default
    if (!data) notFound()

    // 이전/다음 에피소드 계산
    const currentIdx = episodeSlugs.indexOf(slug)
    const prevEpisodeSlug = currentIdx > 0 ? episodeSlugs[currentIdx - 1] : null
    const nextEpisodeSlug = currentIdx < episodeSlugs.length - 1 ? episodeSlugs[currentIdx + 1] : null

    return (
      <>
        <EpisodeViewer meta={meta} data={data} />
        <EpisodeFooter
          episodeId={slug}
          authorSlug={author}
          workSlug={slug}
          prevEpisodeSlug={prevEpisodeSlug ? `${prevEpisodeSlug}` : null}
          nextEpisodeSlug={nextEpisodeSlug ? `${nextEpisodeSlug}` : null}
        />
      </>
    )
  } catch {
    notFound()
  }
}
