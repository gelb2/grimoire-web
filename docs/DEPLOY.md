# DEPLOY.md — 수동 배포 절차 (server + web)

> GitHub Actions가 빌링 이슈 등으로 차단된 경우의 **1차 배포 수단**.
> 평시에도 긴급 패치/롤백에 사용.
> 정본: 이 문서. INFRASTRUCTURE.md §6이 참조한다.
>
> **2026-04-19: `inhouse` 환경 제거 (3환경 → 2환경).** QA는 dev에서 develop 브랜치로 수행.

---

## 1. 환경 매트릭스 (2026-04-19 실측 기준)

> **이 표의 값은 절대 변경 금지**. 변경이 필요하면 이 문서를 먼저 수정하고 스크립트를 수정한다.

### 공통 상수

| 항목 | 값 |
|------|-----|
| Azure 리소스그룹 | `zenith-rg` (유일) |
| Azure 리전 | `Korea Central` |
| ACR | `grimoireacr.azurecr.io` |
| Container App Env | `zenith-env-dev` (ProjectZenith와 공유) |
| FQDN suffix | `salmonsmoke-9e462011.koreacentral.azurecontainerapps.io` |
| 빌드 플랫폼 | `linux/amd64` |
| 이미지 유지 개수 | 환경별 prefix당 최근 5개 |
| Container App 스케일 | `min-replicas=0, max-replicas=1, cpu=0.25, memory=0.5Gi` (2026-04-19 복원) |

### 환경별 매트릭스

| 항목 | dev | prod |
|------|-----|------|
| **브랜치** | `develop` | `main` |
| **이미지 태그** | `dev-{SHA}` + `dev-latest` | `prod-{SHA}` + `prod-latest` |
| **Server Container App** | `grimoire-server-dev` | `grimoire-server-prod` |
| **Web Container App** | `grimoire-web-dev` | `grimoire-web-prod` |
| **Server DB 호스트** | `grimoire-db-dev.postgres.database.azure.com` | `grimoire-db-prod.postgres.database.azure.com` |
| **Web → Server API_URL** | `https://grimoire-server-dev.{FQDN}/api` | `https://grimoire-server-prod.{FQDN}/api` |
| **CORS_ORIGIN** | `*` ⚠️ | `https://grimoire-book.com` |
| **APP_ENV (server)** | `development` | `production` |
| **NODE_ENV (server)** | `development` | `production` |
| **Web `NEXT_PUBLIC_APP_ENV` 빌드 인자** | `development` | `production` |
| **공개 웹 URL** | `https://dev.grimoire-book.com` | `https://grimoire-book.com` |
| **공개 API URL** | `https://dev-api.grimoire-book.com` | `https://api.grimoire-book.com` |

> ⚠️ **dev CORS `*`**: 의도된 느슨한 설정이지만 CLAUDE.md §11 전수검사 기준으론 경고. 별도 이슈 참조.

### Polar 주의사항

- `POLAR_SERVER=production`은 **2환경 모두 동일**. Polar는 organization 단위로 토큰이 발급되어 환경별 분리 불가. `memory/feedback_polar_coupon_ops.md` 참조.
- Polar 관련 환경변수는 `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_PRODUCT_BASIC`, `POLAR_PRODUCT_POPULAR`, `POLAR_PRODUCT_BEST`.

---

## 2. 이미지 태그 전략

```
grimoireacr.azurecr.io/grimoire-server:{env}-{SHA}     ← Container App이 실제 가리키는 태그
grimoireacr.azurecr.io/grimoire-server:{env}-latest    ← 해당 환경의 최신 SHA에 대한 별칭 (참조용)
grimoireacr.azurecr.io/grimoire-web:{env}-{SHA}
grimoireacr.azurecr.io/grimoire-web:{env}-latest
```

- **SHA**는 `git rev-parse HEAD` 값(배포하려는 커밋).
- `{env}-latest`는 편의 태그 — 배포 대상은 **반드시 `{env}-{SHA}` 태그**를 사용해야 Container App revision이 내용 기반으로 생성된다.
- 롤백: 과거 `{env}-{SHA}` 태그로 Container App `--image`를 되돌린다.

### ⚠️ `:latest` 태그 금지

실측상 Container App이 `:latest` 태그로 배포되어 있으면 revision이 내용 기반으로 생성되지 않아 사실상 업데이트가 안 될 수 있다. 새 스크립트로 배포 시 자동으로 `{env}-{SHA}` 태그가 설정된다.

---

## 3. 배포 스크립트 구조

```
grimoire-server/
├── Makefile                        # 진입점
└── scripts/
    ├── deploy-common.sh            # 공통 상수/함수 (source로 로드)
    ├── preflight.sh                # 배포 전 전수검사
    ├── deploy-dev.sh
    └── deploy-prod.sh

grimoire-web/
├── Makefile                        # 진입점 (동일 인터페이스)
└── scripts/
    ├── deploy-common.sh
    ├── preflight.sh
    ├── deploy-dev.sh
    └── deploy-prod.sh
```

### Makefile 타겟

```bash
make preflight ENV=dev         # 배포 전수검사만 (배포 안 함)
make preflight ENV=prod

make deploy-dev                # preflight + 이미지 빌드 + 푸시 + Container App 업데이트 + purge
make deploy-prod

make logs ENV=dev              # Container App 로그 tail
make logs ENV=prod

make rollback ENV=prod SHA=<sha>   # 특정 SHA로 되돌림
```

### preflight 전수검사 항목

배포 스크립트는 실행 시작 시 `preflight.sh`를 **반드시 호출**한다. 하나라도 실패하면 배포는 `exit 1`로 중단된다.

