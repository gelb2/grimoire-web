# TECH_STATUS.md — grimoire-web

> 현재 구현 상태 + 서버-웹 싱크 현황.
> 코드 변경 시 이 문서를 업데이트한다.

---

## 1. 현재 버전

최신 버전은 `CHANGELOG.md` 참조.

---

## 2. 화면 구현 상태

| 페이지 | 라우트 | 상태 | 연결된 API |
|--------|--------|------|-----------|
| 루트 랜딩 | `/` | 구현 완료 | - |
| 로그인 | `/login` | 구현 완료 | login, googleLogin |
| 회원가입 | `/register` | 구현 완료 | register |
| 작가 공간 | `/[author]` | 구현 완료 | getAuthorSpace, getTheme |
| 작가 프로필 | `/[author]/profile` | 구현 완료 | getAuthorProfile, toggleSubscription |
| 작품 목록 | `/[author]/[slug]` | 구현 완료 | getWork |
| 에피소드 뷰어 | `/[author]/[slug]/[episode]` | 구현 완료 | getEpisode, getAuthorSpace, getWork |
| 탐색 | `/explore` | 구현 완료 | getPopularWorksPaginated, getRecentWorksPaginated, getMostGiftedAuthors, searchAuthors |
| 서재 | `/library` | 구현 완료 | getLibrary, getBookmarks |
| 대시보드 홈 | `/dashboard` | 구현 완료 | getProfile, getWorkStats |
| 테마 에디터 | `/dashboard/theme` | 구현 완료 | getMyThemes, generateTheme, updateTheme, publishTheme |
| 원고 업로드 | `/dashboard/upload` | 구현 완료 | createWork, createEpisode, parseManuscript |
| 크레딧 | `/dashboard/credits` | 구현 완료 | getProducts, initiatePayment (Polar checkout) |
| 프로필 편집 | `/dashboard/profile` | 구현 완료 | updateBio |
| AI 채팅 | `/dashboard/chat` | 구현 완료 | listChatSessions, createChatSession, sendChatMessage, getChatMessages |
| 관리자 로그인 | `/admin/login` | 구현 완료 | adminLogin (독립 인증, reCAPTCHA 없음) |
| 관리자 패널 | `/admin` | 구현 완료 | 통계/사용자/콘텐츠/제재/신고/댓글/결제/접근로그/설정/감사로그 |

---

> 서버-웹 싱크 갭: 루트 `SYNC_STATUS.md` 참조

---

## 3. API 클라이언트 커버리지 (`src/lib/api.ts`)

| 카테고리 | 페이지 연결 |
|----------|------------|
| Auth | ✅ 전체 사용 |
| Theme | ✅ 전체 사용 |
| Author | ✅ 전체 사용 |
| Work Management | ✅ 전체 사용 |
| Content | ✅ 전체 사용 |
| Manuscript | ✅ 업로드 페이지에서 사용 |
| Reader (북마크/진행도) | ✅ EpisodeFooter에서 사용 |
| Discovery | ✅ explore에서 사용 |
| Social (좋아요/댓글) | ✅ EpisodeFooter에서 사용 |
| Social (구독) | ✅ 프로필 페이지에서 사용 |
| Payment (Polar) | ✅ 결제 페이지에서 사용 (KYC 전 test mode) |
| Admin | ✅ 관리자 패널 전체 탭에서 사용 (엔드포인트 수는 `docs/api-contract.md` 참조) |
| **Analysis** | ❌ api.ts 미구현 (Phase 5 대기) |

---

## 5. 테스트

- 유닛 테스트: `npm test` 실행으로 확인 (하드코딩 금지)
- E2E 테스트: `npm run test:e2e` 실행으로 확인 (admin 포함)
- 커버리지: `npm run test:coverage` (목표 55%)

---

## 6. 배포 현황

| 환경 | 상태 | URL |
|------|------|-----|
| localhost | 로컬 개발 | localhost:3001 |
| development | 배포 완료 | dev.grimoire-book.com |
| inhouse | 배포 완료 | inhouse.grimoire-book.com |
| production | 배포 완료 | grimoire-book.com |

---

## 7. 다음 단계

1. Analysis UI (대시보드 분석 탭) — Phase 5
2. 플랫폼 페이지 디자인 리뉴얼 (레디맥 참고)
3. AI 채팅 스트리밍 (SSE)

---

## 8. 참조 문서

- 루트 `SYNC_STATUS.md` — 서버-웹 연결 현황 + 갭 (정본)
- `docs/api-contract.md` — 서버 API 명세 (정본)
- `SCREENS.md` — 화면/컴포넌트 카탈로그
- `TODO.md` — 남은 작업
- `TESTING.md` — 테스트 전략
- `DESIGN.md` — UI 디자인 시스템
