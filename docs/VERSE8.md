# Verse8 배포 규칙

## 저장소

| 원격 | 브랜치 | 용도 |
|---|---|---|
| (로컬) | `master` | 실제 작업 기록 |
| `gitlab` (gitlab.verse8.io/anjshdkdl99/game-q4gg) | `develop` | Verse8 배포용. **푸시하면 자동 배포된다** |

- `develop`은 Verse8 템플릿에서 시작해 `master`와 공통 기록이 없었다(첫 병합에 `--allow-unrelated-histories`, 2026-10-06).
- 새 컴퓨터에서는 `git remote add gitlab https://oauth2:<GitLab 토큰>@gitlab.verse8.io/anjshdkdl99/game-q4gg.git` 후 `git fetch gitlab`, `git branch develop gitlab/develop`. 토큰은 `.git/config`에만 둔다.
- Git Bash에서 `git show <브랜치>:<경로>`를 쓸 때는 `MSYS_NO_PATHCONV=1`을 붙인다. 안 그러면 경로 변환 때문에 `unknown revision` 오류가 난다.

## 푸시 전 점검표

1. `npm test`, `npm run typecheck`, `npm run server:test`
2. `develop`에서 `npx vite build`. `dist/index.html`에 `GAME_SIZE_RESPONSE`가 있는지 확인
3. `git push gitlab develop`
4. 에디터를 열고 새로고침한 뒤 미리보기에서 콘솔 오류와 서버 저장(새로고침 후 유지)을 확인

## 지우면 안 되는 것

- `.agent8.lock`, `.env`: Verse8 프로젝트 ID. 바꾸면 배포된 게임과 서버 데이터에서 끊긴다.
- `index.html`의 `GAME_SIZE_RESPONSE` 응답 스크립트와 로딩 화면
- `src/main.tsx` 맨 위의 `import "./storageFallback"`: 에디터 iframe에서 localStorage가 막히면 SDK가 import 시점에 죽는다.
- `vite.config.ts`의 `cssCacheBust()`, `base: "./"`, `resolve.dedupe`, `optimizeDeps.include`
- Verse8 템플릿의 Tailwind/PostCSS 설정은 넣지 않는다(빌드를 깬다).

## 서버 연결

- 개발 빌드(`npm run dev`)는 `.env`의 verse 뒤에 `-preview`를 붙인 미리보기 서버에 붙는다. 배포 빌드는 `-preview` 없는 본 서버에 붙는다(`@agent8/gameserver`의 `GameServer.getInitialVerse`).
- 게이트웨이는 `https://gs-gateway.verse8.io`다.
- 콘솔에 `[GS] connect rejected: Failed to load verse …-preview: a platform error, not a problem in server.js`와 `Route failed (409): recovering`이 나오면, 미리보기 서버가 아직 올라오지 않은 것이다(2026-10-06 첫 푸시 직후 확인). 에디터를 열어 새 코드를 받게 한 뒤 다시 시도한다.

## 로컬에서 Verse8 없이 하기

`.env`가 있으면 개발 서버도 Verse8 미리보기 서버에 붙는다. 서버 없이 브라우저 안의 로컬 서버로 하려면 주소 끝에 `?local`을 붙인다(`http://localhost:5180/?local`). 개발 빌드에서만 동작한다. 개발 서버 포트는 5180이다(5173은 grove hunters가 쓴다).

## 저장한 데이터는 공개다

Verse8 클라이언트 SDK는 계정 ID만 알면 그 계정의 `$global` 유저 상태를 누구나 읽을 수 있다(grove hunters에서 2026-09-21 확인). 세이브에 개인 정보를 넣지 않는다.
