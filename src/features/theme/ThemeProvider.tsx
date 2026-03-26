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

const fontFamilyMap = {
  serif: "var(--font-garamond), var(--font-noto-serif-kr), Georgia, 'Batang', serif",
  "sans-serif": "system-ui, -apple-system, sans-serif",
  monospace: "'JetBrains Mono', 'Fira Code', monospace",
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const serifFont = fontFamilyMap[theme.fontBody]
  const sansFont = fontFamilyMap["sans-serif"]

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className="min-h-screen font-u-serif text-base md:text-[19px] leading-[1.75] md:leading-[1.85]"
        style={
          {
            "--u-bg": theme.bgPrimary,
            "--u-bg2": theme.bgSecondary,
            "--u-text": theme.textPrimary,
            "--u-text-muted": theme.textMuted,
            "--u-text-dim": theme.textDim,
            "--u-text-bright": theme.textBright,
            "--u-text-warm": theme.accent2,
            "--u-accent": theme.accent,
            "--u-accent2": theme.accent2,
            "--u-border": theme.border,
            "--u-serif": serifFont,
            "--u-sans": sansFont,
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
