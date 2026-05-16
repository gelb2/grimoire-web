#!/usr/bin/env bash
# deploy-prod.sh — grimoire-web prod 배포
# 정본: grimoire-server/docs/DEPLOY.md §4.3

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"
source "${SCRIPT_DIR}/deploy-common.sh"

ENV="prod"
info "=== grimoire-web deploy [$ENV] 시작 ==="
warn "이것은 PRODUCTION 배포입니다."

bash "${SCRIPT_DIR}/preflight.sh" "$ENV" || fail "preflight 실패. 배포 중단."

SHA=$(current_sha)
info "배포 대상 SHA: $SHA"

action_acr_login
action_docker_build_push "$ENV" "$SHA"
action_containerapp_update "$ENV" "$SHA"
action_purge_old_images "$ENV"
action_post_deploy_revision_check "$ENV"   # 1차: 신규 revision 상태 직접 검증 (ActivationFailed 차단)
action_post_deploy_healthcheck "$ENV"      # 2차: endpoint 보조 검증

step "배포 완료"
ok "web [$ENV] 배포 성공"
info "  이미지: $(image_fq_sha "$ENV" "$SHA")"
info "  공개 URL: $(env_to_public_url "$ENV")"
