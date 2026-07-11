import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ token: string }>
}

interface SharedEpisodeData {
  title?: string
  subtitle?: string
  blocks?: { type: string; text?: string; title?: string; num?: string }[]
}

async function fetchSharedEpisode(token: string): Promise<{ status: number; data: SharedEpisodeData | null }> {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api'
  try {
    // server 실제 라우트 = ContentController @Get('shared/:token') → /shared/:token (구 /episodes/shared 404)
    const res = await fetch(`${apiUrl}/shared/${token}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { status: res.status, data }
    }
    const data = await res.json()
    return { status: res.status, data }
  } catch {
    return { status: 500, data: null }
  }
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params
  const { status, data } = await fetchSharedEpisode(token)
  if (status !== 200 || !data) return { title: '공유 링크 | Grimoire' }
  return {
    title: `${data.title || '공유 에피소드'} | Grimoire`,
    description: data.subtitle || '공유된 에피소드입니다.',
  }
}

// 403 만료 페이지
function ExpiredLink() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">공유 링크 만료</h1>
        <p className="text-gray-500">이 공유 링크는 만료되었습니다. 로그인하여 확인하세요.</p>
      </div>
    </div>
  )
}

// 에피소드 본문 렌더링
function EpisodeContent({ episode }: { episode: SharedEpisodeData }) {
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
          {(episode.blocks || []).map((block, idx) => {
            if (block.type === 'paragraph') return <p key={idx}>{block.text}</p>
            if (block.type === 'heading-1') return <h1 key={idx}>{block.title}</h1>
            if (block.type === 'heading-2') return <h2 key={idx}>{block.title}</h2>
            if (block.type === 'chapter') return <h3 key={idx}>{block.num ? `${block.num}. ` : ''}{block.title}</h3>
            if (block.type === 'italic') return <p key={idx} className="italic">{block.text}</p>
            if (block.type === 'bold') return <p key={idx} className="font-bold">{block.text}</p>
            if (block.type === 'separator') return <hr key={idx} />
            if (block.type === 'divider') return <div key={idx} className="text-center text-gray-300 my-8">&middot; &middot; &middot;</div>
            if (block.type === 'refrain') return <blockquote key={idx}>{block.text}</blockquote>
            return <p key={idx}>{block.text || ''}</p>
          })}
        </div>
      </div>
    </div>
  )
}

export default async function SharedEpisodePage({ params }: Props) {
  const { token } = await params
  const { status, data } = await fetchSharedEpisode(token)

  if (status === 403) return <ExpiredLink />
  if (status !== 200 || !data) return notFound()

  return <EpisodeContent episode={data} />
}
