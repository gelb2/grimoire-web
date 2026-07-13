# Makefile — grimoire-web 수동 배포 진입점
# 정본: ../grimoire-server/docs/DEPLOY.md
# 2026-07-13 GCP 정합 — Cloud Run + Artifact Registry (server 1ab4eaf 미러)

.PHONY: help preflight deploy-dev deploy-prod logs rollback \
        image-list dev-local test test-e2e build

SHELL := /usr/bin/env bash

# ─────────────────────────────────────────────────────────────
# GCP 정합 상수 (참조용 — 스크립트가 동일 값을 사용)
# ─────────────────────────────────────────────────────────────
GCP_PROJECT_ID := grimoire-491708
GCP_REGION     := asia-northeast1
ARTIFACT_REPO  := asia-northeast1-docker.pkg.dev/$(GCP_PROJECT_ID)/grimoire-docker

help:
	@echo "grimoire-web Makefile — 수동 배포 진입점 (../grimoire-server/docs/DEPLOY.md)"
	@echo ""
	@echo "배포 타겟 (2환경 — 2026-04-19 inhouse 제거, 2026-07-13 GCP 정합):"
	@echo "  make preflight ENV=dev           배포 전수검사만"
	@echo "  make preflight ENV=prod          (interactive 확인 포함)"
	@echo ""
	@echo "  make deploy-dev                  dev 배포"
	@echo "  make deploy-prod                 prod 배포 (interactive 확인 필수)"
	@echo ""
	@echo "운영 타겟 (gcloud 정합):"
	@echo "  make logs ENV=dev                Cloud Run 로그 tail (Ctrl-C로 종료)"
	@echo "  make logs ENV=prod"
	@echo "  make rollback ENV=prod SHA=abc1234...   특정 SHA로 되돌림 (Cloud Run revision 갱신)"
	@echo "  make image-list ENV=dev          Artifact Registry 이미지 태그 목록"
	@echo ""
	@echo "로컬 개발 타겟:"
	@echo "  make test                        Vitest 유닛 테스트"
	@echo "  make test-e2e                    Playwright E2E 테스트"
	@echo "  make build                       Next.js 프로덕션 빌드"
	@echo "  make dev-local                   npm run dev (포트 3001)"

preflight:
	@if [ -z "$(ENV)" ]; then echo "ENV 필수 (dev|prod)"; exit 1; fi
	@bash scripts/preflight.sh $(ENV)

deploy-dev:
	@bash scripts/deploy-dev.sh

deploy-prod:
	@bash scripts/deploy-prod.sh

# ─────────────────────────────────────────────────────────────
# 운영: 로그 (Cloud Run)
# ─────────────────────────────────────────────────────────────
logs:
	@if [ -z "$(ENV)" ]; then echo "ENV 필수 (dev|prod)"; exit 1; fi
	@gcloud run services logs tail grimoire-web-$(ENV) \
		--region $(GCP_REGION) \
		--project $(GCP_PROJECT_ID)

# ─────────────────────────────────────────────────────────────
# 운영: 롤백 (특정 SHA 태그로 Cloud Run revision 갱신)
# 이미지 빌드/푸시 없음. Artifact Registry에 이미 해당 태그가 있어야 함.
# ─────────────────────────────────────────────────────────────
rollback:
	@if [ -z "$(ENV)" ] || [ -z "$(SHA)" ]; then \
		echo "사용: make rollback ENV=prod SHA=<full-sha>"; exit 1; \
	fi
	@echo "▶ ENV=$(ENV) SHA=$(SHA) 로 롤백합니다."
	@TAG="$(ARTIFACT_REPO)/grimoire-web:$(ENV)-$(SHA)"; \
	echo "  이미지 존재 확인: $$TAG"; \
	gcloud artifacts docker images describe $$TAG --project $(GCP_PROJECT_ID) >/dev/null 2>&1 \
		|| { echo "[FAIL] 이미지 없음: $$TAG"; exit 1; }; \
	echo "  Cloud Run revision 갱신 중..."; \
	gcloud run services update grimoire-web-$(ENV) \
		--region $(GCP_REGION) \
		--project $(GCP_PROJECT_ID) \
		--image $$TAG \
		--quiet; \
	echo "[ OK ] 롤백 완료 → $$TAG"

# ─────────────────────────────────────────────────────────────
# 운영: Artifact Registry 이미지 목록 조회
# ─────────────────────────────────────────────────────────────
image-list:
	@if [ -z "$(ENV)" ]; then echo "ENV 필수 (dev|prod)"; exit 1; fi
	@gcloud artifacts docker tags list \
		$(ARTIFACT_REPO)/grimoire-web \
		--project $(GCP_PROJECT_ID) \
		--sort-by="~CREATE_TIME" --limit=30 \
		--format="value(TAG)" | grep "^$(ENV)-" | head -20

test:
	@npm test

test-e2e:
	@npm run test:e2e

build:
	@npm run build

dev-local:
	@npm run dev
