#!/usr/bin/env bash
# deploy-dev.sh — grimoire-web dev 환경 배포 (GCP Cloud Run)
# 정본: grimoire-server/docs/DEPLOY.md §4.1
# 2026-07-13 GCP 전환 — action 함수가 gcloud(Artifact Registry + Cloud Run) 기반 (server 1ab4eaf 미러).

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"   # grimoire-web/ 루트로 이동
source "${SCRIPT_DIR}/deploy-common.sh"

ENV="dev"
info "=== grimoire-web deploy [$ENV] 시작 ==="

bash "${SCRIPT_DIR}/preflight.sh" "$ENV" || fail "preflight 실패. 배포 중단."

SHA=$(current_sha)
info "배포 대상 SHA: $SHA"

action_acr_login                           # gcloud auth configure-docker (구 az acr login)
action_docker_build_push "$ENV" "$SHA"     # NEXT_PUBLIC_* build-arg 인라인 (dev 값)
action_containerapp_update "$ENV" "$SHA"   # gcloud run deploy --image (구 az containerapp update)
action_purge_old_images "$ENV"
action_post_deploy_revision_check "$ENV"   # 1차: 신규 revision Ready 직접 검증 (startup 실패 차단)
action_post_deploy_healthcheck "$ENV"      # 2차: endpoint 보조 검증

step "배포 완료"
ok "web [$ENV] 배포 성공"
info "  이미지: $(image_fq_sha "$ENV" "$SHA")"
info "  공개 URL: $(env_to_public_url "$ENV")"
