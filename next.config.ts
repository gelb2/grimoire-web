// [2026-04-08 Remote Test] 이 주석은 클로드 리모트 기능 세팅 및 아이패드 업무지시 가능성 확인 목적으로 작성됨. 업무와 무관한 테스트.
import type { NextConfig } from "next"
import { buildCsp } from "./src/lib/csp"

const nextConfig: NextConfig = {
  // Docker standalone 빌드를 위한 설정
  output: "standalone",

  // X-Powered-By: Next.js 헤더 노출 차단 — 프레임워크 핑거프린팅 방어
  poweredByHeader: false,

  // 프로덕션에서 Source Map 비활성화 — 원본 코드 구조 노출 방지
  productionBrowserSourceMaps: false,

  // 보안 헤더 (서버 Helmet과 별도 — Next.js 프론트 전용)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // CSP — Next.js App Router는 인라인 스크립트 사용하므로 'unsafe-inline' 필요
            // 향후 nonce 기반으로 전환 시 middleware.ts에서 nonce 생성 + 헤더 동적 설정
            // connect-src API origin 은 환경별 분기 (buildCsp) — prod=api / dev=dev-api /
            // local=localhost. inhouse-* 는 2환경화(2026-04-19)로 폐기 → 전 환경 제거 (FW-1).
            key: 'Content-Security-Policy',
            value: buildCsp(process.env.NEXT_PUBLIC_APP_ENV),
          },
        ],
      },
    ]
  },
}

export default nextConfig
