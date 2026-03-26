import { describe, it, expect } from "vitest"
import {
  parseFrontmatter,
  parseEpisodeBlocks,
  parsePreface,
  parseAfterword,
  escapeForTemplate,
} from "./parse-md"

// ── parseFrontmatter ──

describe("parseFrontmatter", () => {
  it("유효한 frontmatter를 파싱한다", () => {
    const md = `---
slug: ep1
type: episode
num: "01"
subtitle: "The Woodcutter"
---

# 본문`

    const { frontmatter, body } = parseFrontmatter(md)
    expect(frontmatter.slug).toBe("ep1")
    expect(frontmatter.type).toBe("episode")
    expect(frontmatter.num).toBe("01")
    expect(frontmatter.subtitle).toBe("The Woodcutter")
    expect(body.trim()).toBe("# 본문")
  })

  it("따옴표로 감싼 값의 따옴표를 제거한다", () => {
    const md = `---
slug: "ep1"
type: 'episode'
---

body`

    const { frontmatter } = parseFrontmatter(md)
    expect(frontmatter.slug).toBe("ep1")
    expect(frontmatter.type).toBe("episode")
  })

  it("frontmatter가 없으면 에러를 던진다", () => {
    expect(() => parseFrontmatter("# 제목만 있음")).toThrow("frontmatter가 없습니다")
  })

  it("slug가 없으면 에러를 던진다", () => {
    const md = `---
type: episode
---

body`

    expect(() => parseFrontmatter(md)).toThrow("slug와 type은 필수")
  })

  it("type이 없으면 에러를 던진다", () => {
    const md = `---
slug: ep1
---

body`

    expect(() => parseFrontmatter(md)).toThrow("slug와 type은 필수")
  })

  it("빈 frontmatter도 에러를 던진다", () => {
    const md = `---
---

body`

    expect(() => parseFrontmatter(md)).toThrow("frontmatter가 없습니다")
  })

  it("description에 콜론이 포함된 경우 정상 파싱한다", () => {
    const md = `---
slug: ep4
type: episode
description: "금도끼: 정직함의 무게"
---

body`

    const { frontmatter } = parseFrontmatter(md)
    expect(frontmatter.description).toBe("금도끼: 정직함의 무게")
  })
})

// ── parseEpisodeBlocks ──

describe("parseEpisodeBlocks", () => {
  it("H1 제목을 추출한다", () => {
    const body = `# 이름 없는 괴물

일반 문단`

    const { title, blocks } = parseEpisodeBlocks(body)
    expect(title).toBe("이름 없는 괴물")
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe("paragraph")
  })

  it("H2는 무시한다 (frontmatter에서 관리)", () => {
    const body = `# 제목

## Ep 11. — 사슴 악마 유니버스

일반 문단`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe("paragraph")
  })

  it("--- 구분선을 divider 블록으로 변환한다", () => {
    const body = `문단 1

---

문단 2`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks).toHaveLength(3)
    expect(blocks[1].type).toBe("divider")
  })

  it("### N. 챕터 제목을 chapter 블록으로 변환한다", () => {
    const body = `### 1. 을지로

본문`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0]).toEqual({ type: "chapter", num: "1", title: "을지로" })
  })

  it("### 에필로그를 epilogue 블록으로 변환한다", () => {
    const body = `### 에필로그

에필로그 본문`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0].type).toBe("epilogue")
  })

  it("에필로그 부제가 있으면 paragraph로 추가한다", () => {
    const body = `### 에필로그: 유황불의 도시

본문`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0].type).toBe("epilogue")
    expect(blocks[1]).toEqual({ type: "paragraph", text: "유황불의 도시" })
  })

  it("> 인용문을 refrain 블록으로 변환한다", () => {
    const body = `> 이것은 인용문이다`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0]).toEqual({ type: "refrain", text: "이것은 인용문이다" })
  })

  it("*전체 이탤릭*을 italic 블록으로 변환한다", () => {
    const body = `*사슴은 을지로를 등지고 걸었다.*`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0]).toEqual({ type: "italic", text: "사슴은 을지로를 등지고 걸었다." })
  })

  it("일반 텍스트를 paragraph 블록으로 변환한다", () => {
    const body = `나는 냄새를 못 맡은 적이 없다.`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0]).toEqual({ type: "paragraph", text: "나는 냄새를 못 맡은 적이 없다." })
  })

  it("빈 본문은 빈 블록 배열을 반환한다", () => {
    const { title, blocks } = parseEpisodeBlocks("")
    expect(title).toBe("")
    expect(blocks).toHaveLength(0)
  })

  it("빈 줄만 있는 본문은 빈 블록 배열을 반환한다", () => {
    const { blocks } = parseEpisodeBlocks("\n\n\n")
    expect(blocks).toHaveLength(0)
  })

  it("★ 리뷰 블록을 reviews-wrap으로 수집한다", () => {
    const body = `> ★★★★★
>
> 대단한 작품이었다

---

> ★☆☆☆☆
>
> 별로였다`

    const { blocks } = parseEpisodeBlocks(body)
    expect(blocks[0].type).toBe("reviews-wrap")
    expect(blocks[0].children).toHaveLength(2)
    expect(blocks[0].children![0].stars).toBe("★★★★★")
    expect(blocks[0].children![0].reviewText).toBe("대단한 작품이었다")
    expect(blocks[0].children![1].variant).toBe("professor")
  })

  it("복합 에피소드 구조를 올바르게 파싱한다", () => {
    const body = `# 테스트 에피소드

## Ep 1. — 사슴 악마 유니버스

---

도입부 문단

---

### 1. 첫 번째 챕터

챕터 본문

> 인용문

*이탤릭 문단*

---

### 에필로그

에필로그 본문`

    const { title, blocks } = parseEpisodeBlocks(body)
    expect(title).toBe("테스트 에피소드")

    const types = blocks.map((b) => b.type)
    expect(types).toEqual([
      "divider",
      "paragraph",
      "divider",
      "chapter",
      "paragraph",
      "refrain",
      "italic",
      "divider",
      "epilogue",
      "paragraph",
    ])
  })
})

