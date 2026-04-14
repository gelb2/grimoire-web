"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { toast } from 'sonner'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { EpisodeViewer } from '@/features/reader/ui/EpisodeViewer'
import type { AuthorTheme } from '@/features/theme/presets'
import type { Theme } from '@/types/api'

interface WorkOption { id: string; slug: string; title: string }

// 최대 파일 크기: 10MB (서버 Multer 제한과 동일)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function UploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<string>('')
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // 작품 선택
  const [works, setWorks] = useState<WorkOption[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [newWorkTitle, setNewWorkTitle] = useState('')
  const [createMode, setCreateMode] = useState(false)

  // 미리보기 모달
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [themes, setThemes] = useState<Theme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState('')
  const [previewTheme, setPreviewTheme] = useState<AuthorTheme | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // 작품 목록 로드
  useEffect(() => {
    if (!user) return
    api.getAuthorSpace<{ works: WorkOption[] }>(user.slug)
      .then(res => {
        const w = res.works ?? []
        setWorks(w)
        if (w.length > 0) setSelectedWorkId(w[0].id)
      })
      .catch(() => {})
  }, [user])

  // 작가 테마 + 시스템 프리셋 로드
  const [presets, setPresets] = useState<{ name: string; label: string; overrides: Record<string, unknown> }[]>([])
  useEffect(() => {
    if (!user) return
    api.getMyThemes().then(setThemes).catch(() => {})
    api.getPresets().then((list: any[]) => setPresets(list.map((p: any) => ({ name: p.name, label: p.label, overrides: p.overrides ?? {} })))).catch(() => {})
  }, [user])

  // 테마 선택 시 상세 로드 (작가 테마는 API 호출, 프리셋은 이미 로드됨)
  const [selectedType, setSelectedType] = useState<'none' | 'theme' | 'preset'>('none')
  useEffect(() => {
    if (selectedType === 'none' || !selectedThemeId) {
      setPreviewTheme(null)
      return
    }
    if (selectedType === 'preset') {
      const preset = presets.find(p => p.name === selectedThemeId)
      if (preset) setPreviewTheme(preset.overrides as unknown as AuthorTheme)
      return
    }
    // 작가 테마
    api.getThemeById(selectedThemeId)
      .then((data: any) => {
        const overrides = data.overrides ?? data.theme ?? data
        setPreviewTheme(overrides as AuthorTheme)
      })
      .catch(() => toast.error('테마를 불러올 수 없습니다'))
  }, [selectedThemeId, selectedType, presets])

  // 파일 핸들러
  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setError(`파일 크기가 너무 큽니다 (${sizeMB}MB). 최대 10MB까지 업로드할 수 있습니다.`)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const nameWithoutExt = file.name.replace(/\.(md|txt|docx|hwp|html?)$/i, '')
    setTitle(nameWithoutExt)
    setRawFile(file)
    setPreview([])
    setError('')

    if (ext === 'docx' || ext === 'hwp') {
      setFormat(ext.toUpperCase())
      setContent(`[${ext.toUpperCase()} 파일 — 미리보기 시 서버에서 파싱합니다]`)
    } else {
      const text = await file.text()
      setContent(text)
      setRawFile(null)
      if (ext === 'md') setFormat('markdown')
      else if (ext === 'txt') setFormat('txt')
      else if (ext === 'html' || ext === 'htm') setFormat('html')
      else setFormat('자동 감지')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handlePaste = () => {
    if (content) {
      if (content.startsWith('---') || /^#{1,6}\s/.test(content)) setFormat('markdown')
      else if (/<[a-z][\s\S]*>/i.test(content)) setFormat('html')
      else setFormat('txt')
    }
  }

  // 미리보기 — 파싱 후 모달 오픈
  const handlePreview = async () => {
    if (!content.trim() && !rawFile) { setError('내용을 입력하세요'); return }
    setError('')
    setParsing(true)
    try {
      let result
      if (rawFile) {
        result = await api.uploadManuscriptFile(rawFile)
      } else {
        result = await api.parseManuscript(content)
      }
      setPreview(result.blocks || [])

      if (result.frontmatter?.title && !title) {
        setTitle(result.frontmatter.title)
      }

      // 파싱 성공 시 모달 자동 오픈
      setShowPreviewModal(true)
    } catch (err: any) {
      setError(err.message || '파싱에 실패했습니다')
    } finally {
      setParsing(false)
    }
  }

  // 에피소드 저장
  const handleSave = async () => {
    if (!title.trim()) { setError('에피소드 제목을 입력하세요'); return }
    if (preview.length === 0) { setError('먼저 미리보기로 파싱 결과를 확인하세요'); return }

    let workId = selectedWorkId

    if (createMode) {
      if (!newWorkTitle.trim()) { setError('작품 제목을 입력하세요'); return }
      setSaving(true)
      try {
        const slug = newWorkTitle.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-|-$/g, '') || 'work-' + Date.now()
        const work = await api.createWork({ title: newWorkTitle.trim(), slug })
        workId = work.id
        setWorks(prev => [...prev, { id: work.id, slug: '', title: newWorkTitle.trim() }])
        setSelectedWorkId(work.id)
        setCreateMode(false)
        toast.success('작품이 생성됐습니다')
      } catch (err: any) {
        setError(err.message || '작품 생성에 실패했습니다')
        setSaving(false)
        return
      }
    }

    if (!workId) { setError('작품을 선택하세요'); setSaving(false); return }

    setSaving(true)
    setError('')
    try {
      await api.createEpisode(workId, {
        title: title.trim(),
        rawContent: rawFile ? content : content,
        sourceFormat: format === 'markdown' ? 'markdown' : format === 'html' ? 'html' : 'txt',
      })
      toast.success('에피소드가 등록됐습니다')
      setContent('')
      setTitle('')
      setFormat('')
      setRawFile(null)
      setPreview([])
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) return null

  // 미리보기 모달용 기본 테마 (테마 미선택 시)
  const fallbackTheme: AuthorTheme = {
    bgPrimary: '#1a1a1a', bgSecondary: '#222', textPrimary: '#e0e0e0',
    textMuted: '#888', textDim: '#666', textBright: '#fff',
    accent: '#c9a96e', accent2: '#d4a574', border: '#333',
    fontBody: 'serif', fontHeading: 'serif',
    animation: 'typing', tone: 'dark',
    episodeListLayout: 'series',
    decorations: { dividerIcon: 'dot', dividerColor: '#888', headerIcon: 'dot', headerSubtitle: '', cardAccentPosition: 'left', footerText: '' },
  }

  const activeTheme = previewTheme ?? fallbackTheme

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-black text-black mb-2">원고 업로드</h1>
        <p className="text-neutral-500 mb-6">
          MD, TXT, DOCX, HWP 파일을 업로드하거나 텍스트를 직접 붙여넣으세요.
        </p>

        <div className="border-l-2 border-[#e53e3e] px-4 py-3 mb-6">
          <p className="text-[#e53e3e] text-sm font-medium mb-1">권장 업로드 포맷</p>
          <p className="text-neutral-500 text-xs">
            .md (Markdown), .txt (텍스트), .docx (Word), .hwp (한글) 지원.
            Bear, Obsidian, Notion, VS Code 등 대부분의 글쓰기 앱에서 내보내기 가능.
          </p>
        </div>

        {error && (
          <div className="border-l-2 border-[#e53e3e] text-[#e53e3e] px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* 작품 선택 */}
        <div className="mb-6">
          <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-2">작품 선택</label>
          {createMode ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newWorkTitle}
                onChange={e => setNewWorkTitle(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition text-sm"
                placeholder="새 작품 제목"
              />
              <button onClick={() => setCreateMode(false)} className="text-sm text-neutral-400 hover:text-black transition">취소</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={selectedWorkId}
                onChange={e => setSelectedWorkId(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black text-sm focus:outline-none focus:border-black transition"
              >
                {works.length === 0 && <option value="">작품 없음</option>}
                {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
              </select>
              <button
                onClick={() => setCreateMode(true)}
                className="px-4 py-2 text-sm border border-neutral-300 rounded-lg text-neutral-500 hover:text-black hover:border-black transition"
              >
                + 새 작품
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-1">에피소드 제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-[#f5f5f5] border border-neutral-300 rounded-lg text-black placeholder-neutral-400 focus:outline-none focus:border-black transition"
              placeholder="제 1화. 시작"
            />
          </div>

          {/* 파일 드롭존 */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragOver ? 'border-black bg-neutral-50' : 'border-neutral-300 hover:border-black'
            }`}
          >
            {rawFile ? (
              <div>
                <p className="text-black font-medium">{rawFile.name}</p>
                <p className="text-neutral-400 text-sm mt-1">{(rawFile.size / 1024).toFixed(1)} KB · {format}</p>
              </div>
            ) : (
              <>
                <p className="text-neutral-500 mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-neutral-400 text-sm">.md, .txt, .docx, .hwp · 최대 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.docx,.hwp,.html,.htm"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>

          <p className="text-xs text-neutral-400">
            MD, TXT, DOCX, HWP 파일을 업로드하세요. 원고 수정은 작가 도구에서 한 후 다시 업로드합니다.
          </p>

          {format && (
            <p className="text-sm text-neutral-400">
              감지된 포맷: <span className="text-[#e53e3e]">{format}</span>
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={parsing || (!content.trim() && !rawFile)}
              className="flex-1 py-3 bg-neutral-200 hover:bg-neutral-300 disabled:bg-neutral-100 text-black font-medium rounded-lg transition"
            >
              {parsing ? '파싱 중...' : '미리보기'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || preview.length === 0}
              className="flex-1 py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white font-medium rounded-lg transition"
            >
              {saving ? '저장 중...' : '에피소드 등록'}
            </button>
          </div>
        </div>
      </main>

      {/* ── 풀스크린 미리보기 모달 ── */}
      {showPreviewModal && preview.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* 상단 바 */}
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-neutral-400 text-xs uppercase tracking-widest">미리보기</span>
              <select
                value={`${selectedType}:${selectedThemeId}`}
                onChange={e => {
                  const [type, id] = e.target.value.split(':') as ['none' | 'theme' | 'preset', string]
                  setSelectedType(type)
                  setSelectedThemeId(id || '')
                }}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none"
              >
                <option value="none:">테마 미적용</option>
                {presets.length > 0 && <optgroup label="프리셋">
                  {presets.map(p => (
                    <option key={p.name} value={`preset:${p.name}`}>{p.label}</option>
                  ))}
                </optgroup>}
                {themes.length > 0 && <optgroup label="내 테마">
                  {themes.map(t => (
                    <option key={t.id} value={`theme:${t.id}`}>{t.name}</option>
                  ))}
                </optgroup>}
              </select>
            </div>
            <button
              onClick={() => setShowPreviewModal(false)}
              className="text-neutral-400 hover:text-white transition text-sm px-3 py-1.5 border border-neutral-700 rounded"
            >
              닫기
            </button>
          </div>

          {/* 본문 — ThemeProvider + EpisodeViewer (실제 뷰어와 동일) */}
          <div className="flex-1 overflow-y-auto">
            <ThemeProvider theme={activeTheme}>
              <EpisodeViewer
                meta={{
                  slug: 'preview',
                  type: 'episode',
                  num: '01',
                  title: title || '제목 없음',
                }}
                data={{
                  slug: 'preview',
                  title: title || '제목 없음',
                  blocks: preview,
                }}
                authorName={user.name}
              />
            </ThemeProvider>
          </div>
        </div>
      )}
    </div>
  )
}
