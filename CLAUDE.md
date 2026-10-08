# 명퇴용사 박부장

Verse8 세로형 방치 RPG (Vite + React + TypeScript, 서버는 `server/src/server.ts`, 규칙은 `shared/`).

**작업 전에 [docs/VERSE8.md](docs/VERSE8.md)를 읽는다.** GitLab `develop` 푸시는 곧 배포다.

- 사용자에게는 항상 한국어로 말한다.
- 게임 규칙(정산, 비용, 보상)은 `shared/`에만 둔다. 서버와 클라이언트는 `shared/`를 부르기만 한다.
- 작업은 `master`에서 한다. 태스크가 끝날 때마다 `bash tools/ship.sh "<메시지>" <경로들>`로 테스트 3종(`npm test`, `npm run typecheck`, `npm run server:test`) → 커밋 → GitHub(`origin master`) 푸시 → `develop` 병합 → `gitlab develop` 푸시(배포)까지 한다(사용자가 매번 승인 없이 푸시하라고 했다, 2026-10-06). 테스트가 하나라도 실패하면 푸시하지 않는다. 강제 푸시 금지. `develop`을 `master`에 병합하지 않는다.
- GitHub 저장소는 공개다. 사운드 파일(`art/audio/*.mp3`)은 라이선스 때문에 GitHub에 올리지 않는다(`develop`과 별도 폴더에만). 원작 게임의 이름은 파일·문서·커밋 메시지 어디에도 쓰지 않는다(대화에서는 괜찮다). 다른 PC 설정은 [docs/SETUP.md](docs/SETUP.md).
- 그림·웹툰·보스 아트는 게임에 넣기 전에 사용자에게 보여 주고 승인받는다. 그림은 진짜 픽셀아트로(코드로 그리지 않는다): 기본은 PixelLab, 사용자가 원하면 Codex(실제 스프라이트를 참고 이미지로 붙인다).
- 백그라운드 에이전트를 쓰지 않는다(사용자 요청). 토큰을 아낀다.
- 설계: `docs/superpowers/specs/2026-10-06-myeongtoe-hero-design.md`, 로드맵: `docs/superpowers/plans/2026-10-06-00-roadmap.md`
