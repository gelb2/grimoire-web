"use client"

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { ShareModalData, ShareResultData } from './ShareModal'
import type { WorkStatsData } from './StatsSection'

interface EpisodeItem {
  id: string
  slug: string
  title: string
  status: string
  orderNum: number
}

interface Work {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  episodeCount: number
  viewCount?: number
  coverImage?: string | null
}

interface PresetItem {
  name: string
  label: string
  tone: string
  genre: string
  preview: { bgPrimary: string; accent: string; textPrimary: string }
}

interface SlotInfoData {
  plan: string
  slotLimit: number
  slottedCount: number
  isExpired: boolean
  themes: any[]
}

export function useDashboardState(userSlug: string | undefined) {
  const [works, setWorks] = useState<Work[]>([])
  const [worksLoading, setWorksLoading] = useState(true)
  const [showNewWork, setShowNewWork] = useState(false)
  const [newWork, setNewWork] = useState({ title: '', slug: '', description: '' })
  const [creating, setCreating] = useState(false)
  const [deletingWorks, setDeletingWorks] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [selectedWorkId, setSelectedWorkId] = useState<string>('')
  const [statsData, setStatsData] = useState<WorkStatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [expandedWork, setExpandedWork] = useState<string | null>(null)
  const [episodes, setEpisodes] = useState<Record<string, EpisodeItem[]>>({})
  const [shareModal, setShareModal] = useState<ShareModalData | null>(null)
  const [shareResult, setShareResult] = useState<ShareResultData | null>(null)
  const [slotInfo, setSlotInfo] = useState<SlotInfoData | null>(null)
  const [showPresetPicker, setShowPresetPicker] = useState(false)
  const [presets, setPresets] = useState<PresetItem[]>([])
  const [creatingPreset, setCreatingPreset] = useState<string | null>(null)

  const loadSlotInfo = useCallback(async () => {
    try { setSlotInfo(await api.getSlotInfo()) } catch { /* 무시 */ }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    if (userSlug) {
      api.getAuthorSpace<any>(userSlug)
        .then(data => setWorks(data.works || []))
        .catch(() => { setWorks([]); toast.error('작품 목록을 불러올 수 없습니다') })
        .finally(() => setWorksLoading(false))
      loadSlotInfo()
    }
  }, [userSlug, loadSlotInfo])

  // 통계 로드
  useEffect(() => {
    if (!selectedWorkId) { setStatsData(null); return }
    setStatsLoading(true)
    api.getWorkStats(selectedWorkId)
      .then(setStatsData)
      .catch(() => { setStatsData(null); toast.error('통계 데이터를 불러올 수 없습니다') })
      .finally(() => setStatsLoading(false))
  }, [selectedWorkId])

  // 기본 작품 선택
  useEffect(() => {
    if (works.length > 0 && !selectedWorkId) setSelectedWorkId(works[0].id)
  }, [works, selectedWorkId])

  const handleCreateWork = async () => {
    if (!newWork.title.trim() || !newWork.slug.trim()) return
    setCreating(true); setError('')
    try {
      const work = await api.createWork(newWork) as any
      setWorks(prev => [...prev, { ...work, episodeCount: 0 }])
      setShowNewWork(false); setNewWork({ title: '', slug: '', description: '' })
    } catch (err: any) { setError(err.message || '작품 생성에 실패했습니다') }
    finally { setCreating(false) }
  }

  const handleDeleteWork = async (workId: string, title: string) => {
    if (deletingWorks.has(workId)) return
    if (!confirm(`"${title}"을(를) 삭제하시겠습니까? 모든 에피소드가 함께 삭제됩니다.`)) return
    setDeletingWorks(prev => new Set(prev).add(workId))
    try {
      await api.deleteWork(workId)
      setWorks(prev => prev.filter(w => w.id !== workId))
    } catch (err: any) { alert(err.message || '삭제에 실패했습니다') }
    finally {
      setDeletingWorks(prev => { const next = new Set(prev); next.delete(workId); return next })
    }
  }

  const loadEpisodes = async (workId: string, workSlug: string) => {
    if (expandedWork === workId) { setExpandedWork(null); return }
    setExpandedWork(workId)
    if (episodes[workId]) return
    try {
      const data = await api.getWork<{ episodes: EpisodeItem[] }>(userSlug!, workSlug)
      setEpisodes(prev => ({ ...prev, [workId]: data.episodes || [] }))
    } catch { toast.error('에피소드 목록을 불러올 수 없습니다') }
  }

  const handleStatusChange = async (workId: string, episodeId: string, status: 'upload' | 'public' | 'nonPublic') => {
    try {
      await api.updateEpisodeStatus(workId, episodeId, status)
      setEpisodes(prev => ({
        ...prev,
        [workId]: prev[workId]?.map(ep => ep.id === episodeId ? { ...ep, status } : ep) || [],
      }))
      const labels: Record<string, string> = { upload: '업로드', public: '공개', nonPublic: '비공개' }
      toast.success(`상태가 "${labels[status]}"(으)로 변경됐습니다`)
    } catch (err: any) { toast.error(err.message || '상태 변경 실패') }
  }

  const handleCreateShare = async (expireIn: '12h' | '24h' | '48h' | 'never') => {
    if (!shareModal) return
    try {
      const result = await api.createShareLink(shareModal.workId, shareModal.episodeId, expireIn)
      setShareResult({ sharedUrl: result.sharedUrl, expireAt: result.expireAt })
      setEpisodes(prev => ({
        ...prev,
        [shareModal.workId]: prev[shareModal.workId]?.map(ep =>
          ep.id === shareModal.episodeId ? { ...ep, status: 'shared' } : ep,
        ) || [],
      }))
    } catch (err: any) { toast.error(err.message || '공유 링크 생성 실패') }
  }

  const handleOpenPresetPicker = async () => {
    setShowPresetPicker(true)
    if (presets.length === 0) {
      try { setPresets(await api.getPresets()) } catch { toast.error('프리셋 목록을 불러올 수 없습니다') }
    }
  }

  const handleCreateFromPreset = async (presetName: string) => {
    setCreatingPreset(presetName)
    try {
      await api.createFromPreset(presetName)
      toast.success('테마가 생성되었습니다')
      setShowPresetPicker(false)
      loadSlotInfo()
    } catch (err: any) { toast.error(err.message || '테마 생성 실패') }
    finally { setCreatingPreset(null) }
  }

  const openShareModal = (workId: string, episodeId: string, title: string) => {
    setShareModal({ workId, episodeId, title })
    setShareResult(null)
  }

  const closeShareModal = () => setShareModal(null)

  return {
    // 작품 상태
    works, worksLoading, showNewWork, newWork, creating, deletingWorks, error,
    expandedWork, episodes,
    setShowNewWork, setNewWork, setWorks,
    handleCreateWork, handleDeleteWork, loadEpisodes, handleStatusChange,
    // 통계 상태
    selectedWorkId, statsData, statsLoading, setSelectedWorkId,
    // 공유 모달 상태
    shareModal, shareResult, handleCreateShare, openShareModal, closeShareModal,
    // 테마 슬롯 상태
    slotInfo, showPresetPicker, presets, creatingPreset,
    handleOpenPresetPicker, handleCreateFromPreset,
    setShowPresetPicker, loadSlotInfo,
  }
}
