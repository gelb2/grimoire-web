"use client"

import { AntlerDivider } from "./AntlerDivider"
import { BackLink } from "./BackLink"
import { SectionLabel } from "./SectionLabel"
import { ChapterBlock } from "./ChapterBlock"
import { TypeWriter } from "./TypeWriter"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import type { EpisodeData, ContentMeta, Block } from "@/features/universe/data"

interface EpisodeViewerProps {
  meta: ContentMeta
  data: EpisodeData
  /** 작가 이름 — 라벨/푸터에 표시 */
  authorName?: string
}

// 글자 타이핑이 적용되는 첫 문단 수
const TYPING_BLOCKS = 3
// 뭉텅이 페이드인이 적용되는 뷰포트 블록 수
const VIEWPORT_BLOCKS = 10

export function EpisodeViewer({ meta, data, authorName = "Grimoire" }: EpisodeViewerProps) {
  // 세션 내 방문 여부 확인 — 재방문 시 타이핑 스킵
  const isRevisit = typeof window !== "undefined"
    && sessionStorage.getItem(`visited:${data.slug}`) === "true"

  // 0: 대기, 1: 라벨 타이핑, 2: 제목 타이핑, 3: 본문 타이핑, 4: 본문 페이드인, 5: 완료
  const [stage, setStage] = useState(isRevisit ? 5 : 0)
  const [typingBlockIdx, setTypingBlockIdx] = useState(isRevisit ? TYPING_BLOCKS : -1)
  const [revealedCount, setRevealedCount] = useState(isRevisit ? data.blocks.length : 0)

  // 언마운트 감지 — 모든 비동기 콜백에서 체크
  const cancelledRef = useRef(false)
  // 활성 타이머 추적 — 언마운트 시 일괄 정리
  const timersRef = useRef<Set<ReturnType<typeof setTimeout | typeof setInterval>>>(new Set())

  // num이 없으면 에피소드 번호 라벨 생략
  const episodeLabel = meta.num
    ? (meta.type === "bonus" ? meta.num : `Episode ${meta.num}`)
    : null
  const labelText = episodeLabel ? `${authorName} · ${episodeLabel}` : authorName

  // 타이핑 대상 블록 찾기 (paragraph 타입만, 최대 TYPING_BLOCKS개)
  const typingTargets: number[] = []
  for (let i = 0; i < data.blocks.length && typingTargets.length < TYPING_BLOCKS; i++) {
    if (data.blocks[i].type === "paragraph" || data.blocks[i].type === "italic") {
      typingTargets.push(i)
    }
  }
  const lastTypingIdx = typingTargets.length > 0 ? typingTargets[typingTargets.length - 1] : -1

  // 안전한 타이머 등록 — 자동 추적 + 완료 시 자동 제거
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id)
      if (!cancelledRef.current) fn()
    }, ms)
    timersRef.current.add(id)
    return id
  }, [])

  const safeInterval = useCallback((fn: () => void, ms: number) => {
    const id = setInterval(() => {
      if (cancelledRef.current) {
        clearInterval(id)
        timersRef.current.delete(id)
        return
      }
      fn()
    }, ms)
    timersRef.current.add(id)
    return id
  }, [])

  // 마운트/언마운트 라이프사이클 — 모든 타이머 정리
  useEffect(() => {
    cancelledRef.current = false

    if (!isRevisit) {
      safeTimeout(() => setStage(1), 200)
    }

    return () => {
      cancelledRef.current = true
      for (const id of timersRef.current) {
        clearTimeout(id)
        clearInterval(id)
      }
      timersRef.current.clear()
    }
  }, [])

  // 본문 타이핑 시작
  const startBodyTyping = useCallback(() => {
    if (cancelledRef.current) return
    setStage(3)
    if (typingTargets.length > 0) {
      setTypingBlockIdx(0)
      setRevealedCount(typingTargets[0])
    } else {
      startFadeIn()
    }
  }, [typingTargets])

  // 타이핑 블록 하나 완료 → 다음
  const handleTypingBlockComplete = useCallback(() => {
    if (cancelledRef.current) return
    const nextIdx = typingBlockIdx + 1
    if (nextIdx < typingTargets.length) {
      setTypingBlockIdx(nextIdx)
      setRevealedCount(typingTargets[nextIdx])
    } else {
      setRevealedCount(lastTypingIdx + 1)
      safeTimeout(() => startFadeIn(), 150)
    }
  }, [typingBlockIdx, typingTargets, lastTypingIdx, safeTimeout])

  // 나머지 블록 순차 페이드인
  const startFadeIn = useCallback(() => {
    if (cancelledRef.current) return
    setStage(4)
    const startFrom = lastTypingIdx + 1
    let i = 0
    const vpCount = Math.min(VIEWPORT_BLOCKS, data.blocks.length - startFrom)
    safeInterval(() => {
      i++
      setRevealedCount(startFrom + i)
      if (i >= vpCount) {
        // interval은 safeInterval 내부에서 cancelled 체크로 자동 정리됨
        // 남은 블록 한꺼번에 표시 + 완료 처리
        safeTimeout(() => {
          setRevealedCount(data.blocks.length)
          setStage(5)
          sessionStorage.setItem(`visited:${data.slug}`, "true")
        }, 100)
      }
    }, 80)
  }, [data.blocks.length, data.slug, lastTypingIdx, safeInterval, safeTimeout])

  return (
    <div className="max-w-u-reader mx-auto px-4 md:px-8 pb-16 md:pb-32">
      {/* 히어로 */}
      <header className="pt-12 md:pt-20 pb-8 md:pb-14 border-b border-u-border">
        <div className="font-u-sans text-u-caption tracking-u-wide text-u-text-muted uppercase mb-3 md:mb-5 min-h-[1em]">
          {isRevisit ? labelText : stage >= 1 && (
            <TypeWriter
              text={labelText}
              speed={25}
              onComplete={() => { if (!cancelledRef.current) setStage(2) }}
            />
          )}
        </div>

        <h1 className="text-2xl md:text-4xl font-normal leading-[1.3] text-u-text-bright mb-2.5 italic min-h-[1.3em]">
          {isRevisit ? meta.title : stage >= 2 && (
            <TypeWriter
              text={meta.title}
              speed={35}
              onComplete={() => safeTimeout(startBodyTyping, 400)}
            />
          )}
        </h1>

        {meta.subtitle && (
          <motion.div
            className="font-u-sans text-u-caption text-u-text-muted tracking-u-normal"
            initial={{ opacity: 0 }}
            animate={{ opacity: stage >= 3 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {meta.subtitle}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: stage >= 3 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <AntlerDivider size={24} className="mt-6 md:mt-8" />
        </motion.div>
      </header>

      {/* 본문 */}
      {stage >= 3 && (
        <main>
          {data.blocks.map((block: Block, idx: number) => {
            // 이 블록이 타이핑 대상인지
            const typingOrder = typingTargets.indexOf(idx)
            const isTypingBlock = typingOrder !== -1

            if (isTypingBlock) {
              const isActiveTyping = typingOrder === typingBlockIdx
              const isTyped = typingOrder < typingBlockIdx

              if (!isActiveTyping && !isTyped) return null

              if (isTyped) {
                return (
                  <div key={idx}>
                    <ChapterBlock blocks={[block]} />
                  </div>
                )
              }

              // 현재 타이핑 중인 블록
              return (
                <div key={idx} className="mb-u-paragraph text-u-text">
                  <TypeWriter
                    text={block.text ?? ""}
                    speed={15}
                    onComplete={handleTypingBlockComplete}
                  />
                </div>
              )
            }

            // 비타이핑 블록 — 페이드인
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: idx < revealedCount ? 1 : 0,
                  y: idx < revealedCount ? 0 : 8,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChapterBlock blocks={[block]} />
              </motion.div>
            )
          })}
        </main>
      )}

      {/* 클로즈 라인 */}
      <motion.footer
        className="text-center mt-12 md:mt-16 pt-8 md:pt-12 border-t border-u-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 5 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="italic text-[0.95rem] text-u-text-muted leading-loose">
          결핍은 질문을 삼킨다.
        </p>
        <p className="text-[0.8rem] text-u-text-dim mt-4 not-italic font-u-sans tracking-u-normal">
          {authorName}
        </p>
      </motion.footer>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 5 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <BackLink />
      </motion.div>
    </div>
  )
}
