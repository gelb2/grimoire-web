'use client'

/**
 * /dashboard/episodes/[episodeId]/edit — 작가 본인 에피소드 본문 인라인 편집
 *
 * 신설 (2026-05-06 묶음 MM):
 * - 사용자 명시 — 5화 같은 특정 단락 텍스트 수정 (전체 파일 교체 패턴 외 인라인 편집 필요)
 * - server: GET /api/episodes/:episodeId/raw (작가 본인 검증 + rawMd 응답)
 * - 저장: PATCH /api/episodes/:episodeId/reupload (기존 reupload API 활용)
 *
 * 정책 정합:
 * - Constitution P3 작가 콘텐츠 보호 — 작가 본인 인증 필수 (server에서 강제)
 * - 본문 자동 저장 X (사용자 명시 저장만)
 * - 저장 시 RAG 자동 재인덱싱 (reupload usecase 정합)
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/features/auth'
import { api } from '@/lib/api'

interface EpisodeRaw {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  rawMd: string
  sourceFormat: string
  orderNum: number
}

export default function EpisodeEditPage() {
  const router = useRouter()
  const params = useParams<{ episodeId: string }>()
  const { user, loading: authLoading } = useAuth()
  const episodeId = params?.episodeId

  const [episode, setEpisode] = useState<EpisodeRaw | null>(null)
  const [rawMd, setRawMd] = useState('')
  const [originalRawMd, setOriginalRawMd] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // auth 가드
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  // episode rawMd fetch
  useEffect(() => {
    if (!episodeId || !user) return
    let cancelled = false
    setLoading(true)
    api.getEpisodeRaw(episodeId)
      .then(ep => {
        if (cancelled) return
        setEpisode(ep)
        setRawMd(ep.rawMd)
        setOriginalRawMd(ep.rawMd)
        setError(null)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message || '본문을 불러올 수 없어요')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [episodeId, user])

  const isDirty = rawMd !== originalRawMd

  // 저장 — 변경된 경우만 reupload API 호출
  const handleSave = useCallback(async () => {
    if (!episode || !isDirty) return
    if (rawMd.trim().length < 10) {
      toast.error('본문이 너무 짧아 저장할 수 없어요')
      return
    }

    setSaving(true)
    try {
      await api.reuploadEpisode(episode.id, {
        rawContent: rawMd,
        sourceFormat: episode.sourceFormat || 'markdown',
      })
      setOriginalRawMd(rawMd)
      toast.success('본문이 저장됐어요. RAG 재인덱싱은 백그라운드에서 진행됩니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }, [episode, rawMd, isDirty])

  // beforeunload 가드 (변경 미저장 시 경고)
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  if (authLoading || !user) return null

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm text-neutral-500">본문을 불러오는 중...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <Link href="/dashboard/episodes" className="text-sm text-[#e53e3e] underline">
          회차 목록으로
        </Link>
      </main>
    )
  }

  if (!episode) return null

  const label =
    episode.orderNum != null ? `${String(episode.orderNum).padStart(2, '0')}화 · ${episode.title}` : episode.title

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/episodes" className="text-xs text-neutral-500 hover:text-black">
            ← 회차 목록
          </Link>
          <h1 className="text-2xl font-bold text-black mt-2">{label}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            본문을 직접 편집합니다. 저장 시 기존 본문이 교체되고 RAG 재인덱싱이 자동 실행됩니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium">저장하지 않은 변경 있음</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-neutral-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <textarea
        value={rawMd}
        onChange={e => setRawMd(e.target.value)}
        spellCheck={false}
        className="w-full h-[70vh] px-4 py-3 border border-neutral-300 rounded-lg font-mono text-sm leading-relaxed focus:outline-none focus:border-black resize-y"
        placeholder="마크다운 본문..."
      />

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>포맷: {episode.sourceFormat}</span>
        <span>{rawMd.length.toLocaleString()}자</span>
      </div>
    </main>
  )
}
