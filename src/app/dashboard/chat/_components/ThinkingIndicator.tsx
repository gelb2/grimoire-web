"use client"

import { useState, useEffect } from "react"

// 로딩 애니메이션 (Claude 앱 스타일)
const thinkingPhrases = ['원고를 살펴보는 중...', '맥락을 분석하는 중...', '답변을 구성하는 중...', '문장을 다듬는 중...']

export function ThinkingIndicator() {
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
