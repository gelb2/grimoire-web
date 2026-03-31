"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface SharedEpisode {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  type: string
  orderNum: number
  blocks: Array<{ type: string; text?: string; title?: string; children?: any[] }>
  status: string
}

export default function SharedEpisodePage() {
  const params = useParams()
  const token = params.token as string
  const [episode, setEpisode] = useState<SharedEpisode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.getSharedEpisode<SharedEpisode>(token)
      .then(setEpisode)
      .catch(err => setError(err.message || '공유 링크에 접근할 수 없습니다'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-400">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-600 text-lg">{error}</p>
        <a href="/login" className="text-sm text-blue-600 hover:underline">로그인 하기</a>
      </div>
    )
  }

  if (!episode) return null

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">SHARED EPISODE</p>
          <h1 className="text-3xl font-black text-black mb-2">{episode.title}</h1>
          {episode.subtitle && <p className="text-neutral-500">{episode.subtitle}</p>}
        </div>

        <div className="prose prose-neutral max-w-none">
          {episode.blocks.map((block, i) => (
            <div key={i} className="mb-4">
              {block.type === 'heading-1' && <h2 className="text-2xl font-bold mt-8 mb-4">{block.title || block.text}</h2>}
              {block.type === 'heading-2' && <h3 className="text-xl font-bold mt-6 mb-3">{block.title || block.text}</h3>}
              {block.type === 'paragraph' && <p className="leading-relaxed text-neutral-800">{block.text}</p>}
              {block.type === 'separator' && <hr className="my-8 border-neutral-200" />}
              {block.type === 'divider' && <hr className="my-6 border-neutral-200" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
