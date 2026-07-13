// F-18 배선 철회 회귀 가드 (VCK HANDOFF 정정 — 옵션 b).
//
// 정정 배경: getThemeLayout 이 정본 top-level theme.episodeListLayout
// (AuthorSpace.tsx:116 소비 shape) 대신 theme.overrides.episodeListLayout
// (오 shape)만 읽어 산출하던 themeLayout/isSeriesLayout/workEpisodes 는
// 리더 페이지 return(JSX)에서 미참조 dead 였다. 그 소비처였던 WorkNav 는
// 이미 제거(SeriesNav → [author]/layout.tsx)되어 배선 대상이 없으므로,
// dead-var 3종 + 결과 폐기용 resolveTheme 네트워크콜을 제거한다.
// → F-18(작품별 테마 reader 적용)은 미구현 백로그로 정직 복귀.
//
// 이 페이지는 async 서버 컴포넌트라 렌더 단위 테스트 대신 소스 스캔으로
// "콜 제거"를 단언한다 (재도입 시 즉시 RED).

import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const src = readFileSync(new URL("./page.tsx", import.meta.url), "utf-8")

describe("에피소드 리더 페이지 — 죽은 테마 resolve 콜 제거 (F-18)", () => {
  it("결과 폐기용 resolveTheme 네트워크콜을 호출하지 않는다", () => {
    expect(src).not.toContain("resolveTheme")
    expect(src).not.toContain("getThemeLayout")
  })

  it("미참조 dead 파생값(themeLayout/isSeriesLayout/workEpisodes)을 두지 않는다", () => {
    expect(src).not.toContain("themeLayout")
    expect(src).not.toContain("isSeriesLayout")
    expect(src).not.toContain("workEpisodes")
  })
})
