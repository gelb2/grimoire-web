/**
 * MD → TS 자동 파서
 *
 * DeerDevil_MDfiles/*.md 파일을 읽어서
 * src/features/reader/data/generated/ 에 TS 파일로 출력
 *
 * 실행: npx tsx scripts/parse-md.ts
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"

// ── 타입 (export for testing) ──

export interface Frontmatter {
  slug: string
  type: "episode" | "bonus" | "preface" | "afterword"
  num?: string
  subtitle?: string
  description?: string
}

export interface Block {
  type: string
  num?: string
  title?: string
  text?: string
  stars?: string
  reviewText?: string
  variant?: string
  children?: Block[]
}

// ── 경로 ──

const ROOT = resolve(__dirname, "..")
const MD_DIR = join(ROOT, "DeerDevil_MDfiles")
const OUT_DIR = join(ROOT, "src/features/reader/data/contentDataSource")

// ── Frontmatter 파싱 ──

export function parseFrontmatter(content: string): {
  frontmatter: Frontmatter
  body: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error("frontmatter가 없습니다. ---로 감싸진 메타데이터를 추가하세요.")
  }

  const meta: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":")
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    // 따옴표 제거
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    meta[key] = val
  }

  if (!meta.slug || !meta.type) {
    throw new Error("frontmatter에 slug와 type은 필수입니다.")
  }

  return {
    frontmatter: meta as unknown as Frontmatter,
    body: match[2],
  }
}

// ── 에피소드/번외 본문 → Block[] 파싱 ──

export function parseEpisodeBlocks(body: string): { title: string; blocks: Block[] } {
  const lines = body.split("\n")
  const blocks: Block[] = []
  let title = ""
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // 빈 줄 건너뛰기
    if (trimmed === "") {
      i++
      continue
    }

    // # 제목 (H1) → title 추출
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      title = trimmed.slice(2).trim()
      i++
      continue
    }

    // ## 부제 (H2) → 무시 (frontmatter에서 관리)
    if (trimmed.startsWith("## ")) {
      i++
      continue
    }

    // --- 구분선
    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ type: "divider" })
      i++
      continue
    }

    // ### 에필로그 패턴
    if (trimmed.startsWith("### ") && /에필로그/.test(trimmed)) {
      blocks.push({ type: "epilogue" })
      // 에필로그 뒤에 부제가 있을 수 있음 (예: "### 에필로그: 유황불의 도시")
      const epilogueTitle = trimmed.replace(/^###\s*에필로그[:\s]*/, "").trim()
      if (epilogueTitle) {
        blocks.push({ type: "paragraph", text: epilogueTitle })
      }
      i++
      continue
    }

    // ### N. 챕터 제목
    const chapterMatch = trimmed.match(/^###\s+(\d+)\.\s+(.+)$/)
    if (chapterMatch) {
      blocks.push({ type: "chapter", num: chapterMatch[1], title: chapterMatch[2] })
      i++
      continue
    }

    // > 인용문 → refrain 또는 review
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.slice(2).trim()

      // ★/☆ 로 시작하면 리뷰 블록 수집
      if (/^[★☆]/.test(quoteText)) {
        const reviewResult = collectReviews(lines, i)
        if (reviewResult.block.children && reviewResult.block.children.length > 0) {
          blocks.push(reviewResult.block)
          i = reviewResult.nextIndex
          continue
        }
      }

      // 일반 인용문 → refrain
      blocks.push({ type: "refrain", text: quoteText })
      i++
      continue
    }

    // *전체 이탤릭 문단* (줄 전체가 *...*로 감싸진 경우)
    const italicMatch = trimmed.match(/^\*([^*]+)\*$/)
    if (italicMatch) {
      blocks.push({ type: "italic", text: italicMatch[1] })
      i++
      continue
    }

    // 일반 문단
    blocks.push({ type: "paragraph", text: trimmed })
    i++
  }

  return { title, blocks }
}

// ── ep3 리뷰 블록 수집 ──
// MD 패턴: > ★★★★★ / (빈줄/>) / > 리뷰텍스트 / (빈줄) / --- / > ★☆☆☆☆ / ...
// 리뷰 영역은 ★로 시작하는 인용문이 더 이상 없을 때까지 계속 수집

