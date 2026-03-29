# TODO — grimoire-web

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 단기 (Phase 1 마무리)

### 디자인 방향 확정 (선행)
- [ ] 레디맥 리서치 → `DESIGN_REFERENCE_READYMAG.md` 작성
- [ ] 디지털 쇼룸 테마 시스템 고도화 방향 확정 (레디맥 리서치 기반)

### 외부 연동
- [ ] Google OAuth 로그인 버튼 UI 추가 (Client ID 발급 완료)
- [ ] 커버이미지 프론트 업로드 UI (서버 100%, Azure Blob 환경변수 필요)
- [ ] 크레딧 충전 UI (PAYAPP 실제 연동, API 키 필요)
- [ ] 테마 Baking 후 CDN CSS 로드

### 테스트
- [ ] EpisodeViewer 유닛테스트 보강 (타이핑 애니메이션 스테이지별 검증)
- [ ] SeriesNav 유닛테스트 (라우팅, 활성 탭)
- [ ] SeriesLanding 유닛테스트 (콘텐츠 필터링/정렬)

## 중기 (Phase 2)

- [ ] 테마 시스템 고도화 구현 (레디맥 리서치 + 디지털 쇼룸 제안 기반)
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
