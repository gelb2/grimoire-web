#!/bin/bash
# 머지 프로모션 스크립트 (2026-04-19 inhouse 제거 — 2환경)
# Usage: ./scripts/promote.sh [prod]
#
# develop → main 직결 머지 (QA는 dev 환경에서 develop 브랜치로 수행)

set -e

TARGET=${1:-prod}

echo "=== 전수검사 ==="
npx tsc --noEmit
npm test
npm run build
echo "=== 전수검사 통과 ==="

if [ "$TARGET" = "prod" ]; then
  echo "=== develop → main ==="
  git checkout main
  git merge develop --no-ff -m "merge: develop → main (프로모션)"
  git push origin main
  git checkout develop
else
  echo "지원: prod만. (2026-04-19 inhouse 제거)"
  exit 1
fi

echo "=== $TARGET 프로모션 완료 ==="
