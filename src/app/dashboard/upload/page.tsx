"use client"

import { PlatformNav } from '@/components/PlatformNav'
import { PreviewModal } from './_components/PreviewModal'
import { useUploadPage } from './_components/useUploadPage'

export default function UploadPage() {
  const {
    user, loading,
    fileInputRef,
    content, title, format, rawFile, preview,
    parsing, saving, error, dragOver,
    works, selectedWorkId, newWorkTitle, createMode,
    showPreviewModal, themes, presets,
    selectedType, selectedThemeId, activeTheme,
    setContent, setTitle, setDragOver, setSelectedWorkId,
    setNewWorkTitle, setCreateMode, setShowPreviewModal,
    handleFile, handleDrop, handlePreview, handleSave,
    handleThemeChange,
  } = useUploadPage()

  if (loading || !user) return null

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

      {/* 풀스크린 미리보기 모달 */}
      {showPreviewModal && preview.length > 0 && (
        <PreviewModal
          title={title}
          preview={preview}
          authorName={user.name}
          activeTheme={activeTheme}
          themes={themes}
          presets={presets}
          selectedType={selectedType}
          selectedThemeId={selectedThemeId}
          onThemeChange={handleThemeChange}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  )
}
