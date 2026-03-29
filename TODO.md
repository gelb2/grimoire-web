# TODO — grimoire-web

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 단기 (다음 우선순위)

### 외부 연동
- [ ] 커버이미지 프론트 업로드 UI (서버 100%, Azure Blob 환경변수 필요)
- [ ] 크레딧 충전 UI (PAYAPP 실제 연동, API 키 필요)
- [ ] 테마 Baking 후 CDN CSS 로드

### 테스트
- [ ] EpisodeViewer 유닛테스트 보강 (타이핑 애니메이션 스테이지별 검증)
- [ ] SeriesNav 유닛테스트 (라우팅, 활성 탭)
- [ ] SeriesLanding 유닛테스트 (콘텐츠 필터링/정렬)

### 디자인 개선 (deferred)
- [ ] 플랫폼 페이지 레디맥 디자인 적용 (login, explore, dashboard, library)
- [ ] 테마 에디터 미리보기 — 레이아웃 변경 실시간 반영

## 중기 (Phase 2)

- [ ] AuthorSpace 레이아웃 컴포넌트 리팩토링 (gallery/magazine/minimal 분리)
- [ ] A24식 Artifacts 데이터 모델 + UI
- [ ] 시멘틱 캐싱 프론트 연동

## 장기

- [ ] 크레딧-원화-AI토큰 비용 정밀 계산식 UI
- [ ] HTML 파서 (최후순위, 서버와 동시)

## 참조

- 화면 목록: `SCREENS.md`
- API 명세: `docs/api-contract.md`
- 기획서: 루트 `PLANNING_GRIMOIRE.md`
- 디지털 쇼룸 제안: 루트 `PROPOSAL_DIGITAL_SHOWROOM.md`
