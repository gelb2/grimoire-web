import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",             // 메인 화면
        "/explore",      // 탐색 페이지
      ],
      disallow: [
        "/api/",         // API 프록시
        "/dashboard/",   // 작가 대시보드
        "/admin/",       // 관리자 (향후 분리 예정이지만 방어)
        "/login",        // 인증
        "/register",     // 인증
        "/library/",     // 개인 서재
      ],
    },
  }
}
