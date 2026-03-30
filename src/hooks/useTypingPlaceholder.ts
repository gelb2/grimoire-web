'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * 타이핑 → 정지 → 역순 지우기 → 다음 문구 반복 애니메이션 훅
 * 검색 인풋 placeholder 등에 사용
 */
export function useTypingPlaceholder(
  phrases: string[],
  typingSpeed = 80,
  deleteSpeed = 40,
  pauseMs = 2000,
) {
  const [text, setText] = useState('')
  const phraseIdx = useRef(0)
  const charIdx = useRef(0)
  const deleting = useRef(false)

  useEffect(() => {
    const tick = () => {
      const currentPhrase = phrases[phraseIdx.current]

      if (!deleting.current) {
        charIdx.current++
        setText(currentPhrase.slice(0, charIdx.current))

        if (charIdx.current === currentPhrase.length) {
          deleting.current = true
          return pauseMs
        }
        return typingSpeed
      } else {
        charIdx.current--
        setText(currentPhrase.slice(0, charIdx.current))

        if (charIdx.current === 0) {
          deleting.current = false
          phraseIdx.current = (phraseIdx.current + 1) % phrases.length
          return typingSpeed * 3
        }
        return deleteSpeed
      }
    }

    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      const delay = tick()
      timer = setTimeout(schedule, delay)
    }
    timer = setTimeout(schedule, typingSpeed)

    return () => clearTimeout(timer)
  }, [phrases, typingSpeed, deleteSpeed, pauseMs])

  return text
}
