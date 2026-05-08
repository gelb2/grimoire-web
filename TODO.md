# TODO — grimoire-web

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 단기

- [ ] AI 채팅 스트리밍 SSE

### Claude Code harness 강화 (2026-04-19 도입 필요)

> 상세 마스터 목록: `../grimoire-server/TODO.md` "Claude Code harness 강화" 섹션 참조.

**web 단독 P0**
- [ ] `grimoire-web/.githooks/pre-push` 설치 — tsc + vitest + build + docs 동기화 검증 (server에는 있으나 web 없음)
- [x] **해소 (2026-05-04 EMAIL-P0-1)** — login/page.tsx에서 "테스트 계정으로 채우기" 버튼 이미 제거됨. broken e2e 테스트 (auth.spec.ts) 삭제 + dashboard.spec.ts 4 위치 `process.env.E2E_AUTHOR_EMAIL` 환경변수화 + .env.example 박제.

**web 공유 참여 (루트 `.claude/` 작업 시 함께)**
- [ ] PostToolUse hook에서 web 파일 `.tsx/.ts` 수정 시 `npx tsc --noEmit` 자동 트리거
- [ ] Skill `claude-in-chrome-recovery` — Chrome MCP extension 미연결 시 3회 재시도 규정
- [ ] Slash command `/dev-login-smoke` — db-sync --mask-pii 회귀 감지

## 중기

- [ ] 커스텀 테마 에디터 고도화 (Color Picker 개별 필드 개선)
- [ ] 플랫폼 페이지 디자인 리뉴얼 — 보류 (섣불리 건드리지 말 것, feedback_readymag_rollback 참조)
- [ ] A24식 Artifacts UI
- [ ] Typography Contract 2차 방어선 — EpisodeViewer h1에 `font-synthesis: none` 정책화. 서버 정규화가 1차 방어이고 이건 보조. 적용 시 순수 한글 제목의 Chrome faux italic이 normal로 변경됨 (디자인 의도 vs 실제 렌더 일관성 결정 필요)

## 참조

- 화면 목록: `SCREENS.md`
- API 명세: `docs/api-contract.md`
- 기획서: 루트 `PLANNING_GRIMOIRE.md`
