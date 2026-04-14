# Grimoire Web — Dockerfile (Next.js standalone 모드)
# BFF 패턴: API_URL은 런타임 환경변수 → 이미지 1개로 모든 환경 배포

# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 빌드 시 주입 (NEXT_PUBLIC_* 는 빌드 타임에 인라인됨)
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}

ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY=""
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${NEXT_PUBLIC_RECAPTCHA_SITE_KEY}

RUN npm run build

# 2단계: 실행 (standalone 모드 — node_modules 불필요)
FROM node:20-alpine AS runner
RUN apk add --no-cache tini

# non-root 유저 (컨테이너 보안)
RUN addgroup -g 1001 -S nodejs && adduser -S grimoire -u 1001
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# standalone 서버 + static 파일 복사
COPY --from=builder --chown=grimoire:nodejs /app/.next/standalone ./
COPY --from=builder --chown=grimoire:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=grimoire:nodejs /app/public ./public

USER grimoire
EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
