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
| localhost | localhost:3001 | localhost:3000 | 127.0.0.1:55432 (격리 로컬 DB) |
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
POLAR_SERVER=sandbox            # 토큰 주입 시 sandbox/production 명시 필수
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
EMAIL_FROM_ADDRESS=             # 발신자가 소유한 주소. 키와 함께 설정해야 발송 활성
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
| DATABASE_URL | postgresql://grimoireadmin:...@127.0.0.1:55432/grimoire_local | Cloud SQL dev (Auth Proxy socket) | Cloud SQL prod (Auth Proxy socket) |

## 공개 준비용 로컬 실행 (2026-11-13)

현재 `.env.example`은 작성자 계정 없이 시작하는 로컬 기본값이다. API 키는 비워 두며
`APP_ENV=localhost`를 명시한다. `NODE_ENV=development`만 설정하면 원격 개발 환경으로
분류되므로 쿠키 설정이 달라진다. `HOST=127.0.0.1`은 개발 API를 루프백에만 연다.

허브의 `scripts/local-run.mjs`는 별도 설정 파일에서 DB/JWT/가상 시드 값만 읽는다.
셸의 외부 키를 상속하지 않으며 AI 두 키와 호환 별칭 `OPENAI_KEY`, GCS, Google,
reCAPTCHA, Polar, 메일 설정을 빈 값으로 덮는다. 주기 작업 여섯 종류도 비활성화한다.
파일의 외부 키를 추가해도 이 로컬 명령은 연동을 활성화하지 않는다.

1. 허브·서버·웹 세 저장소를 형제 구조로 받는다. 허브 README의 배치를 따른다.
2. `npm --prefix grimoire-server ci`, `npm --prefix grimoire-web ci`로 lockfile을 설치한다.
3. 기존 5432와 분리한 빈 PostgreSQL DB를 127.0.0.1:55432에 준비한다. 기존 DB를 재사용하지 않는다.
4. 서버 `.env.example`을 소스 밖의 개인 파일에 복사한다. DATABASE_URL의 로컬 DB 계정,
   JWT_SECRET, SEED_PASSWORD, SEED_ADMIN_PASSWORD를 직접 생성한 값으로 바꾼다.
   파일 접근 권한은 600으로 제한한다. 기존 `.env`와 `.env.local`은 보존한다.
5. 아래 명령을 허브에서 순서대로 실행한다. 설정 파일 경로는 실제 절대 경로로 바꾼다.

```sh
node scripts/local-run.mjs /absolute/private/local.env server generate
node scripts/local-run.mjs /absolute/private/local.env server migrate
node scripts/local-run.mjs /absolute/private/local.env server seed
node scripts/local-run.mjs /absolute/private/local.env server admin
node scripts/local-run.mjs /absolute/private/local.env server build
node scripts/local-run.mjs /absolute/private/local.env server start
# 다른 터미널
node scripts/local-run.mjs /absolute/private/local.env web start
```

웹은 http://localhost:3001, API는 http://localhost:3000/api 이다.
가상 계정은 local-writer / local-reader이며 비밀번호는 SEED_PASSWORD 입력값이다.
관리자는 SEED_ADMIN_SLUG/EMAIL/NAME/PASSWORD로 생성한다. 가상 시드는 빈 DB에서
한 번만 실행하며 실제 원고·그림·기존 작가 계정을 읽지 않는다. 이후 변경은 API로 한다.

### Docker와 직접 개발 실행의 차이

Docker Compose는 별도 프로젝트 `grimoire-local-release`, 전용 `local_pgdata` 볼륨,
루프백 DB 55432/API 3000을 사용한다. 기존 다른 Compose 프로젝트/볼륨을 정리하지 않는다.
`docker.env.example`을 소스 밖의 개인 파일로 복사하고 LOCAL_DB_PASSWORD(URI에 안전한 임의 16진수), LOCAL_JWT_SECRET를 생성한다.
Compose는 웹·서버·DB를 함께 실행한다. 기본 포트는 웹3001/API3000/DB55432다.
다른 로컬 서버가 사용 중이면 LOCAL_WEB_PORT, LOCAL_API_PORT, LOCAL_DB_PORT에 빈 포트를 지정한다.

