"use client"

import Link from "next/link"

interface Work {
  id: string
  slug: string
  title: string
}

interface Session {
  id: string
  workId: string
  title: string
  updatedAt: string
}

interface ChatSidebarProps {
  works: Work[]
  selectedWorkId: string
  onWorkChange: (workId: string) => void
  sessions: Session[]
  activeSession: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  showSettings: boolean
  onToggleSettings: () => void
  workContext: string
  onWorkContextChange: (v: string) => void
  workInstructions: string
  onWorkInstructionsChange: (v: string) => void
  onSaveSettings: () => void
  savingSettings: boolean
}

export function ChatSidebar({
  works, selectedWorkId, onWorkChange,
  sessions, activeSession, onSessionSelect,
  onNewSession, showSettings, onToggleSettings,
  workContext, onWorkContextChange,
  workInstructions, onWorkInstructionsChange,
  onSaveSettings, savingSettings,
}: ChatSidebarProps) {
  return (
    <div className="w-64 shrink-0 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black">&larr; 대시보드</Link>
        <h2 className="text-sm font-bold text-black mt-2">AI 어시스턴트</h2>
        <select value={selectedWorkId} onChange={e => { onWorkChange(e.target.value) }}
          className="mt-2 w-full text-xs rounded border border-gray-300 px-2 py-1.5">
          {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
        </select>
        <div className="flex gap-1 mt-2">
          <button onClick={onNewSession} className="flex-1 px-2 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800">
            + 새 대화
          </button>
          <button onClick={onToggleSettings} className="px-2 py-1.5 border border-gray-300 text-xs rounded hover:bg-gray-100">
            &#9881;
          </button>
        </div>
        {showSettings && (
          <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">작품 맥락 (메모리)</label>
              <textarea value={workContext} onChange={e => onWorkContextChange(e.target.value)} rows={4}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1 mt-1 resize-none"
                placeholder="세계관, 캐릭터 목록, 배경 설정..." />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">작품 지침 (지시사항)</label>
              <textarea value={workInstructions} onChange={e => onWorkInstructionsChange(e.target.value)} rows={4}
                className="w-full text-xs rounded border border-gray-300 px-2 py-1 mt-1 resize-none"
                placeholder="문체 규칙, 톤, 금지사항..." />
            </div>
            <button onClick={onSaveSettings} disabled={savingSettings}
              className="w-full px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50">
              {savingSettings ? "저장 중..." : "설정 저장"}
            </button>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="text-[10px] font-bold text-gray-500 uppercase">원고 인덱싱 상태</label>
              <p className="text-[10px] text-gray-400 mt-1">업로드된 에피소드가 자동으로 인덱싱됩니다. 인덱싱된 원고만 AI 채팅에서 참조됩니다.</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.map(s => (
          <button key={s.id} onClick={() => onSessionSelect(s.id)}
            className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 ${activeSession === s.id ? 'bg-gray-100 font-medium' : 'text-gray-600'}`}>
            <div className="truncate">{s.title}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{new Date(s.updatedAt).toLocaleDateString()}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
