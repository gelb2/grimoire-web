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

  try {
    // 서버 API에서 작가 공간 + 작품 목록 로드
    const authorData = await api.getAuthorSpace(author)

    // 작품이 있으면 첫 번째 작품의 에피소드 목록을 가져와서 표시
    if (authorData.works && authorData.works.length > 0) {
      const work = authorData.works[0]
      // 작품의 에피소드 목록 가져오기
      try {
        const workData = await api.getWork(author, work.slug)
        if (workData.episodes && workData.episodes.length > 0) {
          // 서버 에피소드를 ContentMeta 형태로 변환
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
    // API 연결 안 되면 DeerDevil 폴백 (레거시 호환)
  }

  // 폴백: 로컬 데이터로 렌더링
  const { contents } = await import("@/features/universe/data")
  return <UniverseLanding contents={contents} />
}