function collectReviews(
  lines: string[],
  startIndex: number
): { block: Block; nextIndex: number } {
  const children: Block[] = []
  let i = startIndex

  while (i < lines.length) {
    const trimmed = lines[i].trim()

    // 빈 줄, 빈 인용문(> 만), 구분선(---) → 건너뛰고 계속
    if (trimmed === "" || trimmed === ">" || /^-{3,}$/.test(trimmed)) {
      i++
      continue
    }

    // > 로 시작하는 줄
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.slice(2).trim()

      // ★/☆ 패턴이면 별점 라인
      if (/^[★☆]/.test(quoteText)) {
        const stars = quoteText
        i++

        // 빈 줄/빈 인용문 건너뛰기
        while (i < lines.length && (lines[i].trim() === "" || lines[i].trim() === ">")) i++

        // 다음 > 줄이 리뷰 텍스트
        if (i < lines.length && lines[i].trim().startsWith("> ")) {
          const reviewText = lines[i].trim().slice(2).trim()
          const isProfessor = stars.includes("☆")
          const review: Block = { type: "review", stars, reviewText }
          if (isProfessor) review.variant = "professor"
          children.push(review)
          i++
        }
        continue
      }
    }

    // ★로 시작하지 않는 일반 줄 → 리뷰 영역 끝
    break
  }

  return {
    block: { type: "reviews-wrap", children },
    nextIndex: i,
  }
}

// ── Preface 파싱 ──

export function parsePreface(body: string): { paragraphs: string[]; lastLine: string } {
  const lines = body.split("\n")
  const paragraphs: string[] = []
  let lastLine = ""

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "" || trimmed.startsWith("#") || /^-{3,}$/.test(trimmed)) continue

    // *전체 이탤릭* → lastLine 후보
    const italicMatch = trimmed.match(/^\*([^*]+)\*$/)
    if (italicMatch) {
      lastLine = italicMatch[1]
      continue
    }

    paragraphs.push(trimmed)
  }

  // lastLine이 없으면 마지막 문단을 사용
  if (!lastLine && paragraphs.length > 0) {
    lastLine = paragraphs.pop()!
  }

  return { paragraphs, lastLine }
}

// ── Afterword 파싱 ──

export function parseAfterword(body: string): { glitchText: string; footnote: string } {
  const lines = body.split("\n")
  let glitchLines: string[] = []
  let footnote = ""
  let foundDivider = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("#")) continue

    if (/^-{3,}$/.test(trimmed)) {
      foundDivider = true
      continue
    }

    if (trimmed === "") continue

    if (foundDivider) {
      // 구분선 이후 → 각주 (이탤릭 마커 제거)
      const italicMatch = trimmed.match(/^\*([^*]+)\*$/)
      footnote = italicMatch ? italicMatch[1] : trimmed
    } else {
      // 구분선 이전 → 글리치 텍스트
      glitchLines.push(line) // 원본 줄바꿈 유지
    }
  }

  return { glitchText: glitchLines.join("\n"), footnote }
}

// ── TS 파일 생성 ──

export function escapeForTemplate(text: string): string {
  // MD 원본의 불필요한 이스케이프 정리 (\" → ")
  const cleaned = text.replace(/\\"/g, '"').replace(/\\'/g, "'")
  // 템플릿 리터럴에서 필요한 이스케이프만 적용
  return cleaned.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")
}

function blockToString(block: Block, indent: string = "  "): string {
  const parts: string[] = []
  parts.push(`${indent}{ type: "${block.type}"`)

  if (block.num !== undefined) parts.push(`num: "${escapeForTemplate(block.num)}"`)
  if (block.title !== undefined) parts.push(`title: \`${escapeForTemplate(block.title)}\``)
  if (block.text !== undefined) parts.push(`text: \`${escapeForTemplate(block.text)}\``)
  if (block.stars !== undefined) parts.push(`stars: "${escapeForTemplate(block.stars)}"`)
  if (block.reviewText !== undefined) parts.push(`reviewText: \`${escapeForTemplate(block.reviewText)}\``)
  if (block.variant !== undefined) parts.push(`variant: "${block.variant}"`)
  if (block.children !== undefined) {
    const childrenStr = block.children.map((c) => blockToString(c, indent + "  ")).join(",\n")
    parts.push(`children: [\n${childrenStr},\n${indent}]`)
  }

  return parts.join(", ") + " }"
}

function generateEpisodeTS(slug: string, title: string, subtitle: string | undefined, blocks: Block[]): string {
  const blocksStr = blocks.map((b) => blockToString(b)).join(",\n")
  const subtitleLine = subtitle ? `\n  subtitle: \`${escapeForTemplate(subtitle)}\`,` : ""

  return `import type { EpisodeData } from "@/features/reader/data"

const ${slug}: EpisodeData = {
  slug: "${slug}",
  title: \`${escapeForTemplate(title)}\`,${subtitleLine}
  blocks: [
${blocksStr},
  ]
}

export default ${slug}
`
}

