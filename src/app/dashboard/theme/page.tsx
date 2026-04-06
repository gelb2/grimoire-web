"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/features/auth"
import { ThemeProvider, useTheme } from "@/features/theme"
import type { AuthorTheme, ThemeDecorations } from "@/features/theme/presets"
import { AuthorSpace } from "@/features/reader/ui/AuthorSpace"
import type { AuthorData } from "@/features/reader/ui/layouts"
import { themePresets } from "@/features/theme/presets"

// ── 색상 입력 ──
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ── 셀렉트 ──
function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value as T)} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

// ── 옵션 패널 (좌측) ──
function OptionsPanel({ theme, onChange, onPresetChange, onSave, onPublish, onGenerate, saving, slotInfo, onSlotToggle }: {
  theme: AuthorTheme
  onChange: (partial: Partial<AuthorTheme>) => void
  onPresetChange: (preset: string) => void
  onSave: () => void
  onPublish: () => void
  onGenerate: (description: string) => void
  saving: boolean
  slotInfo: { plan: string; slotLimit: number; slottedCount: number; isExpired: boolean; themes: any[] } | null
  onSlotToggle: (themeId: string, isSlotted: boolean) => void
}) {
  const [aiPrompt, setAiPrompt] = useState("")

  const updateDeco = (partial: Partial<ThemeDecorations>) => {
    onChange({ decorations: { ...theme.decorations, ...partial } })
  }

  return (
    <div className="w-80 shrink-0 bg-white border-r border-gray-200 overflow-y-auto h-screen p-4 space-y-6">
      {/* 플랜 정보 */}
      {slotInfo && (
        <section className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase">{slotInfo.plan} 플랜</span>
            {slotInfo.isExpired && <span className="text-xs text-red-500 font-bold">만료됨</span>}
          </div>
          <p className="text-sm text-gray-700">슬롯: {slotInfo.slottedCount} / {slotInfo.slotLimit == null || slotInfo.slotLimit === Infinity ? '∞' : slotInfo.slotLimit}</p>
        </section>
      )}

      {/* 만기 경고 */}
      {slotInfo?.isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          구독이 만료되어 시스템 기본 테마가 적용됩니다. 플랜을 갱신하세요.
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button onClick={onSave} disabled={saving || slotInfo?.isExpired} className="flex-1 px-3 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
        <button onClick={onPublish} disabled={saving || slotInfo?.isExpired} className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-500 disabled:opacity-50">
          퍼블리시
        </button>
      </div>

      {/* AI 테마 생성 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">AI로 테마 생성</h3>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="원하는 분위기를 자유롭게 설명하세요..."
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm h-24 resize-none"
        />
        <button
          onClick={() => { if (aiPrompt.trim()) onGenerate(aiPrompt.trim()) }}
          disabled={saving || !aiPrompt.trim() || !!slotInfo?.isExpired || !!(slotInfo && slotInfo.slotLimit != null && slotInfo.slottedCount >= slotInfo.slotLimit)}
          className="mt-2 w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "생성 중..." : "AI로 생성 (1 크레딧)"}
        </button>
        {slotInfo && slotInfo.slotLimit != null && slotInfo.slottedCount >= slotInfo.slotLimit && !slotInfo.isExpired && (
          <p className="text-xs text-red-500 mt-1">슬롯이 가득 찼습니다. 기존 테마를 슬롯에서 제거하세요.</p>
        )}
      </section>

      {/* 테마 슬롯 관리 */}
      {slotInfo && slotInfo.themes.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-900 mb-2">내 테마 ({slotInfo.themes.length}개)</h3>
          <div className="space-y-1">
            {slotInfo.themes.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50 text-sm">
                <span className="truncate flex-1">{t.name}</span>
                <button
                  onClick={() => onSlotToggle(t.id, t.isSlotted)}
                  disabled={slotInfo.isExpired}
                  className={`ml-2 px-2 py-0.5 text-xs rounded ${t.isSlotted ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                >
                  {t.isSlotted ? '활성' : '보관'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 프리셋 선택 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">프리셋</h3>
        <select onChange={e => onPresetChange(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white">
          <option value="">현재 설정 유지</option>
          {Object.keys(themePresets).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </section>

      {/* 색상 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">색상</h3>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="배경" value={theme.bgPrimary} onChange={v => onChange({ bgPrimary: v })} />
          <ColorField label="배경2" value={theme.bgSecondary} onChange={v => onChange({ bgSecondary: v })} />
          <ColorField label="텍스트" value={theme.textPrimary} onChange={v => onChange({ textPrimary: v })} />
          <ColorField label="뮤트" value={theme.textMuted} onChange={v => onChange({ textMuted: v })} />
          <ColorField label="딤" value={theme.textDim} onChange={v => onChange({ textDim: v })} />
          <ColorField label="밝은" value={theme.textBright} onChange={v => onChange({ textBright: v })} />
          <ColorField label="액센트" value={theme.accent} onChange={v => onChange({ accent: v })} />
          <ColorField label="액센트2" value={theme.accent2} onChange={v => onChange({ accent2: v })} />
          <ColorField label="보더" value={theme.border} onChange={v => onChange({ border: v })} />
        </div>
      </section>

      {/* 타이포그래피 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">타이포그래피</h3>
        <div className="space-y-2">
          <SelectField label="본문 폰트" value={theme.fontBody} options={[{ value: "serif", label: "세리프" }, { value: "sans-serif", label: "산세리프" }, { value: "monospace", label: "고정폭" }]} onChange={v => onChange({ fontBody: v })} />
          <SelectField label="제목 폰트" value={theme.fontHeading ?? "serif"} options={[{ value: "serif", label: "세리프" }, { value: "sans-serif", label: "산세리프" }, { value: "monospace", label: "고정폭" }]} onChange={v => onChange({ fontHeading: v })} />
          <SelectField label="제목 크기" value={theme.titleSize ?? "lg"} options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "xl", label: "XL" }]} onChange={v => onChange({ titleSize: v })} />
          <SelectField label="제목 두께" value={theme.titleWeight ?? "bold"} options={[{ value: "light", label: "가벼운" }, { value: "normal", label: "보통" }, { value: "bold", label: "굵은" }, { value: "black", label: "매우 굵은" }]} onChange={v => onChange({ titleWeight: v })} />
          <SelectField label="본문 크기" value={theme.bodySize ?? "normal"} options={[{ value: "compact", label: "작게" }, { value: "normal", label: "보통" }, { value: "large", label: "크게" }]} onChange={v => onChange({ bodySize: v })} />
          <SelectField label="행간" value={theme.bodyLineHeight ?? "relaxed"} options={[{ value: "compact", label: "좁게" }, { value: "normal", label: "보통" }, { value: "relaxed", label: "넓게" }]} onChange={v => onChange({ bodyLineHeight: v })} />
          <SelectField label="자간" value={theme.letterSpacing ?? "normal"} options={[{ value: "tight", label: "좁게" }, { value: "normal", label: "보통" }, { value: "wide", label: "넓게" }]} onChange={v => onChange({ letterSpacing: v })} />
        </div>
      </section>

      {/* 레이아웃 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">레이아웃</h3>
        <div className="space-y-2">
          <SelectField label="에피소드 목록" value={theme.episodeListLayout} options={[{ value: "series", label: "시리즈" }, { value: "grid", label: "그리드" }, { value: "magazine", label: "매거진" }, { value: "gallery", label: "갤러리" }, { value: "minimal", label: "미니멀" }]} onChange={v => onChange({ episodeListLayout: v })} />
          <SelectField label="히어로 스타일" value={theme.heroStyle ?? "minimal"} options={[{ value: "minimal", label: "미니멀" }, { value: "fullname", label: "풀네임" }, { value: "cover", label: "커버" }, { value: "none", label: "없음" }]} onChange={v => onChange({ heroStyle: v })} />
          <SelectField label="톤" value={theme.tone} options={[{ value: "dark", label: "다크" }, { value: "light", label: "라이트" }, { value: "sepia", label: "세피아" }]} onChange={v => onChange({ tone: v })} />
          <SelectField label="애니메이션" value={theme.animation} options={[{ value: "typing", label: "타이핑" }, { value: "fade", label: "페이드" }, { value: "slide", label: "슬라이드" }, { value: "none", label: "없음" }]} onChange={v => onChange({ animation: v })} />
          <SelectField label="콘텐츠 폭" value={theme.contentWidth ?? "normal"} options={[{ value: "narrow", label: "좁게" }, { value: "normal", label: "보통" }, { value: "wide", label: "넓게" }]} onChange={v => onChange({ contentWidth: v })} />
          <label className="flex items-center gap-2 mt-1">
            <input type="checkbox" checked={theme.showPreface ?? true} onChange={e => onChange({ showPreface: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">일러두기 표시</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={theme.showAfterword ?? true} onChange={e => onChange({ showAfterword: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">후기 표시</span>
          </label>
        </div>
      </section>

      {/* 장식 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">장식</h3>
        <div className="space-y-2">
          <SelectField label="디바이더 아이콘" value={theme.decorations.dividerIcon} options={[{ value: "antler", label: "사슴뿔" }, { value: "flower", label: "꽃" }, { value: "star", label: "별" }, { value: "geometric", label: "기하학" }, { value: "brush", label: "붓" }, { value: "leaf", label: "잎" }, { value: "dot", label: "점" }, { value: "line", label: "선" }, { value: "none", label: "없음" }]} onChange={v => updateDeco({ dividerIcon: v })} />
          <ColorField label="디바이더 색상" value={theme.decorations.dividerColor || theme.accent} onChange={v => updateDeco({ dividerColor: v })} />
          <SelectField label="헤더 아이콘" value={theme.decorations.headerIcon} options={[{ value: "antler", label: "사슴뿔" }, { value: "quill", label: "깃펜" }, { value: "book", label: "책" }, { value: "dot", label: "점" }, { value: "none", label: "없음" }]} onChange={v => updateDeco({ headerIcon: v })} />
          <SelectField label="카드 악센트" value={theme.decorations.cardAccentPosition} options={[{ value: "left", label: "왼쪽" }, { value: "top", label: "상단" }, { value: "none", label: "없음" }]} onChange={v => updateDeco({ cardAccentPosition: v })} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">태그라인</span>
            <input type="text" value={theme.tagline ?? ""} onChange={e => onChange({ tagline: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Inspired by..." />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">헤더 서브타이틀</span>
            <input type="text" value={theme.decorations.headerSubtitle} onChange={e => updateDeco({ headerSubtitle: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Short Fiction Anthology" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">푸터 텍스트</span>
            <input type="text" value={theme.decorations.footerText} onChange={e => updateDeco({ footerText: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="ⓒ 2024 작가명" />
          </label>
        </div>
      </section>

      {/* 고급 설정 (접이식) */}
      <details className="group">
        <summary className="text-sm font-bold text-gray-900 cursor-pointer select-none flex items-center gap-1">
          <span className="transition-transform group-open:rotate-90">▶</span>
          고급 설정
        </summary>
        <div className="mt-3 space-y-2">
          <SelectField label="카드 둥글기" value={theme.cardRadius ?? "8px"} options={[{ value: "0", label: "없음" }, { value: "4px", label: "작게" }, { value: "8px", label: "보통" }, { value: "16px", label: "크게" }]} onChange={v => onChange({ cardRadius: v })} />
          <SelectField label="섹션 간격" value={theme.sectionSpacing ?? "md"} options={[{ value: "sm", label: "좁게" }, { value: "md", label: "보통" }, { value: "lg", label: "넓게" }]} onChange={v => onChange({ sectionSpacing: v })} />
          <SelectField label="소제목 스타일" value={theme.subtitleStyle ?? "italic"} options={[{ value: "italic", label: "이탤릭" }, { value: "normal", label: "보통" }]} onChange={v => onChange({ subtitleStyle: v })} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">타이핑 속도 (ms)</span>
            <input type="number" min={5} max={200} value={theme.typingSpeed ?? 50} onChange={e => onChange({ typingSpeed: Number(e.target.value) })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">네비 투명도</span>
            <input type="range" min={0} max={1} step={0.05} value={theme.navOpacity ?? 0.95} onChange={e => onChange({ navOpacity: Number(e.target.value) })} className="mt-1 block w-full" />
            <span className="text-xs text-gray-500">{theme.navOpacity ?? 0.95}</span>
          </label>
          <SelectField label="탭 버튼 둥글기" value={theme.tabPillRadius ?? "20px"} options={[{ value: "4px", label: "약간" }, { value: "20px", label: "보통" }, { value: "9999px", label: "완전 둥글게" }]} onChange={v => onChange({ tabPillRadius: v })} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">라벨 자간</span>
            <input type="text" value={theme.labelLetterSpacing ?? "0.25em"} onChange={e => onChange({ labelLetterSpacing: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="0.25em" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">카드 워터마크 투명도</span>
            <input type="range" min={0} max={0.5} step={0.01} value={theme.cardWatermarkOpacity ?? 0.15} onChange={e => onChange({ cardWatermarkOpacity: Number(e.target.value) })} className="mt-1 block w-full" />
            <span className="text-xs text-gray-500">{theme.cardWatermarkOpacity ?? 0.15}</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">카드 호버 상승</span>
            <input type="text" value={theme.cardHoverLift ?? "0.125rem"} onChange={e => onChange({ cardHoverLift: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="0.125rem" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">카드 CTA 텍스트</span>
            <input type="text" value={theme.cardCtaText ?? "읽기 →"} onChange={e => onChange({ cardCtaText: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="읽기 →" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">에피소드 라벨 포맷</span>
            <input type="text" value={theme.episodeLabelFormat ?? "{author} · {type} {num}"} onChange={e => onChange({ episodeLabelFormat: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="{author} · {type} {num}" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={theme.showProfileTab ?? true} onChange={e => onChange({ showProfileTab: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">프로필 탭 표시</span>
          </label>
        </div>
      </details>
    </div>
  )
}

// ── 메인 페이지 ──
export default function ThemeEditorPage() {
  const { user, loading: authLoading } = useAuth()
  const [theme, setTheme] = useState<AuthorTheme | null>(null)
  const [themeId, setThemeId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<AuthorData | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [slotInfo, setSlotInfo] = useState<{ plan: string; slotLimit: number; slottedCount: number; isExpired: boolean; themes: any[] } | null>(null)

  // 슬롯 정보 로드
  const loadSlotInfo = useCallback(async () => {
    try {
      const info = await api.getSlotInfo()
      setSlotInfo(info)
    } catch { /* 무시 */ }
  }, [])

  // 작가 테마 + 작가 데이터 로드
  useEffect(() => {
    if (authLoading || !user) return

    Promise.all([
      api.getTheme(user.slug),
      api.getAuthorSpace<any>(user.slug),
    ]).then(async ([themeRes, authorRes]) => {
      // 테마 로드 — /themes/{slug}는 resolveTheme 거친 완전한 theme 객체 반환
      const themeData = themeRes as any
      if (themeData.theme) {
        setTheme(themeData.theme)
        setThemeId(themeData.id)
      } else if (themeData.overrides) {
        // 폴백: overrides로 직접 사용
        setTheme(themeData.overrides)
        setThemeId(themeData.id)
      }

      // 프리뷰 데이터 로드
      const authorInfo = authorRes.author ?? authorRes
      const works = authorRes.works ?? authorInfo.works ?? []
      const worksWithEpisodes = await Promise.all(
        works.map(async (work: { slug: string }) => {
          try {
            const workRes = await api.getWork<any>(user.slug, work.slug)
            return { ...work, episodes: workRes.episodes ?? workRes.work?.episodes ?? [] }
          } catch {
            return work
          }
        })
      )

      setPreviewData({
        id: authorInfo.id,
        slug: authorInfo.slug ?? user.slug,
        name: authorInfo.name ?? user.slug,
        description: authorInfo.description,
        works: worksWithEpisodes,
      })
    }).catch(() => {
      setMessage("테마를 불러올 수 없습니다.")
    })
    loadSlotInfo()
  }, [authLoading, user, loadSlotInfo])

  const handleChange = useCallback((partial: Partial<AuthorTheme>) => {
    setTheme(prev => prev ? { ...prev, ...partial } : prev)
  }, [])

  const handlePresetChange = useCallback((presetName: string) => {
    if (!presetName || !themePresets[presetName as keyof typeof themePresets]) return
    setTheme(themePresets[presetName as keyof typeof themePresets])
  }, [])

  const handleSave = useCallback(async () => {
    if (!themeId || !theme) return
    setSaving(true)
    setMessage("")
    try {
      await api.updateTheme(themeId, theme as unknown as Record<string, unknown>)
      setMessage("저장 완료")
    } catch {
      setMessage("저장 실패")
    }
    setSaving(false)
  }, [themeId, theme])

  const handleGenerate = useCallback(async (description: string) => {
    if (!user) return
    setSaving(true)
    setMessage("")
    try {
      const result = await api.generateTheme(user.id, description)
      setTheme(result.preview as unknown as AuthorTheme)
      setThemeId(result.themeId)
      setMessage("AI 테마 생성 완료! (1 크레딧 사용)")
      loadSlotInfo()
    } catch (e: any) {
      setMessage(e.message || "테마 생성 실패")
    }
    setSaving(false)
  }, [user, loadSlotInfo])

  const handleSlotToggle = useCallback(async (themeId: string, currentlySlotted: boolean) => {
    try {
      if (currentlySlotted) {
        await api.removeThemeSlot(themeId)
      } else {
        await api.assignThemeSlot(themeId)
      }
      loadSlotInfo()
    } catch (e: any) {
      setMessage(e.message || "슬롯 변경 실패")
    }
  }, [loadSlotInfo])

  const handlePublish = useCallback(async () => {
    if (!user) return
    setSaving(true)
    setMessage("")
    try {
      await api.publishTheme(user.slug)
      setMessage("퍼블리시 완료")
    } catch {
      setMessage("퍼블리시 실패")
    }
    setSaving(false)
  }, [user])

  if (authLoading) return <div className="flex items-center justify-center h-screen text-gray-500">로딩 중...</div>
  if (!user) return <div className="flex items-center justify-center h-screen text-gray-500">로그인이 필요합니다.</div>
  if (!theme) return <div className="flex items-center justify-center h-screen text-gray-500">테마 로딩 중...</div>

  return (
    <div className="flex h-screen">
      {/* 좌측: 옵션 패널 */}
      <OptionsPanel
        theme={theme}
        onChange={handleChange}
        onPresetChange={handlePresetChange}
        onSave={handleSave}
        onPublish={handlePublish}
        onGenerate={handleGenerate}
        saving={saving}
        slotInfo={slotInfo}
        onSlotToggle={handleSlotToggle}
      />

      {/* 우측: 실제 컴포넌트 프리뷰 */}
      <div className="flex-1 overflow-y-auto relative">
        {message && (
          <div className="absolute top-2 right-2 z-50 bg-white border border-gray-200 rounded px-3 py-1.5 text-sm shadow-sm">
            {message}
          </div>
        )}
        <ThemeProvider theme={theme}>
          <AuthorSpace authorSlug={user.slug} previewData={previewData ?? undefined} />
        </ThemeProvider>
      </div>
    </div>
  )
}
