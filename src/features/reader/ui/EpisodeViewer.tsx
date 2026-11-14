"use client"

import { ThemeDivider } from "./ThemeDecorations"
import { BackLink } from "./BackLink"
import { SectionLabel } from "./SectionLabel"
import { ChapterBlock } from "./ChapterBlock"
import { TypeWriter } from "./TypeWriter"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import type { EpisodeData, ContentMeta, Block } from "@/features/reader/data"
import type { ThemeDecorations as DecorationConfig } from "@/features/theme"
import { useTheme } from "@/features/theme"

// 기본 장식 설정 — 범용 (테마 미지정 시)
const DEFAULT_DECORATIONS: DecorationConfig = {
  dividerIcon: "dot",
  dividerColor: "#888888",
  headerIcon: "dot",
  headerSubtitle: "",
  cardAccentPosition: "left",
  footerText: "",
}

interface EpisodeViewerProps {
  meta: ContentMeta
  data: EpisodeData
  /** 작가 이름 — 라벨/푸터에 표시 */
  authorName?: string
  /** 장식 설정 — 테마에서 전달 */
  decorations?: DecorationConfig
  /** 작가별 대표 문구 — 테마에서 전달 */
  tagline?: string
}

// 글자 타이핑이 적용되는 첫 문단 수
const TYPING_BLOCKS = 3
// 뭉텅이 페이드인이 적용되는 뷰포트 블록 수
const VIEWPORT_BLOCKS = 10