function generatePrefaceTS(paragraphs: string[], lastLine: string): string {
  const parasStr = paragraphs.map((p) => `    \`${escapeForTemplate(p)}\``).join(",\n")

  return `export const prefaceData = {
  paragraphs: [
${parasStr},
  ],

  lastLine: \`${escapeForTemplate(lastLine)}\`
}
`
}

function generateAfterwordTS(glitchText: string, footnote: string): string {
  return `export const afterwordData = {
  // 깨진 문자 덩어리 원문 — 절대 수정 금지
  glitchText: \`${escapeForTemplate(glitchText)}\`,

  footnote: \`${escapeForTemplate(footnote)}\`
}
`
}

function generateContentsTS(
  metas: { frontmatter: Frontmatter; title: string }[]
): string {
  const entries = metas.map(({ frontmatter: fm, title }) => {
    const parts = [`    slug: "${fm.slug}"`, `type: "${fm.type}"`, `title: \`${escapeForTemplate(title)}\``]
    if (fm.num) parts.push(`num: "${fm.num}"`)
    if (fm.subtitle) parts.push(`subtitle: \`${escapeForTemplate(fm.subtitle)}\``)
    if (fm.description) parts.push(`description: \`${escapeForTemplate(fm.description)}\``)
    return `  { ${parts.join(", ")} }`
  })

  return `import type { ContentMeta } from "@/features/reader/data"

export const generatedContents: ContentMeta[] = [
${entries.join(",\n")},
]

export const generatedEpisodeSlugs = generatedContents
  .filter((c) => c.type === "episode" || c.type === "bonus")
  .map((c) => c.slug)
`
}

// ── 메인 ──

function main() {
  const files = readdirSync(MD_DIR).filter((f) => f.endsWith(".md")).sort()
  console.log(`📄 ${files.length}개 MD 파일 발견`)

  const metas: { frontmatter: Frontmatter; title: string }[] = []

  for (const file of files) {
    const content = readFileSync(join(MD_DIR, file), "utf-8")
    console.log(`  파싱 중: ${file}`)

    try {
      const { frontmatter, body } = parseFrontmatter(content)

      if (frontmatter.type === "preface") {
        const { paragraphs, lastLine } = parsePreface(body)
        writeFileSync(join(OUT_DIR, "preface.ts"), generatePrefaceTS(paragraphs, lastLine))
        metas.push({ frontmatter, title: "일러두기" })
        console.log(`    → preface.ts (${paragraphs.length}개 문단)`)
      } else if (frontmatter.type === "afterword") {
        const { glitchText, footnote } = parseAfterword(body)
        writeFileSync(join(OUT_DIR, "afterword.ts"), generateAfterwordTS(glitchText, footnote))
        metas.push({ frontmatter, title: "후기" })
        console.log(`    → afterword.ts`)
      } else {
        const { title, blocks } = parseEpisodeBlocks(body)
        const finalTitle = title || frontmatter.slug
        writeFileSync(
          join(OUT_DIR, `${frontmatter.slug}.ts`),
          generateEpisodeTS(frontmatter.slug, finalTitle, frontmatter.subtitle, blocks)
        )
        metas.push({ frontmatter, title: finalTitle })
        console.log(`    → ${frontmatter.slug}.ts (${blocks.length}개 블록)`)
      }
    } catch (err) {
      console.error(`  ❌ ${file}: ${(err as Error).message}`)
    }
  }

  // contents 메타데이터 생성
  // 정렬: preface → episode (num순) → bonus (num순) → afterword
  const typeOrder = { preface: 0, episode: 1, bonus: 2, afterword: 3 }
  metas.sort((a, b) => {
    const ta = typeOrder[a.frontmatter.type] ?? 99
    const tb = typeOrder[b.frontmatter.type] ?? 99
    if (ta !== tb) return ta - tb
    // 같은 타입 내에서는 num 숫자 기준 정렬
    const numA = parseInt(a.frontmatter.num?.replace(/\D/g, "") || "0", 10)
    const numB = parseInt(b.frontmatter.num?.replace(/\D/g, "") || "0", 10)
    return numA - numB
  })

  writeFileSync(join(OUT_DIR, "contents.ts"), generateContentsTS(metas))
  console.log(`\n✅ generated/ 에 ${metas.length + 1}개 파일 생성 완료`)
}

// CLI 직접 실행 시에만 main() 호출
if (process.argv[1] && (process.argv[1].endsWith("parse-md.ts") || process.argv[1].endsWith("parse-md"))) {
  main()
}
