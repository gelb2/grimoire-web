# Grimoire Web — Dockerfile (Next.js standalone 모드)

# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 빌드 시 환경 변수 주입 (NEXT_PUBLIC_ 접두사는 빌드 시 인라인됨)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

RUN npm run build

# 2단계: 실행 (standalone 모드 — node_modules 불필요)
FROM node:20-alpine AS runner
RUN apk add --no-cache tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# standalone 서버 + static 파일 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# public 폴더가 없을 수 있으므로 와일드카드 사용
COPY --from=builder /app/public* ./public/

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
