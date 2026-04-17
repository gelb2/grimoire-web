#!/usr/bin/env bash
# deploy-inhouse.sh — grimoire-web inhouse 배포
# 정본: grimoire-server/docs/DEPLOY.md §4.2

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"
source "${SCRIPT_DIR}/deploy-common.sh"

ENV="inhouse"
info "=== grimoire-web deploy [$ENV] 시작 ==="

bash "${SCRIPT_DIR}/preflight.sh" "$ENV" || fail "preflight 실패. 배포 중단."

SHA=$(current_sha)
info "배포 대상 SHA: $SHA"

action_acr_login
action_docker_build_push "$ENV" "$SHA"
action_containerapp_update "$ENV" "$SHA"
action_purge_old_images "$ENV"
action_post_deploy_healthcheck "$ENV"

step "배포 완료"
ok "web [$ENV] 배포 성공"
info "  이미지: $(image_fq_sha "$ENV" "$SHA")"
info "  공개 URL: $(env_to_public_url "$ENV")"
