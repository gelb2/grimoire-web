#!/usr/bin/env bash
# preflight.sh — 배포 전 전수검사 (grimoire-web)
# 사용: ./scripts/preflight.sh <env>
# 정본: grimoire-server/docs/DEPLOY.md §3 preflight 전수검사 항목

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./deploy-common.sh
source "${SCRIPT_DIR}/deploy-common.sh"

ENV="${1:-}"
validate_env "$ENV"

CHECK_FAILED=0
CHECK_WARNS=0
_fail() { printf "%s[FAIL]%s %s\n" "$C_RED" "$C_OFF" "$*" >&2; CHECK_FAILED=$((CHECK_FAILED+1)); }
_pass() { printf "%s[PASS]%s %s\n" "$C_GREEN" "$C_OFF" "$*"; }
_warn() { printf "%s[WARN]%s %s\n" "$C_YELLOW" "$C_OFF" "$*" >&2; CHECK_WARNS=$((CHECK_WARNS+1)); }

printf "\n%s╔══ grimoire-web preflight [%s] ══╗%s\n" "$C_BOLD" "$ENV" "$C_OFF"
print_matrix "$ENV"

# ─────────────────────────────────────────────────────────────
# 1. git 상태
# ─────────────────────────────────────────────────────────────
step "1/7: git 상태"
EXPECTED_BRANCH=$(env_to_branch "$ENV")
CURRENT_BRANCH=$(current_branch)
if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  _fail "현재 브랜치 '$CURRENT_BRANCH' ≠ 기대 브랜치 '$EXPECTED_BRANCH'"
else
  _pass "현재 브랜치: $CURRENT_BRANCH"
fi

if [ -n "$(git status --porcelain)" ]; then
  _fail "워킹 트리에 변경 있음. 커밋하거나 stash 후 재시도."
  git status --short
else
  _pass "워킹 트리 클린"
fi

git fetch origin "$EXPECTED_BRANCH" --quiet 2>/dev/null || _warn "git fetch 실패"
LOCAL_SHA=$(git rev-parse HEAD 2>/dev/null || echo "none")
REMOTE_SHA=$(git rev-parse "origin/${EXPECTED_BRANCH}" 2>/dev/null || echo "none")
if [ "$LOCAL_SHA" = "none" ] || [ "$REMOTE_SHA" = "none" ]; then
  _warn "git SHA 비교 불가"
elif [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  _fail "로컬 HEAD($LOCAL_SHA)와 origin/${EXPECTED_BRANCH}($REMOTE_SHA) 불일치"
else
  _pass "로컬 HEAD == origin/${EXPECTED_BRANCH} ($LOCAL_SHA)"
fi

# ─────────────────────────────────────────────────────────────
# 2. Azure CLI
# ─────────────────────────────────────────────────────────────
step "2/7: Azure CLI 로그인 상태"
if ! az account show -o json >/dev/null 2>&1; then
  _fail "Azure CLI 로그인되어 있지 않음. 'az login' 실행 필요."
else
  AZ_USER=$(az account show --query "user.name" -o tsv 2>/dev/null)
  if [ "$AZ_USER" != "$EXPECTED_AZURE_USER" ]; then
    _fail "Azure 로그인 사용자 '$AZ_USER' ≠ 기대 '$EXPECTED_AZURE_USER'"
  else
    _pass "Azure 로그인: $AZ_USER"
  fi
fi

# ─────────────────────────────────────────────────────────────
# 3. ACR 접근
# ─────────────────────────────────────────────────────────────
step "3/7: ACR 접근"
if ! az acr show --name "$ACR_NAME" -o none 2>/dev/null; then
  _fail "ACR '$ACR_NAME' 접근 불가"
else
  _pass "ACR '$ACR_NAME' 접근 가능"
fi

# ─────────────────────────────────────────────────────────────
# 4. Container App 존재 + FQDN 일치
# ─────────────────────────────────────────────────────────────
step "4/7: Container App 존재 확인"
APP_NAME=$(env_to_app_name "$ENV")
APP_INFO=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" -o json 2>/dev/null || echo "")
if [ -z "$APP_INFO" ]; then
  _fail "Container App '$APP_NAME' 이 '$RESOURCE_GROUP'에 없음"
else
  ACTUAL_FQDN=$(echo "$APP_INFO" | python3 -c "import sys,json;print(json.load(sys.stdin)['properties']['configuration']['ingress']['fqdn'])" 2>/dev/null || echo "unknown")
  EXPECTED_FQDN=$(env_to_fqdn "$ENV")
  if [ "$ACTUAL_FQDN" != "$EXPECTED_FQDN" ]; then
    _fail "FQDN 불일치: 실제 '$ACTUAL_FQDN' ≠ 기대 '$EXPECTED_FQDN'"
  else
    _pass "Container App '$APP_NAME' (FQDN: $EXPECTED_FQDN)"
  fi
fi

# ─────────────────────────────────────────────────────────────
# 5. Docker daemon
# ─────────────────────────────────────────────────────────────
step "5/7: Docker daemon"
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
# 6. Container App API_URL 환경변수 검증 (web 고유)
# ─────────────────────────────────────────────────────────────
step "6/7: API_URL 환경변수 검증"
ACTUAL_API_URL=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.template.containers[0].env[?name=='API_URL'].value" -o tsv 2>/dev/null || echo "")
EXPECTED_API_URL=$(env_to_expected_api_url "$ENV")
if [ -z "$ACTUAL_API_URL" ]; then
  _fail "API_URL 누락. Container App 환경변수 설정 필요."
elif [ "$ACTUAL_API_URL" != "$EXPECTED_API_URL" ]; then
  _warn "API_URL 불일치: 실제 '$ACTUAL_API_URL' ≠ 기대 '$EXPECTED_API_URL'"
else
  _pass "API_URL: $ACTUAL_API_URL"
fi

# NEXT_PUBLIC_RECAPTCHA_SITE_KEY, NEXT_PUBLIC_GOOGLE_CLIENT_ID (런타임에도 쓰임)
REQUIRED_KEYS=("NEXT_PUBLIC_RECAPTCHA_SITE_KEY" "NEXT_PUBLIC_GOOGLE_CLIENT_ID")
ENV_KEYS=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query "properties.template.containers[0].env[].name" -o tsv 2>/dev/null || echo "")
for key in "${REQUIRED_KEYS[@]}"; do
  if echo "$ENV_KEYS" | grep -qw "$key"; then
    _pass "$key 설정됨"
  else
    _fail "$key 누락"
  fi
done

# ─────────────────────────────────────────────────────────────
# 7. prod 추가 검증
# ─────────────────────────────────────────────────────────────
step "7/7: prod 전용 검증"
if [ "$ENV" = "prod" ]; then
  LAST_MSG=$(git log -1 --pretty=format:"%s")
  case "$LAST_MSG" in
    feat:*|fix:*|merge:*|refactor:*|docs:*|chore:*|test:*)
      _pass "커밋 메시지 컨벤션 충족: $LAST_MSG"
      ;;
    *)
      _warn "커밋 메시지 컨벤션 위반: '$LAST_MSG'"
      ;;
  esac

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
