import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Docker standalone 빌드를 위한 설정
  output: "standalone",

  // 프로덕션에서 Source Map 비활성화 — 원본 코드 구조 노출 방지
  productionBrowserSourceMaps: false,
}

export default nextConfig
