import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { contents, episodeSlugs } from "@/features/universe/data"
import { EpisodeViewer } from "@/features/universe/ui/EpisodeViewer"
import { EpisodeFooter } from "@/features/universe/ui/EpisodeFooter"

interface Props {
  params: Promise<{ author: string; slug: string }>
}

// 정적 경로 생성 — Phase 0에서는 deerdevil 작가만
export function generateStaticParams() {
  return episodeSlugs.map((slug) => ({ author: "deerdevil", slug }))
}

// 에피소드별 동적 메타데이터
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
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
}

// 에피소드 데이터 동적 import
async function getEpisodeData(slug: string) {
  try {
    const mod = await import(`@/features/universe/data/contentDataSource/${slug}`)
    return mod.default
  } catch {
    return null
  }
}

export default async function EpisodePage({ params }: Props) {
  const { author, slug } = await params

  // slug가 에피소드/번외 목록에 없으면 404
  if (!episodeSlugs.includes(slug)) {
    notFound()
  }

  const meta = contents.find((c) => c.slug === slug)
  if (!meta) notFound()

  const data = await getEpisodeData(slug)
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
}
