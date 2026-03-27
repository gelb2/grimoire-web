# Environments — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화

## 3단계 환경

| 환경 | 용도 | 브랜치 |
|------|------|--------|
| development | 로컬 개발 + dev 서버 | develop |
| inhouse | 내부 QA 테스트 | inhouse |
| production | 실서비스 | main |

## URL 체계

| 환경 | Web | API |
|------|-----|-----|
| development | localhost:3001 | localhost:3000 |
| inhouse | inhouse.grimoire.app | inhouse-api.grimoire.app |
| production | grimoire.app | api.grimoire.app |

## Azure 리소스

| 리소스 | 서비스 | 용도 |
|--------|--------|------|
| grimoire-web-{env} | Azure Container Apps | 웹 호스팅 |
| grimoire-server-{env} | Azure Container Apps | API 서버 |
| grimoire-db-{env} | Azure Database for PostgreSQL | 데이터베이스 |
| grimoireacr | Azure Container Registry | Docker 이미지 |

> 상세 인프라 구성: `grimoire-server/INFRASTRUCTURE.md` 참조.

## 환경변수

### grimoire-server
```
# 필수
NODE_ENV=development|inhouse|production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3001|https://inhouse.grimoire.app|https://grimoire.app

# 선택 (없으면 해당 기능 비활성화)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...
OPENAI_API_KEY=...
PAYAPP_USER_ID=...
PAYAPP_API_KEY=...
PAYAPP_SECRET=...
```

### grimoire-web
```
# 빌드 시 (선택)
NEXT_PUBLIC_APP_ENV=development|inhouse|production

# 런타임 (BFF 프록시 — 서버 사이드에서 백엔드 직접 호출용)
API_URL=http://localhost:3000/api|https://inhouse-api.grimoire.app/api|https://api.grimoire.app/api
```
