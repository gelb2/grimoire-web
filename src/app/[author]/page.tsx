import type { Metadata } from "next"
import { UniverseLanding } from "@/features/universe/ui/UniverseLanding"

interface Props {
  params: Promise<{ author: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { author } = await params
  return {
    title: `${author} | Grimoire`,
    description: `${author}의 작가 공간 — Grimoire`,
    openGraph: {
      title: `${author} | Grimoire`,
      description: `${author}의 작가 공간`,
    },
  }
}

export default function AuthorPage() {
  return <UniverseLanding />
}
