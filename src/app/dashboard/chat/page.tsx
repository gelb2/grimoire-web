"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/features/auth"
import { toast } from "sonner"

import { ThinkingIndicator } from "./_components/ThinkingIndicator"
import { StreamedMessage } from "./_components/StreamedMessage"
import { ChatSidebar } from "./_components/ChatSidebar"
import { ChatChargeBadge } from "./_components/ChatChargeBadge"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  isNew?: boolean
  // 크레딧 개편 I Phase — 채팅 4구간 사후 차감 결과 (assistant 메시지, server 응답)
  chargedPoints?: number | null
  chargeTier?: string | null
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

  const handleSaveSettings = useCallback(async () => {
    if (!selectedWorkId) return
    setSavingSettings(true)
    try {
      await api.updateWork(selectedWorkId, { context: workContext || null, instructions: workInstructions || null })
      setShowSettings(false)
    } catch (e) {
      // F-5: 무증상 은폐(빈 catch) 제거 — 프로젝트 메모리/지침 저장 실패를 사용자에게 노출.
      toast.error(e instanceof Error && e.message ? e.message : "설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setSavingSettings(false)
    }
  }, [selectedWorkId, workContext, workInstructions])

  const handleNewSession = useCallback(async () => {
    if (!selectedWorkId) return
    const session = await api.createChatSession(selectedWorkId)
    setSessions(prev => [session, ...prev])
    setActiveSession(session.id)
  }, [selectedWorkId])

  const handleSend = useCallback(async () => {
    if (!activeSession || !input.trim() || sending) return
    const text = input.trim()
    setInput("")
    setSending(true)

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
        { ...tempUserMsg, content: text + "\n\n\u26A0 전송 실패: " + (e.message || "오류") },
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
      <ChatSidebar
        works={works}
        selectedWorkId={selectedWorkId}
        onWorkChange={(id) => { setSelectedWorkId(id); setActiveSession(null) }}
        sessions={sessions}
        activeSession={activeSession}
        onSessionSelect={setActiveSession}
        onNewSession={handleNewSession}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        workContext={workContext}
        onWorkContextChange={setWorkContext}
        workInstructions={workInstructions}
        onWorkInstructionsChange={setWorkInstructions}
        onSaveSettings={handleSaveSettings}
        savingSettings={savingSettings}
      />

      {/* 우측: 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {!activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            작품을 선택하고 대화를 시작하세요
          </div>
        ) : (
          <>
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {loadingMore && <div className="text-center text-xs text-gray-400 py-2">이전 메시지 로딩 중...</div>}
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {msg.role === "assistant" ? <StreamedMessage content={msg.content} isNew={msg.isNew} /> : msg.content}
                  </div>
                  {/* 채팅 4구간 사후 차감 결과 (assistant 메시지에만) */}
                  {msg.role === "assistant" && (
                    <ChatChargeBadge chargedPoints={msg.chargedPoints} chargeTier={msg.chargeTier} />
                  )}
                </div>
              ))}
              {sending && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={el => {
                    if (el) {
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 192) + 'px'
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
