"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'
import { toast } from 'sonner'

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

  // 파일 핸들러
  const handleFile = useCallback(async (file: File) => {
    // 클라이언트 파일 크기 검증 — 서버 전송 전에 차단
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

  // 미리보기
  const handlePreview = async () => {
    if (!content.trim() && !rawFile) { setError('내용을 입력하세요'); return }
    setError('')
    setParsing(true)
    try {
      let result
      if (rawFile) {
        // DOCX/HWP → 서버 파일 업로드
        result = await api.uploadManuscriptFile(rawFile)
      } else {
        result = await api.parseManuscript(content)
      }
      setPreview(result.blocks || [])

      // frontmatter에서 제목 추출
      if (result.frontmatter?.title && !title) {
        setTitle(result.frontmatter.title)
      }
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

    // 새 작품 생성
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
      // 초기화
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

  return (
    <div className="min-h-screen bg-white">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 입력 */}
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

            {/* 원칙: 직접 에디터를 제공하지 않음 — 파일 업로드만 허용 */}
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

          {/* 오른쪽: 미리보기 */}
          <div className="bg-[#f5f5f5] border border-neutral-200 rounded-xl p-6 min-h-[400px]">
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-neutral-400 mb-4">미리보기</h3>
            {preview.length === 0 ? (
              <p className="text-neutral-400 text-center mt-20 text-sm">
                왼쪽에서 원고를 입력하고 미리보기를 누르세요
              </p>
            ) : (
              <div className="space-y-4 text-neutral-700">
                {title && <h2 className="text-xl font-bold text-black">{title}</h2>}
                {preview.map((block: any, i: number) => {
                  if (block.type === 'paragraph') return <p key={i} className="leading-relaxed">{block.text}</p>
                  if (block.type === 'chapter') return <h3 key={i} className="text-lg font-bold text-[#e53e3e] mt-6">{block.title ?? block.text}</h3>
                  if (block.type === 'divider') return <hr key={i} className="border-neutral-300 my-6" />
                  if (block.type === 'italic') return <p key={i} className="italic text-neutral-500">{block.text}</p>
                  if (block.type === 'heading-1') return <h2 key={i} className="text-xl font-bold mt-6">{block.title ?? block.text}</h2>
                  if (block.type === 'heading-2') return <h3 key={i} className="text-lg font-semibold mt-4">{block.title ?? block.text}</h3>
                  if (block.type === 'bold') return <p key={i} className="font-bold">{block.text}</p>
                  return <p key={i}>{block.text}</p>
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
