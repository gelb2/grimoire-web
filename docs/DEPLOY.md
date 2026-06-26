# DEPLOY.md — 포인터 (정본 아님)

> **정본: `grimoire-server/docs/DEPLOY.md`** (server + web 양측 배포 절차를 한 곳에서 관리).
> 본 web 문서는 **포인터 stub**이다. 배포 매트릭스/스크립트/절차/롤백/환경변수는 정본을 참조할 것.
>
> 문서 피라미드 정책(루트 `CLAUDE.md` §2, `docs/AGENTS.md`)상 동일 내용을 두 레포에 중복 박제하지 않는다.
> 과거 본 문서가 보유하던 전체 배포 절차본(Azure Container Apps 기반)은 2026-06-27 문서 감사에서
> ① 정본/STALE 자가모순(L5 "정본: 이 문서" ↔ STALE 경고) ② 2026-05-27 GCP 마이그레이션 후 stale 중복
> 두 사유로 제거하고 정본 포인터로 일원화했다.

---

## 현역 인프라 (요약 — 상세는 정본)

- **배포 대상**: GCP Cloud Run (`asia-northeast1`) — 2026-05-27 Azure → GCP 마이그레이션 완료.
- **Azure**: 2026-06-04 `zenith-rg` 전체 삭제로 완전 decommission. 현역 인프라 = GCP 단독.
- **이미지**: Artifact Registry `grimoire-docker` repo + `{prefix}-{SHA}` 명시 태그.
- **DB**: Cloud SQL (Auth Proxy Unix socket).
- **시크릿**: Secret Manager (`{name}-{env}-an1` 패턴).
- **수동 배포**: `make deploy-dev` / `make deploy-prod` (GitHub Actions 자동배포 차단 — `memory/feedback_manual_deploy_primary.md`).

> 환경 매트릭스(URL/브랜치/도메인), 배포 스크립트 구조(`scripts/deploy-common.sh` 등),
> preflight 전수검사, 롤백, 환경변수 추가/변경, Polar 주의사항, Docker credsStore 세팅 등
> **모든 절차는 정본 `grimoire-server/docs/DEPLOY.md`에만 존재**한다.

---

## 참조 문서

| 문서 | 내용 |
|------|------|
| **`grimoire-server/docs/DEPLOY.md`** | **배포 절차 정본** (GCP 갱신본) |
| `grimoire-server/docs/INFRASTRUCTURE.md` | 인프라 구성 정본 (Cloud Run/Cloud SQL/GCS/Secret Manager) |
| `docs/environments.md` | 환경 매트릭스 (정본: grimoire-server) |
