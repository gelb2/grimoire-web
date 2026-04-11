"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/features/auth"
import Link from "next/link"

// ── 로딩 애니메이션 (Claude 앱 스타일) ──
const thinkingPhrases = ['원고를 살펴보는 중...', '맥락을 분석하는 중...', '답변을 구성하는 중...', '문장을 다듬는 중...']

function ThinkingIndicator() {
  const [phraseIdx, setPhraseIdx] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setPhraseIdx(i => (i + 1) % thinkingPhrases.length), 2500)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
        <span className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
        <span className="text-gray-500 italic transition-opacity duration-500">{thinkingPhrases[phraseIdx]}</span>
      </div>
    </div>
  )
}

// ── AI 메시지 순차 표시 (isNew=true일 때만 애니메이션) ──
function StreamedMessage({ content, isNew }: { content: string; isNew?: boolean }) {
  const [visibleChunks, setVisibleChunks] = useState(isNew ? 0 : Infinity)
  const chunks = content.split('\n\n').filter(Boolean)

  useEffect(() => {
    if (!isNew || chunks.length === 0) { setVisibleChunks(Infinity); return }
    setVisibleChunks(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleChunks(i)
      if (i >= chunks.length) clearInterval(interval)
    }, 200)
    return () => clearInterval(interval)
  }, [content, chunks.length, isNew])

  const shown = visibleChunks >= chunks.length ? chunks : chunks.slice(0, visibleChunks)
  return (
    <div className="space-y-2">
      {shown.map((chunk, idx) => (
        <p key={idx} className={isNew && idx >= (visibleChunks - 1) ? "animate-fadeIn" : ""}>{chunk}</p>
      ))}
    </div>
  )
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  isNew?: boolean // 방금 받은 메시지인지 (애니메이션 표시용)
}

interface Session {
  id: string
  workId: string
  title: string
  updatedAt: string
}

