# 다른 PC에서 작업하기

저장소는 두 곳에 있다.

| 원격 | 주소 | 브랜치 | 용도 |
| --- | --- | --- | --- |
| `origin` | GitHub (공개) | `master` | 코드. 작업은 여기서 한다. |
| `gitlab` | gitlab.verse8.io/anjshdkdl99/game-q4gg | `develop` | 배포. 여기 푸시하면 곧 Verse8에 반영된다. |

효과음·배경음(`art/audio/*.mp3`, Mixkit)은 라이선스상 음원 파일 재배포가 금지라 GitHub에 없다. GitLab `develop`과 별도 폴더 `myeongtoe-hero-audio`(구글 드라이브)에만 있다.

## 처음 한 번

1. Node.js 24, Git, Python 3, GitHub CLI(`gh`)를 설치하고 `gh auth login`.
2. 클론과 설치:
   ```bash
   git clone https://github.com/Jujeongmin/myeongtoe-hero.git
   cd myeongtoe-hero
   npm install
   npm run server:install
   ```
3. 사운드: 구글 드라이브의 `myeongtoe-hero-audio/art/audio/*.mp3`를 저장소의 `art/audio/`에 복사한다(`.gitignore`가 무시하므로 커밋되지 않는다).
4. 배포 원격: GitLab 액세스 토큰(gitlab.verse8.io에서 발급, `write_repository`)으로
   ```bash
   git remote add gitlab https://oauth2:<토큰>@gitlab.verse8.io/anjshdkdl99/game-q4gg.git
   git fetch gitlab
   ```
   토큰은 `.git/config`에만 둔다. 파일이나 채팅에 적지 않는다.
5. 확인: `npm run dev` 후 터미널에 나온 주소 뒤에 `?local`을 붙여 연다(서버 없이 로컬 저장으로 실행).

`.env`와 `.agent8.lock`은 저장소에 들어 있다(게임에 그대로 노출되는 공개 주소). 고치거나 지우지 않는다.

## 매 작업

- `master`에서 작업한다.
- 끝나면 `bash tools/ship.sh "<커밋 메시지>" <경로들>`: 테스트 3종 → 커밋 → GitHub 푸시 → `develop`에 병합 → GitLab 푸시(배포).
  `develop`은 `.superpowers/deploy`에 따로 체크아웃된다(스크립트가 처음에 만든다).
- 강제 푸시 금지. `develop`을 `master`에 병합하지 않는다.
- 다른 PC에서 작업한 뒤 돌아오면 먼저 `git pull origin master`.
