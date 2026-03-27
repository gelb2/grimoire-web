# Grimoire Web — Dockerfile (Next.js standalone 모드)
# BFF 패턴: API_URL은 런타임 환경변수 → 이미지 1개로 모든 환경 배포

# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# NEXT_PUBLIC_APP_ENV만 빌드 시 주입 (API URL은 런타임에 결정)
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

RUN npm run build

# 2단계: 실행 (standalone 모드 — node_modules 불필요)
FROM node:20-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# API_URL은 런타임에 Container Apps 환경변수로 주입
# 예: API_URL=https://api.grimoire.app/api

# standalone 서버 + static 파일 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
