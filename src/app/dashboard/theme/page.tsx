"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { themePresets, AuthorTheme } from '@/features/theme'

const colorFields = [
  { key: 'bgPrimary', label: '배경색', cssVar: '--u-bg' },
  { key: 'bgSecondary', label: '카드 배경', cssVar: '--u-bg2' },
  { key: 'textPrimary', label: '본문 텍스트', cssVar: '--u-text' },
  { key: 'textMuted', label: '보조 텍스트', cssVar: '--u-text-muted' },
  { key: 'accent', label: '강조색', cssVar: '--u-accent' },
  { key: 'border', label: '경계선', cssVar: '--u-border' },
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

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

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
    setSaving(true)
    setMessage('')
    try {
      // TODO: POST /api/themes/publish/:authorSlug -- 서버 연동 후 활성화
      setMessage('테마가 저장되었습니다 (서버 연동 후 퍼블리시 가능)')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '저장에 실패했습니다'
      setMessage(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  // 미리보기용 인라인 스타일
  const previewStyle: Record<string, string> = {
    '--u-bg': theme.bgPrimary,
    '--u-bg2': theme.bgSecondary,
    '--u-text': theme.textPrimary,
    '--u-text-muted': theme.textMuted,
    '--u-accent': theme.accent,
    '--u-border': theme.border,
  } as Record<string, string>

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-neutral-400 hover:text-white transition">&larr; 대시보드</Link>
          <span className="text-neutral-600">|</span>
          <span className="text-white font-medium">테마 에디터</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-500 text-sm">{user.credits} 크레딧</span>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white text-sm rounded-lg transition"
          >
            {saving ? '저장 중...' : '퍼블리시'}
          </button>
        </div>
      </header>

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
          <div className="h-full p-8" style={{ backgroundColor: 'var(--u-bg)', color: 'var(--u-text)' }}>
            {/* 미리보기 헤더 */}
            <div className="text-center mb-12">
              <p className="text-xs tracking-widest mb-4" style={{ color: 'var(--u-text-muted)' }}>PREVIEW</p>
              <h1 className="text-3xl font-bold mb-2">{user.name}의 공간</h1>
              <p className="text-sm" style={{ color: 'var(--u-text-muted)' }}>grimoire.app/{user.slug}</p>
            </div>

            {/* 미리보기 본문 */}
            <div className="max-w-lg mx-auto space-y-6">
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--u-bg2)', borderColor: 'var(--u-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--u-accent)' }}>제 1화. 시작</h3>
                <p className="leading-relaxed">
                  어둠 속에서 한 줄기 빛이 스며들었다.
                  그것은 오래전 잊혀진 이야기의 첫 페이지였다.
                  누군가의 손끝에서 시작된 글자들이 하나둘 모여 세계를 이루었다.
                </p>
              </div>

              <hr style={{ borderColor: 'var(--u-border)' }} />

              <p className="leading-relaxed">
                바람이 불어왔다. 차갑지도, 따뜻하지도 않은 바람.
                그저 존재를 확인시켜 주는 바람이었다.
                그녀는 책장을 넘기며 중얼거렸다.
              </p>

              <p className="italic" style={{ color: 'var(--u-text-muted)' }}>
                &ldquo;모든 이야기에는 시작이 있고, 모든 시작에는 용기가 필요하다.&rdquo;
              </p>

              <div className="text-center mt-8">
                <span className="inline-block px-6 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--u-accent)', color: 'var(--u-bg)' }}>
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
