#!/usr/bin/env bash
# deploy-common.sh — grimoire-web 배포 공통 상수/함수
# 정본: grimoire-server/docs/DEPLOY.md §1 (server 정본, web 복사본)

set -u

# ─────────────────────────────────────────────────────────────
# 공통 상수 (매트릭스)
# ─────────────────────────────────────────────────────────────
readonly RESOURCE_GROUP="zenith-rg"
readonly ACR_NAME="grimoireacr"
readonly ACR_LOGIN_SERVER="grimoireacr.azurecr.io"
readonly IMAGE_REPO="grimoire-web"
readonly BUILD_PLATFORM="linux/amd64"
readonly FQDN_SUFFIX="salmonsmoke-9e462011.koreacentral.azurecontainerapps.io"
readonly IMAGE_KEEP_COUNT=5
readonly EXPECTED_AZURE_USER="rainmaker8492@gmail.com"

# build-arg 상수 (환경 무관)
readonly RECAPTCHA_SITE_KEY="6Ldxb6QsAAAAABTyABs61_Bzhi6iwrAQiqRbbXaJ"
readonly GOOGLE_CLIENT_ID="23295981916-30pl52bdf3k008k9gmsf9fpufinnpk4o.apps.googleusercontent.com"

# ─────────────────────────────────────────────────────────────
# 색상 출력
# ─────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  readonly C_RED=$'\033[0;31m'
  readonly C_GREEN=$'\033[0;32m'
  readonly C_YELLOW=$'\033[0;33m'
  readonly C_BLUE=$'\033[0;34m'
  readonly C_BOLD=$'\033[1m'
  readonly C_OFF=$'\033[0m'
else
  readonly C_RED=""; readonly C_GREEN=""; readonly C_YELLOW=""; readonly C_BLUE=""; readonly C_BOLD=""; readonly C_OFF=""
fi

info() { printf "%s[INFO]%s %s\n" "$C_BLUE" "$C_OFF" "$*"; }
ok()   { printf "%s[ OK ]%s %s\n" "$C_GREEN" "$C_OFF" "$*"; }
warn() { printf "%s[WARN]%s %s\n" "$C_YELLOW" "$C_OFF" "$*" >&2; }
fail() { printf "%s[FAIL]%s %s\n" "$C_RED" "$C_OFF" "$*" >&2; exit 1; }
step() { printf "\n%s▶ %s%s\n" "$C_BOLD" "$*" "$C_OFF"; }

# ─────────────────────────────────────────────────────────────
# 환경 매트릭스
# ─────────────────────────────────────────────────────────────
validate_env() {
  case "${1:-}" in
    dev|inhouse|prod) return 0 ;;
    *) fail "ENV must be one of: dev, inhouse, prod (got: '${1:-}')" ;;
  esac
}

env_to_branch() {
  case "$1" in
    dev) echo "develop" ;;
    inhouse) echo "inhouse" ;;
    prod) echo "main" ;;
    *) return 1 ;;
  esac
}

env_to_app_name() {
  case "$1" in
    dev) echo "grimoire-web-dev" ;;
    inhouse) echo "grimoire-web-inhouse" ;;
    prod) echo "grimoire-web-prod" ;;
    *) return 1 ;;
  esac
}

env_to_fqdn() {
  case "$1" in
    dev) echo "grimoire-web-dev.${FQDN_SUFFIX}" ;;
    inhouse) echo "grimoire-web-inhouse.${FQDN_SUFFIX}" ;;
    prod) echo "grimoire-web-prod.${FQDN_SUFFIX}" ;;
    *) return 1 ;;
  esac
}

env_to_public_url() {
  case "$1" in
    dev) echo "https://dev.grimoire-book.com" ;;
    inhouse) echo "https://inhouse.grimoire-book.com" ;;
    prod) echo "https://grimoire-book.com" ;;
    *) return 1 ;;
  esac
}

# web 전용: NEXT_PUBLIC_APP_ENV 빌드 인자 값
# dev → development, inhouse → inhouse, prod → production
env_to_app_env_buildarg() {
  case "$1" in
    dev) echo "development" ;;
    inhouse) echo "inhouse" ;;
    prod) echo "production" ;;
    *) return 1 ;;
  esac
}

env_to_tag_prefix() {
  case "$1" in
    dev) echo "dev" ;;
    inhouse) echo "inhouse" ;;
    prod) echo "prod" ;;
    *) return 1 ;;
  esac
}

# 기대되는 API_URL (Container App 환경변수와 일치해야 함)
env_to_expected_api_url() {
  case "$1" in
    dev) echo "https://grimoire-server-dev.${FQDN_SUFFIX}/api" ;;
    inhouse) echo "https://grimoire-server-inhouse.${FQDN_SUFFIX}/api" ;;
    prod) echo "https://grimoire-server-prod.${FQDN_SUFFIX}/api" ;;
    *) return 1 ;;
  esac
}

# ─────────────────────────────────────────────────────────────
# 헬퍼
# ─────────────────────────────────────────────────────────────
current_sha() {
  git rev-parse HEAD
}

current_branch() {
  git rev-parse --abbrev-ref HEAD
}

