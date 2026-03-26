# Grimoire Web — Dockerfile (Next.js standalone 모드)

# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 빌드 시 환경 변수 주입 (NEXT_PUBLIC_ 접두사는 .env.production 파일로 인라인 보장)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

# .env.production 파일 생성 — Next.js가 빌드 시 확실히 읽어감
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > .env.production && \
    echo "NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}" >> .env.production

RUN npm run build

# 2단계: 실행 (standalone 모드 — node_modules 불필요)
FROM node:20-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# standalone 서버 + static 파일 + .env.production 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.production ./.env.production

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
