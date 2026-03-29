"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { themePresets, AuthorTheme } from '@/features/theme'

const colorFields = [
  { key: 'bgPrimary', label: '배경색', cssVar: '--g-bg' },
  { key: 'bgSecondary', label: '카드 배경', cssVar: '--g-bg2' },
  { key: 'textPrimary', label: '본문 텍스트', cssVar: '--g-text' },
  { key: 'textBright', label: '강조 텍스트', cssVar: '--g-text-bright' },
  { key: 'textMuted', label: '보조 텍스트', cssVar: '--g-text-muted' },
  { key: 'textDim', label: '흐린 텍스트', cssVar: '--g-text-dim' },
  { key: 'accent', label: '강조색', cssVar: '--g-accent' },
  { key: 'accent2', label: '보조 강조색', cssVar: '--g-accent2' },
  { key: 'border', label: '경계선', cssVar: '--g-border' },
]

const fontOptions = [
  { value: 'serif', label: '세리프 (Garamond)' },
  { value: 'sans-serif', label: '산세리프 (Noto Sans)' },
  { value: 'monospace', label: '모노스페이스' },
]

const animationOptions = [
  { value: 'typing', label: '타이핑' },
  { value: 'fade', label: '페이드인' },
  { value: 'slide', label: '슬라이드' },
  { value: 'none', label: '없음' },
]

const toneOptions = [
  { value: 'dark', label: '다크' },
  { value: 'light', label: '라이트' },
  { value: 'sepia', label: '세피아' },
]

// Phase 1: 타이포그래피 확장
const titleSizeOptions = [
  { value: 'sm', label: '작게' },
  { value: 'md', label: '보통' },
  { value: 'lg', label: '크게' },
  { value: 'xl', label: '매우 크게' },
]

const titleWeightOptions = [
  { value: 'light', label: '가늘게' },
  { value: 'normal', label: '보통' },
  { value: 'bold', label: '굵게' },
  { value: 'black', label: '매우 굵게' },
]

const letterSpacingOptions = [
  { value: 'tight', label: '좁게' },
  { value: 'normal', label: '보통' },
  { value: 'wide', label: '넓게' },
]

const lineHeightOptions = [
  { value: 'compact', label: '빽빽하게' },
  { value: 'normal', label: '보통' },
  { value: 'relaxed', label: '넉넉하게' },
]

const contentWidthOptions = [
  { value: 'narrow', label: '좁게 (600px)' },
  { value: 'normal', label: '보통 (700px)' },
  { value: 'wide', label: '넓게 (860px)' },
]

// Phase 2: 레이아웃 프리셋
const layoutOptions = [
  { value: 'series', label: '시리즈 (탭)' },
  { value: 'grid', label: '그리드' },
  { value: 'classic', label: '클래식' },
  { value: 'magazine', label: '매거진' },
  { value: 'gallery', label: '갤러리' },
  { value: 'minimal', label: '미니멀' },
]

const heroStyleOptions = [
  { value: 'fullname', label: '풀스크린 이름' },
  { value: 'cover', label: '커버 이미지' },
  { value: 'minimal', label: '미니멀' },
  { value: 'none', label: '없음' },
]

const navStyleOptions = [
  { value: 'top', label: '상단 바' },
  { value: 'sidebar', label: '사이드바' },
  { value: 'hidden', label: '숨김' },
]

