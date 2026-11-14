# 글꼴 서빙·CLS 검토 · 2026-11-14

기존 EB Garamond·Noto Serif KR 서체를 유지한다. Sass의 next/font 자체 서빙·크기 보정과 Candidate의 localFont·선택 preload 구성을 읽고 Grimoire의 혼합 명조 조판과 대조했다. 다른 프로젝트의 코드는 수정하지 않았다.

Noto 124개 WOFF2는 기존 Next 빌드 파일과 SHA256이 같으며 SOURCE.json에 크기·해시·유니코드 범위를 기록한다. OFL 원문도 포함했다. 해시 자산은 자체 출처에서 1년 immutable로 제공한다. CSS는 동일 장기 캐시에 넣지 않는다. 제목·목차에 필요한 조각만 preload한다. Garamond 대체 글꼴의 Latin 크기 보정이 한글에도 적용되던 경로를 제거했다.

Noto는 font-display: optional로 뒤늦은 글꼴 교체를 막는다. 느린 첫 방문은 해당 화면의 시스템 대체 글꼴를 유지할 수 있다. 캐시가 준비된 재방문은 Noto를 사용한다. [Chrome의 preload·optional 동작](https://web.dev/articles/preload-optional-fonts)과 [font-display 정의](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)를 따른다.

탐색·작가·작품 최초 데이터는 서버에서 전달한다. 익명 인증 메뉴·타이핑 제목·원고는 최종 공간을 먼저 예약한다. 같은 서버 렌더의 작가 조회는 React.cache로 공유해 요청 제한에 걸리던 중복 호출을 줄인다. 서버의 요청 제한은 그대로다.

## 실측

설치된 Chrome headless, localhost 실제 2026-05-19 백업 복원 데이터, 높이 1000px. 각 경로는 새 브라우저 컨텍스트의 최초 방문과 같은 컨텍스트의 재방문을 비교했다. document.fonts.ready 후 2초까지 LayoutShift를 수집했다. 최근 입력을 제외한 최대 세션 창 값을 사용한다. 오류 페이지와 카드 미로딩은 결과를 거절한다. 본문 전체 읽기·모든 테마·모든 네트워크·iOS 또는 Safari의 CLS 0을 뜻하지 않는다.

| 너비 | 경로 | 최초 CLS | 재방문 CLS | 가로 넘침 |
| --- | --- | --- | --- | --- |
| 375px | `/explore` | 0 | 0 | 0px |
| 375px | `/deerdevil` | 0 | 0 | 0px |
| 375px | `/deerdevil/deerdevil` | 0 | 0 | 0px |
| 375px | `/deerdevil/deerdevil/ep1` | 0 | 0 | 0px |
| 1440px | `/explore` | 0 | 0 | 0px |
| 1440px | `/deerdevil` | 0 | 0 | 0px |
| 1440px | `/deerdevil/deerdevil` | 0 | 0 | 0px |
| 1440px | `/deerdevil/deerdevil/ep1` | 0 | 0 | 0px |

변경 전 같은 경로·너비·방문 조건에서는 최대 CLS 0.37957953270833333를 관측했다. 서버 초기 데이터와 공간 예약을 포함한 전체 변경의 전후 비교이며 모든 차이를 글꼴 하나의 효과로 해석하지 않는다.

웹 유닛 34파일·289검사와 production 빌드가 통과했다. Docker의 실제 Chrome·Playwright WebKit에서 탐색·작가·본문·로그인·테마·포인트 경로와 본문 대비를 확인했다. WebKit 결과를 실제 Safari 결과로 표시하지 않는다.

Chrome의 실제 그리기 글꼴도 별도 확인했다. 작가 제목4글자는 첫 방문에 Noto2글자·시스템 대체2글자, 재방문에는 Noto4글자로 렌더됐다. 이는 optional의 늦은 교체 생략 동작이며 첫 방문에 모든 조각이 준비된다고 보고하지 않는다.
