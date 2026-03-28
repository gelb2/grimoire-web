import { describe, it, expect } from "vitest"
import { contents, episodeSlugs } from "./index"
import type { ContentMeta } from "./index"

describe("contents 데이터 무결성", () => {
  it("contents 배열이 비어있지 않다", () => {
    expect(contents.length).toBeGreaterThan(0)
  })

  it("모든 콘텐츠에 slug가 있다", () => {
    for (const c of contents) {
      expect(c.slug).toBeTruthy()
    }
  })

  it("모든 콘텐츠에 title이 있다", () => {
    for (const c of contents) {
      expect(c.title).toBeTruthy()
    }
  })

  it("모든 콘텐츠에 유효한 type이 있다", () => {
    const validTypes = ["episode", "bonus", "preface", "afterword"]
    for (const c of contents) {
      expect(validTypes).toContain(c.type)
    }
  })

  it("slug가 중복되지 않는다", () => {
    const slugs = contents.map((c) => c.slug)
    const uniqueSlugs = new Set(slugs)
    expect(slugs.length).toBe(uniqueSlugs.size)
  })

  it("episode 타입에는 num이 있다", () => {
    const episodes = contents.filter((c) => c.type === "episode")
    for (const ep of episodes) {
      expect(ep.num).toBeTruthy()
    }
  })

  it("episode num이 순서대로 정렬되어 있다", () => {
    const episodes = contents.filter((c) => c.type === "episode")
    const nums = episodes.map((ep) => parseInt(ep.num!.replace(/\D/g, ""), 10))
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeGreaterThan(nums[i - 1])
    }
  })

  it("preface가 contents에 포함되어 있다", () => {
    expect(contents.find((c) => c.type === "preface")).toBeTruthy()
  })

  it("afterword가 contents에 포함되어 있다", () => {
    expect(contents.find((c) => c.type === "afterword")).toBeTruthy()
  })

  it("contents 정렬 순서: preface → episode → bonus → afterword", () => {
    const typeOrder = { preface: 0, episode: 1, bonus: 2, afterword: 3 }
    for (let i = 1; i < contents.length; i++) {
      const prevOrder = typeOrder[contents[i - 1].type]
      const currOrder = typeOrder[contents[i].type]
      expect(currOrder).toBeGreaterThanOrEqual(prevOrder)
    }
  })
})

describe("episodeSlugs", () => {
  it("비어있지 않다", () => {
    expect(episodeSlugs.length).toBeGreaterThan(0)
  })

  it("episode와 bonus 타입의 slug만 포함한다", () => {
    for (const slug of episodeSlugs) {
      const meta = contents.find((c) => c.slug === slug)
      expect(meta).toBeTruthy()
      expect(["episode", "bonus"]).toContain(meta!.type)
    }
  })

  it("preface/afterword slug는 포함하지 않는다", () => {
    expect(episodeSlugs).not.toContain("preface")
    expect(episodeSlugs).not.toContain("afterword")
  })
})

describe("에피소드 데이터 동적 import", () => {
  it("모든 episodeSlugs의 데이터를 import할 수 있다", async () => {
    for (const slug of episodeSlugs) {
      const mod = await import(`./contentDataSource/${slug}.ts`)
      const data = mod.default
      expect(data).toBeTruthy()
      expect(data.slug).toBe(slug)
      expect(data.title).toBeTruthy()
      expect(Array.isArray(data.blocks)).toBe(true)
      expect(data.blocks.length).toBeGreaterThan(0)
    }
  })

  it("preface 데이터를 import할 수 있다", async () => {
    const { prefaceData } = await import("./contentDataSource/preface")
    expect(prefaceData).toBeTruthy()
    expect(Array.isArray(prefaceData.paragraphs)).toBe(true)
    expect(prefaceData.paragraphs.length).toBeGreaterThan(0)
    expect(prefaceData.lastLine).toBeTruthy()
  })

  it("afterword 데이터를 import할 수 있다", async () => {
    const { afterwordData } = await import("./contentDataSource/afterword")
    expect(afterwordData).toBeTruthy()
    expect(afterwordData.glitchText).toBeTruthy()
    expect(typeof afterwordData.footnote).toBe("string")
  })
})
