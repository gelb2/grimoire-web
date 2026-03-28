# TODO — grimoire-web

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 코드 정리

- [ ] 전역 리네이밍 (별도 브랜치: features/universe → features/reader, --u-* → --g-*, UniverseNav → SeriesNav 등)

## 테스트

- [ ] EpisodeViewer 유닛테스트 보강 (타이핑 애니메이션 스테이지별 검증)
- [ ] UniverseNav 유닛테스트 (라우팅, 활성 탭) — 리네이밍 후 SeriesNav
- [ ] UniverseLanding 유닛테스트 (콘텐츠 필터링/정렬) — 리네이밍 후 SeriesLanding

## 외부 연동 (자격증명 필요)

- [ ] Google OAuth 실제 연동 (Client ID 필요, 로그인 버튼 UI 추가)
- [ ] 커버이미지 프론트 업로드 UI (Azure Blob — 서버 코드 완성, 환경변수만 필요)
- [ ] 크레딧 충전 UI (PAYAPP 실제 연동)
- [ ] 테마 Baking 후 CDN CSS 로드

## 기타

- [ ] HTML 파서 (최후순위, 서버와 동시)
- [ ] Cloudflare DNS 설정 완료 후 URL 검증

## 장기

- [ ] 크레딧-원화-AI토큰 비용 정밀 계산식 UI

## 참조

- 화면 목록: `SCREENS.md`
- API 명세: `docs/api-contract.md`
- 기획서: 루트 `PLANNING_GRIMOIRE.md`
