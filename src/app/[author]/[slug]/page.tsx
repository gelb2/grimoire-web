import type { Metadata } from "next"
import { loadPublicWork, loadPublicEpisode } from "@/lib/public-reader-data"
import { WorkPage, type WorkData } from "@/features/reader/ui/WorkPage"
import { preloadAuthorText } from '@/lib/author-font-preload'

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string; slug: string }>
}

// 에피소드/작품별 동적 메타데이터
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author, slug } = await params

  try {
    // 모든 작가 — API에서 작품 메타데이터 시도
    const workData = await loadPublicWork(author, slug)
    const title = workData.work?.title ?? slug
    const description = workData.work?.description ?? `${author} — ${title}`

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Grimoire`,
        description,
      },
    }
  } catch {
    // API 실패 시 기본 메타데이터
    return {
      title: slug,
      description: `${author} — ${slug}`,
    }
  }
}

export default async function SlugPage({ params }: Props) {
  const { author, slug } = await params

  // 최초 HTML에 실제 목차/단일 회차를 포함해 로딩 UI 교체에 따른 이동을 없앤다.
  const initialWork: WorkData | undefined = await loadPublicWork(author, slug).catch(() => undefined)
  if (initialWork) preloadAuthorText([initialWork.title, ...(initialWork.episodes ?? []).map((ep: { title: string }) => ep.title)].join(' '))
  const onlyEpisode = initialWork?.episodes?.length === 1 ? initialWork.episodes[0] : undefined
  const initialEpisode = onlyEpisode
    ? await loadPublicEpisode(author, slug, onlyEpisode.slug).catch(() => undefined)
    : undefined
  return <WorkPage key={`${author}-${slug}`} authorSlug={author} workSlug={slug} initialWork={initialWork} initialEpisode={initialEpisode} />
}
