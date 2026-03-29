"use client"

// ThemePreview — 테마 에디터의 실시간 미리보기 컴포넌트
// 작가공간(AuthorSpace)과 에피소드(EpisodeViewer) 두 탭으로 구성
// AuthorSpace의 실제 레이아웃(gallery/magazine/minimal/series/grid)을 축소 반영

import { useState } from 'react'
import type { AuthorTheme } from '@/features/theme'

interface ThemePreviewProps {
  theme: AuthorTheme
  authorName: string
  /** 미리보기 영역의 인라인 CSS Variables */
  previewStyle: Record<string, string>
}

// 더미 작품 데이터 — 미리보기용
const MOCK_WORKS = [
  { title: '첫 번째 이야기', episodes: 5 },
  { title: '두 번째 이야기', episodes: 3 },
  { title: '세 번째 이야기', episodes: 8 },
]

const MOCK_EPISODES = [
  { num: '01', title: '시작' },
  { num: '02', title: '전개' },
  { num: '03', title: '위기' },
]

export function ThemePreview({ theme, authorName, previewStyle }: ThemePreviewProps) {
  const [tab, setTab] = useState<'space' | 'episode'>('space')

  return (
    <div
      className="rounded-xl border border-neutral-800 overflow-hidden min-h-[600px] flex flex-col"
      style={previewStyle}
    >
      {/* 탭 전환 */}
      <div className="flex border-b" style={{ borderColor: 'var(--g-border)', backgroundColor: 'var(--g-bg2)' }}>
        <button
          onClick={() => setTab('space')}
          className="flex-1 py-2.5 text-xs tracking-widest uppercase transition"
          style={{
            color: tab === 'space' ? 'var(--g-text-bright)' : 'var(--g-text-dim)',
            borderBottom: tab === 'space' ? '2px solid var(--g-accent)' : '2px solid transparent',
          }}
        >
          작가공간
        </button>
        <button
          onClick={() => setTab('episode')}
          className="flex-1 py-2.5 text-xs tracking-widest uppercase transition"
          style={{
            color: tab === 'episode' ? 'var(--g-text-bright)' : 'var(--g-text-dim)',
            borderBottom: tab === 'episode' ? '2px solid var(--g-accent)' : '2px solid transparent',
          }}
        >
          에피소드
        </button>
      </div>

      {/* 미리보기 본문 */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--g-bg)', color: 'var(--g-text)' }}>
        {tab === 'space' ? (
          <AuthorSpacePreview theme={theme} authorName={authorName} />
        ) : (
          <EpisodePreview theme={theme} authorName={authorName} />
        )}
      </div>
    </div>
  )
}

// ── 작가공간 미리보기 — layout별 분기 ──

function AuthorSpacePreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  const layout = theme.layout ?? 'grid'

  switch (layout) {
    case 'gallery':
      return <GalleryPreview theme={theme} authorName={authorName} />
    case 'magazine':
      return <MagazinePreview theme={theme} authorName={authorName} />
    case 'minimal':
      return <MinimalPreview theme={theme} authorName={authorName} />
    case 'series':
      return <SeriesPreview theme={theme} authorName={authorName} />
    default:
      return <GridPreview theme={theme} authorName={authorName} />
  }
}

// ── NavPreview — navStyle별 네비게이션 ──

function NavPreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  const navStyle = theme.navStyle ?? 'top'

  if (navStyle === 'hidden') {
    return (
      <nav className="flex justify-between items-center px-6 py-4">
        <span className="text-[10px] opacity-50" style={{ color: 'var(--g-text-dim)' }}>← 탐색</span>
        <span className="text-[10px] opacity-50" style={{ color: 'var(--g-text-dim)' }}>Grimoire</span>
      </nav>
    )
  }

  if (navStyle === 'sidebar') {
    return null // 사이드바는 레이아웃 자체에서 처리
  }

  // top
  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'var(--g-border)' }}>
      <span className="text-[10px]" style={{ color: 'var(--g-text-dim)' }}>← 탐색</span>
      <span className="text-xs tracking-widest uppercase" style={{ color: 'var(--g-text-bright)' }}>{authorName}</span>
      <span className="text-[10px]" style={{ color: 'var(--g-text-dim)' }}>Grimoire</span>
    </nav>
  )
}

