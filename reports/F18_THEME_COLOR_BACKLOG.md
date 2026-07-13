# F-18 작품별 테마 **색상** 적용 — 백로그 스펙 (DEFER 판정)

> 작성: 2026-07-13 · 브랜치 `fix/followup-web` · 판정 **(b) 아키텍처 변경 필요 → defer**
> 정책 근거: [[feedback_theme_no_touch]] "테마 섣불리 못 건드림" + CRITICAL "사슴악마 시각 정본, VCK 없는 시각 컴포넌트 추가 금지"

---

## 1. 배경 — F-18 이 남긴 것

- **배선 완료**: `api.resolveTheme(author, work?)`(`src/lib/api.ts:133` → server `GET /api/themes/resolve/:authorSlug?work=`) + `episodeListLayout` resolve. 작품에 슬롯 배정된 테마가 있으면 그 테마를, 없으면 작가 기본 테마를 반환(work 미지정/미배정 시 작가 기본과 동일 = 회귀 0).
- **미적용(백로그)**: 작품별 **색상**. 직전(`c5e90c8`)에서 리더 페이지의 `resolveTheme`/`getThemeLayout` 콜은 **죽은 코드(dead-var)** 로 판명돼 철회됨(회귀 가드 `[episode]/theme-resolve-removed.test.ts`). 색상이 적용되지 않는 근본 원인은 **테마 렌더 스코프**에 있다(아래 §2).

---

## 2. (a) 국소·안전 픽스가 **불가능**한 코드 근거

작품별 색상을 "리더 페이지 레벨에서 CSS 주입"으로 넣는 (a) 접근은 **무효**다. 근거:

### 2-1. 색상 정본 = ThemeProvider 인라인 CSS 변수 (baked CSS 아님)
- server `theme-baker.ts:145` 는 baked CSS 를 **`:root { --g-bg: …; --g-text: …; }`** 형태로 굽는다.
- 그러나 `src/features/theme/ThemeProvider.tsx:40-77` 은 **동일한 `--g-*` 변수를 `<div style={{…}}>` 인라인**으로 다시 설정한다(작가 테마).
- CSS 커스텀 프로퍼티는 **상속(inherited)** 속성이다. 후손 요소의 `var(--g-bg)` 는 **가장 가까운 조상**의 값으로 해석된다. ThemeProvider `<div>`(인라인) 는 `:root` 보다 가까운 조상이므로 — **ThemeProvider 인라인 변수가 baked `:root` 변수를 항상 이긴다**.
- 결과: 리더 콘텐츠(`{children}` = `[slug]`·`[episode]`)에 work-level baked CSS `<link>` 를 추가 주입해도(`:root` 대상), 그 위를 덮는 author-level ThemeProvider 인라인 변수 때문에 **색상이 반영되지 않는다**. `:root { … !important }` 도 무효 — `!important` 는 :root 요소 *내* 경쟁 선언을 가릴 뿐, 더 가까운 조상의 상속 값을 뒤집지 못한다.

### 2-2. 렌더 스코프 = `[author]` 레이아웃 (work 컨텍스트 부재)
- `src/app/[author]/layout.tsx` 가 **모든** 하위(`[slug]`·`[episode]`)를 단일 author `ThemeProvider` + author `bakedCssUrl <link>`(L151) + author `html,body` 배경 인라인 `<style>`(L154) + `<meta theme-color>`(L153) 로 감싼다.
- 이 레이아웃의 `params` 는 **`{ author }` 뿐** — Next.js App Router 레이아웃은 하위 세그먼트(`slug`)의 param 에 접근할 수 없다. 즉 layout 단계에서 work 테마를 알 수 없다.
- work 슬러그가 있는 세그먼트(`[slug]`·`[episode]`)는 이미 author ThemeProvider **안**이다. 여기서 색상을 바꾸려면 §2-1 때문에 ThemeProvider 자체를 바꾸거나 새 스코프를 도입해야 한다.

### 2-3. 부분 주입도 불가 — 6개 표면이 author 스코프에 묶임
work 색상을 온전히 적용하려면 다음이 **동시에** work 값으로 바뀌어야 한다(하나라도 author 로 남으면 시각 불일치 = 버그):
1. ThemeProvider 인라인 `--g-*` 변수 (색상 코어)
2. ThemeProvider `<div>` 자신의 `backgroundColor`/`color` (변수 아닌 실제 속성)
3. `html,body` 배경 인라인 `<style>` (레이아웃 — 스크롤/safe-area 여백)
4. `<meta theme-color>` (모바일 status bar)
5. `useTheme()` 컨텍스트 값 — EpisodeViewer/ChapterBlock/장식/타이핑 이펙트가 **JS 로 읽는 테마**. CSS 만 work 로 바뀌고 컨텍스트는 author 면 JS-구동 렌더가 어긋난다.
6. `SeriesNav` (레이아웃 — author 스코프. work 별로 바꿀지 자체가 시각 결정사항).

→ 리더 페이지 레벨의 국소 CSS 주입으로는 3·4·6 을 못 건드리고, 5(`useTheme`)는 여전히 author 를 반환한다. **부분 적용 = 사슴악마 회귀 위험**.