1. **git 상태 검증**
   - 현재 브랜치가 배포 대상 브랜치(`develop`/`main`)와 일치
   - 워킹 트리에 스테이지/언스테이지된 변경 없음 (`git status --porcelain`이 비어 있음)
   - 로컬 HEAD가 `origin/{브랜치}` HEAD와 일치 (앞섰거나 밀렸으면 거부)

2. **Azure CLI 상태**
   - `az account show`로 올바른 구독 (유저 `rainmaker8492@gmail.com`)
   - Azure 로그인 유효 (토큰 만료 아님)

3. **ACR 접근**
   - `az acr login --name grimoireacr` 통과
   - ACR에 이미지 푸시 권한 (write) 확인

4. **Container App 존재 + 리소스그룹 일치**
   - 타겟 Container App이 `zenith-rg`에 존재
   - FQDN이 매트릭스와 일치

5. **Docker daemon**
   - `docker info` 성공
   - `docker buildx ls`에서 `linux/amd64` 지원 확인

6. **환경변수 존재 검증 (Container App)**
   - server: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` 모두 설정됨
   - web: `API_URL`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 설정됨
   - (값은 직접 출력하지 않음 — 존재 여부만)

7. **prod에 한해 추가 검증**
   - 마지막 커밋 메시지에 `feat:`/`fix:`/`merge:` 중 하나로 시작하는지 (규약)
   - 현재 브랜치가 정확히 `main`
   - 사용자에게 "prod 배포 맞습니까? (yes 입력)" 명시적 확인 (interactive)

8. **원격 DB와의 DB 스키마 일관성**
   - server 배포일 때만: `prisma migrate status --schema prisma/schema.prisma` 실행
   - 미적용 마이그레이션 있으면 **경고만** 출력 (배포는 진행) — 배포 후 앱 기동 시 `RUN_MIGRATION=true`가 자동 적용하므로

---

## 4. 배포 절차 (권장)

### 4.1 dev 배포
```bash
# grimoire-server
cd grimoire-server
make deploy-dev

# grimoire-web
cd grimoire-web
make deploy-dev

# 검증
curl -I https://dev-api.grimoire-book.com/api/health   # 200 기대
open https://dev.grimoire-book.com                     # 수동 UI 검증
```

### 4.2 prod 승격 (develop → main 직결)

```bash
# 2개 레포 각각
cd grimoire-server && git checkout main && git merge develop --no-ff -m "merge: develop → main" && git push origin main && git checkout develop
cd grimoire-web    && git checkout main && git merge develop --no-ff -m "merge: develop → main" && git push origin main && git checkout develop

# 배포 (interactive 확인 필수)
cd grimoire-server && make deploy-prod
cd grimoire-web    && make deploy-prod

# 검증
curl -I https://api.grimoire-book.com/api/health
open https://grimoire-book.com
```

> QA는 `develop` 브랜치에서 `make deploy-dev` 후 dev URL로 진행한다. (기존 inhouse 흡수)

---

## 5. 롤백

```bash
# ACR에 쌓인 이미지 목록
az acr repository show-tags --name grimoireacr --repository grimoire-server --orderby time_desc --query "[?starts_with(@, 'prod-')]" -o tsv | head

# 특정 SHA로 되돌림
make rollback ENV=prod SHA=abc1234...
```

스크립트는 해당 SHA 태그가 ACR에 존재하는지 먼저 확인한다.

---

## 6. 환경변수 추가/변경

> **스크립트는 이미지 배포만 담당한다**. 환경변수 변경은 별도 명령으로 수행한다.

```bash
# 단일 변수 추가
az containerapp update \
  --name grimoire-server-dev \
  --resource-group zenith-rg \
  --set-env-vars KEY=VALUE

# 여러 변수 동시 추가 (memory/feedback_az_containerapp_envvars.md 참조 — --set-env-vars는 **공백 구분**, 변수별 개별 인자 분리 필수)
az containerapp update --name grimoire-server-dev --resource-group zenith-rg \
  --set-env-vars K1=V1 K2=V2 K3=V3
```

환경변수 변경이 있었다면 **반드시** `INFRASTRUCTURE.md §9`와 이 문서 §1 매트릭스를 같은 커밋에 업데이트한다.

---

## 7. 보안 주의

이 문서와 스크립트는 **비밀값 자체를 커밋에 포함하지 않는다**. 모든 자격증명은:

- Azure 자격증명: `az login`으로 로컬 keychain에 저장
- ACR 자격증명: `az acr login` (MSI 또는 admin user 토큰, 만료 있음)
- 앱 런타임 시크릿: Container App 환경변수에만 존재, `.env`에는 **로컬 전용 값만**

자세한 보안 지침: `SECURITY.md §4 배포 전 체크리스트` 참조.

---

## 8. CI 복원 시

GitHub Actions 빌링이 복구되면 자동 배포가 다시 작동한다. 그 경우에도:

- **수동 배포는 긴급 수단으로 계속 유지**한다 (운영자가 로컬에서 언제든 실행 가능해야 함)
- 스크립트가 업데이트되면 `.github/workflows/deploy-*.yml`도 동일한 로직으로 업데이트한다
- 스크립트가 정본이 되도록 관리한다 (CI는 스크립트를 호출하는 래퍼로 전환 가능)

---

## 9. 참조 문서

- `INFRASTRUCTURE.md` — Azure 인프라 구성
- `SECURITY.md` — 보안 정책 + 배포 전 체크리스트
- `docs/environments.md` — 환경 정본
- `MIGRATION.md` — DB 마이그레이션 규칙
- `CLAUDE.md §11 전수검사` — 배포 전 체크리스트
- 루트 `CLAUDE.md §7 빌드 환경`, `§8 Git 브랜치 전략`
