"use client"

import { useState, useEffect, useRef } from "react"

interface TypeWriterProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  onComplete?: () => void
}

export function TypeWriter({
  text,
  speed = 30,
  delay = 0,
  className,
  onComplete,
}: TypeWriterProps) {
  const [displayText, setDisplayText] = useState("")
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setDisplayText("")
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval>

    const delayTimer = setTimeout(() => {
      if (cancelled) return
      let i = 0
      intervalId = setInterval(() => {
        if (cancelled) return
        i++
        setDisplayText(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(intervalId)
          onCompleteRef.current?.()
        }
      }, speed)
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(delayTimer)
      clearInterval(intervalId)
    }
  }, [text, speed, delay])

  return <span className={className}>{displayText}</span>
}
