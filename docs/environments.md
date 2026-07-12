# Environments — ProjectGrimoire

> 정본: grimoire-server (이 파일) → grimoire-web에 동기화
> 2026-05-27: Azure → GCP 마이그레이션 완료. Cloud Run + Cloud SQL + Artifact Registry + GCS 정합.
> 2026-04-19: `inhouse` 환경 제거. QA는 dev 환경에서 develop 브랜치로 수행.

## 2단계 환경 (+ 로컬)

| 환경 | 용도 | 브랜치 | 데이터 관리 |
|------|------|--------|------------|
| localhost | 로컬 개발 | feature/bugfix (작업 브랜치) | 시드 스크립트 1회 + 이후 마이그레이션/API |
| development | 원격 개발 서버 + QA | develop | 마이그레이션 + API |
| production | 실서비스 | main | 마이그레이션 + API |

> **시드 스크립트는 localhost 초기 세팅 시 1회만 사용한다.**
> development 이상 환경의 데이터 변경은 마이그레이션, 백필 SQL, API를 통해서만 진행한다.

## URL 체계

| 환경 | Web | API | DB |
|------|-----|-----|----|
| localhost | localhost:3001 | localhost:3000 | localhost:5432 (Docker) |
| development | dev.grimoire-book.com | dev-api.grimoire-book.com | Cloud SQL grimoire-db-dev (Auth Proxy) |
| production | grimoire-book.com | api.grimoire-book.com | Cloud SQL grimoire-db-prod (Auth Proxy) |

## GCP 리소스 (2026-05-27 정합)

| 리소스 | 서비스 | 용도 |
|--------|--------|------|
| grimoire-web-{env} | Cloud Run (asia-northeast1) | 웹 호스팅 (dev/prod) |
| grimoire-server-{env} | Cloud Run (asia-northeast1) | API 서버 (dev/prod) |
| grimoire-db-{env} | Cloud SQL for PostgreSQL 16 (db-f1-micro Enterprise) | 데이터베이스 (dev/prod) |
| grimoire-docker | Artifact Registry (DOCKER) | Docker 이미지 (수동 push) |
| grimoire-blob-{env} | Cloud Storage (Standard) | 테마 CSS + 커버 이미지 (public IAM) |
| Secret Manager (16건, asia-northeast1) | Secret Manager | DATABASE_URL/JWT/API keys/Polar tokens |
| Cloud Run Domain Mapping × 4 | Cloud Run | 커스텀 도메인 + Google managed cert |

> 프로젝트: `grimoire-491708` (project number `23295981916`) / 리전: `asia-northeast1` 단일.
> localhost는 GCP 리소스를 사용하지 않는다. Docker Compose로 로컬 DB를 띄운다.
> 상세 인프라 구성: `INFRASTRUCTURE.md` 참조.

## Azure decommission (2026-06-04 완료)

> Azure는 2026-06-04 `zenith-rg` 전체 삭제로 완전 decommission 완료. 현역 인프라는 **GCP 단독**.
> 삭제 이력 상세: `INFRASTRUCTURE.md §12` 참조 (구 Container Apps × 4 / Postgres × 2 / ACR / Blob / Log Analytics → GCP 대체).

## 환경변수

