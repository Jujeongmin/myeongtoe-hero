#!/bin/bash
# Ship one finished task: the three test suites, a commit on master, master to GitHub (origin), then
# master merged into develop and develop pushed to GitLab (that push is the Verse8 deploy).
# usage: bash tools/ship.sh "<commit message>" <paths...>
# develop is checked out in its own worktree (.superpowers/deploy) because it carries the sound
# files master leaves out (docs/SETUP.md); master's working tree never switches branch.
set -e
cd "$(git rev-parse --show-toplevel)"
msg="$1"; shift
python tools/eol.py >/dev/null
npm test 2>&1 | grep -E "Tests "
if npm test 2>&1 | grep -q "failed"; then echo "TESTS FAILED"; exit 1; fi
if npm run typecheck 2>&1 | grep -q "error"; then npm run typecheck; exit 1; fi
st=$(npm run server:test 2>&1); echo "$st" | grep -E "Passed:|Failed:"
echo "$st" | grep -q "Failed: 0 tests" || { echo "SERVER TESTS FAILED"; exit 1; }
git add "$@"
git commit -qm "$msg

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q origin master
D=.superpowers/deploy
if [ ! -d "$D" ]; then
  git fetch -q gitlab develop
  git show-ref -q --verify refs/heads/develop || git branch -q develop gitlab/develop
  git worktree add -q "$D" develop
fi
git -C "$D" pull -q --ff-only gitlab develop
git -C "$D" merge -q master -m "Merge branch 'master' into develop"
git -C "$D" push gitlab develop 2>&1 | sed 's/glpat-[A-Za-z0-9_-]*/***/g' | tail -1
git log --oneline -1