---

## 3. 올바른 픽스에 **필요한 정확한 변경** (아키텍처)

work subtree 에 work 테마를 �“주입”하려면 렌더 스코프를 work 경계로 내려야 한다. 두 후보:

### 案 A — 신설 `[author]/[slug]/layout.tsx` 에서 work 테마 재-provide (중첩)
- `params: { author, slug }` 를 갖는 새 레이아웃 생성 → `api.resolveTheme(author, slug)` 로 work 테마 + work `bakedCssUrl` 로드 → work `ThemeProvider` + work `bakedCssUrl <link>` + work `html,body` `<style>` 로 `{children}` 재-wrap.
- **효과**: 내부(work) ThemeProvider 인라인 변수가 외부(author) 를 §2-1 원리로 덮어씀 → CSS 변수·`useTheme()` 둘 다 work 로 정합.
- **비용/위험**:
  - author ThemeProvider **안에** 두 번째 ThemeProvider 중첩(`min-h-dvh <div>` 이중). 레이아웃 회귀 점검 필요.
  - `html,body`/`<meta>` 는 head 싱글턴 — 후행 `<style>`/`<meta>` 가 이기지만 DOM 순서 의존, 취약.
  - `SeriesNav` 는 author 레이아웃에 남아 author 색 유지(work 색 콘텐츠 위 author 색 네비) — **시각 결정 + VCK 필수**.
  - **사슴악마 회귀**: work 테마 미배정 공간(사슴악마 등)도 이 레이아웃을 타면 `resolveTheme` 네트워크콜 1회 + 중첩 div + 중복 `bakedCssUrl <link>`(동일 URL) 추가 → 값은 같아도 렌더 부작용 0 보장 필요. **VCK 스크린샷 대조 필수**.

### 案 B — `[author]/layout.tsx` 를 테마 non-provider 로 바꾸고 provision 을 하위로 이동
- 레이아웃은 nav/shell 만, 테마 provision 은 `[author]/page.tsx`(작가 랜딩=작가 기본) + `[slug]` subtree(work) 가 각자 담당.
- **위험 최상** — 정본 레이아웃 골격을 재구성. `[[feedback_theme_no_touch]]` 정면 충돌. 전 화면 회귀. **비권장**.

---

## 4. 판정 및 권장

- **판정: (b) — 아키텍처 변경 필요 → 이번 스프린트 구현 보류(defer).** 어떤 (a) 국소 픽스도 §2-1(인라인 변수 우선) 때문에 **무효이거나 부분적용(회귀 위험)** 이다. 억지 구현 금지 원칙 + 테마 미접촉 정책상 defer 가 정답.
- **권장 접근(차기 전용 스프린트)**: 案 A(`[slug]/layout.tsx` 중첩 provide). 단 **선행 조건**:
  1. **VCK 사전 검수** — 사슴악마(work 테마 없음) 렌더 **불변** 스크린샷 대조(작가 랜딩/작품/에피소드/네비) + work 테마 있는 케이스의 nav 색 정책 승인.
  2. work 테마 데이터 소스 확정 — server `resolve` 응답의 `bakedCssUrl`(절대 URL) + `theme` 객체를 layout 에서 로드(레이아웃 캐시 정책 = `[author]/layout.tsx loadTheme` 와 동일 `no-store`).
  3. `theme-resolve-removed.test.ts` 가드 갱신(리더 페이지 아닌 `[slug]/layout.tsx` 로 콜 이동 반영).
  4. `html,body`/`meta theme-color` 이중화 처리 방식 확정(중첩 시 후행 우선의 DOM 순서 의존 제거).
- **비용(cost-accountant)**: `resolveTheme` 는 기존 server 엔드포인트 재사용(AI 크레딧 미소모) — 원가 영향 0. (AI 테마 **생성**은 별개, 무관.)

---

## 5. 코드 증거 인덱스 (재현용)

| 주장 | 파일:라인 |
|------|-----------|
| baked CSS = `:root { --g-* }` | server `src/lib/theme-baker.ts:145`, `.spec.ts:14` |
| ThemeProvider 가 동일 `--g-*` 를 div 인라인으로 재설정 | `src/features/theme/ThemeProvider.tsx:40-77` |
| author 레이아웃이 전 subtree 를 author ThemeProvider+bakedCss+html/body 로 wrap | `src/app/[author]/layout.tsx:148-172` |
| 레이아웃 params = `{ author }` 뿐(work 부재) | `src/app/[author]/layout.tsx:54-57` |
| resolveTheme 배선(적용은 백로그) | `src/lib/api.ts:126-136` |
| F-18 리더콜 dead 철회 가드 | `src/app/[author]/[slug]/[episode]/theme-resolve-removed.test.ts` |
| `[slug]/layout.tsx` 부재(신설=아키텍처 변경) | `find src/app/[author]/[slug]` = `[episode]/` + `page.tsx` 만 |

**이번 브랜치 코드 변경 0(FW-2) — 리포트 only. 테마 에디터·theme.css·프리셋·ThemeProvider·layout 전부 무접촉.**