// ── Gallery 레이아웃 (AHYEON RYU 참고) ──

function GalleryPreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  return (
    <div className="flex flex-col min-h-[550px]">
      {/* 풀스크린 히어로 — 하단 고정 작가명 */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-8 relative">
        <NavPreview theme={theme} authorName={authorName} />
        <div className="mt-auto">
          <h1
            className="leading-none"
            style={{
              color: 'var(--g-text-bright)',
              fontSize: 'clamp(2rem, 8vw, var(--g-title-size, 4rem))',
              fontWeight: 'var(--g-title-weight, 900)',
              letterSpacing: 'var(--g-letter-spacing, 0.1em)',
            }}
          >
            {authorName}
          </h1>
          <p className="text-xs mt-2" style={{ color: 'var(--g-text-dim)' }}>
            {MOCK_WORKS.length} WORKS
          </p>
        </div>
      </div>

      {/* 작품 리스트 */}
      <div className="px-6 pb-8">
        <div className="border-t pt-6" style={{ borderColor: 'var(--g-border)' }}>
          {MOCK_WORKS.map((work, i) => (
            <div
              key={i}
              className="flex items-baseline gap-4 py-4 border-b"
              style={{ borderColor: 'var(--g-border)' }}
            >
              <span className="text-xs font-mono" style={{ color: 'var(--g-text-dim)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  color: 'var(--g-text-bright)',
                  fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                  fontWeight: 'var(--g-title-weight, 700)',
                  letterSpacing: 'var(--g-letter-spacing, 0)',
                }}
              >
                {work.title}
              </span>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--g-text-dim)' }}>{work.episodes}화</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Magazine 레이아웃 (UNLEARNED 참고) ──

function MagazinePreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  const hasSidebar = theme.navStyle === 'sidebar'

  return (
    <div className={hasSidebar ? 'flex min-h-[550px]' : 'min-h-[550px]'}>
      {/* 사이드바 네비 */}
      {hasSidebar && (
        <div className="w-10 border-r flex flex-col items-center py-4 gap-3 shrink-0" style={{ borderColor: 'var(--g-border)' }}>
          <span className="text-[8px] writing-vertical" style={{ color: 'var(--g-text-dim)', writingMode: 'vertical-rl' }}>탐색</span>
          <div className="flex-1" />
          <span className="text-[8px] writing-vertical" style={{ color: 'var(--g-text-dim)', writingMode: 'vertical-rl' }}>Grimoire</span>
        </div>
      )}

      <div className="flex-1">
        {!hasSidebar && <NavPreview theme={theme} authorName={authorName} />}

        {/* 히어로 — 센터 */}
        <div className="flex items-center justify-center px-6 py-16 border-b" style={{ borderColor: 'var(--g-border)' }}>
          <div className="text-center">
            <p className="text-[10px] tracking-widest mb-4" style={{ color: 'var(--g-text-dim)' }}>
              SHORT FICTION
            </p>
            <h1
              className="leading-none"
              style={{
                color: 'var(--g-text-bright)',
                fontSize: 'clamp(2rem, 8vw, var(--g-title-size, 4rem))',
                fontWeight: 'var(--g-title-weight, 900)',
                letterSpacing: 'var(--g-letter-spacing, -0.02em)',
              }}
            >
              {authorName}
            </h1>
          </div>
        </div>

        {/* 작품 목록 — 넘버링 + 설명 */}
        <div className="px-6 py-8">
          {MOCK_WORKS.map((work, i) => (
            <div
              key={i}
              className="flex items-baseline gap-4 py-5 border-b"
              style={{ borderColor: 'var(--g-border)' }}
            >
              <span className="text-xs font-mono" style={{ color: 'var(--g-accent)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <span
                  style={{
                    color: 'var(--g-text-bright)',
                    fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                    fontWeight: 'var(--g-title-weight, 700)',
                  }}
                >
                  {work.title}
                </span>
                <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--g-text-muted)' }}>
                  이야기의 시작, 그 첫 번째 장
                </p>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--g-text-dim)' }}>{work.episodes}화</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Minimal 레이아웃 (Frame 템플릿 참고) ──

function MinimalPreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  return (
    <div className="flex flex-col min-h-[550px]">
      <NavPreview theme={theme} authorName={authorName} />

      {/* 히어로 — 센터 이탤릭 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <h1
          className="italic"
          style={{
            color: 'var(--g-text-bright)',
            fontSize: 'clamp(1.5rem, 6vw, var(--g-title-size, 3rem))',
            fontWeight: 'var(--g-title-weight, 300)',
            letterSpacing: 'var(--g-letter-spacing, 0.1em)',
          }}
        >
          {authorName}
        </h1>
      </div>

      {/* 작품 — 산발적 배치 */}
      <div className="px-6 pb-12 text-center">
        {MOCK_WORKS.map((work, i) => (
          <span key={i} className="inline-block mx-3 my-2">
            <span
              className="italic"
              style={{
                color: 'var(--g-text-bright)',
                fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
                fontWeight: 'var(--g-title-weight, 300)',
                letterSpacing: 'var(--g-letter-spacing, 0.1em)',
              }}
            >
              {work.title}
            </span>
            <sup className="text-[10px] ml-0.5" style={{ color: 'var(--g-accent)' }}>[{i + 1}]</sup>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Series 레이아웃 (사슴악마 원본) ──

function SeriesPreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  const heroStyle = theme.heroStyle ?? 'minimal'

  return (
    <div className="min-h-[550px]">
      <NavPreview theme={theme} authorName={authorName} />

      <div className="px-6 py-8">
        {/* 히어로 — heroStyle별 분기 */}
        {heroStyle === 'fullname' && (
          <header className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--g-border)' }}>
            <h1
              className="italic leading-none mb-2"
              style={{
                color: 'var(--g-text-bright)',
                fontSize: 'var(--g-title-size, 3rem)',
                fontWeight: 'var(--g-title-weight, 700)',
                letterSpacing: 'var(--g-letter-spacing, 0)',
              }}
            >
              {authorName}
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--g-text-dim)', letterSpacing: 'var(--g-letter-spacing, 0.1em)' }}>
              SHORT FICTION ANTHOLOGY
            </p>
          </header>
        )}

        {heroStyle === 'cover' && (
          <header className="text-center mb-8 pb-6 border-b relative" style={{ borderColor: 'var(--g-border)' }}>
            <p className="text-[10px] tracking-widest mb-4" style={{ color: 'var(--g-text-dim)' }}>SHORT FICTION ANTHOLOGY</p>
            <h1
              className="italic leading-tight mb-2"
              style={{
                color: 'var(--g-text-bright)',
                fontSize: 'var(--g-title-size, 3rem)',
                fontWeight: 'var(--g-title-weight, 700)',
                letterSpacing: 'var(--g-letter-spacing, 0)',
              }}
            >
              {authorName}
            </h1>
          </header>
        )}

        {heroStyle === 'minimal' && (
          <header className="text-center mb-8 pb-6 border-b" style={{ borderColor: 'var(--g-border)' }}>
            <p className="text-[10px] tracking-widest mb-3" style={{ color: 'var(--g-text-muted)' }}>SHORT FICTION ANTHOLOGY</p>
            <div className="text-lg mb-2" style={{ color: 'var(--g-text-dim)', opacity: 0.5 }}>◆</div>
            <h1
              className="text-2xl italic mb-2"
              style={{ color: 'var(--g-text-bright)', fontWeight: 400 }}
            >
              {authorName}
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--g-text-dim)' }}>
              Inspired by the sensibility of A24
            </p>
          </header>
        )}

        {/* 에피소드 카드 */}
        <div>
          <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: 'var(--g-text-dim)' }}>에피소드</p>
          <div className="space-y-3">
            {MOCK_EPISODES.map((ep) => (
              <div
                key={ep.num}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--g-bg2)',
                  borderColor: 'var(--g-border)',
                }}
              >
                <p className="text-[10px] tracking-widest mb-1" style={{ color: 'var(--g-text-dim)' }}>
                  EPISODE {ep.num}
                </p>
                <h3 className="text-sm italic" style={{ color: 'var(--g-text-bright)' }}>
                  제 {ep.num}화. {ep.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Grid/Classic 레이아웃 (기본) ──

function GridPreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  return (
    <div className="min-h-[550px]">
      <NavPreview theme={theme} authorName={authorName} />

      <div className="px-6 py-8">
        {/* 작가 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--g-text-bright)' }}>
            {authorName}
          </h1>
          <p className="text-xs" style={{ color: 'var(--g-text-muted)' }}>
            소설을 씁니다.
          </p>
        </div>

        {/* 작품 그리드 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold" style={{ color: 'var(--g-text-bright)' }}>작품 목록</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--g-border)' }} />
          <span className="text-[10px]" style={{ color: 'var(--g-text-dim)' }}>{MOCK_WORKS.length}개</span>
        </div>

        <div className="space-y-3">
          {MOCK_WORKS.map((work, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: 'var(--g-bg2)',
                borderColor: 'var(--g-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--g-accent)', color: 'var(--g-bg)', opacity: 0.8 }}>
                  소설
                </span>
                <span className="text-[10px]" style={{ color: 'var(--g-text-dim)' }}>{work.episodes}화</span>
              </div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--g-text-bright)' }}>
                {work.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 에피소드(읽기 공간) 미리보기 ──

function EpisodePreview({ theme, authorName }: { theme: AuthorTheme; authorName: string }) {
  return (
    <div className="min-h-[550px]">
      {/* 에피소드 상단 — 작가명 + 에피소드 번호 */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--g-border)' }}>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--g-text-muted)' }}>
          {authorName} · EPISODE 01
        </p>
      </div>

      {/* 본문 영역 — contentWidth 반영 */}
      <div
        className="mx-auto px-6 py-8"
        style={{ maxWidth: 'var(--g-content-width, 700px)' }}
      >
        {/* 에피소드 제목 */}
        <h1
          className="italic mb-6"
          style={{
            color: 'var(--g-text-bright)',
            fontSize: 'var(--g-title-size, 3rem)',
            fontWeight: 'var(--g-title-weight, 700)',
            letterSpacing: 'var(--g-letter-spacing, 0)',
          }}
        >
          제 01화. 시작
        </h1>

        {/* 본문 텍스트 — lineHeight 반영 */}
        <div style={{ lineHeight: 'var(--g-line-height, 1.9)' }}>
          <p className="mb-4" style={{ color: 'var(--g-text)' }}>
            바람이 불어왔다. 차갑지도, 따뜻하지도 않은 바람.
            그저 존재를 확인시켜 주는 바람이었다.
          </p>

          <p className="mb-4" style={{ color: 'var(--g-text)' }}>
            눈을 감으면 보이는 것들이 있다.
            귀를 막으면 들리는 것들이 있다.
            그런 것들을 모아 이야기라 부른다.
          </p>

          <p className="italic mb-4" style={{ color: 'var(--g-accent2)' }}>
            &ldquo;모든 이야기에는 시작이 있고, 모든 시작에는 용기가 필요하다.&rdquo;
          </p>

          <p className="mb-4" style={{ color: 'var(--g-text)' }}>
            그렇게 첫 번째 장이 열렸다.
            아무도 읽지 않을 수도 있는, 그러나 반드시 써야 하는 이야기.
          </p>
        </div>

        {/* 하단 네비게이션 */}
        <div className="mt-12 pt-6 border-t flex justify-between items-center" style={{ borderColor: 'var(--g-border)' }}>
          <span className="text-xs" style={{ color: 'var(--g-text-dim)' }}>← 이전 화</span>
          <span
            className="inline-block px-4 py-2 rounded-lg text-xs"
            style={{ backgroundColor: 'var(--g-accent)', color: 'var(--g-bg)' }}
          >
            다음 화 →
          </span>
        </div>
      </div>
    </div>
  )
}
