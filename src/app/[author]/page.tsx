import type { Metadata } from "next"
import { api } from "@/lib/api"
import { AuthorSpace } from "@/features/reader/ui/AuthorSpace"

// 완전 동적 — SSR on every request
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ author: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author } = await params

  try {
    // 서버 API에서 작가 정보 로드
    const authorData = await api.getAuthorSpace<any>(author)
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
  return <AuthorSpace authorSlug={author} />
}
