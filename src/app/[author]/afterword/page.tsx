import { redirect } from "next/navigation"

// afterword는 작품(work)의 에피소드로 관리되어야 한다.
// 하드코딩된 DeerDevil 로컬 데이터 대신 작가 공간으로 리다이렉트.
interface Props {
  params: Promise<{ author: string }>
}

export default async function AfterwordPage({ params }: Props) {
  const { author } = await params
  redirect(`/${author}`)
}