```sh
docker compose --env-file /absolute/private/compose.env -f grimoire-server/docker-compose.yml up -d --build
```

컨테이너 안의 DB 주소는 db:5432이고 호스트의 시드/웹 주소는 localhost:55432/3000이다.
서버 컨테이너는 외부 키를 전달받지 않는다. 마이그레이션은 엔트리포인트가 실행한다.
가상 시드·관리자는 호스트에서 위 로컬 명령으로 준비한다. DB 포트를 바꿨다면
시드용 DATABASE_URL에도 같은 포트를 넣는다. 웹 컨테이너는 내부 네트워크의 server:3000을
BFF 대상으로 쓴다. Docker 실행과 직접 PostgreSQL 실행의 검사 결과를 구분한다.

### 외부 기능 설정 경계

| 기능 | 설정 조건 | 미설정 동작 |
| --- | --- | --- |
| AI 테마·분석·채팅 | 사용자의 Anthropic/OpenAI 키 | 호출 거절/해당 기능 실패. 유료 호출을 성공으로 대체하지 않음 |
| GCS 커버·CSS | 사용자의 GCS_BUCKET + ADC 또는 자격증명 파일 | 커버 업로드 거절. 테마 CSS API 경로 사용 |
| Google·reCAPTCHA | 사용자의 서버 키와 웹 공개 식별자 | Google 로그인 불가. reCAPTCHA 로컬 검사 생략 |
| Polar | 사용자 토큰 + 명시한 POLAR_SERVER + 상품/서명 | 토큰 없으면 SDK 호출 차단. 구독 checkout은 null → 503 |
| Resend/SendGrid | EMAIL_PROVIDER + 사용자 키 + EMAIL_FROM_ADDRESS | 발송 비활성. 작성자 발신자 기본값 없음 |

주기 작업의 비활성 설정은 `.env.example`에 모두 적었다. GCS는 버킷을 설정하면 ADC를
사용하므로 개인 CLI 로그인 계정이 자동 사용될 수 있다. 자신의 계정과 비용 범위를 먼저
확인한 뒤 직접 주입한다. 로컬 실행 명령은 이 연동을 계속 비활성화한다.
GCP의 기존 프로젝트·도메인·배포 명령은 당시 인프라 기록이다. 포크 사용자의 배포에는
자신의 프로젝트·DB·버킷·Secret·도메인 설정과 별도 배포 검증이 필요하다.


### 로컬 백업·복구와 갱신

갱신 전에는 자신의 DB를 백업하고 마이그레이션 상태를 확인한다. 백업은 공개 저장소와
Docker 빌드 컨텍스트 밖에 보관한다. `PGPASSFILE`은 소스 밖의 600 권한 파일로 준비한다.
비밀번호를 CLI 인자나 로그에 적지 않는다. 아래 환경값은 자신의 격리 로컬 DB에 맞춘다.

```sh
export PGHOST=127.0.0.1 PGPORT=55432 PGUSER=grimoire_local
export PGPASSFILE=/absolute/private/pgpass
pg_dump --dbname=grimoire_local --format=custom --file=/absolute/private/local-backup.dump
# 원본 DB에 덮어쓰지 않고 새 DB에서 복구를 확인한다.
createdb grimoire_restore_check
pg_restore --no-owner --dbname=grimoire_restore_check /absolute/private/local-backup.dump
```

복구 DB의 테이블·원고·포인트 원장이 일치하는지 확인한 뒤에만 복구 성공으로 판단한다.
업데이트는 변경을 검토한 로컬 소스에서 npm ci → 검사·빌드 → migrate deploy → 재시작 순으로
수행한다. 적용된 마이그레이션 파일은 고치지 않는다. 운영 백업·권한·Secret·주기 작업과
외부 연동은 별도 환경에서 검증해야 한다. 백업 파일을 공개 후보에 포함하지 않는다.


### 테마 CSS 출처

