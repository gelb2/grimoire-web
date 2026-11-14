#!/usr/bin/env bash
# preflight.sh — 배포 전 전수검사 (grimoire-web)
# 사용: ./scripts/preflight.sh <env>
#   <env>: dev | prod
# 정본: grimoire-server/docs/DEPLOY.md §4 preflight 전수검사 항목 (server 정본, web 복사본)
#
# 모든 검사 통과 → exit 0
# 하나라도 실패 → 검사 목록 출력 후 exit 1
#
# 2026-07-13 GCP 전환: Azure(az account/acr/containerapp) → GCP(gcloud auth/config/
#   Artifact Registry/Cloud Run) 검증. 모든 gcloud 측정은 --project 명시 강제
#   (로컬 gcloud 전역 default 가 pr-letter-addr/ne3 일 수 있음 → 무지정은 거짓 PASS/FAIL).
#   web 고유: 5/8 단계는 server 의 Cloud SQL 대신 build-arg 정합(로그인 파손 방지) 검증.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./deploy-common.sh
source "${SCRIPT_DIR}/deploy-common.sh"

ENV="${1:-}"
validate_env "$ENV"
validate_cloud_config "$ENV"

# 체크 결과 추적 (bash 3.2 호환 — associative array 미사용)
CHECK_FAILED=0
CHECK_WARNS=0

_fail() { printf "%s[FAIL]%s %s\n" "$C_RED" "$C_OFF" "$*" >&2; CHECK_FAILED=$((CHECK_FAILED+1)); }
_pass() { printf "%s[PASS]%s %s\n" "$C_GREEN" "$C_OFF" "$*"; }
_warn() { printf "%s[WARN]%s %s\n" "$C_YELLOW" "$C_OFF" "$*" >&2; CHECK_WARNS=$((CHECK_WARNS+1)); }

printf "\n%s╔══ grimoire-web preflight [%s] ══╗%s\n" "$C_BOLD" "$ENV" "$C_OFF"
print_matrix "$ENV"

APP_NAME=$(env_to_app_name "$ENV")

# ─────────────────────────────────────────────────────────────
# 1/8. git 상태
# ─────────────────────────────────────────────────────────────
step "1/8: git 상태"
EXPECTED_BRANCH=$(env_to_branch "$ENV")
CURRENT_BRANCH=$(current_branch)
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  _fail "현재 브랜치 '$CURRENT_BRANCH' ≠ 기대 브랜치 '$EXPECTED_BRANCH'"
else
  _pass "현재 브랜치: $CURRENT_BRANCH"
fi

if [ -n "$(git status --porcelain)" ]; then
  _fail "워킹 트리에 스테이지/언스테이지된 변경 있음. 커밋하거나 stash 후 재시도."
  git status --short
else
  _pass "워킹 트리 클린"
fi

git fetch origin "$EXPECTED_BRANCH" --quiet 2>/dev/null || _warn "git fetch 실패 (네트워크?)"
LOCAL_SHA=$(git rev-parse HEAD 2>/dev/null || echo "none")
REMOTE_SHA=$(git rev-parse "origin/${EXPECTED_BRANCH}" 2>/dev/null || echo "none")
if [ "$LOCAL_SHA" = "none" ] || [ "$REMOTE_SHA" = "none" ]; then
  _warn "git SHA 비교 불가"
elif [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  _fail "로컬 HEAD($LOCAL_SHA)와 origin/${EXPECTED_BRANCH}($REMOTE_SHA) 불일치. push 누락 또는 pull 필요."
else
  _pass "로컬 HEAD == origin/${EXPECTED_BRANCH} ($LOCAL_SHA)"
fi

# ─────────────────────────────────────────────────────────────
# 2/8. gcloud CLI 상태 (auth + project)
# 모든 gcloud 측정은 --project 명시 강제 (전역 default 가 pr-letter-addr 일 수 있음).
# ─────────────────────────────────────────────────────────────
step "2/8: gcloud CLI 로그인 + 프로젝트 상태"
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "")
if [ -z "$ACTIVE_ACCOUNT" ]; then
  _fail "gcloud 활성 계정 없음. 'gcloud auth login' 실행 필요."
elif [ "$ACTIVE_ACCOUNT" != "$EXPECTED_GCP_ACCOUNT" ]; then
  _warn "gcloud 활성 계정 '$ACTIVE_ACCOUNT' ≠ 기대 '$EXPECTED_GCP_ACCOUNT' (배포는 --project 명시로 진행)"
else
  _pass "gcloud 활성 계정: $ACTIVE_ACCOUNT"
fi

# 프로젝트 접근 가능 여부 (전역 default 와 무관하게 --project 명시로 직접 확인)
if gcloud projects describe "$GCP_PROJECT_ID" --format="value(projectId)" >/dev/null 2>&1; then
  _pass "프로젝트 접근 가능: $GCP_PROJECT_ID"