### grimoire-server
```
# 필수
APP_ENV=localhost|development|production   # 애플리케이션 환경 구분자 (코드 내 분기용)
NODE_ENV=development|production            # Node/Express 표준값 (라이브러리 최적화용)
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
CORS_ORIGIN={환경별 Web URL}
PUBLIC_API_BASE_URL={환경별 API URL}/api  # bakedCssUrl 응답 절대화 (P1-#7, 2026-05-03). 절대 URL 강제, 미설정 시 부팅 차단

# NODE_ENV vs APP_ENV 분리 이유:
# - NODE_ENV는 Node/Express/NestJS 생태계의 표준값. 'production' 시 라이브러리들이 최적화 모드로 동작.
# - 코드 내 환경 분기 (예: dev는 스택 트레이스 노출, prod는 숨김)는 APP_ENV로만 판단.
# - 관련 헬퍼: src/infrastructure/config/app-env.ts (getAppEnv / isRemoteEnv / isProduction)

# 선택 (없으면 해당 기능 비활성화)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...
OPENAI_API_KEY=...
# Polar 결제
#   F-12 (2026-07-11): POLAR_ACCESS_TOKEN / POLAR_WEBHOOK_SECRET 는 **production 필수**
#   (validateEnv 가 prod 부팅 시 미설정이면 process.exit(1)). dev/localhost 는 관대(경고만).
#   구 PAYAPP_* 검증은 제거됨(PayappAdapter 폐기 — 실사용 게이트웨이는 Polar).
POLAR_ACCESS_TOKEN=polar_oat_...   # production 필수 (F-12)
POLAR_SERVER=production
POLAR_ORGANIZATION_ID=...
POLAR_WEBHOOK_SECRET=polar_whs_... # production 필수 (F-12)
# 충전 패키지 4종 (CC-2a 디노미 — CREDIT_PRODUCTS) — 각 Polar Product UUID
POLAR_PRODUCT_STARTER=...   # 입문 ₩3,000 / $2.99 (CC-2a 신설 — Polar Dashboard 상품 등록 필요)
POLAR_PRODUCT_BASIC=...     # 기본 ₩5,000 / $4.99
POLAR_PRODUCT_POPULAR=...   # 인기 ₩10,000 / $9.99
POLAR_PRODUCT_BEST=...      # 베스트 ₩30,000 / $29.99
# 구독 정기결제 상품 2종 (CC-5 — PAY-P1-4) — 각 Polar recurring Product UUID. **Optional**.
#   미설정 = 정상 상태 (POST /subscriptions/checkout 만 503 graceful, 나머지 기능 전부 정상).
#   구독 결제 활성화 시 Polar Dashboard 에 recurring product 등록 후 입력.
POLAR_PRODUCT_SUBSCRIPTION_PRO=...      # Pro 구독 ₩9,900/월 (recurring_interval: month)
POLAR_PRODUCT_SUBSCRIPTION_PREMIUM=...  # Premium 구독 ₩19,900/월 (recurring_interval: month)
# PAY-P3-B (2026-05-09) — Polar SDK timeout (워커 자원 leak 차단). 미설정 시 30000ms 기본값.
POLAR_SDK_TIMEOUT_MS=30000

# EMAIL-POLAR-READY Phase B+C (2026-05-27) — Email SaaS factory 분기. **Optional**.
#   미설정 = NullEmailAdapter (외부 호출 0건, logger.warn만) — 사용자 절대 규정 0-1 default
#   resend = ResendEmailAdapter (RESEND_API_KEY 실값 필요)
#   sendgrid = SendgridEmailAdapter (SENDGRID_API_KEY 실값 필요)
#   미지원 값(ses/postmark 등) = NullEmailAdapter 폴백 + logger.warn
EMAIL_PROVIDER=null
RESEND_API_KEY=placeholder      # Secret Manager `resend-api-key-{env}-an1` 바인딩 권장. placeholder 시 isEnabled=false
SENDGRID_API_KEY=placeholder    # Secret Manager `sendgrid-api-key-{env}-an1` 바인딩 권장
EMAIL_FROM_ADDRESS=noreply@grimoire-book.com   # 발신자 주소 (기본값)
# EMAIL-POLAR-READY Phase C (2026-05-27) — 토큰 hash pepper (rainbow table 차단).
#   미설정 시 빈 문자열 폴백 (개발용). prod에서는 반드시 실값 + Secret Manager 권장.
EMAIL_TOKEN_PEPPER=             # 권장: openssl rand -base64 32

# 커버/테마 CSS 업로드 = GCS (BlobStoragePort → GcsStorageService)
GCS_BUCKET=grimoire-blob-{env}
# (구 AZURE_STORAGE_* 는 2026-06-04 Azure decommission + 2026-06-10 dead env 제거로 폐기)
```

### grimoire-web
```
# 빌드 시 (선택)
NEXT_PUBLIC_APP_ENV=localhost|development|production

# 런타임 (BFF 프록시 — 서버 사이드에서 백엔드 직접 호출용)
API_URL={환경별 API URL}/api
```

### 환경별 값 참조

| 변수 | localhost | development | production |
|------|-----------|-------------|------------|
| CORS_ORIGIN | http://localhost:3001 | https://dev.grimoire-book.com | https://grimoire-book.com |
| API_URL | http://localhost:3000/api | https://dev-api.grimoire-book.com/api | https://api.grimoire-book.com/api |
| PUBLIC_API_BASE_URL | http://localhost:3000/api | https://dev-api.grimoire-book.com/api | https://api.grimoire-book.com/api |
| DATABASE_URL | postgresql://grimoireadmin:...@localhost:5432/grimoire | Cloud SQL dev (Auth Proxy socket) | Cloud SQL prod (Auth Proxy socket) |
