# TECH_STATUS.md — grimoire-web

> 현재 구현 상태 + 서버-웹 싱크 현황.
> 코드 변경 시 이 문서를 업데이트한다.

---

## 1. 현재 버전

**v0.10.0** — 멀티테넌트 작가 공간 + 대시보드 + 독자 기능 구현

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
| 크레딧 | `/dashboard/credits` | UI 완료, 결제 미연동 | getProducts, getCredits (결제 버튼 비활성) |
| 프로필 편집 | `/dashboard/profile` | 구현 완료 | updateBio |
| 관리자 | `/admin` | 구현 완료 | getAdminStats, adminGrantCredits |

---

## 3. 서버-웹 싱크 갭

> 서버 API는 구현됐으나 웹에 연결되지 않은 기능들.

| 서버 기능 | 웹 상태 | 비고 |
|-----------|---------|------|
| **좋아요** (toggleLike, getLikeCount) | api.ts에 메서드 있음, UI 없음 | 에피소드 뷰어에 좋아요 버튼 필요 |
| **댓글** (createComment, getComments, deleteComment) | api.ts에 메서드 있음, UI 없음 | 에피소드 뷰어에 댓글 섹션 필요 |
| **북마크** (toggleBookmark, saveProgress, getProgress) | api.ts 있음, 에피소드 뷰어에서 미사용 | 뷰어 내 북마크 버튼 연결 필요 |
| **커버 이미지 업로드** | api.ts 없음, UI 없음 | 서버 100% 완료, 프론트 미구현 |
| **결제 시작** (createPayment/PAYAPP) | 버튼 비활성, initiatePayment 주석 | PAYAPP API 키 발급 후 연동 필요 |
| **Analysis (RAG 일관성 체크)** | api.ts 없음, UI 없음 | 대시보드에 분석 탭 필요 |
| **크레딧 선물** (giftCredits) | api.ts에 메서드 있음, UI 없음 | 작가 프로필에서 선물 버튼 필요 |

---

## 4. API 클라이언트 커버리지 (`src/lib/api.ts`)

서버 API 카테고리 대비 api.ts 메서드 구현 현황:

| 카테고리 | api.ts 메서드 | 페이지 연결 |
|----------|--------------|------------|
| Auth | register, login, logout, getProfile, googleLogin | ✅ 전체 사용 |
| Theme | getTheme, generateTheme, updateTheme, publishTheme, getMyThemes | ✅ 전체 사용 |
| Author | getAuthorSpace, getAuthorProfile, updateBio | ✅ 전체 사용 |
| Work Management | createWork, updateWork, deleteWork, createEpisode, deleteEpisode | ✅ 전체 사용 |
| Content | getWork, getEpisode | ✅ 전체 사용 |
| Manuscript | parseManuscript | ✅ 업로드 페이지에서 사용 (파일 업로드 UI 미구현) |
| Reader | toggleBookmark, getBookmarks, saveProgress, getProgress | ⚠️ 메서드 있음, 에피소드 뷰어 미연결 |
| Discovery | searchAuthors, getPopular/Recent, getMostGiftedAuthors | ✅ explore에서 사용 |
| Social (좋아요/댓글) | toggleLike, getLikeCount, createComment, getComments, deleteComment | ⚠️ 메서드 있음, UI 없음 |
| Social (구독) | toggleSubscription, getSubscriptions, getSubscriberCount | ✅ 프로필 페이지에서 사용 |
| Payment | getProducts, getCredits, giftCredits | ⚠️ 결제 시작 미연동, giftCredits UI 없음 |
| Admin | getAdminStats, adminGrantCredits | ✅ admin 페이지에서 사용 |
| **Analysis** | **없음** | ❌ 미구현 |

---

## 5. 테스트

- 테스트 수: `npm test` 실행으로 확인
- E2E 테스트: `npm run test:e2e` 실행으로 확인
- 커버리지: `npm run test:coverage` (목표 55%)
- 전략: `TESTING.md` 참조

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

우선순위 순:
1. 커버 이미지 업로드 UI (Azure Blob 환경변수 필요)
2. 에피소드 뷰어: 좋아요 + 북마크 버튼 연결
3. 에피소드 뷰어: 댓글 섹션 UI
4. 크레딧 선물 UI (작가 프로필)
5. 결제 UI 활성화 (PAYAPP API 키 발급 후)
6. Analysis UI (대시보드 분석 탭)
7. 플랫폼 페이지 레디맥 디자인 적용

---

## 8. 참조 문서

- `docs/api-contract.md` — 서버 API 명세 (정본)
- `SCREENS.md` — 화면/컴포넌트 카탈로그
- `TODO.md` — 남은 작업
- `TESTING.md` — 테스트 전략
- `DESIGN.md` — UI 디자인 시스템
