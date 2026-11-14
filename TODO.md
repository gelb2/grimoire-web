# TODO — grimoire-web


## 공개 준비 후속

- [ ] 자체 소스의 재사용 라이선스를 선택한 뒤 적용한다. MIT 적용안은 준비했으며 원고·외부 자료와 범위를 구분한다. 본인 작성자 정보와 확인된 원고 권한은 추가 진행 차단 항목으로 두지 않는다.
- [ ] 바이너리·Docker 이미지를 외부에 배포할 때 실제 포함한 OS·네이티브 라이브러리의 고지·소스 제공 조건을 확인한다. 현재 npm 운영 의존성의 원문·버전·출처·보충 고지는 THIRD_PARTY_NOTICES.md와 생성 목록을 따른다.
- [ ] 실제 외부 연동과 GCP 배포는 별도 허용 범위에서 검증한다. 미설정·테스트 대역 검사와 구분한다. 현재 공개·push·클라우드 변경·유료 호출·키 유효성 시험은 수행하지 않는다.

Docker 빌드·Compose 기동과 Chrome·Playwright WebKit 18개 화면 검사는 2026-11-14에 통과했다. 소스 전체 유닛은 서버 1,267개, 최신 웹 289개다. 실제 Safari·CLS 측정 범위는 별도 검토 기록을 따른다.

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 단기

- [ ] AI 채팅 스트리밍 SSE
- [ ] 크레딧 개편 — 멤버십 구독 실 결제 연결 (Polar). CC-5(2026-05-22): `/dashboard/membership` 구독 UI 노출 + "준비중" 모달 가드 완료. server 구독 API(`/subscriptions/checkout`·`/membership`)는 prod 라이브. **Polar KYC + 한국 payout 승인 완료 시** `MembershipPage.handleSelect`의 `setComingSoonOpen(true)`를 실 checkout 호출로 교체 + `ComingSoonModal` 제거.
- [ ] 크레딧 개편 — 잔액 4 출처 분해 표시 활성화. `CreditBalanceCard`는 server 가 `bySource`(출처별 잔액) 응답 시 자동 분해 — 현재 server `/credits/balance`는 정수 크레딧만 반환(I Phase backward-compatible). server 가 `CreditLedger.getBalance`를 HTTP 노출하면 추가 작업 없이 동작.
- [ ] 크레딧 개편 — 충전 패키지 #7 4종(입문 ₩3,000 / 기본 ₩5,000 / 인기 ₩10,000 +10% / 베스트 ₩30,000 +15%) 반영. 현재 server `CREDIT_PRODUCTS`는 구 3종(credit-5/20/50) — server config 갱신 후 web 은 자동 반영(`/payments/products` 정본 의존).

### 당시 Claude Code harness 강화 (2026-04-19 도입 필요)

> 상세 마스터 목록: `../grimoire-server/TODO.md` "Claude Code harness 강화" 섹션 참조.

현재 작업은 루트 AGENTS.md와 .agents의 브라우저 스킬을 따른다. 아래는 당시 계획·완료 기록이며 훅·센서·배포를 자동 활성화하는 지시가 아니다.

**web 단독 P0**
- [ ] `grimoire-web/.githooks/pre-push` 설치 — tsc + vitest + build + docs 동기화 검증 (server에는 있으나 web 없음)
- [x] **해소 (2026-05-04 EMAIL-P0-1)** — login/page.tsx에서 "테스트 계정으로 채우기" 버튼 이미 제거됨. broken e2e 테스트 (auth.spec.ts) 삭제 + dashboard.spec.ts 4 위치 `process.env.E2E_AUTHOR_EMAIL` 환경변수화 + .env.example 박제.

**web 공유 참여 (루트 `.claude/` 작업 시 함께)**
- [ ] PostToolUse hook에서 web 파일 `.tsx/.ts` 수정 시 `npx tsc --noEmit` 자동 트리거
- [ ] Skill `claude-in-chrome-recovery` — Chrome MCP extension 미연결 시 3회 재시도 규정
- [ ] Slash command `/dev-login-smoke` — db-sync --mask-pii 회귀 감지

## 중기

- [ ] **F-18 작품별 테마 색상 적용** (defer, 아키텍처 변경 — 전용 스프린트) — resolveTheme 배선은 완료됐으나 색상 미적용. 근본 원인: ThemeProvider 인라인 `--g-*` 변수가 work baked `:root` CSS 를 상속 우선으로 덮어씀 + 렌더 스코프가 `[author]` 레이아웃(work 컨텍스트 부재). 리더 페이지 레벨 국소 주입은 무효/부분적용. 올바른 픽스 = 신설 `[author]/[slug]/layout.tsx` work 테마 재-provide(案 A) + **VCK 사슴악마 불변 검수 선행**. 상세 스펙·위험·코드증거: `reports/F18_THEME_COLOR_BACKLOG.md`. 정책: [[feedback_theme_no_touch]].
- [ ] 커스텀 테마 에디터 고도화 (Color Picker 개별 필드 개선)
- [ ] 플랫폼 페이지 디자인 리뉴얼 — 보류 (섣불리 건드리지 말 것, feedback_readymag_rollback 참조)
- [ ] A24식 Artifacts UI
- [ ] Typography Contract 2차 방어선 — EpisodeViewer h1에 `font-synthesis: none` 정책화. 서버 정규화가 1차 방어이고 이건 보조. 적용 시 순수 한글 제목의 Chrome faux italic이 normal로 변경됨 (디자인 의도 vs 실제 렌더 일관성 결정 필요)

## 참조

- 화면 목록: `SCREENS.md`
- API 명세: `docs/api-contract.md`
- 기획서: 루트 `PLANNING_GRIMOIRE.md`