else
  _fail "프로젝트 '$GCP_PROJECT_ID' 접근 불가 (권한 또는 로그인 확인 필요)"
fi

# 전역 default 가 다른 프로젝트면 안내 (FAIL 아님 — 스크립트는 항상 --project 명시)
GLOBAL_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$GLOBAL_PROJECT" != "$GCP_PROJECT_ID" ]; then
  _warn "gcloud 전역 default project='$GLOBAL_PROJECT' ≠ '$GCP_PROJECT_ID' (스크립트는 --project 명시로 안전. 'gcloud config set project' 불필요)"
fi

# ─────────────────────────────────────────────────────────────
# 3/8. Artifact Registry 접근 (repo 존재 + Docker 인증)
# ─────────────────────────────────────────────────────────────
step "3/8: Artifact Registry 접근"
if gcloud artifacts repositories describe "$ARTIFACT_REPO" \
    --location "$GCP_REGION" --project "$GCP_PROJECT_ID" \
    --format="value(name)" >/dev/null 2>&1; then
  _pass "Artifact Registry repo '$ARTIFACT_REPO' 존재 ($GCP_REGION)"
else
  _fail "Artifact Registry repo '$ARTIFACT_REPO' 없음 ($GCP_PROJECT_ID/$GCP_REGION). grimoire-server/docs/DEPLOY.md §1 확인."
fi

# Docker credential helper 등록 여부 (config.json)
if grep -q "$ARTIFACT_REGISTRY_HOST" "$HOME/.docker/config.json" 2>/dev/null; then
  _pass "Docker credential helper 등록됨 ($ARTIFACT_REGISTRY_HOST)"
else
  _warn "Docker credential helper 미등록. 'gcloud auth configure-docker $ARTIFACT_REGISTRY_HOST' 권장 (배포 시 자동 시도)."
fi

# ─────────────────────────────────────────────────────────────
# 4/8. Cloud Run 서비스 존재 + 프로젝트/리전 일치
# ─────────────────────────────────────────────────────────────
step "4/8: Cloud Run 서비스 존재 확인"
SVC_URL=$(gcloud run services describe "$APP_NAME" \
  --region "$GCP_REGION" --project "$GCP_PROJECT_ID" \
  --format="value(status.url)" 2>/dev/null || echo "")
if [ -z "$SVC_URL" ]; then
  _fail "Cloud Run 서비스 '$APP_NAME' 이 '$GCP_PROJECT_ID/$GCP_REGION'에 없음"
else
  EXPECTED_RUN_URL=$(env_to_run_url "$ENV")
  if [ "$SVC_URL" != "$EXPECTED_RUN_URL" ]; then
    _warn "Cloud Run URL '$SVC_URL' ≠ 매트릭스 '$EXPECTED_RUN_URL' (도메인/리비전 차이 가능)"
  else
    _pass "Cloud Run 서비스 '$APP_NAME' (URL: $SVC_URL)"
  fi
fi

# ─────────────────────────────────────────────────────────────
# 5/8. build-arg 정합 (web 고유 — 로그인 파손 방지)
# server 의 Cloud SQL 검증 자리. web 은 DB 미사용 → NEXT_PUBLIC_* 빌드타임 인라인 값 검증.
# 빈 값/절단본으로 빌드하면 클라이언트 번들에 박혀 reCAPTCHA/구글 로그인이 파손된다.
# ─────────────────────────────────────────────────────────────
step "5/8: build-arg 정합 (reCAPTCHA / Google / APP_ENV)"
if [ -z "$RECAPTCHA_SITE_KEY" ]; then
  _fail "RECAPTCHA_SITE_KEY 비어있음 — 빌드 시 reCAPTCHA 파손. deploy-common.sh 확인."
elif [ "${#RECAPTCHA_SITE_KEY}" -ne 40 ]; then
  _warn "RECAPTCHA_SITE_KEY 길이 ${#RECAPTCHA_SITE_KEY} (Google 정식 키는 40자). deploy-common.sh 확인."
else
  _pass "RECAPTCHA_SITE_KEY 설정됨 (len=40, 값 비노출)"
fi

if [ -z "$GOOGLE_CLIENT_ID" ]; then
  _fail "GOOGLE_CLIENT_ID 비어있음 — 구글 로그인 파손. deploy-common.sh 확인."
elif ! printf "%s" "$GOOGLE_CLIENT_ID" | grep -q "\.apps\.googleusercontent\.com$"; then
  _warn "GOOGLE_CLIENT_ID 형식 의심 (.apps.googleusercontent.com 로 끝나지 않음)."
else
  _pass "GOOGLE_CLIENT_ID 설정됨 (값 비노출)"
fi

