"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { AuthorTheme, ThemeDecorations } from "@/features/theme/presets"
import { themePresets } from "@/features/theme/presets"
import { ColorField } from "./ColorField"
import { SelectField } from "./SelectField"

// 옵션 패널 (좌측) — 편집 전용
export function OptionsPanel({ theme, themeName, onNameChange, onChange, onPresetChange, onSave, onActivate, onGenerate, saving }: {
  theme: AuthorTheme
  themeName?: string
  onNameChange?: (name: string) => void
  onChange: (partial: Partial<AuthorTheme>) => void
  onPresetChange: (preset: string, label?: string) => void
  onSave: () => void
  onActivate?: () => void
  onGenerate: (description: string) => void
  saving: boolean
}) {
  const [aiPrompt, setAiPrompt] = useState("")
  const [apiPresets, setApiPresets] = useState<{ name: string; label: string }[]>([])

  useEffect(() => {
    api.getPresets().then(list => setApiPresets(list.map(p => ({ name: p.name, label: p.label })))).catch(() => {})
  }, [])

  const updateDeco = (partial: Partial<ThemeDecorations>) => {
    onChange({ decorations: { ...theme.decorations, ...partial } })
  }

  return (
    <div className="w-80 shrink-0 bg-white border-r border-gray-200 overflow-y-auto h-screen p-4 space-y-6">
      {/* 테마 이름 */}
      {onNameChange && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">테마 이름</label>
          <input
            type="text"
            value={themeName ?? ''}
            onChange={e => onNameChange(e.target.value)}
            placeholder="내 테마"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-900"
          />
        </div>
      )}

      {/* 저장 + 활성화 버튼 */}
      <div className="space-y-2">
        <button onClick={onSave} disabled={saving} className="w-full px-3 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
        {onActivate && (
          <button onClick={onActivate} disabled={saving} className="w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 disabled:opacity-50">
            {saving ? "처리 중..." : "내 공간에 적용"}
          </button>
        )}
      </div>

      {/* AI 테마 생성 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">AI로 테마 생성</h3>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="원하는 분위기를 자유롭게 설명하세요..."
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm h-24 resize-none"
        />
        <button
          onClick={() => { if (aiPrompt.trim()) onGenerate(aiPrompt.trim()) }}
          disabled={saving || !aiPrompt.trim()}
          className="mt-2 w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "생성 중..." : "AI로 생성 (1 크레딧)"}
        </button>
      </section>

      {/* 프리셋 선택 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">프리셋</h3>
        <select onChange={e => {
          const selected = apiPresets.find(p => p.name === e.target.value)
          onPresetChange(e.target.value, selected?.label)
        }} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white">
          <option value="">현재 설정 유지</option>
          {apiPresets.length > 0
            ? apiPresets.map(p => <option key={p.name} value={p.name}>{p.label}</option>)
            : Object.keys(themePresets).map(k => <option key={k} value={k}>{k}</option>)
          }
        </select>
      </section>

      {/* 색상 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">색상</h3>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="전체 배경" value={theme.bgPrimary} onChange={v => onChange({ bgPrimary: v })} />
          <ColorField label="카드 배경" value={theme.bgSecondary} onChange={v => onChange({ bgSecondary: v })} />
          <ColorField label="본문 글자" value={theme.textPrimary} onChange={v => onChange({ textPrimary: v })} />
          <ColorField label="보조 글자" value={theme.textMuted} onChange={v => onChange({ textMuted: v })} />
          <ColorField label="흐린 글자" value={theme.textDim} onChange={v => onChange({ textDim: v })} />
          <ColorField label="강조 글자" value={theme.textBright} onChange={v => onChange({ textBright: v })} />
          <ColorField label="포인트 색" value={theme.accent} onChange={v => onChange({ accent: v })} />
          <ColorField label="포인트 보조" value={theme.accent2} onChange={v => onChange({ accent2: v })} />
          <ColorField label="구분선" value={theme.border} onChange={v => onChange({ border: v })} />
        </div>
      </section>

      {/* 타이포그래피 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">타이포그래피</h3>
        <div className="space-y-2">
          <SelectField label="본문 폰트" value={theme.fontBody} options={[{ value: "serif", label: "세리프" }, { value: "sans-serif", label: "산세리프" }, { value: "monospace", label: "고정폭" }]} onChange={v => onChange({ fontBody: v })} />
          <SelectField label="제목 폰트" value={theme.fontHeading ?? "serif"} options={[{ value: "serif", label: "세리프" }, { value: "sans-serif", label: "산세리프" }, { value: "monospace", label: "고정폭" }]} onChange={v => onChange({ fontHeading: v })} />
          <SelectField label="제목 크기" value={theme.titleSize ?? "lg"} options={[{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }, { value: "xl", label: "XL" }]} onChange={v => onChange({ titleSize: v })} />
          <SelectField label="제목 두께" value={theme.titleWeight ?? "bold"} options={[{ value: "light", label: "가벼운" }, { value: "normal", label: "보통" }, { value: "bold", label: "굵은" }, { value: "black", label: "매우 굵은" }]} onChange={v => onChange({ titleWeight: v })} />
          <SelectField label="본문 크기" value={theme.bodySize ?? "normal"} options={[{ value: "compact", label: "작게" }, { value: "normal", label: "보통" }, { value: "large", label: "크게" }]} onChange={v => onChange({ bodySize: v })} />
          <SelectField label="행간" value={theme.bodyLineHeight ?? "relaxed"} options={[{ value: "compact", label: "좁게" }, { value: "normal", label: "보통" }, { value: "relaxed", label: "넓게" }]} onChange={v => onChange({ bodyLineHeight: v })} />
          <SelectField label="자간" value={theme.letterSpacing ?? "normal"} options={[{ value: "tight", label: "좁게" }, { value: "normal", label: "보통" }, { value: "wide", label: "넓게" }]} onChange={v => onChange({ letterSpacing: v })} />
        </div>
      </section>

      {/* 레이아웃 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">레이아웃</h3>
        <div className="space-y-2">
          <SelectField label="에피소드 목록" value={theme.episodeListLayout} options={[{ value: "series", label: "시리즈" }, { value: "grid", label: "그리드" }, { value: "magazine", label: "매거진" }, { value: "gallery", label: "갤러리" }, { value: "minimal", label: "미니멀" }]} onChange={v => onChange({ episodeListLayout: v })} />
          <SelectField label="히어로 스타일" value={theme.heroStyle ?? "minimal"} options={[{ value: "minimal", label: "미니멀" }, { value: "fullname", label: "풀네임" }, { value: "cover", label: "커버" }, { value: "none", label: "없음" }]} onChange={v => onChange({ heroStyle: v })} />
          <SelectField label="톤" value={theme.tone} options={[{ value: "dark", label: "다크" }, { value: "light", label: "라이트" }, { value: "sepia", label: "세피아" }]} onChange={v => onChange({ tone: v })} />
          <SelectField label="애니메이션" value={theme.animation} options={[{ value: "typing", label: "타이핑" }, { value: "fade", label: "페이드" }, { value: "slide", label: "슬라이드" }, { value: "none", label: "없음" }]} onChange={v => onChange({ animation: v })} />
          <SelectField label="콘텐츠 폭" value={theme.contentWidth ?? "normal"} options={[{ value: "narrow", label: "좁게" }, { value: "normal", label: "보통" }, { value: "wide", label: "넓게" }]} onChange={v => onChange({ contentWidth: v })} />
          <label className="flex items-center gap-2 mt-1">
            <input type="checkbox" checked={theme.showPreface ?? true} onChange={e => onChange({ showPreface: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">일러두기 표시</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={theme.showAfterword ?? true} onChange={e => onChange({ showAfterword: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">후기 표시</span>
          </label>
        </div>
      </section>

      {/* 장식 */}
      <section>
        <h3 className="text-sm font-bold text-gray-900 mb-2">장식</h3>
        <div className="space-y-2">
          <SelectField label="디바이더 아이콘" value={theme.decorations.dividerIcon} options={[{ value: "antler", label: "사슴뿔" }, { value: "flower", label: "꽃" }, { value: "star", label: "별" }, { value: "geometric", label: "기하학" }, { value: "brush", label: "붓" }, { value: "leaf", label: "잎" }, { value: "camellia", label: "동백" }, { value: "umbrella", label: "우산" }, { value: "waterwheel", label: "물레방아" }, { value: "book", label: "책" }, { value: "dot", label: "점" }, { value: "line", label: "선" }, { value: "none", label: "없음" }]} onChange={v => updateDeco({ dividerIcon: v })} />
          <ColorField label="디바이더 색상" value={theme.decorations.dividerColor || theme.accent} onChange={v => updateDeco({ dividerColor: v })} />
          <SelectField label="헤더 아이콘" value={theme.decorations.headerIcon} options={[{ value: "antler", label: "사슴뿔" }, { value: "quill", label: "깃펜" }, { value: "book", label: "책" }, { value: "dot", label: "점" }, { value: "none", label: "없음" }]} onChange={v => updateDeco({ headerIcon: v })} />
          <SelectField label="카드 악센트" value={theme.decorations.cardAccentPosition} options={[{ value: "left", label: "왼쪽" }, { value: "top", label: "상단" }, { value: "none", label: "없음" }]} onChange={v => updateDeco({ cardAccentPosition: v })} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">태그라인</span>
            <input type="text" value={theme.tagline ?? ""} onChange={e => onChange({ tagline: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Inspired by..." />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">헤더 서브타이틀</span>
            <input type="text" value={theme.decorations.headerSubtitle} onChange={e => updateDeco({ headerSubtitle: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="Short Fiction Anthology" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">푸터 텍스트</span>
            <input type="text" value={theme.decorations.footerText} onChange={e => updateDeco({ footerText: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="&copy; 2024 작가명" />
          </label>
        </div>
      </section>

      {/* 고급 설정 (접이식) */}
      <details className="group">
        <summary className="text-sm font-bold text-gray-900 cursor-pointer select-none flex items-center gap-1">
          <span className="transition-transform group-open:rotate-90">&#9654;</span>
          고급 설정
        </summary>
        <div className="mt-3 space-y-2">
          <SelectField label="카드 둥글기" value={theme.cardRadius ?? "8px"} options={[{ value: "0", label: "없음" }, { value: "4px", label: "작게" }, { value: "8px", label: "보통" }, { value: "16px", label: "크게" }]} onChange={v => onChange({ cardRadius: v })} />
          <SelectField label="섹션 간격" value={theme.sectionSpacing ?? "md"} options={[{ value: "sm", label: "좁게" }, { value: "md", label: "보통" }, { value: "lg", label: "넓게" }]} onChange={v => onChange({ sectionSpacing: v })} />
          <SelectField label="소제목 스타일" value={theme.subtitleStyle ?? "italic"} options={[{ value: "italic", label: "이탤릭" }, { value: "normal", label: "보통" }]} onChange={v => onChange({ subtitleStyle: v })} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">타이핑 속도 (ms)</span>
            <input type="number" min={5} max={200} value={theme.typingSpeed ?? 50} onChange={e => onChange({ typingSpeed: Number(e.target.value) })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">네비 투명도</span>
            <input type="range" min={0} max={1} step={0.05} value={theme.navOpacity ?? 0.95} onChange={e => onChange({ navOpacity: Number(e.target.value) })} className="mt-1 block w-full" />
            <span className="text-xs text-gray-500">{theme.navOpacity ?? 0.95}</span>
          </label>
          <SelectField label="탭 버튼 둥글기" value={theme.tabPillRadius ?? "20px"} options={[{ value: "4px", label: "약간" }, { value: "20px", label: "보통" }, { value: "9999px", label: "완전 둥글게" }]} onChange={v => onChange({ tabPillRadius: v })} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">라벨 자간</span>
            <input type="text" value={theme.labelLetterSpacing ?? "0.25em"} onChange={e => onChange({ labelLetterSpacing: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="0.25em" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">카드 워터마크 투명도</span>
            <input type="range" min={0} max={0.5} step={0.01} value={theme.cardWatermarkOpacity ?? 0.15} onChange={e => onChange({ cardWatermarkOpacity: Number(e.target.value) })} className="mt-1 block w-full" />
            <span className="text-xs text-gray-500">{theme.cardWatermarkOpacity ?? 0.15}</span>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">카드 호버 상승</span>
            <input type="text" value={theme.cardHoverLift ?? "0.125rem"} onChange={e => onChange({ cardHoverLift: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="0.125rem" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">카드 CTA 텍스트</span>
            <input type="text" value={theme.cardCtaText ?? "읽기 →"} onChange={e => onChange({ cardCtaText: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="읽기 →" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">에피소드 라벨 포맷</span>
            <input type="text" value={theme.episodeLabelFormat ?? "{author} · {type} {num}"} onChange={e => onChange({ episodeLabelFormat: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" placeholder="{author} · {type} {num}" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={theme.showProfileTab ?? true} onChange={e => onChange({ showProfileTab: e.target.checked })} className="rounded border-gray-300" />
            <span className="text-sm text-gray-700">프로필 탭 표시</span>
          </label>
        </div>
      </details>
    </div>
  )
}