서버의 bakedCssUrl 응답은 절대 URL 계약을 유지한다. 웹은 현재 작가의
`/api/themes/css/{slug}` 경로를 같은 출처의 BFF로 중계해 API 포트가 달라도 CSP에
막히지 않게 한다. GCS에 베이킹한 CSS는 원래 CDN URL을 사용하며 style-src에서
storage.googleapis.com을 허용한다. 실제 GCS 연동 검증과 이 로컬 경로 검증을 구분한다.


### 웹 빌드 의존성

웹은 package-lock.json의 Next.js 16.4.6을 설치하며 개발과 빌드 모두 Webpack 경로를 쓴다.
기존 Google 서체를 유지한다. 확장자 없는 Google Fonts 파일 URL에서 빌드가 실패한
문제는 Next.js의 [수정 PR #100158](https://github.com/vercel/next.js/pull/100158) 및
설치 패키지의 폰트 로더와 대조했다. 폰트 제공 방식 비교와 실제 CLS 보정·측정은 후속 작업이다.

### 공개 준비의 배포 설정 경계 (2026-11-13)

작성자 GCP 계정/프로젝트/서비스 계정/도메인 기본값을 배포 스크립트에서 제거했다. 필수 값과 과거 매트릭스의 차이는 [DEPLOY.md](DEPLOY.md#2026-11-13-공개-준비-사용자-설정-주입)를 따른다. 실제 배포나 클라우드 변경을 검증한 것은 아니다. DB 동기화 워크플로는 저장소 변수로 명시적으로 켜야 실행한다. 웹 CSP의 직접 API 출처는 선택 설정 `NEXT_PUBLIC_API_ORIGIN`이며 기본 통신은 같은 출처 BFF다.

### 병렬 로컬 검토의 포트 설정

별도 local.env에 선택 값 `LOCAL_API_PORT`, `LOCAL_WEB_PORT`를 넣으면 기본 API 3000/웹 3001 대신 사용한다. 각 값은 1024~65535여야 하며 웹·API·DB 포트는 서로 달라야 한다. 생략하면 기존 기본값을 유지한다. 사용 중인 포트를 피해서 지정하며 `scripts/local-run.mjs`가 API URL·CORS·웹 실행 인자를 함께 맞춘다. 기존 DB와 원본 환경 파일을 덮어쓰지 않는다.

### 운영자 공개 정보

웹의 `NEXT_PUBLIC_SITE_URL`은 사이트맵에 사용할 본인 HTTP(S) 출처이며 빌드 때 주입한다. 비면 사이트맵 항목을 발행하지 않는다. `LEGAL_CONTACT_EMAIL`은 약관·개인정보 화면에 표시할 본인 문의 이메일이며 웹 런타임에 주입한다. 로컬 실행 도구는 사이트 주소를 선택한 웹 포트에 맞추고, 별도 설정 파일의 문의 이메일만 전달한다. 과거 Git 이력의 작성자 메일·문서에 남은 연락처 공개 범위는 별도 확인 대상이다.

### 공개 후보 런타임과 의존성 점검

로컬 검증 기준은 Node 22.19 이상이며 Docker 빌드/실행도 node:22-alpine을 사용한다. 기존 Node 20은 [공식 지원 일정](https://github.com/nodejs/Release/blob/main/schedule.json)상 지원이 종료됐다. 이 변경은 로컬 소스/이미지의 기준이며 운영 Cloud Run을 변경한 것은 아니다. `npm run audit:production`은 운영 의존성의 중간 이상 경고에서 실패하고, `npm run audit:all`은 개발 의존성을 포함한 높은 등급 이상에서 실패한다. 낮은 등급/개발 도구의 남은 경고도 원문 보고서에서 확인한다.

서버는 기존 SDK 기능을 유지하며 uuid, deepmerge-ts, @types/request의 form-data를 명시한 override로 제한했다. uuid는 직접 의존성의 같은 버전을 재사용하며 Node 22 환경에서 Google SDK의 로컬 객체 생성과 파서·마이그레이션·유닛/API 회귀를 확인한다. SendGrid 경로 deepmerge의 낮은 등급 경고는 남아 있다. 자동 도구가 제안한 과거 SendGrid 주버전으로의 강제 하향은 적용하지 않았다. 기본 메일 제공자는 비활성 상태이며 실제 외부 발송 성공은 미검증이다.