# APP_ENV build-arg 매핑 (dev → development, prod → production)
BUILD_APP_ENV=$(env_to_app_env_buildarg "$ENV")
EXPECTED_BUILD_APP_ENV="development"; [ "$ENV" = "prod" ] && EXPECTED_BUILD_APP_ENV="production"
if [ "$BUILD_APP_ENV" != "$EXPECTED_BUILD_APP_ENV" ]; then
  _fail "APP_ENV build-arg 불일치: '$BUILD_APP_ENV' ≠ 기대 '$EXPECTED_BUILD_APP_ENV' (dev가 production으로 빌드되면 안 됨)"
else
  _pass "APP_ENV build-arg: $BUILD_APP_ENV"
fi

# ─────────────────────────────────────────────────────────────
# 6/8. Docker daemon
# ─────────────────────────────────────────────────────────────
step "6/8: Docker daemon"
if ! docker info >/dev/null 2>&1; then
  _fail "Docker daemon 미실행. Docker Desktop을 실행하세요."
else
  _pass "Docker daemon 실행 중"
  if docker buildx ls 2>/dev/null | grep -q "linux/amd64"; then
    _pass "linux/amd64 빌드 지원"
  else
    _warn "linux/amd64 빌드 지원 미확인 (buildx ls 실패). 계속 진행."
  fi
fi

# ─────────────────────────────────────────────────────────────
# 7/8. Cloud Run 런타임 env 검증 (web BFF — API_URL 필수)
# NEXT_PUBLIC_* 는 빌드타임 인라인이라 런타임 env 는 무효(정보성). API_URL 은 서버사이드 필수.
# gcloud run deploy --image 는 기존 런타임 env 를 보존하므로 여기서 존재만 확인.
# ─────────────────────────────────────────────────────────────
step "7/8: Cloud Run 런타임 env (API_URL)"
ACTUAL_API_URL=$(gcloud run services describe "$APP_NAME" \
  --region "$GCP_REGION" --project "$GCP_PROJECT_ID" \
  --format="value(spec.template.spec.containers[0].env)" 2>/dev/null \
  | tr ';' '\n' | grep -oE "'API_URL', 'value': '[^']*'" | head -1 | sed "s/.*'value': '//; s/'$//" || echo "")
EXPECTED_API_URL=$(env_to_expected_api_url "$ENV")
if [ -z "$ACTUAL_API_URL" ]; then
  _fail "API_URL 런타임 env 누락 — BFF 프록시 대상 없음. 'gcloud run services update --update-env-vars API_URL=...' 필요."
elif [ "$ACTUAL_API_URL" != "$EXPECTED_API_URL" ]; then
  _warn "API_URL '$ACTUAL_API_URL' ≠ 매트릭스 '$EXPECTED_API_URL' (Cloud Run 직접 URL 형식 가능 — 동일 백엔드면 무해)"
else
  _pass "API_URL: $ACTUAL_API_URL"
fi

# ─────────────────────────────────────────────────────────────
# 8/8. prod 추가 검증 (interactive)
# ─────────────────────────────────────────────────────────────
step "8/8: prod 전용 검증"
if [ "$ENV" = "prod" ]; then
  LAST_MSG=$(git log -1 --pretty=format:"%s")
  case "$LAST_MSG" in
    feat:*|fix:*|merge:*|refactor:*|docs:*|chore:*|test:*)
      _pass "커밋 메시지 컨벤션 충족: $LAST_MSG"
      ;;
    *)
      _warn "커밋 메시지 컨벤션 위반: '$LAST_MSG' (prod 배포 권장 안 함)"
      ;;
  esac

  # interactive 확인 (CI 환경에서는 건너뜀 — SKIP_INTERACTIVE=1)
  if [ "${SKIP_INTERACTIVE:-0}" = "1" ]; then
    _warn "SKIP_INTERACTIVE=1 — interactive 확인 건너뜀"
  else
    printf "\n%s⚠  prod 배포를 진행하시겠습니까? 'yes' 입력 시에만 진행 →%s " "$C_YELLOW" "$C_OFF"
    read -r ANSWER
    if [ "$ANSWER" != "yes" ]; then
      _fail "사용자가 prod 배포 확인하지 않음. 중단."
    else
      _pass "사용자 prod 배포 승인"
    fi
  fi
else
  info "  (prod 아님, 스킵)"
fi

# ─────────────────────────────────────────────────────────────
# 요약
# ─────────────────────────────────────────────────────────────
printf "\n%s═══ preflight 요약 [%s] ═══%s\n" "$C_BOLD" "$ENV" "$C_OFF"
if [ "$CHECK_FAILED" -gt 0 ]; then
  printf "%s✘ FAILED: %d%s    %s⚠ WARNS: %d%s\n" "$C_RED" "$CHECK_FAILED" "$C_OFF" "$C_YELLOW" "$CHECK_WARNS" "$C_OFF"
  exit 1
fi
printf "%s✔ 모든 검사 통과%s (경고 %d건)\n" "$C_GREEN" "$C_OFF" "$CHECK_WARNS"
exit 0