// ── parsePreface ──

describe("parsePreface", () => {
  it("문단과 마지막 줄을 분리한다", () => {
    const body = `# 일러두기

첫 번째 문단

두 번째 문단

*마지막 이탤릭 줄*`

    const { paragraphs, lastLine } = parsePreface(body)
    expect(paragraphs).toEqual(["첫 번째 문단", "두 번째 문단"])
    expect(lastLine).toBe("마지막 이탤릭 줄")
  })

  it("이탤릭 마지막 줄이 없으면 마지막 문단을 사용한다", () => {
    const body = `문단 1

문단 2

문단 3`

    const { paragraphs, lastLine } = parsePreface(body)
    expect(paragraphs).toEqual(["문단 1", "문단 2"])
    expect(lastLine).toBe("문단 3")
  })

  it("빈 본문은 빈 결과를 반환한다", () => {
    const { paragraphs, lastLine } = parsePreface("")
    expect(paragraphs).toHaveLength(0)
    expect(lastLine).toBe("")
  })

  it("H1, H2, 구분선은 무시한다", () => {
    const body = `# 제목
## 부제
---
실제 문단`

    const { paragraphs, lastLine } = parsePreface(body)
    expect(lastLine).toBe("실제 문단")
  })
})

// ── parseAfterword ──

describe("parseAfterword", () => {
  it("글리치 텍스트와 각주를 분리한다", () => {
    const body = `# 후기

글리치 첫줄
글리치 둘째줄

---

*각주 이탤릭*`

    const { glitchText, footnote } = parseAfterword(body)
    expect(glitchText).toContain("글리치 첫줄")
    expect(glitchText).toContain("글리치 둘째줄")
    expect(footnote).toBe("각주 이탤릭")
  })

  it("각주가 일반 텍스트여도 처리한다", () => {
    const body = `글리치

---

일반 각주`

    const { footnote } = parseAfterword(body)
    expect(footnote).toBe("일반 각주")
  })

  it("구분선이 없으면 전부 글리치로 처리한다", () => {
    const body = `글리치만 있음`

    const { glitchText, footnote } = parseAfterword(body)
    expect(glitchText).toContain("글리치만 있음")
    expect(footnote).toBe("")
  })
})

// ── escapeForTemplate ──

describe("escapeForTemplate", () => {
  it("백틱을 이스케이프한다", () => {
    expect(escapeForTemplate("코드 `블록` 테스트")).toBe("코드 \\`블록\\` 테스트")
  })

  it("달러 기호를 이스케이프한다", () => {
    expect(escapeForTemplate("가격 $100")).toBe("가격 \\$100")
  })

  it("역슬래시를 이스케이프한다", () => {
    expect(escapeForTemplate("경로 C:\\Users")).toBe("경로 C:\\\\Users")
  })

  it("MD 원본의 불필요한 이스케이프를 정리한다", () => {
    expect(escapeForTemplate('\\"인용\\"')).toBe('"인용"')
    expect(escapeForTemplate("\\'작은따옴표\\'")).toBe("'작은따옴표'")
  })

  it("일반 텍스트는 변경하지 않는다", () => {
    expect(escapeForTemplate("한국어 텍스트 테스트")).toBe("한국어 텍스트 테스트")
  })
})
