"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { AuthorTheme } from '@/features/theme/presets'
import type { Theme } from '@/types/api'

interface WorkOption { id: string; slug: string; title: string }

// 최대 파일 크기: 10MB (서버 Multer 제한과 동일)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export function useUploadPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [format, setFormat] = useState<string>('')
  const [rawFile, setRawFile] = useState<File | null>(null)
  // 업로드된 파일의 확장자 제거 이름. rawFile은 MD/TXT 파싱 후 null이 되므로
  // title input의 "자동 채움값"을 별도 state로 추적해야 handlePreview가 사용자 편집 여부를 판별할 수 있다.
  const [autoFilledTitle, setAutoFilledTitle] = useState('')
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

  // 테마 선택 시 상세 로드
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
    const nameWithoutExt = file.name.replace(/\.(md|txt|docx|hwp|hwpx|html?)$/i, '')
    setTitle(nameWithoutExt)
    setAutoFilledTitle(nameWithoutExt)
    setRawFile(file)
    setPreview([])
    setError('')

    // 파일명 기반 정규화가 필요한 포맷(txt/docx/hwp/hwpx)은 rawFile 유지 →
    // handlePreview가 uploadManuscriptFile 경로로 서버 normalizedTitle을 받아옴.
    // MD는 본문 `# 헤딩`에서 제목 추출하는 기존 로직이 중요하므로 parseManuscript 경로 유지
    // (서버가 MD 경로에서도 finalTitle을 normalize해 normalizedTitle 반환).
    if (ext === 'docx' || ext === 'hwp' || ext === 'hwpx' || ext === 'txt') {
      setFormat(ext.toUpperCase())
      setContent(`[${ext.toUpperCase()} 파일 — 미리보기 시 서버에서 파싱합니다]`)
    } else {
      const text = await file.text()
      setContent(text)
      setRawFile(null)
      if (ext === 'md') setFormat('markdown')
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

      // 제목 업데이트 전략: 사용자가 직접 편집하지 않은 상태면 서버 응답으로 교체.
      // 현재 title이 handleFile에서 채운 파일명 그대로면 "편집 안 한 상태"로 간주 →
      // MD frontmatter.title > normalizedTitle 우선으로 미리보기/저장 결과와 일치시킨다.
      // 정규화는 서버 domain layer가 단일 진실 공급원 — 웹은 응답 소비만.
      const userEdited = title !== '' && title !== autoFilledTitle
      if (!userEdited) {
        const next = result.frontmatter?.title || result.normalizedTitle
        if (next) setTitle(next)
      }

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

  const handleThemeChange = useCallback((type: 'none' | 'theme' | 'preset', id: string) => {
    setSelectedType(type)
    setSelectedThemeId(id)
  }, [])

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

  return {
    user, loading,
    fileInputRef,
    content, title, format, rawFile, preview,
    parsing, saving, error, dragOver,
    works, selectedWorkId, newWorkTitle, createMode,
    showPreviewModal, themes, presets,
    selectedType, selectedThemeId, previewTheme, activeTheme,
    setContent, setTitle, setDragOver, setSelectedWorkId,
    setNewWorkTitle, setCreateMode, setShowPreviewModal,
    handleFile, handleDrop, handlePaste, handlePreview, handleSave,
    handleThemeChange,
  }
}
