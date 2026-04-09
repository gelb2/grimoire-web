# TODO — grimoire-web

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 단기 (다음 우선순위)

### 외부 연동
- [x] ~~크레딧 충전 UI (Polar hosted checkout 리다이렉트)~~ (v0.24.0)
- [ ] 결제 성공/실패 후 토스트 UI 개선 (현재 단순 alert)
- [ ] 테마 Baking 후 CDN CSS 로드
- [ ] Azure Blob Storage 커버 이미지 실제 저장 (환경변수 필요)

### 본문 렌더링
- [ ] 본문 크기 독립 제어 — 에피소드 뷰어 본문 폰트 크기를 테마/사용자 설정으로 분리

---

## 중기 (Phase 2)

- [ ] A24식 Artifacts 데이터 모델 + UI
- [ ] React hydration 경고 (#418) — SSR/CSR 불일치 정리
- [ ] 플랫폼 페이지 디자인 리뉴얼 (login, explore, dashboard, library) — 레퍼런스 리서치 선행 필요

## 장기

- [ ] 크레딧-원화-AI토큰 비용 정밀 계산식 UI

## 참조

- 화면 목록: `SCREENS.md`
- API 명세: `docs/api-contract.md`
- 기획서: 루트 `PLANNING_GRIMOIRE.md`
