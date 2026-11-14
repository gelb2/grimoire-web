import { preload } from 'react-dom'
import subsets from './noto-serif-subsets.json'

// 렌더링할 제목/목차의 한글 조각만 먼저 요청한다. 본문·서체 데이터는 바꾸지 않는다.
export function preloadAuthorText(text: string) {
  const points = [...new Set([...text].map(char => char.codePointAt(0)!))].filter(point => point >= 0x2e80)
  const requested = new Set<string>()
  // 화면 앞쪽 문자에 필요한 조각을 먼저 요청한다. CSS 파일 순서는 빈도 순서가 아니다.
  for (const point of points) {
    for (const subset of subsets) {
      if (requested.has(subset.url)) continue
      if (!subset.ranges.some(([start, end]) => point >= start && point <= (end ?? start))) continue
      preload(subset.url, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
      requested.add(subset.url)
    }
  }
}
