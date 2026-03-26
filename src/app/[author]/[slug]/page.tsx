import type { Metadata } from "next"
import { api } from "@/lib/api"
import { WorkPage } from "@/components/WorkPage"

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
    const workData = await api.getWork(author, slug)
    const title = workData.title
    const description = workData.description ?? `${author} — ${title}`

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

  // 모든 작가 동일 — [slug]은 작품 슬러그
  // WorkPage가 API 호출 + 에러 팝업 처리
  return <WorkPage authorSlug={author} workSlug={slug} />
}
