# Makefile — grimoire-web 수동 배포 진입점
# 정본: ../grimoire-server/docs/DEPLOY.md

.PHONY: help preflight deploy-dev deploy-prod logs rollback \
        image-list dev-local test test-e2e build

SHELL := /usr/bin/env bash

help:
	@echo "grimoire-web Makefile — 수동 배포 진입점 (../grimoire-server/docs/DEPLOY.md)"
	@echo ""
	@echo "배포 타겟 (2환경 — 2026-04-19 inhouse 제거):"
	@echo "  make preflight ENV=dev           배포 전수검사만"
	@echo "  make preflight ENV=prod          (interactive 확인 포함)"
	@echo ""
	@echo "  make deploy-dev                  dev 배포"
	@echo "  make deploy-prod                 prod 배포 (interactive 확인 필수)"
	@echo ""
	@echo "운영 타겟:"
	@echo "  make logs ENV=dev                Container App 로그 tail"
	@echo "  make logs ENV=prod"
	@echo "  make rollback ENV=prod SHA=abc1234...   특정 SHA로 되돌림"
	@echo "  make image-list ENV=dev          해당 환경 이미지 태그 목록"
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

logs:
	@if [ -z "$(ENV)" ]; then echo "ENV 필수 (dev|prod)"; exit 1; fi
	@az containerapp logs show \
		--name grimoire-web-$(ENV) \
		--resource-group zenith-rg \
		--follow

rollback:
	@if [ -z "$(ENV)" ] || [ -z "$(SHA)" ]; then \
		echo "사용: make rollback ENV=prod SHA=<full-sha>"; exit 1; \
	fi
	@echo "▶ ENV=$(ENV) SHA=$(SHA) 로 롤백합니다."
	@TAG="grimoireacr.azurecr.io/grimoire-web:$(ENV)-$(SHA)"; \
	echo "  이미지 존재 확인: $$TAG"; \
	az acr repository show --name grimoireacr --image "grimoire-web:$(ENV)-$(SHA)" -o none \
		|| { echo "[FAIL] 이미지 없음: $$TAG"; exit 1; }; \
	echo "  Container App 업데이트 중..."; \
	az containerapp update \
		--name grimoire-web-$(ENV) \
		--resource-group zenith-rg \
		--image $$TAG \
		-o none; \
	echo "[ OK ] 롤백 완료 → $$TAG"

image-list:
	@if [ -z "$(ENV)" ]; then echo "ENV 필수 (dev|prod)"; exit 1; fi
	@az acr repository show-tags \
		--name grimoireacr \
		--repository grimoire-web \
		--orderby time_desc \
		--query "[?starts_with(@, '$(ENV)-')]" \
		-o tsv | head -20

test:
	@npm test

test-e2e:
	@npm run test:e2e

build:
	@npm run build

dev-local:
	@npm run dev
