# 명퇴용사 박부장

Verse8 세로형 방치 RPG (Vite + React + TypeScript, 서버는 `server/src/server.ts`, 규칙은 `shared/`).

**작업 전에 [docs/VERSE8.md](docs/VERSE8.md)를 읽는다.** GitLab `develop` 푸시는 곧 배포다.

- 사용자에게는 항상 한국어로 말한다.
- 게임 규칙(정산, 비용, 보상)은 `shared/`에만 둔다. 서버와 클라이언트는 `shared/`를 부르기만 한다.
- 작업은 `master`에서 한다. 태스크가 끝날 때마다 `master`를 로컬 `develop`에 병합하고 `gitlab develop`에 푸시한다(사용자가 매번 승인 없이 푸시하라고 했다, 2026-10-06). 강제 푸시 금지. `develop`을 `master`에 병합하지 않는다.
- 커밋과 푸시 직전에 `npm test`, `npm run typecheck`, `npm run server:test`를 실행한다. 하나라도 실패하면 푸시하지 않는다.
- 설계: `docs/superpowers/specs/2026-10-06-myeongtoe-hero-design.md`, 로드맵: `docs/superpowers/plans/2026-10-06-00-roadmap.md`
