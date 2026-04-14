"use client"

import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { PlatformNav } from '@/components/PlatformNav'
import { QuickActions } from './_components/QuickActions'
import { WorkList } from './_components/WorkList'
import { StatsSection } from './_components/StatsSection'
import { ShareModal } from './_components/ShareModal'
import { ThemeSlots } from './_components/ThemeSlots'
import { CreditsSection } from './_components/CreditsSection'
import { useDashboardState } from './_components/useDashboardState'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const state = useDashboardState(user?.slug)

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-neutral-400">로딩 중...</p></div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 환영 — 에디토리얼 */}
        <div className="mb-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-3">YOUR SPACE</p>
          <h1 className="text-4xl md:text-5xl font-black text-black leading-tight mb-3">
            {user.name}
          </h1>
          <Link href={`/${user.slug}`} className="text-sm text-[#e53e3e] hover:underline" target="_blank">
            grimoire-book.com/{user.slug}
          </Link>
        </div>

        <QuickActions />

        {state.slotInfo && (
          <ThemeSlots
            userSlug={user.slug}
            slotInfo={state.slotInfo}
            showPresetPicker={state.showPresetPicker}
            presets={state.presets}
            creatingPreset={state.creatingPreset}
            onOpenPresetPicker={state.handleOpenPresetPicker}
            onClosePresetPicker={() => state.setShowPresetPicker(false)}
            onCreateFromPreset={state.handleCreateFromPreset}
            onReloadSlotInfo={state.loadSlotInfo}
          />
        )}

        <WorkList
          userSlug={user.slug}
          works={state.works}
          worksLoading={state.worksLoading}
          expandedWork={state.expandedWork}
          episodes={state.episodes}
          deletingWorks={state.deletingWorks}
          error={state.error}
          showNewWork={state.showNewWork}
          newWork={state.newWork}
          creating={state.creating}
          onSetShowNewWork={state.setShowNewWork}
          onSetNewWork={state.setNewWork}
          onCreateWork={state.handleCreateWork}
          onDeleteWork={state.handleDeleteWork}
          onLoadEpisodes={state.loadEpisodes}
          onStatusChange={state.handleStatusChange}
          onOpenShareModal={state.openShareModal}
          onUpdateWorks={state.setWorks}
        />

        <StatsSection
          works={state.works}
          selectedWorkId={state.selectedWorkId}
          onSelectWork={state.setSelectedWorkId}
          statsLoading={state.statsLoading}
          statsData={state.statsData}
        />

        <CreditsSection credits={user.credits} />
      </main>

      {state.shareModal && (
        <ShareModal
          modal={state.shareModal}
          result={state.shareResult}
          onCreateShare={state.handleCreateShare}
          onClose={state.closeShareModal}
        />
      )}
    </div>
  )
}
