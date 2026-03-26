"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

// ── 사슴뿔 SVG 인라인 ──

function AntlerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path
        d="M20 38C20 38 20 20 20 15C20 10 16 6 12 4C14 8 14 12 12 14C10 10 8 6 6 4C8 10 10 14 10 18M20 15C20 10 24 6 28 4C26 8 26 12 28 14C30 10 32 6 34 4C32 10 30 14 30 18"
        stroke="#9a8060"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="38" r="1.5" fill="#9a8060" />
    </svg>
  )
}

// ── 타입 ──

interface CardRect {
  top: number
  left: number
  width: number
  height: number
}

interface CardTransitionContextValue {
  navigateWithTransition: (href: string, cardElement: HTMLElement) => void
}

const CardTransitionContext = createContext<CardTransitionContextValue | null>(null)

export function useCardTransition() {
  return useContext(CardTransitionContext)
}

// ── Provider ──

export function CardTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [transition, setTransition] = useState<{
    rect: CardRect
    href: string
  } | null>(null)
  const [phase, setPhase] = useState<"idle" | "expand" | "hold" | "shrink">("idle")

  const navigateWithTransition = useCallback(
    (href: string, cardElement: HTMLElement) => {
      const rect = cardElement.getBoundingClientRect()
      setTransition({
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        href,
      })
      setPhase("expand")
    },
    []
  )

  // 확대 완료 → 잠시 유지 → 라우팅 → 원래 위치로 축소
  const handleExpandComplete = useCallback(() => {
    if (phase === "expand" && transition) {
      setPhase("hold")
      window.scrollTo({ top: 0, behavior: "instant" })
      router.push(transition.href)
      setTimeout(() => {
        setPhase("shrink")
      }, 100)
    }
  }, [phase, transition, router])

  const handleShrinkComplete = useCallback(() => {
    if (phase === "shrink") {
      setTransition(null)
      setPhase("idle")
    }
  }, [phase])

  const vw = typeof window !== "undefined" ? window.innerWidth : 1920
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080

  return (
    <CardTransitionContext.Provider value={{ navigateWithTransition }}>
      {children}

      <AnimatePresence>
        {transition && phase !== "idle" && (
          <>
            {/* 배경 */}
            <motion.div
              className="fixed inset-0 z-[998] bg-u-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "shrink" ? 0 : 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* 카드 확대/축소 + 사슴뿔 */}
            <motion.div
              className="fixed z-[999] bg-u-bg overflow-hidden flex items-center justify-center"
              initial={{
                top: transition.rect.top,
                left: transition.rect.left,
                width: transition.rect.width,
                height: transition.rect.height,
                borderRadius: 8,
              }}
              animate={
                phase === "expand" || phase === "hold"
                  ? {
                      top: 0,
                      left: 0,
                      width: vw,
                      height: vh,
                      borderRadius: 0,
                    }
                  : {
                      // shrink — 원래 카드 위치로 돌아가며 사라짐
                      top: transition.rect.top,
                      left: transition.rect.left,
                      width: transition.rect.width,
                      height: transition.rect.height,
                      borderRadius: 8,
                      opacity: 0,
                    }
              }
              exit={{ opacity: 0 }}
              transition={
                phase === "shrink"
                  ? { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
                  : { duration: 0.45, ease: [0.4, 0, 0.2, 1] }
              }
              onAnimationComplete={
                phase === "expand"
                  ? handleExpandComplete
                  : phase === "shrink"
                    ? handleShrinkComplete
                    : undefined
              }
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: phase === "shrink" ? 0 : 0.7,
                  scale: phase === "shrink" ? 0.5 : 1,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <AntlerIcon size={140} />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CardTransitionContext.Provider>
  )
}
