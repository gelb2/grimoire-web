# 외부 자료 고지

## 글꼴

웹은 EB Garamond와 Noto Serif KR을 사용한다. EB Garamond는 next/font로 자체 서빙하고, Noto Serif KR은 기존 빌드와 동일한 WOFF2를 `public/fonts/noto-serif-kr/`에 고정해 자체 서빙한다. 파일별 해시·유니코드 범위·보관 근거는 해당 폴더의 SOURCE.json에 있다. 원래 서체와 파일은 변경하지 않았다. 글꼴 파일의 저작권·OFL은 Grimoire 자체 소스와 구분한다.

| 글꼴 | 공식 이용 조건 | 포함한 고지 |
| --- | --- | --- |
| EB Garamond | [Google Fonts의 OFL](https://github.com/google/fonts/blob/main/ofl/ebgaramond/OFL.txt) | [저작권·OFL 전문](public/licenses/eb-garamond-OFL.txt) |
| Noto Serif KR | [Google Fonts의 OFL](https://github.com/google/fonts/blob/main/ofl/notoserifkr/OFL.txt) | [저작권·OFL 전문](public/licenses/noto-serif-kr-OFL.txt) |

각 글꼴의 원래 저작권·OFL 문구를 포함했다. 빌드·자가 호스팅 시 public/licenses도 함께 제공한다.

## npm 의존성

`npm ci` 뒤 `npm run notices`를 실행하면 설치된 운영 의존성 트리를 읽고 아래 파일을 생성한다. 네트워크 호출이나 추가 설치는 하지 않는다. Docker 빌드도 해당 플랫폼에서 다시 생성하므로 macOS와 Linux의 선택 의존성을 구분한다.

- [운영 의존성 고지 전문](public/licenses/npm-runtime-notices.txt)
- [버전·이용 조건·원문 해시·출처 목록](public/licenses/npm-runtime-manifest.json)
- 생성 코드: `scripts/generate-third-party-notices.mjs`
- 원본 저장소 보충 고지와 고정 출처: `licenses/upstream/manifest.json`

패키지의 LICENSE·NOTICE·COPYING·COPYRIGHT와 README의 라이선스 전문, Next 내부에 묶인 고지를 보존한다. 설치 파일의 고지와 원본 저장소에서 보충한 고지를 구분한다. `client-only`처럼 원문 없이 이용 조건만 적힌 패키지는 `package-declaration-only`로 표시한다. 해당 표시를 임의의 저작권 문구로 메우지 않는다.

이미지 처리의 sharp/libvips와 그 네이티브 라이브러리는 별도 이용 조건을 유지한다. 바이너리나 Docker 이미지를 외부에 배포할 때는 실제 플랫폼 산출물의 동적 라이브러리·소스 제공 조건까지 대조해야 한다. 이 목록은 Grimoire 자체 소스나 원고에 적용할 라이선스를 결정하지 않는다.
