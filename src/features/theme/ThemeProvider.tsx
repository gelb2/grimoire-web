"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { AuthorTheme } from "./presets"

// 테마 컨텍스트 — 자식 컴포넌트에서 테마 데이터에 접근
const ThemeContext = createContext<AuthorTheme | null>(null)

export function useTheme(): AuthorTheme {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme은 ThemeProvider 내부에서 사용해야 합니다.")
  return ctx
}

interface ThemeProviderProps {
  theme: AuthorTheme
  children: ReactNode
}

const fontFamilyMap: Record<string, string> = {
  serif: "var(--font-garamond), var(--font-noto-serif-kr), Georgia, 'Batang', serif",
  "sans-serif": "system-ui, -apple-system, sans-serif",
  monospace: "'JetBrains Mono', 'Fira Code', monospace",
}

// Phase 1 타이포그래피 매핑
const titleSizeMap = { sm: "2rem", md: "3rem", lg: "4rem", xl: "6rem" }
const titleWeightMap = { light: "300", normal: "400", bold: "700", black: "900" }
const letterSpacingMap = { tight: "-0.02em", normal: "0", wide: "0.1em" }
const lineHeightMap = { compact: "1.5", normal: "1.7", relaxed: "1.9" }
const contentWidthMap = { narrow: "600px", normal: "700px", wide: "860px" }

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const serifFont = fontFamilyMap[theme.fontBody]
  const sansFont = fontFamilyMap["sans-serif"]

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className="min-h-dvh font-g-serif text-base md:fs-caption leading-[1.75] md:leading-[1.85]"
        style={
          {
            "--g-bg": theme.bgPrimary,
            "--g-bg2": theme.bgSecondary,
            "--g-text": theme.textPrimary,
            "--g-text-muted": theme.textMuted,
            "--g-text-dim": theme.textDim,
            "--g-text-bright": theme.textBright,
            "--g-text-warm": theme.accent2,
            "--g-accent": theme.accent,
            "--g-accent2": theme.accent2,
            "--g-border": theme.border,
            "--g-serif": serifFont,
            "--g-sans": sansFont,
            // Phase 1: 타이포그래피 확장
            "--g-title-size": titleSizeMap[theme.titleSize ?? "lg"],
            "--g-title-weight": titleWeightMap[theme.titleWeight ?? "bold"],
            "--g-letter-spacing": letterSpacingMap[theme.letterSpacing ?? "normal"],
            "--g-line-height": lineHeightMap[theme.bodyLineHeight ?? "relaxed"],
            "--g-content-width": contentWidthMap[theme.contentWidth ?? "normal"],
            // fontHeading — 제목용 폰트 (fontBody와 독립)
            "--g-heading-font": fontFamilyMap[theme.fontHeading ?? "serif"],
            // 카드/네비
            "--g-card-radius": theme.cardRadius ?? "8px",
            "--g-nav-opacity": String(theme.navOpacity ?? 0.95),
            "--g-tab-pill-radius": theme.tabPillRadius ?? "20px",
            "--g-label-letter-spacing": theme.labelLetterSpacing ?? "0.25em",
            "--g-card-watermark-opacity": String(theme.cardWatermarkOpacity ?? 0.15),
            "--g-card-hover-lift": theme.cardHoverLift ?? "0.125rem",
            // tone
            colorScheme: theme.tone === "light" ? "light" : "dark",
            backgroundColor: theme.bgPrimary,
            color: theme.textPrimary,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
