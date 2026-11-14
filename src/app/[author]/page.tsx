import type { Metadata } from "next"
import { loadPublicAuthor, loadPublicWork } from "@/lib/public-reader-data"
import { AuthorSpace } from "@/features/reader/ui/AuthorSpace"
import type { AuthorData, Work } from "@/features/reader/ui/layouts"
import { preloadAuthorText } from '@/lib/author-font-preload'

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author } = await params

  try {
    // 서버 API에서 작가 정보 로드
    const authorData = await loadPublicAuthor(author)
    const authorName = authorData.author?.name ?? author
    const authorDesc = authorData.author?.bio ?? `${author}의 작가 공간`
    return {
      title: authorName,
      description: authorDesc,
      openGraph: {
        title: `${authorName} | Grimoire`,
        description: authorDesc,
      },
    }
  } catch {
    // API 연결 안 되면 기본 메타데이터
    return {
      title: author,
      description: `${author}의 작가 공간`,
      openGraph: {
        title: `${author} | Grimoire`,
        description: `${author}의 작가 공간`,
      },
    }
  }
}

// 모든 작가에 동일한 AuthorSpace 컴포넌트 사용 — DeerDevil 특별 분기 없음
export default async function AuthorPage({ params }: Props) {
  const { author } = await params
  let initialData: AuthorData | undefined
  try {
    const res = await loadPublicAuthor(author)
    const info = res.author ?? res
    const works: Work[] = res.works ?? info.works ?? []
    const worksWithEpisodes = await Promise.all(works.map(async work => {
      const data = await loadPublicWork(author, work.slug).catch(() => null)
      return data ? { ...work, episodes: data.episodes ?? data.work?.episodes ?? [] } : work
    }))
    initialData = { id: info.id, slug: info.slug ?? author, name: info.name ?? author, description: info.description, works: worksWithEpisodes }
    preloadAuthorText([initialData.name, ...worksWithEpisodes.flatMap(work => [work.title, ...(work.episodes ?? []).map((ep: { title: string }) => ep.title)])].join(' '))
  } catch {
    // 기존 클라이언트의 재시도/오류 표시 경로를 유지한다.
  }
  return <AuthorSpace key={author} authorSlug={author} initialData={initialData} />
}
