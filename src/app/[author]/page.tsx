import type { Metadata } from "next"
import { api } from "@/lib/api"
import { UniverseLanding } from "@/features/universe/ui/UniverseLanding"

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author } = await params

  try {
    // 서버 API에서 작가 정보 로드
    const authorData = await api.getAuthorSpace(author)
    return {
      title: `${authorData.name || author} | Grimoire`,
      description: authorData.description || `${author}의 작가 공간 — Grimoire`,
      openGraph: {
        title: `${authorData.name || author} | Grimoire`,
        description: authorData.description || `${author}의 작가 공간`,
      },
    }
  } catch {
    // API 연결 안 되면 기본 메타데이터
    return {
      title: `${author} | Grimoire`,
      description: `${author}의 작가 공간 — Grimoire`,
      openGraph: {
        title: `${author} | Grimoire`,
        description: `${author}의 작가 공간`,
      },
    }
  }
}

export default async function AuthorPage({ params }: Props) {
  const { author } = await params

  // DeerDevil은 로컬 데이터가 풍부하므로 우선 사용
  // 다른 작가는 서버 API에서 로드
  if (author === 'deerdevil') {
    const { contents } = await import("@/features/universe/data")
    return <UniverseLanding contents={contents} />
  }

  try {
    // 서버 API에서 작가 공간 + 작품 목록 로드
    const authorData = await api.getAuthorSpace(author)

    if (authorData.works && authorData.works.length > 0) {
      const work = authorData.works[0]
      try {
        const workData = await api.getWork(author, work.slug)
        if (workData.episodes && workData.episodes.length > 0) {
          const episodeContents = workData.episodes.map((ep: any) => ({
            slug: ep.slug,
            type: ep.slug.startsWith('bonus') ? 'bonus' : ep.slug === 'preface' ? 'preface' : ep.slug === 'afterword' ? 'afterword' : 'episode',
            title: ep.title,
            subtitle: ep.subtitle || undefined,
            description: '',
          }))
          return <UniverseLanding contents={episodeContents} />
        }
      } catch {
        // 에피소드 로드 실패 시 폴백
      }
    }
  } catch {
    // API 연결 안 되면 폴백
  }

  // 폴백: 로컬 데이터
  const { contents } = await import("@/features/universe/data")
  return <UniverseLanding contents={contents} />
}
