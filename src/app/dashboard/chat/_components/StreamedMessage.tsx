"use client"

import { useState, useEffect } from "react"

// AI 메시지 순차 표시 (isNew=true일 때만 애니메이션)
export function StreamedMessage({ content, isNew }: { content: string; isNew?: boolean }) {
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
