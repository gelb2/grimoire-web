"use client"

import type { ReactNode } from "react"
import type { AuthorTheme } from "./presets"

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
    <div
      className="min-h-screen font-u-serif text-base md:text-[19px] leading-[1.75] md:leading-[1.85]"
      style={
        {
          "--u-bg": theme.bgPrimary,
          "--u-bg2": theme.bgSecondary,
          "--u-text": theme.textPrimary,
          "--u-text-muted": theme.textMuted,
          "--u-text-dim": theme.textDim,
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
  )
}
