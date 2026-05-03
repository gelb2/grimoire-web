"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/features/auth"
import { ThemeProvider } from "@/features/theme"
import type { AuthorTheme } from "@/features/theme/presets"
import { AuthorSpace } from "@/features/reader/ui/AuthorSpace"
import { EpisodeViewer } from "@/features/reader/ui/EpisodeViewer"
import type { AuthorData } from "@/features/reader/ui/layouts"
import { themePresets } from "@/features/theme/presets"
import { useThemeEditorStore, inferTabFromField } from "@/stores/useThemeEditorStore"
import { useThemeName } from "./_hooks/useThemeName"

import { OptionsPanel } from "./_components/OptionsPanel"
import { PreviewTabBar } from "./_components/PreviewTabBar"
import { ThemeCreateModeSelector } from "./_components/ThemeCreateModeSelector"
import { AIGenerateScreen } from "./_components/AIGenerateScreen"
import { PresetSelectScreen } from "./_components/PresetSelectScreen"
import { DUMMY_META, DUMMY_EPISODE } from "./_components/previewData"

// ── 메인 에디터 (useSearchParams 사용) ──
function ThemeEditorInner() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editThemeId = searchParams.get("id")

  const [createMode, setCreateMode] = useState<'select' | 'ai' | 'preset' | 'editor'>(editThemeId ? 'editor' : 'select')
  const [theme, setTheme] = useState<AuthorTheme | null>(null)
  const [themeId, setThemeId] = useState<string | null>(null)
  // 테마 이름 + preset 자동 동기 정책 — useThemeName hook (P2-#10 UX, AC-1~AC-5)
  const { themeName, handleNameChange, setNameFromServer, syncNameFromPreset } = useThemeName("")
  const [previewData, setPreviewData] = useState<AuthorData | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const { previewTab, setPreviewTab, autoSwitchTab, resetManualSwitch } = useThemeEditorStore()

  // 테마 + 프리뷰 데이터 로드
  useEffect(() => {
    if (authLoading || !user) return
    const loadTheme = async () => {
      try {
        let themeData: any
        if (editThemeId) {
          themeData = await api.getThemeById(editThemeId)
        } else {
          themeData = await api.getTheme(user.slug)
        }
        if (themeData.theme) { setTheme(themeData.theme); setThemeId(themeData.id); setNameFromServer(themeData.name ?? '') }
        else if (themeData.overrides) { setTheme(themeData.overrides); setThemeId(themeData.id); setNameFromServer(themeData.name ?? '') }

        const authorRes = await api.getAuthorSpace<any>(user.slug)
        const authorInfo = authorRes.author ?? authorRes
        const works = authorRes.works ?? authorInfo.works ?? []
        const worksWithEpisodes = await Promise.all(
          works.map(async (work: { slug: string }) => {
            try {
              const workRes = await api.getWork<any>(user.slug, work.slug)
              return { ...work, episodes: workRes.episodes ?? workRes.work?.episodes ?? [] }
            } catch { return work }
          })
        )
        setPreviewData({ id: authorInfo.id, slug: authorInfo.slug ?? user.slug, name: authorInfo.name ?? user.slug, description: authorInfo.description, works: worksWithEpisodes })
      } catch { setMessage("테마를 불러올 수 없습니다.") }
    }
    loadTheme()
    // setNameFromServer는 useCallback([]) 안정 — 의존성 추가 불요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, editThemeId])

  const handleChange = useCallback((partial: Partial<AuthorTheme>) => {
    setTheme(prev => prev ? { ...prev, ...partial } : prev)
    const fieldName = Object.keys(partial)[0]
    if (fieldName) {
      const targetTab = inferTabFromField(fieldName)
      if (targetTab) autoSwitchTab(targetTab)
      if (!targetTab) resetManualSwitch()
    }
  }, [autoSwitchTab, resetManualSwitch])

  const handlePresetChange = useCallback((presetName: string, label?: string) => {
    if (!presetName || !themePresets[presetName as keyof typeof themePresets]) return
    setTheme(themePresets[presetName as keyof typeof themePresets])
    // 프리셋 선택 시 이름 자동 동기 — useThemeName이 userEditedName flag를 보고 보존/덮어쓰기 결정 (P2-#10 UX).
    syncNameFromPreset(label)
  }, [syncNameFromPreset])

  const handleSave = useCallback(async () => {
    if (!themeId || !theme || !user) return
    setSaving(true); setMessage("")
    try {
      await api.updateTheme(themeId, theme as unknown as Record<string, unknown>, themeName || undefined)
      // 저장 후 CSS 베이킹 (작가 공간에 바로 반영)
      try { await api.publishTheme(user.slug) } catch { /* 베이킹 실패는 무시 — API 폴백 */ }
      // 작가공간 SSR 캐시 재검증 — 현재 편집 중인 테마가 활성 테마면 즉시 반영
      router.refresh()
      setMessage("저장 완료 — 작가 공간에 반영됩니다")
    } catch { setMessage("저장 실패") }
    setSaving(false)
  }, [themeId, theme, themeName, user, router])

  const handleActivate = useCallback(async () => {
    if (!themeId || !user) return
    setSaving(true); setMessage("")
    try {
      await api.activateTheme(themeId)
      try { await api.publishTheme(user.slug) } catch { /* 베이킹 실패 무시 */ }
      // 작가공간 SSR 캐시 재검증 — defaultThemeId 변경 즉시 반영
      router.refresh()
      setMessage("이 테마가 내 작가 공간의 기본 테마로 활성화되었습니다")
    } catch (e: any) { setMessage(e.message || "활성화 실패") }
    setSaving(false)
  }, [themeId, user, router])

  const handleGenerate = useCallback(async (description: string) => {
    if (!user) return
    setSaving(true); setMessage("")
    try {
      const result = await api.generateTheme(description)
      setTheme(result.preview as unknown as AuthorTheme)
      setThemeId(result.themeId)
      setMessage("AI 테마 생성 완료! (1 크레딧 사용)")
      // 크레딧 1개 차감 반영 — 네비바/대시보드 숫자 동기화
      refreshUser().catch(() => {})
    } catch (e: any) {
      setMessage(e.message || "테마 생성 실패")
      // 실패 시에도 서버가 환불했을 수 있으니 동기화
      refreshUser().catch(() => {})
    }
    setSaving(false)
  }, [user, refreshUser])

  if (authLoading) return <div className="flex items-center justify-center h-screen text-gray-500">로딩 중...</div>
  if (!user) return <div className="flex items-center justify-center h-screen text-gray-500">로그인이 필요합니다.</div>

  if (createMode === 'select') {
    return <ThemeCreateModeSelector onSelectAI={() => setCreateMode('ai')} onSelectPreset={() => setCreateMode('preset')} />
  }

  if (createMode === 'ai' && !theme) {
    return <AIGenerateScreen saving={saving} message={message} onBack={() => setCreateMode('select')}
      onGenerate={async (prompt) => { await handleGenerate(prompt); setCreateMode('editor') }} />
  }

  if (createMode === 'preset' && !theme) {
    return <PresetSelectScreen message={message} onBack={() => setCreateMode('select')}
      onSelect={(preset, id) => { setTheme(preset); setThemeId(id); setCreateMode('editor'); setMessage('프리셋 적용 완료') }} />
  }

  if (!theme) return <div className="flex items-center justify-center h-screen text-gray-500">테마 로딩 중...</div>

  return (
    <div className="flex h-screen">
      <OptionsPanel theme={theme} themeName={themeName} onNameChange={handleNameChange} onChange={handleChange} onPresetChange={handlePresetChange}
        onSave={handleSave} onActivate={handleActivate} onGenerate={handleGenerate} saving={saving} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <PreviewTabBar current={previewTab} onTabChange={setPreviewTab} />
        {message && <div className="bg-white border-b border-gray-200 px-4 py-2 text-sm text-gray-700">{message}</div>}
        <div className="flex-1 overflow-y-auto"
          onClickCapture={(e) => { const anchor = (e.target as HTMLElement).closest("a"); if (anchor) { e.preventDefault(); e.stopPropagation() } }}>
          <ThemeProvider theme={theme}>
            {previewTab === "authorSpace" ? (
              <AuthorSpace authorSlug={user.slug} previewData={previewData ?? undefined} />
            ) : (
              <EpisodeViewer meta={DUMMY_META} data={DUMMY_EPISODE} authorName={user.name ?? user.slug} />
            )}
          </ThemeProvider>
        </div>
      </div>
    </div>
  )
}

export default function ThemeEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-500">로딩 중...</div>}>
      <ThemeEditorInner />
    </Suspense>
  )
}
