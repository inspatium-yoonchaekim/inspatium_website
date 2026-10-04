# Inspatium 웹사이트 초안

`Reference/`의 홈페이지 문안과 한국어·영어 데모를 바탕으로 만든 React 웹사이트입니다. 한국어 기본 화면과 영어 전환, 회사 소개, 연구 분야·성과, 구성원, 소식, 연구 참여 및 이메일 문의를 제공합니다. 원본 참고 자료는 `Reference/`에 그대로 보존합니다.

흑백·회색과 얇은 구분선을 중심으로 화면을 간소화했습니다. 홈은 큰 제목과 짧은 소개, 연구·구성원 바로가기로 구성하고, 회사·연구의 전체 설명은 내부 페이지에서 제공합니다. 구성원 목록은 이름·담당 분야·회사 및 학교 이메일을 간결하게 표시하며, 소개·관심 분야·참여 연구는 `/team/:id` 프로필에서 확인합니다. 기본 본문은 17–18px, 홈 소개 문단은 18–20px로 표시합니다. 디자인 참고: [bb&b](https://www.bb-b.net/), [DVO](https://dvo.it/), [Sinedogma](https://sinedogma.com.tr/).

## 실행 환경

- Node.js **22.12.0 이상**. 현재 설치된 Node.js **24.12.0**, npm **11.9.0**에서 구성했습니다. `.nvmrc`에는 24.12.0을 기록했습니다.
- React 19.3.0, React Router 7.18.4, lucide-react 1.51.0
- Vite 8.3.2, Vite React 플러그인 6.1.1
- 서버는 Node.js 내장 HTTP 모듈을 사용합니다. 별도 데이터베이스가 필요하지 않습니다.
- 패키지는 버전을 고정했고 `package-lock.json`을 포함합니다.

## 개발 서버 실행

프로젝트 폴더에서 실행합니다.

```powershell
npm ci
npm run dev
```

브라우저에서 **http://127.0.0.1:5173**을 엽니다. 소스를 저장하면 화면에 반영됩니다. 서버는 `Ctrl+C`로 종료합니다. PowerShell에서 실행 정책 때문에 `npm`이 차단되는 환경에서는 같은 명령을 `npm.cmd ci`, `npm.cmd run dev`로 실행할 수 있습니다.

기본 포트가 사용 중이면 명령이 오류로 종료되므로, 해당 포트의 기존 서버를 종료한 뒤 다시 실행합니다.

## 빌드 및 Node.js 서버 실행

```powershell
npm run build
npm start
```

빌드 결과는 `dist/`에 생성되며 Node.js 서버의 기본 주소는 **http://127.0.0.1:4173**입니다. 서버는 React의 내부 페이지 주소를 직접 열거나 새로고침해도 `index.html`로 연결합니다. 없는 이미지·스크립트·API 경로는 404로 응답합니다.

서버 설정을 바꾸려면 `.env.example`을 복사해 `.env`를 만들고 `HOST`, `PORT`를 수정합니다.

```powershell
Copy-Item .env.example .env
```

개발 서버의 주소는 `package.json`의 `dev` 스크립트로 설정하고, `.env`의 `HOST`·`PORT`는 `npm start`에 적용됩니다. 로컬 기본 설정은 `HOST=127.0.0.1`, `PORT=4173`입니다. 외부 공개 환경에서는 호스팅 서비스의 네트워크 설정에 맞춰 `HOST`를 지정합니다.

`GET /api/health`는 서버 상태 JSON을 반환합니다. 문의 폼 수집 API는 없으며, 문의 버튼은 제공받은 이메일 주소 `sjchol@inspatium.co`로 이메일 앱을 엽니다. 주소의 마지막 글자는 소문자 `l`입니다.

Vite의 빌드 미리보기만 사용할 경우 `npm run preview`를 실행할 수 있습니다. 배포용 Node 서버 실행 명령은 `npm start`입니다.

## 텍스트 애니메이션과 스크롤

[React Bits](https://reactbits.dev/)의 SplitText·BlurText·ScrollReveal를 기존 화면에 맞춰 적용했습니다. 홈 제목과 바로가기 제목은 글자·단어가 차례로 올라오고, 홈 소개와 내부 페이지 소개는 블러가 풀리며 등장합니다. 경영철학의 비전과 연구 방향 본문은 스크롤 진행에 맞춰 단어가 드러납니다. 기존 한국어·영어 문안과 제목 구조를 유지합니다.

`src/components/react-bits/`에서 효과별 `delay`, `duration`, `baseOpacity`, `blurStrength`를 조절할 수 있습니다. 출처·적용 사항과 원본 라이선스는 같은 폴더의 README·LICENSE에 기록했습니다. [Lenis](https://github.com/darkroomengineering/lenis)는 `src/components/useSmoothScroll.js`에서 휠 스크롤을 부드럽게 처리하며 `lerp`로 감도를 조절합니다. 모바일 터치는 브라우저 기본 스크롤을 사용하고 메뉴 내부 스크롤·본문 바로가기·구성원 앵커·언어 전환을 지원합니다. 운영체제에서 동작 줄이기를 켜면 텍스트는 즉시 표시되고 기본 스크롤을 사용합니다.

## 콘텐츠 및 화면 편집

| 경로 | 용도 |
| --- | --- |
| `src/content.json` | 구성원·연구·논문·소식 등 한국어 및 영어 콘텐츠 |
| `src/` | React 페이지, 공통 화면과 스타일 |
| `public/assets/` | 배포할 이미지·폰트 등 정적 파일 |
| `server/index.mjs` | Node 서버 시작과 환경변수 처리 |
| `server/static-server.mjs` | 정적 파일 응답, SPA 경로 처리, 상태 확인 API |
| `docs/CLIENT_INFORMATION_REQUEST.txt` | 납품 전 Inspatium에 요청할 추가 정보 목록 |
| `Reference/` | 전달받은 원본 문안 및 데모, 편집하지 않는 참고 자료 |

이미지 파일을 `public/assets/`에 넣고 콘텐츠의 경로를 `/assets/파일명.webp` 형태로 연결합니다. 구성원 사진, 하드웨어 사진, 카카오톡, 논문 링크 등은 실제 제공받은 값으로 채웁니다. 제공받은 4명의 회사·학교 이메일 8개는 반영되어 있습니다. `site.email`은 공통 문의 주소, `people` 각 항목의 `email`은 회사 이메일, `academic_email`은 학교 이메일입니다. 콘텐츠의 식별자인 `id`를 바꾸면 연결되는 상세 페이지·링크도 함께 확인해야 합니다.

7.86ms·28.96초 성과 수치는 홈에서 제외하고 연구 상세 페이지에서 제공합니다. 수치는 `src/content.json`의 연구 성과 문안에서 편집합니다. 홈의 짧은 소개는 `src/Home.jsx`, 연구 방향의 고정 본문은 `src/Pages.jsx`에서 편집합니다.

연구 페이지를 일시적으로 숨기려면 `projects`의 해당 항목에 `"visibility": "hidden"`을 설정합니다. 연구 목록·상세 페이지·구성원 참여 연구에서 제외되고, 연혁·소식·논문의 해당 연구 링크도 숨겨집니다. 연구 본문은 개발 화면과 배포 JavaScript에 포함되지 않으며 원문은 JSON에 보존됩니다. 관련 논문은 논문 자체의 공개 설정을 따르고, 연혁 항목 자체는 유지됩니다. 현재 `acoustic-optimization`(음향 홀로그래피의 실시간급 최적화)이 이 설정으로 숨겨져 있습니다. 다시 공개할 때는 해당 항목의 `visibility`를 `"public"`으로 바꾸고 검증·빌드 후 push하면 연결 링크와 본문이 함께 복원됩니다.

소식은 `src/content.json`의 `news` 배열에 아래 형식으로 추가합니다. `category`는 `research` 또는 `media`이며, 두 언어의 내용을 검토한 뒤 `visibility`를 `public`으로 바꾸고 다시 빌드합니다. `draft` 또는 공개 상태가 없는 항목은 개발 화면과 배포 JavaScript에서도 제외됩니다. 원문 주소와 관련 연구는 있을 때만 입력합니다.

```json
{
  "id": "unique-news-slug",
  "date": "2026-10-15",
  "category": "media",
  "category_label": "언론 보도",
  "category_label_en": "Media coverage",
  "title": "확인된 기사 제목",
  "title_en": "Approved English title",
  "summary": "기사 소개",
  "summary_en": "Article summary",
  "body": ["본문 첫 문단"],
  "body_en": ["First paragraph"],
  "url": "",
  "project": "",
  "visibility": "draft"
}
```

논문을 일시적으로 숨기려면 `src/content.json`의 `publications` 항목에 `"visibility": "hidden"`을 설정합니다. 목록·상세 페이지·관련 연구의 논문 링크와 개발 화면·배포 JavaScript에서 해당 논문을 제외하고, 원문은 JSON에 보존합니다. 현재 등록된 모든 논문(`hat-2026`)이 숨김 상태입니다. 논문 페이지와 메뉴는 유지하며 공개된 논문이 없다는 안내를 표시합니다. 다시 공개하려는 논문의 `visibility`만 `"public"`으로 바꾸고 검증·빌드 후 push하면 본문과 연결 링크가 복원됩니다. 연구 페이지의 숨김 설정은 별도로 유지됩니다.

논문 외부 자료는 승인된 DOI·URL·코드 주소를 입력하고 `public_release`를 `true`로 바꾸면 노출됩니다. `false` 상태에서는 이 세 필드가 배포 파일에서도 제거되며, 논문 자체가 숨김 상태가 아닐 때는 제공된 논문 소개·게재 상태를 계속 표시합니다. `public_release`는 논문 자체의 `visibility`와 별도의 설정입니다.

한국어와 영어 문안을 함께 수정하고, 변경 후 두 언어의 화면을 확인합니다. 화면에서는 빈 이미지·미제공 링크를 임의의 실제 자료로 대체하지 않습니다.

## 검증

```powershell
npm test
npm run build
npm run test:ui
```

`npm test`는 Node 서버의 SPA 경로, 기존 데모 주소 호환, 파일 MIME와 내용, 없는 자산의 404, HEAD 요청, 허용하지 않는 HTTP 메서드, 상태 확인 API, 경로 이탈·Windows junction 차단, 숨김 연구·논문·연결 링크·비공개 소식·논문 외부 자료의 번들 제외 및 연구·논문 재공개를 검사합니다.

`npm run test:ui`는 설치된 Google Chrome으로 UI 테스트를 실행합니다. 한국어·영어의 공개 경로를 1440px·390px에서 확인하고, 홈은 768px·320px도 검사합니다. 화면 오류·가로 넘침, 홈 길이·글자 크기, 흑백 팔레트, 메뉴·언어 전환·구성원 프로필·소식 필터·제공받은 8개 메일 링크·404를 검사합니다. 홈과 상세 페이지는 직접 접속·새로고침도 검사합니다. 숨김 연구·논문은 직접 주소·기존 주소·새로고침에서 404 화면을 표시하고, 다른 페이지의 연결 링크와 숨김 본문·메타 정보가 노출되지 않는지 확인합니다. 재공개할 때는 콘텐츠의 공개 설정에 맞게 본문과 링크의 복원도 검사합니다. Chrome이 없는 환경에서는 Chrome을 설치하거나 `playwright.config.js`의 채널 설정을 변경합니다. 기본 웹 테스트는 Node 서버를 자동 실행하며, 미리 빌드해야 합니다. 홈·구성원·연구의 확인용 전체 화면 이미지 8개는 `docs/previews/`에 저장합니다.

배포 전에는 모바일·데스크톱 화면, 한국어·영어 전환, 내부 페이지 새로고침, 이메일 링크와 공개되는 콘텐츠를 최종 확인합니다.

애니메이션 테스트는 한국어·영어 제목의 접근 가능한 이름과 등장 완료, 휠 스크롤 보간과 페이지 이동 시 관성 정지, 스크롤 문장의 최종 가독성, 동작 줄이기 설정의 실시간 전환과 앵커 유지도 확인합니다. 정적 화면 이미지는 동작 줄이기를 활성화해 화면 아래 텍스트까지 모두 표시한 상태로 저장합니다.

## 배포

현재 운영 사이트는 **https://www.inspatium.co**이며 GitHub의 `main` 브랜치를 Vercel에 연결해 배포합니다. 프로젝트 루트의 `vercel.json`이 `/ko`, `/en`과 내부 페이지 요청을 `/index.html`로 rewrite하므로 주소를 직접 열거나 새로고침해도 React 화면이 실행됩니다. 기존 언어별 `index.html` 주소도 연결합니다. `/assets/`, `/api/`와 일반 파일 요청은 페이지 rewrite에서 제외합니다. 이 설정은 [Vercel의 Vite SPA 배포 안내](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)에 따라 적용했습니다.

Vercel 프로젝트는 Framework Preset을 **Vite**, Build Command를 **`npm run build`**, Output Directory를 **`dist`**로 설정합니다. GitHub에 push한 뒤 Vercel 배포가 **Ready**가 되면 `/ko`, `/en`과 내부 페이지에서 직접 접속·새로고침을 확인합니다. Vercel 정적 배포에서는 `npm start`의 Node 서버를 실행하지 않습니다.

실제 배포의 rewrite를 브라우저로 검사하려면 다음 명령을 실행합니다. `PLAYWRIGHT_BASE_URL`을 지정하면 로컬 서버 대신 해당 사이트를 검사합니다.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://www.inspatium.co'
npm.cmd run test:ui -- --grep 'locale home and detail pages survive direct navigation and refresh'
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

정적 호스팅 환경에는 `npm ci` 후 `npm run build`로 만든 `dist/`의 내용을 배포합니다. 호스팅 서비스의 SPA rewrite 설정에서 페이지 경로를 `index.html`로 연결해야 합니다. 존재하지 않는 정적 자산까지 HTML을 반환하지 않도록 호스팅 규칙을 확인합니다. 정적 호스팅만 사용할 경우 `/api/health`는 제공되지 않습니다.

Node.js 호스팅 환경에는 소스와 잠금 파일을 배포하고 `npm ci`, `npm run build`, `npm start` 순서로 실행합니다. 공개 도메인과 HTTPS는 선택한 호스팅 또는 리버스 프록시에서 설정합니다. 서버 프로세스 재시작·로그 관리 방식과 배포 담당자는 납품 전에 정합니다. 이 초안에는 배포 계정이나 운영 비밀값이 들어 있지 않습니다.

## GitHub에 변경 사항 올리기

이 저장소의 원격은 `https://github.com/inspatium-yoonchaekim/inspatium_website.git`이고 작업 브랜치는 `main`입니다. Collaborator도 쓰기 권한이 있으면 자신의 GitHub 계정으로 push할 수 있습니다. 프로젝트 폴더에서 작업을 시작하기 전에 `git pull --ff-only origin main`으로 최신 내용을 받습니다.

수정 후 아래 순서로 확인하고 올립니다. `git add`에는 실제로 변경한 파일 경로를 지정합니다.

```powershell
git status
npm.cmd test
npm.cmd run build
git add vercel.json README.md playwright.config.js server/static-server.test.mjs tests/site.spec.js
git commit -m "Fix Vercel locale page refresh"
git push origin main
```

처음 push할 때 로그인 창이 열리면 Collaborator로 등록된 자신의 GitHub 계정으로 로그인합니다. 원격 변경 때문에 push가 거절되면 `git pull --rebase origin main`으로 변경을 합치고 충돌이 있으면 해결한 뒤 검증과 push를 다시 실행합니다. GitHub 업로드가 끝나면 연결된 Vercel 프로젝트가 새 커밋을 자동 배포합니다.

## 초안에서 확인할 사항

실제 구성원·장비 사진, 공개 가능한 연구 자료·논문 URL, 소식, 공식 법인 및 브랜드 정보, 담당 분야·연혁·성과 표현과 영문 문안의 최종 승인이 필요합니다. 확인되지 않은 자료는 초안 상태로 두었습니다. 구체적인 요청 내용과 우선순위는 `docs/CLIENT_INFORMATION_REQUEST.txt`에 정리했습니다.

초안의 검색 노출을 막기 위해 HTML 메타 정보와 `public/robots.txt`를 `noindex`/수집 차단 상태로 설정했습니다. 공개 도메인과 콘텐츠가 확정되면 이 설정을 해제하고, canonical·언어별 alternate URL·사이트맵과 공유용 대표 이미지를 추가합니다. 현재 워드마크는 임시 문자형 디자인입니다. 첫 화면의 파동 이미지와 연구 도식은 개념 시각화이며 실험 사진 또는 실제 계산 결과가 아닙니다.

콘텐츠 관리 시스템, 회원 기능, 문의 저장, 방문 통계 수집은 구현 범위에 포함되어 있지 않습니다. 현재 콘텐츠는 JSON을 편집하고 다시 빌드하는 방식으로 운영합니다. 도메인·호스팅·유지보수 담당자와 향후 콘텐츠 수정 방식은 공개 전에 확정해야 합니다.

Pretendard 글꼴은 `public/assets/fonts/`에 로컬로 포함했고 라이선스를 함께 보존했습니다. 사용할 이미지·인물 사진·기관 로고의 공개 사용 권한은 최종 자료 제공 시 확인합니다.
