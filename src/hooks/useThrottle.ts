'use client'
import { useRef, useState, useCallback } from 'react'

/**
 * 버튼 연타 방지 훅
 * - pending 상태에서 재호출 차단
 * - cooldown(ms) 동안 재호출 차단
 */
export function useThrottledAction(cooldownMs = 1000) {
  const [pending, setPending] = useState(false)
  const lastCall = useRef(0)

  const execute = useCallback(async (fn: () => Promise<void>) => {
    const now = Date.now()
    if (pending || now - lastCall.current < cooldownMs) return
    lastCall.current = now
    setPending(true)
    try {
      await fn()
    } finally {
      setPending(false)
    }
  }, [pending, cooldownMs])

  return { pending, execute }
}

/**
 * 비동기 액션 로딩 상태 관리 훅
 * - pending 상태에서 재호출 차단 (더블클릭 방지)
 * - 버튼 disabled 처리에 사용
 */
export function useLoadingAction() {
  const [pending, setPending] = useState(false)

  const execute = useCallback(async (fn: () => Promise<void>) => {
    if (pending) return
    setPending(true)
    try {
      await fn()
    } finally {
      setPending(false)
    }
  }, [pending])

  return { pending, execute }
}

/**
 * 검색 입력 디바운스 훅
 */
export function useDebounce(delayMs = 300) {
  const timer = useRef<NodeJS.Timeout | null>(null)

  const debounce = useCallback((fn: () => void) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(fn, delayMs)
  }, [delayMs])

  return debounce
}