export function EpisodeViewer({ meta, data: rawData, authorName = "Grimoire", decorations: decorationsProp, tagline: taglineProp }: EpisodeViewerProps) {
  // blocks 방어: 중첩 객체({title, blocks:[...]}) → 배열 추출
  const data = {
    ...rawData,
    blocks: Array.isArray(rawData.blocks) ? rawData.blocks : (rawData.blocks as unknown as { blocks: Block[] })?.blocks ?? [],
  }
  // 테마 컨텍스트에서 장식/태그라인/애니메이션 가져오기 (props 우선)
  const themeCtx = useTheme()
  const decorations = decorationsProp ?? themeCtx.decorations ?? DEFAULT_DECORATIONS
  const tagline = taglineProp ?? themeCtx.tagline
  const animationType = themeCtx.animation ?? "none"
  const typingSpeed = themeCtx.typingSpeed ?? 30
  const subtitleStyle = themeCtx.subtitleStyle ?? "italic"
  const sectionSpacing = themeCtx.sectionSpacing ?? "md"
  const episodeLabelFormat = themeCtx.episodeLabelFormat ?? "{author} · {type} {num}"

  // 섹션 여백 매핑
  // main 원본: pt-12 md:pt-20 pb-8 md:pb-14 → md 기본값을 이에 맞춤
  const spacingMap = { sm: { pt: "pt-6 md:pt-10", pb: "pb-4 md:pb-8" }, md: { pt: "pt-12 md:pt-20", pb: "pb-8 md:pb-14" }, lg: { pt: "pt-16 md:pt-28", pb: "pb-12 md:pb-20" } }
  const spacing = spacingMap[sectionSpacing as keyof typeof spacingMap] ?? spacingMap.md

  // 애니메이션 없음(none) → 모든 콘텐츠 즉시 표시
  const skipAnimation = animationType === "none"

  // 세션 내 방문 여부 확인 — hydration 이후에 sessionStorage 접근
  const visitedKey = `visited:${authorName}:${data.slug}`

  // SSR/CSR 초기값 일치: skipAnimation만 기준. 재방문 여부는 useEffect에서 반영.
  const showImmediately = skipAnimation
  const [stage, setStage] = useState(skipAnimation ? 5 : 0)
  const [typingBlockIdx, setTypingBlockIdx] = useState(skipAnimation ? TYPING_BLOCKS : -1)
  const [revealedCount, setRevealedCount] = useState(skipAnimation ? data.blocks.length : 0)

  // 언마운트 감지 — 모든 비동기 콜백에서 체크
  const cancelledRef = useRef(false)
  // 활성 타이머 추적 — 언마운트 시 일괄 정리
  const timersRef = useRef<Set<ReturnType<typeof setTimeout | typeof setInterval>>>(new Set())

  // type별 라벨 — episodeLabelFormat 템플릿에서 {author}, {type}, {num} 치환
  const typeLabel = (() => {
    switch (meta.type) {
      case 'preface': return 'Preface'
      case 'afterword': return 'Afterword'
      case 'bonus': return 'Bonus'
      default: return 'Episode'
    }
  })()
  const numLabel = meta.num?.replace(/\D/g, '') ?? ''
  // episode 타입인데 num이 비어있으면 "{type} {num}" 부분 통째 제거 (e.g. "Grimoire · Episode " → "Grimoire")
  // preface/afterword/bonus는 num 없이도 타입 라벨 유지 (e.g. "Grimoire · Afterword")
  const stripTypeNum = meta.type === 'episode' && !numLabel
  const formatTemplate = stripTypeNum
    ? episodeLabelFormat.replace(/[·\-]\s*\{type\}\s*\{num\}/, '').replace(/\{type\}\s*\{num\}/, '')
    : episodeLabelFormat
  const labelText = formatTemplate
    .replace('{author}', authorName)
    .replace('{type}', typeLabel)
    .replace('{num}', numLabel)
    .replace(/\s+/g, ' ')
    .trim()

  // 타이핑 대상 블록 찾기 (paragraph 타입만, 최대 TYPING_BLOCKS개)
  const typingTargets = useMemo(() => {
    const targets: number[] = []
    for (let i = 0; i < data.blocks.length && targets.length < TYPING_BLOCKS; i++) {
      if (data.blocks[i].type === "paragraph" || data.blocks[i].type === "italic") {
        targets.push(i)
      }
    }
    return targets
  }, [data.blocks])
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

  // 마운트/언마운트 라이프사이클 — 모든 타이머 정리 (mount-only)
  useEffect(() => {
    cancelledRef.current = false
    const timers = timersRef.current

    // 재방문 확인 (sessionStorage — 클라이언트 전용)
    const isRevisit = sessionStorage.getItem(visitedKey) === "true"

    if (skipAnimation || isRevisit) {
      // 즉시 표시 — 재방문 또는 animation: "none"
      setStage(5)
      setTypingBlockIdx(TYPING_BLOCKS)
      setRevealedCount(data.blocks.length)
    } else {
      if (animationType === "typing") {
        // typing: 라벨 → 제목 → 본문 순차 타이핑
        safeTimeout(() => setStage(1), 200)
      } else {
        // fade/slide: 타이핑 없이 헤더 즉시 표시 → 본문 페이드인
        safeTimeout(() => {
          setStage(3)
          startFadeIn()
        }, 300)
      }
    }

    return () => {
      cancelledRef.current = true
      for (const id of timers) {
        clearTimeout(id)
        clearInterval(id)
      }
      timers.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: 에피소드 전환 시 key prop으로 리마운트
  }, [])

  // 나머지 블록 순차 페이드인
  const startFadeIn = useCallback(() => {
    if (cancelledRef.current) return
    setStage(4)
    const startFrom = lastTypingIdx + 1
    let i = 0
    const vpCount = Math.min(VIEWPORT_BLOCKS, data.blocks.length - startFrom)

    if (vpCount <= 0) {
      // 페이드인할 블록이 없으면 즉시 완료
      setRevealedCount(data.blocks.length)
      setStage(5)
      sessionStorage.setItem(visitedKey, "true")
      return
    }

    const intervalId = safeInterval(() => {
      i++
      setRevealedCount(startFrom + i)
      if (i >= vpCount) {
        // interval 즉시 정리 — 불필요한 추가 실행 방지
        clearInterval(intervalId)
        timersRef.current.delete(intervalId)
        // 남은 블록 한꺼번에 표시 + 완료 처리
        safeTimeout(() => {
          setRevealedCount(data.blocks.length)
          setStage(5)
          sessionStorage.setItem(visitedKey, "true")
        }, 100)
      }
    }, 80)
  }, [data.blocks.length, lastTypingIdx, safeInterval, safeTimeout, visitedKey])

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
  }, [typingTargets, startFadeIn])

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
  }, [typingBlockIdx, typingTargets, lastTypingIdx, safeTimeout, startFadeIn])

  // 본문 크기 독립 제어 (A-/A+) — localStorage 저장
  const [fontSize, setFontSize] = useState(0) // 0 = 기본, -2~+4 범위
  useEffect(() => {
    const saved = localStorage.getItem('grimoire_font_size')
    if (saved) setFontSize(parseInt(saved) || 0)
  }, [])
  const adjustSize = (delta: number) => {
    setFontSize(prev => {
      const next = Math.max(-2, Math.min(4, prev + delta))
      localStorage.setItem('grimoire_font_size', String(next))
      return next
    })
  }
  const bodyFontSize = `calc(var(--g-body-size, 19px) + ${fontSize}px)`

  return (
    <div className="mx-auto px-4 md:px-8 pb-16 md:pb-32" style={{ lineHeight: 'var(--g-line-height, 1.9)', fontSize: bodyFontSize }}>
      {/* 본문 크기 조절 */}
      <div className="flex justify-end gap-1 pt-3 pb-1">
        <button onClick={() => adjustSize(-1)} className="w-7 h-7 rounded border border-g-border text-g-text-muted text-xs hover:text-g-text-bright transition" aria-label="글자 작게">A-</button>
        <button onClick={() => adjustSize(1)} className="w-7 h-7 rounded border border-g-border text-g-text-muted text-xs hover:text-g-text-bright transition" aria-label="글자 크게">A+</button>
        <button onClick={() => { setFontSize(0); localStorage.removeItem('grimoire_font_size') }} className={`w-7 h-7 rounded border border-g-border text-[10px] transition ${fontSize !== 0 ? 'text-g-text-dim hover:text-g-text-bright' : 'text-g-text-dim/30 cursor-default'}`} disabled={fontSize === 0} aria-label="기본 크기">↺</button>
      </div>
      {/* 히어로 */}
      <header className={`${spacing.pt} ${spacing.pb} border-b border-g-border`}>
        <div className="font-g-sans fs-caption tracking-wide-g text-g-text-muted uppercase mb-3 md:mb-5 min-h-[1em]">
          {showImmediately || animationType !== "typing" ? labelText : (
            <TypeWriter
              text={labelText}
              active={stage >= 1}
              speed={typingSpeed}
              onComplete={() => { if (!cancelledRef.current) setStage(2) }}
            />
          )}
        </div>

        <h1 className={`font-g-heading text-2xl md:text-4xl font-normal leading-[1.3] text-g-text-bright mb-2.5 min-h-[1.3em] ${subtitleStyle === 'italic' ? 'italic' : ''}`} style={{ fontWeight: 'var(--g-title-weight, 400)', letterSpacing: 'var(--g-letter-spacing, 0)' }}>
          {showImmediately || animationType !== "typing" ? meta.title : (
            <TypeWriter
              text={meta.title}
              active={stage >= 2}
              speed={typingSpeed}
              onComplete={() => safeTimeout(startBodyTyping, 400)}
            />
          )}
        </h1>

        {/* description 우선, 없으면 subtitle 폴백 */}
        {(meta.description || meta.subtitle) && (
          <motion.div
            className={meta.description
              ? "text-sm text-g-text-muted leading-relaxed mt-2 max-w-prose"
              : "font-g-sans fs-caption text-g-text-muted tracking-normal-g"
            }
            initial={showImmediately ? false : { opacity: 0 }}
            animate={{ opacity: stage >= 3 ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {meta.description || meta.subtitle}
          </motion.div>
        )}

        <motion.div
          initial={showImmediately ? false : { opacity: 0 }}
          animate={{ opacity: stage >= 3 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          <ThemeDivider decorations={decorations} size={24} className="mt-6 md:mt-8" />
        </motion.div>
      </header>

      {/* 본문 — 구분선과 텍스트 사이 충분한 여백 확보 */}
        <main className="pt-8 md:pt-14" style={{ visibility: stage >= 3 ? 'visible' : 'hidden' }}>
          {data.blocks.map((block: Block, idx: number) => {
            // 이 블록이 타이핑 대상인지 (typing 모드에서만)
            const typingOrder = typingTargets.indexOf(idx)
            const isTypingBlock = animationType === "typing" && typingOrder !== -1

            if (isTypingBlock) {
              const isActiveTyping = typingOrder === typingBlockIdx
              const isTyped = typingOrder < typingBlockIdx

              if (isTyped) {
                return (
                  <div key={idx}>
                    <ChapterBlock blocks={[block]} />
                  </div>
                )
              }

              // 현재 타이핑 중인 블록
              return (
                <div key={idx} className="relative">
                  <div style={{ visibility: 'hidden' }} aria-hidden="true"><ChapterBlock blocks={[block]} /></div>
                  <div className={`absolute inset-0 mb-5 ${block.type === 'italic' ? 'italic text-g-text-warm' : 'text-g-text'}`} style={{ visibility: isActiveTyping && stage >= 3 ? 'visible' : 'hidden' }}>
                    <TypeWriter
                      text={block.text ?? ""}
                      active={stage >= 3 && isActiveTyping}
                      speed={typingSpeed}
                      onComplete={handleTypingBlockComplete}
                    />
                  </div>
                </div>
              )
            }

            // 비타이핑 블록 — 애니메이션 타입별 렌더
            const isRevealed = idx < revealedCount

            // 완료된 블록은 정적 렌더 — 스크롤 시 깜박임/흔들림 방지
            if (isRevealed && stage >= 5) {
              return (
                <div key={idx}>
                  <ChapterBlock blocks={[block]} />
                </div>
              )
            }

            // 애니메이션 타입별 initial → animate 값
            const slideOffset = animationType === "slide" ? 20 : 8
            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  opacity: isRevealed ? 1 : 0,
                  y: isRevealed ? 0 : slideOffset,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChapterBlock blocks={[block]} />
              </motion.div>
            )
          })}
        </main>

      {/* 클로즈 라인 */}
      <motion.footer
        className="text-center mt-12 md:mt-16 pt-8 md:pt-12 border-t border-g-border"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage >= 5 ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {tagline && (
          <p className="italic text-[0.95rem] text-g-text-muted leading-loose">
            {tagline}
          </p>
        )}
        <p className="text-[0.8rem] text-g-text-dim mt-4 not-italic font-g-sans tracking-normal-g">
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
