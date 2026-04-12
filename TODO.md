# TODO — grimoire-web

> 남은 작업만 기록한다. 완료 항목은 `CHANGELOG.md` 참조.

---

## 단기

### 보안 (2026-04-12 전수검사 결과)
- [ ] npm audit fix --force (Next.js 6개 CVE — HTTP smuggling, CSRF bypass, DoS)
- [ ] web 보안 헤더 확인 — Next.js 측 CSP/HSTS 설정 여부 점검 (서버 Helmet과 별개)
- [ ] CSRF 보호 확인 — Cookie 인증 사용 시 필수

### 결제
- (완료됨 — CHANGELOG 참조)

## 중기 (Phase 2)

- [ ] 커스텀 테마 에디터 고도화 (Color Picker 개별 필드 개선)
- [ ] 플랫폼 페이지 디자인 리뉴얼 (login/explore/dashboard/library)
- [ ] A24식 Artifacts UI

## 장기

- [ ] 관리자 추가 기능 (벌크 작업, CSV 내보내기)

## 참조

- 화면 목록: `SCREENS.md`
- API 명세: `docs/api-contract.md`
- 기획서: 루트 `PLANNING_GRIMOIRE.md`
