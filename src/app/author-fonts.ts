import { EB_Garamond } from 'next/font/google'

// 빌드 때 받은 글꼴은 Next의 해시 정적 자산으로 자체 서빙한다.
// 라틴 Garamond의 보정 fallback이 한글에도 적용되면 CJK 너비가 축소된다.
// 혼합 본문에서는 해당 fallback을 빼고 다음 Noto Serif KR/시스템 한글로 넘긴다.
export const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--fn-garamond',
  display: 'swap',
  adjustFontFallback: false,
})
