#!/bin/bash
# 머지 프로모션 스크립트
# Usage: ./scripts/promote.sh [inhouse|prod]

set -e

TARGET=${1:-inhouse}

echo "=== 전수검사 ==="
npx tsc --noEmit
npm test
npm run build
echo "=== 전수검사 통과 ==="

if [ "$TARGET" = "inhouse" ]; then
  echo "=== develop → inhouse ==="
  git checkout inhouse
  git merge develop --no-ff -m "merge: develop → inhouse (프로모션)"
  git push origin inhouse
  git checkout develop
elif [ "$TARGET" = "prod" ]; then
  echo "=== develop → inhouse → main ==="
  git checkout inhouse
  git merge develop --no-ff -m "merge: develop → inhouse (프로모션)"
  git push origin inhouse
  git checkout main
  git merge inhouse --no-ff -m "merge: inhouse → main (프로모션)"
  git push origin main
  git checkout develop
fi

echo "=== $TARGET 프로모션 완료 ==="
