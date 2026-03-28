"use client"

import { useState, useRef } from 'react'
import { useAuth } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PlatformNav } from '@/components/PlatformNav'

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
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  // 파일 드롭/선택 핸들러
  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    // DOCX는 바이너리이므로 서버사이드 파싱 필요
    if (ext === 'docx') {
      setTitle(file.name.replace(/\.docx$/, ''))
      setFormat('docx (Word)')
      setContent('[DOCX 파일 — 서버에서 파싱됩니다]\n\nDOCX 파싱은 서버 연동 후 지원 예정입니다.')
      setRawFile(file)
      return
    }

    const text = await file.text()
    setContent(text)
    setRawFile(null)
    setTitle(file.name.replace(/\.(md|txt|html)$/, ''))

    // 포맷 감지
    if (ext === 'md') setFormat('markdown')
    else if (ext === 'txt') setFormat('txt')
    else if (ext === 'html' || ext === 'htm') setFormat('html')
    else setFormat('자동 감지')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handlePaste = () => {
    if (content) {
      // 간단한 포맷 감지
      if (content.startsWith('---') || /^#{1,6}\s/.test(content)) setFormat('markdown')
      else if (/<[a-z][\s\S]*>/i.test(content)) setFormat('html')
      else setFormat('txt')
    }
  }

  // 미리보기
  const handlePreview = async () => {
    if (!content.trim()) { setError('내용을 입력하세요'); return }
    setError('')
    setParsing(true)
    try {
      const result = await api.parseManuscript(content)
      setPreview(result.blocks || [])
    } catch (err: any) {
      setError(err.message || '파싱에 실패했습니다')
    } finally {
      setParsing(false)
    }
  }

  if (loading || !user) return null

  return (
    <div className="min-h-screen bg-platform-bg">
      <PlatformNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">원고 업로드</h1>
        <p className="text-neutral-400 mb-6">
          MD, TXT, DOCX 파일을 업로드하거나 텍스트를 직접 붙여넣으세요.
          에디팅이 아닌 <span className="text-amber-500">업로드</span>입니다 — 글은 작가님의 앱에서 쓰세요.
        </p>

        <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg px-4 py-3 mb-6">
          <p className="text-amber-400 text-sm font-medium mb-1">권장 업로드 포맷</p>
          <p className="text-amber-300/70 text-xs">
            .md (Markdown), .txt (텍스트), .docx (Word) 를 권장합니다.
            Bear, Obsidian, Notion, VS Code 등 대부분의 글쓰기 앱에서 이 포맷으로 내보내기를 지원합니다.
            Pages 파일은 Word(.docx)로 내보내기 후 업로드해 주세요.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 입력 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">에피소드 제목</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                placeholder="제 1화. 시작"
              />
            </div>

            {/* 파일 드롭존 */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-amber-600 rounded-xl p-8 text-center cursor-pointer transition"
            >
              <p className="text-neutral-400 mb-2">파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-neutral-600 text-sm">.md, .txt, .docx 지원</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.docx"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {/* 텍스트 직접 입력 */}
            <div>
              <label className="block text-sm text-neutral-300 mb-1">또는 텍스트 직접 붙여넣기</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={handlePaste}
                rows={12}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition font-mono text-sm resize-y"
                placeholder="마크다운 또는 텍스트를 붙여넣으세요..."
              />
            </div>

            {format && (
              <p className="text-sm text-neutral-500">
                감지된 포맷: <span className="text-amber-500">{format}</span>
              </p>
            )}

            <button
              onClick={handlePreview}
              disabled={parsing || !content.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 text-white font-medium rounded-lg transition"
            >
              {parsing ? '파싱 중...' : '미리보기'}
            </button>
          </div>

          {/* 오른쪽: 미리보기 */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 min-h-[400px]">
            <h3 className="text-neutral-400 text-sm mb-4">미리보기</h3>
            {preview.length === 0 ? (
              <p className="text-neutral-600 text-center mt-20">
                왼쪽에서 원고를 입력하고 미리보기를 누르세요
              </p>
            ) : (
              <div className="space-y-4 text-neutral-200">
                {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                {preview.map((block: any, i: number) => {
                  if (block.type === 'paragraph') {
                    return <p key={i} className="leading-relaxed">{block.text}</p>
                  }
                  if (block.type === 'chapter') {
                    return <h3 key={i} className="text-lg font-bold text-amber-500 mt-6">{block.text}</h3>
                  }
                  if (block.type === 'divider') {
                    return <hr key={i} className="border-neutral-700 my-6" />
                  }
                  if (block.type === 'italic') {
                    return <p key={i} className="italic text-neutral-400">{block.text}</p>
                  }
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