export default function ThemeEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [theme, setTheme] = useState<AuthorTheme>(themePresets.midnight)
  const [selectedPreset, setSelectedPreset] = useState('midnight')
  const [aiDescription, setAiDescription] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // 서버에 저장된 내 테마 로드
  useEffect(() => {
    if (!user) return
    api.getMyThemes().then(themes => {
      if (themes.length > 0) {
        const myTheme = themes[0]
        setCurrentThemeId(myTheme.id)
        if (myTheme.overrides) {
          setTheme(prev => ({ ...prev, ...myTheme.overrides }))
          setSelectedPreset('custom')
        }
      }
    }).catch(() => {
      toast.error('저장된 테마를 불러올 수 없습니다. 기본 테마로 시작합니다.')
    })
  }, [user])

  const updateTheme = (key: string, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }))
  }

  const loadPreset = (presetName: string) => {
    const preset = themePresets[presetName]
    if (preset) {
      setTheme(preset)
      setSelectedPreset(presetName)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return
    setGenerating(true)
    setMessage('')
    try {
      const result = await api.generateTheme(aiDescription)
      if (result.preview) {
        setTheme(prev => ({ ...prev, ...result.preview }))
        setMessage('AI 테마가 생성되었습니다 (1 크레딧 소비)')
      }
      setShowAiInput(false)
      setAiDescription('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'AI 생성에 실패했습니다'
      setMessage(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async () => {
    if (!user) return
    setSaving(true)
    setMessage('')
    try {
      // 1. 테마 overrides 저장
      if (currentThemeId) {
        await api.updateTheme(currentThemeId, theme as unknown as Record<string, unknown>)
      }
      // 2. CSS 베이킹 + 퍼블리시
      await api.publishTheme(user.slug)
      setMessage('테마가 퍼블리시되었습니다!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '저장에 실패했습니다'
      setMessage(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  // 미리보기용 인라인 스타일 — ThemeProvider와 동일한 변수 전부 설정
  const titleSizeMap: Record<string, string> = { sm: '2rem', md: '3rem', lg: '4rem', xl: '6rem' }
  const titleWeightMap: Record<string, string> = { light: '300', normal: '400', bold: '700', black: '900' }
  const letterSpacingMap: Record<string, string> = { tight: '-0.02em', normal: '0', wide: '0.1em' }

  const previewStyle: Record<string, string> = {
    '--g-bg': theme.bgPrimary,
    '--g-bg2': theme.bgSecondary,
    '--g-text': theme.textPrimary,
    '--g-text-muted': theme.textMuted,
    '--g-text-dim': theme.textDim ?? theme.textMuted,
    '--g-text-bright': theme.textBright ?? theme.textPrimary,
    '--g-accent': theme.accent,
    '--g-accent2': theme.accent2 ?? theme.accent,
    '--g-border': theme.border,
    '--g-title-size': titleSizeMap[theme.titleSize ?? 'lg'],
    '--g-title-weight': titleWeightMap[theme.titleWeight ?? 'bold'],
    '--g-letter-spacing': letterSpacingMap[theme.letterSpacing ?? 'normal'],
  } as Record<string, string>

  return (
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      {/* 테마 에디터 액션 바 */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between border-b border-neutral-800/50">
        <span className="text-neutral-400 text-sm">테마 에디터</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white text-sm rounded-lg transition"
          >
            {saving ? '저장 중...' : '퍼블리시'}
          </button>
        </div>
      </div>

      {message && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-amber-900/20 border border-amber-800/50 text-amber-300 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* 왼쪽: 컨트롤 패널 */}
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* 프리셋 선택 */}
          <div>
            <label className="block text-sm text-neutral-300 mb-2">프리셋으로 시작</label>
            <select
              value={selectedPreset}
              onChange={e => loadPreset(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm"
            >
              {Object.keys(themePresets).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* 색상 */}
          <div>
            <h3 className="text-sm font-medium text-neutral-300 mb-3">색상</h3>
            <div className="space-y-3">
              {colorFields.map(field => (
                <div key={field.key} className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(theme as unknown as Record<string, unknown>)[field.key] as string || '#000000'}
                      onChange={e => updateTheme(field.key, e.target.value)}
                      className="w-8 h-8 rounded border border-neutral-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={(theme as unknown as Record<string, unknown>)[field.key] as string || ''}
                      onChange={e => updateTheme(field.key, e.target.value)}
                      className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-white text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 폰트 */}
          <div>
            <label className="block text-sm text-neutral-300 mb-2">본문 폰트</label>
            <select
              value={theme.fontBody}
              onChange={e => updateTheme('fontBody', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm"
            >
              {fontOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 애니메이션 */}
          <div>
            <label className="block text-sm text-neutral-300 mb-2">애니메이션</label>
            <select
              value={theme.animation}
              onChange={e => updateTheme('animation', e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm"
            >
              {animationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 톤 */}
          <div>
            <label className="block text-sm text-neutral-300 mb-2">톤</label>
            <div className="flex gap-2">
              {toneOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateTheme('tone', opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm transition ${
                    theme.tone === opt.value
                      ? 'bg-amber-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── 타이포그래피 (Phase 1) ── */}
          <div className="border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-medium text-neutral-300 mb-3">타이포그래피</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">제목 크기</label>
                <select value={theme.titleSize ?? 'lg'} onChange={e => updateTheme('titleSize', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {titleSizeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">제목 두께</label>
                <select value={theme.titleWeight ?? 'bold'} onChange={e => updateTheme('titleWeight', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {titleWeightOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">자간</label>
                <select value={theme.letterSpacing ?? 'normal'} onChange={e => updateTheme('letterSpacing', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {letterSpacingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">본문 행간</label>
                <select value={theme.bodyLineHeight ?? 'relaxed'} onChange={e => updateTheme('bodyLineHeight', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {lineHeightOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">읽기 영역 폭</label>
                <select value={theme.contentWidth ?? 'normal'} onChange={e => updateTheme('contentWidth', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {contentWidthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── 레이아웃 (Phase 2) ── */}
          <div className="border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-medium text-neutral-300 mb-3">레이아웃</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">레이아웃 스타일</label>
                <select value={theme.layout ?? 'grid'} onChange={e => updateTheme('layout', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {layoutOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">히어로 스타일</label>
                <select value={theme.heroStyle ?? 'minimal'} onChange={e => updateTheme('heroStyle', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {heroStyleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">네비게이션</label>
                <select value={theme.navStyle ?? 'top'} onChange={e => updateTheme('navStyle', e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm">
                  {navStyleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* AI 재생성 */}
          <div className="border-t border-neutral-800 pt-4">
            {!showAiInput ? (
              <button
                onClick={() => setShowAiInput(true)}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg transition"
              >
                AI로 다시 생성 (1 크레딧)
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={aiDescription}
                  onChange={e => setAiDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 resize-none"
                  placeholder="원하는 분위기를 설명하세요..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAiGenerate}
                    disabled={generating || !aiDescription.trim()}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white text-sm rounded-lg transition"
                  >
                    {generating ? '생성 중...' : '생성 (1 크레딧)'}
                  </button>
                  <button
                    onClick={() => { setShowAiInput(false); setAiDescription('') }}
                    className="px-4 py-2 bg-neutral-800 text-neutral-400 text-sm rounded-lg"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 내 공간 미리보기 링크 */}
          <div className="border-t border-neutral-800 pt-4">
            <Link
              href={`/${user.slug}`}
              target="_blank"
              className="block w-full py-2 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-lg transition"
            >
              내 공간 열기 (새 탭) &rarr;
            </Link>
          </div>
        </div>

        {/* 오른쪽: 실시간 미리보기 */}
        <div
          className="rounded-xl border border-neutral-800 overflow-hidden min-h-[600px]"
          style={previewStyle}
        >
          <div className="h-full p-8" style={{ backgroundColor: 'var(--g-bg)', color: 'var(--g-text)' }}>
            {/* 미리보기 헤더 — 작가 공간 스타일 (Phase 1 타이포 반영) */}
            <div className="text-center mb-12">
              <p className="text-xs mb-4" style={{ color: 'var(--g-text-dim)', letterSpacing: 'var(--g-letter-spacing, 0.25em)' }}>SHORT FICTION ANTHOLOGY</p>
              <h1 className="italic mb-2" style={{ color: 'var(--g-text-bright)', fontSize: 'var(--g-title-size, 3rem)', fontWeight: 'var(--g-title-weight, 700)', letterSpacing: 'var(--g-letter-spacing, 0)' }}>{user.name}</h1>
              <p className="text-sm" style={{ color: 'var(--g-text-dim)' }}>grimoire-book.com/{user.slug}</p>
            </div>

            <hr style={{ borderColor: 'var(--g-border)' }} />

            {/* 미리보기 에피소드 카드 */}
            <div className="max-w-lg mx-auto space-y-6 mt-8">
              <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--g-text-dim)' }}>에피소드</p>
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--g-bg2)', borderColor: 'var(--g-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--g-text-dim)' }}>EPISODE 01</p>
                <h3 className="text-lg italic mb-2" style={{ color: 'var(--g-text-bright)' }}>제 1화. 시작</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--g-text-muted)' }}>
                  어둠 속에서 한 줄기 빛이 스며들었다.
                  그것은 오래전 잊혀진 이야기의 첫 페이지였다.
                </p>
                <p className="text-xs mt-3" style={{ color: 'var(--g-accent2)' }}>읽기 &rarr;</p>
              </div>

              <hr style={{ borderColor: 'var(--g-border)' }} />

              {/* 미리보기 에피소드 뷰어 스타일 */}
              <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--g-text-muted)' }}>{user.name} · EPISODE 01</p>
              <h2 className="text-2xl italic" style={{ color: 'var(--g-text-bright)' }}>제목이 여기에 표시됩니다</h2>

              <p className="leading-relaxed">
                바람이 불어왔다. 차갑지도, 따뜻하지도 않은 바람.
                그저 존재를 확인시켜 주는 바람이었다.
              </p>

              <p className="italic" style={{ color: 'var(--g-accent2)' }}>
                &ldquo;모든 이야기에는 시작이 있고, 모든 시작에는 용기가 필요하다.&rdquo;
              </p>

              <div className="text-center mt-8">
                <span className="inline-block px-6 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--g-accent)', color: 'var(--g-bg)' }}>
                  다음 화 읽기
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
