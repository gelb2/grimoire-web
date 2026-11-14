import type { MetadataRoute } from "next"

// 사이트맵 — 플랫폼 공용 페이지만 정적 등록
// 작가별 페이지는 서버 API에서 동적으로 생성해야 함 (향후 구현)
export default function sitemap(): MetadataRoute.Sitemap {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!configured) return []
  const parsed = new URL(configured)
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin')
  }
  const baseUrl = parsed.origin

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
    },
  ]
}