interface Work {
  id: string
  slug: string
  title: string
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const [works, setWorks] = useState<Work[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [workContext, setWorkContext] = useState("")
  const [workInstructions, setWorkInstructions] = useState("")
  const [savingSettings, setSavingSettings] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 작품 목록 로드
  useEffect(() => {
    if (authLoading || !user) return
    api.getAuthorSpace<any>(user.slug).then(data => {
      const w = data.works || []
      setWorks(w)
      if (w.length > 0) setSelectedWorkId(w[0].id)
    }).catch(() => {})
  }, [authLoading, user])

  // 작품 선택 시 세션 로드 + context/instructions 로드
  useEffect(() => {
    if (!selectedWorkId || !user) return
    api.listChatSessions(selectedWorkId).then(setSessions).catch(() => setSessions([]))
    // 작품의 context/instructions 로드
    const selectedWork = works.find(w => w.id === selectedWorkId)
    if (selectedWork && user) {
      api.getWork<any>(user.slug, (selectedWork as any).slug).then(data => {
        setWorkContext(data.work?.context || data.context || "")
        setWorkInstructions(data.work?.instructions || data.instructions || "")
      }).catch(() => {})
    }
  }, [selectedWorkId, user, works])

  // 세션 선택 시 메시지 로드
  useEffect(() => {
    if (!activeSession) { setMessages([]); return }
    setHasMore(true)
    api.getChatMessages(activeSession, 30).then(msgs => {
      setMessages(msgs)
      setHasMore(msgs.length >= 30)
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
    }).catch(() => setMessages([]))
  }, [activeSession])

  // context/instructions 저장
  const handleSaveSettings = useCallback(async () => {
    if (!selectedWorkId) return
    setSavingSettings(true)
    try {
      await api.updateWork(selectedWorkId, { context: workContext || null, instructions: workInstructions || null })
      setShowSettings(false)
    } catch {}
    setSavingSettings(false)
  }, [selectedWorkId, workContext, workInstructions])

  // 새 세션 생성
  const handleNewSession = useCallback(async () => {
    if (!selectedWorkId) return
    const session = await api.createChatSession(selectedWorkId)
    setSessions(prev => [session, ...prev])
    setActiveSession(session.id)
  }, [selectedWorkId])

  // 메시지 전송
  const handleSend = useCallback(async () => {
    if (!activeSession || !input.trim() || sending) return
    const text = input.trim()
    setInput("")
    setSending(true)

    // 낙관적 UI: 사용자 메시지 즉시 표시
    const tempUserMsg: Message = { id: "temp-" + Date.now(), role: "user", content: text, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, tempUserMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)

    try {
      const { userMsg, assistantMsg } = await api.sendChatMessage(activeSession, text)
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        userMsg,
        { ...assistantMsg, isNew: true },
      ])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    } catch (e: any) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        { ...tempUserMsg, content: text + "\n\n⚠ 전송 실패: " + (e.message || "오류") },
      ])
    }
    setSending(false)
  }, [activeSession, input, sending])

  // 무한 스크롤: 맨 위 도달 시 이전 메시지 로드
  const handleScroll = useCallback(async () => {
    const container = scrollContainerRef.current
    if (!container || !activeSession || loadingMore || !hasMore) return
    if (container.scrollTop < 50 && messages.length > 0) {
      setLoadingMore(true)
      const oldScrollHeight = container.scrollHeight
      const cursor = messages[0]?.id
      try {
        const older = await api.getChatMessages(activeSession, 30, cursor)
        if (older.length < 30) setHasMore(false)
        if (older.length > 0) {
          setMessages(prev => [...older, ...prev])
          // 스크롤 위치 유지
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - oldScrollHeight
          })
        }
      } catch {}
      setLoadingMore(false)
    }
  }, [activeSession, loadingMore, hasMore, messages])

  if (authLoading) return <div className="flex items-center justify-center h-screen text-gray-500">로딩 중...</div>
  if (!user) return <div className="flex items-center justify-center h-screen text-gray-500">로그인이 필요합니다.</div>

  return (
    <div className="flex h-screen bg-white">
      {/* 좌측: 세션 목록 */}
      <div className="w-64 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-black">← 대시보드</Link>
          <h2 className="text-sm font-bold text-black mt-2">AI 어시스턴트</h2>
          <select value={selectedWorkId} onChange={e => { setSelectedWorkId(e.target.value); setActiveSession(null) }}
            className="mt-2 w-full text-xs rounded border border-gray-300 px-2 py-1.5">
            {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
          </select>
          <div className="flex gap-1 mt-2">
            <button onClick={handleNewSession} className="flex-1 px-2 py-1.5 bg-black text-white text-xs rounded hover:bg-gray-800">
              + 새 대화
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="px-2 py-1.5 border border-gray-300 text-xs rounded hover:bg-gray-100">
              ⚙
            </button>
          </div>
          {showSettings && (
            <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">작품 맥락 (메모리)</label>
                <textarea value={workContext} onChange={e => setWorkContext(e.target.value)} rows={4}
                  className="w-full text-xs rounded border border-gray-300 px-2 py-1 mt-1 resize-none"
                  placeholder="세계관, 캐릭터 목록, 배경 설정..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">작품 지침 (지시사항)</label>
                <textarea value={workInstructions} onChange={e => setWorkInstructions(e.target.value)} rows={4}
                  className="w-full text-xs rounded border border-gray-300 px-2 py-1 mt-1 resize-none"
                  placeholder="문체 규칙, 톤, 금지사항..." />
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings}
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
            <button key={s.id} onClick={() => setActiveSession(s.id)}
              className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 ${activeSession === s.id ? 'bg-gray-100 font-medium' : 'text-gray-600'}`}>
              <div className="truncate">{s.title}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(s.updatedAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 우측: 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            작품을 선택하고 대화를 시작하세요
          </div>
        ) : (
          <>
            {/* 메시지 영역 */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {loadingMore && <div className="text-center text-xs text-gray-400 py-2">이전 메시지 로딩 중...</div>}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {msg.role === "assistant" ? <StreamedMessage content={msg.content} isNew={msg.isNew} /> : msg.content}
                  </div>
                </div>
              ))}
              {sending && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={el => {
                    if (el) {
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 192) + 'px' // 최대 8줄 (24px * 8)
                    }
                  }}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="원고에 대해 질문하세요... (Shift+Enter로 줄바꿈)"
                  disabled={sending}
                  rows={1}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black disabled:opacity-50 resize-none overflow-y-auto"
                />
                <button onClick={handleSend} disabled={sending || !input.trim()}
                  className="px-4 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 shrink-0">
                  전송
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
