import { api } from "@/lib/api"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/episodes/shared/${token}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { title: '공유 링크 | Grimoire' }
    const data = await res.json()
    return {
      title: `${data.title || '공유 에피소드'} | Grimoire`,
      description: data.subtitle || '공유된 에피소드입니다.',
    }
  } catch {
    return { title: '공유 링크 | Grimoire' }
  }
}

export default async function SharedEpisodePage({ params }: Props) {
  const { token } = await params

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
    const res = await fetch(`${apiUrl}/episodes/shared/${token}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (res.status === 403) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">공유 링크 만료</h1>
              <p className="text-gray-500">이 공유 링크는 만료되었습니다. 로그인하여 확인하세요.</p>
            </div>
          </div>
        )
      }
      return notFound()
    }

    const episode = await res.json()

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="mb-8 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-400 mb-1">공유된 에피소드</p>
            <h1 className="text-3xl font-bold text-gray-900">{episode.title}</h1>
            {episode.subtitle && (
              <p className="text-lg text-gray-500 mt-1 italic">{episode.subtitle}</p>
            )}
          </div>
          <div className="prose prose-lg max-w-none">
            {(episode.blocks || []).map((block: any, idx: number) => {
              if (block.type === 'paragraph') return <p key={idx}>{block.text}</p>
              if (block.type === 'heading-1') return <h1 key={idx}>{block.title}</h1>
              if (block.type === 'heading-2') return <h2 key={idx}>{block.title}</h2>
              if (block.type === 'chapter') return <h3 key={idx}>{block.num ? `${block.num}. ` : ''}{block.title}</h3>
              if (block.type === 'italic') return <p key={idx} className="italic">{block.text}</p>
              if (block.type === 'bold') return <p key={idx} className="font-bold">{block.text}</p>
              if (block.type === 'separator') return <hr key={idx} />
              if (block.type === 'divider') return <div key={idx} className="text-center text-gray-300 my-8">· · ·</div>
              if (block.type === 'refrain') return <blockquote key={idx}>{block.text}</blockquote>
              return <p key={idx}>{block.text || ''}</p>
            })}
          </div>
        </div>
      </div>
    )
  } catch {
    return notFound()
  }
}
