// [2026-04-08 Remote Test] 이 주석은 클로드 리모트 기능 세팅 및 아이패드 업무지시 가능성 확인 목적으로 작성됨. 업무와 무관한 테스트.
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Docker standalone 빌드를 위한 설정
  output: "standalone",

  // 프로덕션에서 Source Map 비활성화 — 원본 코드 구조 노출 방지
  productionBrowserSourceMaps: false,
}

export default nextConfig
