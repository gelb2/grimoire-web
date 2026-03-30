# Environments — ProjectGrimoire

> 정본: grimoire-server → grimoire-web에 동기화

## 4단계 환경

| 환경 | 용도 | 브랜치 | 데이터 관리 |
|------|------|--------|------------|
| localhost | 로컬 개발 | feature/bugfix (작업 브랜치) | 시드 스크립트 1회 + 이후 마이그레이션/API |
| development | 원격 개발 서버 | develop | 마이그레이션 + API |
| inhouse | 내부 QA 테스트 | inhouse | 마이그레이션 + API |
| production | 실서비스 | main | 마이그레이션 + API |

> **시드 스크립트는 localhost 초기 세팅 시 1회만 사용한다.**
> development 이상 환경의 데이터 변경은 마이그레이션, 백필 SQL, API를 통해서만 진행한다.

## URL 체계

| 환경 | Web | API | DB |
|------|-----|-----|----|
| localhost | localhost:3001 | localhost:3000 | localhost:5432 (Docker) |
| development | dev.grimoire-book.com | dev-api.grimoire-book.com | Azure grimoire-db-dev |
| inhouse | inhouse.grimoire-book.com | inhouse-api.grimoire-book.com | Azure grimoire-db-inhouse |
| production | grimoire-book.com | api.grimoire-book.com | Azure grimoire-db-prod |

## Azure 리소스

| 리소스 | 서비스 | 용도 |
|--------|--------|------|
| grimoire-web-{env} | Azure Container Apps | 웹 호스팅 (dev/inhouse/prod) |
| grimoire-server-{env} | Azure Container Apps | API 서버 (dev/inhouse/prod) |
| grimoire-db-{env} | Azure Database for PostgreSQL | 데이터베이스 (dev/inhouse/prod) |
| grimoireacr | Azure Container Registry | Docker 이미지 |

> localhost는 Azure 리소스를 사용하지 않는다. Docker Compose로 로컬 DB를 띄운다.
> 상세 인프라 구성: `grimoire-server/INFRASTRUCTURE.md` 참조.

## 환경변수

### grimoire-server
```
# 필수
NODE_ENV=localhost|development|inhouse|production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN={환경별 Web URL}

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
NEXT_PUBLIC_APP_ENV=localhost|development|inhouse|production

# 런타임 (BFF 프록시 — 서버 사이드에서 백엔드 직접 호출용)
API_URL={환경별 API URL}/api
```

### 환경별 값 참조

| 변수 | localhost | development | inhouse | production |
|------|-----------|-------------|---------|------------|
| CORS_ORIGIN | http://localhost:3001 | https://dev.grimoire-book.com | https://inhouse.grimoire-book.com | https://grimoire-book.com |
| API_URL | http://localhost:3000/api | https://dev-api.grimoire-book.com/api | https://inhouse-api.grimoire-book.com/api | https://api.grimoire-book.com/api |
| DATABASE_URL | postgresql://grimoireadmin:...@localhost:5432/grimoire | Azure dev DB | Azure inhouse DB | Azure prod DB |
