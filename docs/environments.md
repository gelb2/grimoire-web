# Environments — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화

## 3단계 환경

| 환경 | 용도 | 브랜치 |
|------|------|--------|
| development | 로컬 개발 + dev 서버 | develop |
| inhouse | 내부 QA 테스트 | inhouse |
| production | 실서비스 | main |

## URL 체계 (확정 시 업데이트)

| 환경 | Web | API |
|------|-----|-----|
| development | localhost:3001 | localhost:3000 |
| inhouse | inhouse.grimoire.app | inhouse-api.grimoire.app |
| production | grimoire.app | api.grimoire.app |

## Azure 리소스 (Phase 1에서 생성)

| 리소스 | 서비스 | 용도 |
|--------|--------|------|
| grimoire-web-{env} | Azure Static Web Apps | 웹 호스팅 |
| grimoire-server-{env} | Azure Container Apps | API 서버 |
| grimoire-db-{env} | Azure Database for PostgreSQL | 데이터베이스 |
| grimoire-acr | Azure Container Registry | Docker 이미지 |

## 환경변수

### grimoire-server
```
NODE_ENV=development|inhouse|production
PORT=3000
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGIN=http://localhost:3001|https://inhouse.grimoire.app|https://grimoire.app
```

### grimoire-web
```
NEXT_PUBLIC_APP_ENV=development|inhouse|production
NEXT_PUBLIC_API_URL=http://localhost:3000|https://inhouse-api.grimoire.app|https://api.grimoire.app
```