print_matrix() {
  local env="$1"
  info "대상 환경: $env"
  info "  브랜치:             $(env_to_branch "$env")"
  info "  Container App:       $(env_to_app_name "$env")"
  info "  FQDN:               https://$(env_to_fqdn "$env")"
  info "  공개 URL:           $(env_to_public_url "$env")"
  info "  빌드 APP_ENV:        $(env_to_app_env_buildarg "$env")"
  info "  기대 API_URL:        $(env_to_expected_api_url "$env")"
  info "  태그 prefix:         $(env_to_tag_prefix "$env")-"
}

image_fq_sha() {
  local env="$1" sha="$2"
  echo "${ACR_LOGIN_SERVER}/${IMAGE_REPO}:$(env_to_tag_prefix "$env")-${sha}"
}

image_fq_latest() {
  local env="$1"
  echo "${ACR_LOGIN_SERVER}/${IMAGE_REPO}:$(env_to_tag_prefix "$env")-latest"
}

# ─────────────────────────────────────────────────────────────
# 배포 액션
# ─────────────────────────────────────────────────────────────
action_acr_login() {
  step "ACR 로그인"
  az acr login --name "$ACR_NAME" >/dev/null 2>&1 || fail "ACR 로그인 실패. 'az login' 후 재시도."
  ok "ACR 로그인 완료"
}

action_docker_build_push() {
  local env="$1" sha="$2"
  local tag_sha tag_latest app_env
  tag_sha="$(image_fq_sha "$env" "$sha")"
  tag_latest="$(image_fq_latest "$env")"
  app_env="$(env_to_app_env_buildarg "$env")"

  step "Docker 이미지 빌드 (platform=$BUILD_PLATFORM)"
  info "  태그: $tag_sha"
  info "  태그: $tag_latest"
  info "  build-arg NEXT_PUBLIC_APP_ENV=$app_env"
  info "  build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=(hidden)"
  info "  build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=(hidden)"

  docker build --platform "$BUILD_PLATFORM" \
    --build-arg "NEXT_PUBLIC_APP_ENV=${app_env}" \
    --build-arg "NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${RECAPTCHA_SITE_KEY}" \
    --build-arg "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
    -t "$tag_sha" \
    -t "$tag_latest" \
    . || fail "docker build 실패"
  ok "빌드 완료"

  step "이미지 푸시"
  docker push "$tag_sha" || fail "docker push ($tag_sha) 실패"
  docker push "$tag_latest" || fail "docker push ($tag_latest) 실패"
  ok "푸시 완료"
}

action_containerapp_update() {
  local env="$1" sha="$2"
  local app tag_sha
  app="$(env_to_app_name "$env")"
  tag_sha="$(image_fq_sha "$env" "$sha")"

  step "Container App 업데이트: $app"
  info "  이미지: $tag_sha"
  az containerapp update \
    --name "$app" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$tag_sha" \
    -o none || fail "Container App 업데이트 실패"
  ok "업데이트 완료"
}

action_purge_old_images() {
  local env="$1"
  local prefix
  prefix="$(env_to_tag_prefix "$env")-"

  step "오래된 이미지 정리 ($prefix 최근 $IMAGE_KEEP_COUNT 개만 유지)"
  local tags total_count delete_count
  tags=$(az acr repository show-tags \
    --name "$ACR_NAME" \
    --repository "$IMAGE_REPO" \
    --orderby time_asc \
    --query "[?starts_with(@, '${prefix}') && @!='${prefix}latest']" \
    -o tsv 2>/dev/null || echo "")

  if [ -z "$tags" ]; then
    info "  태그 없음. 스킵."
    return 0
  fi

  total_count=$(printf "%s\n" "$tags" | wc -l | tr -d ' ')
  delete_count=$((total_count - IMAGE_KEEP_COUNT))

  if [ "$delete_count" -le 0 ]; then
    info "  유지 개수 이하 ($total_count / $IMAGE_KEEP_COUNT). 스킵."
    return 0
  fi

  info "  $delete_count 개 삭제 예정 (전체 $total_count 개)"
  printf "%s\n" "$tags" | head -n "$delete_count" | while read -r TAG; do
    [ -z "$TAG" ] && continue
    info "  삭제: $TAG"
    az acr repository delete \
      --name "$ACR_NAME" \
      --image "${IMAGE_REPO}:${TAG}" \
      --yes >/dev/null 2>&1 || warn "삭제 실패: $TAG"
  done
  ok "정리 완료"
}

action_post_deploy_healthcheck() {
  local env="$1"
  local fqdn
  fqdn="$(env_to_fqdn "$env")"

  step "Healthcheck (Container App 직접)"
  local url="https://${fqdn}/"
  info "  GET $url"

  local i=0 status=""
  while [ "$i" -lt 12 ]; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    case "$status" in
      200|302|301)
        ok "$status ($(date +%H:%M:%S))"
        return 0
        ;;
    esac
    info "  상태: $status. 5초 후 재시도 ($((i+1))/12)"
    sleep 5
    i=$((i+1))
  done
  fail "Healthcheck 실패 (최종 상태: $status)"
}
