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
    // API 응답의 works를 ContentMeta 형태로 변환하여 전달
    if (authorData.works && authorData.works.length > 0) {
      return <UniverseLanding contents={authorData.works} />
    }
  } catch {
    // API 연결 안 되면 DeerDevil 폴백 (레거시 호환)
  }

  // 폴백: 로컬 데이터로 렌더링
  const { contents } = await import("@/features/universe/data")
  return <UniverseLanding contents={contents} />
}
