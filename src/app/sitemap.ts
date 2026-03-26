import type { MetadataRoute } from "next"

// 사이트맵 — 플랫폼 공용 페이지만 정적 등록
// 작가별 페이지는 서버 API에서 동적으로 생성해야 함 (향후 구현)
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://grimoire.app"

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
