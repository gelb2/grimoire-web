import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Docker standalone 빌드를 위한 설정
  output: "standalone",
  images: {
    remotePatterns: [
      {
        // Azure Blob Storage — 커버 이미지
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
        pathname: '/covers/**',
      },
    ],
  },
}

export default nextConfig
