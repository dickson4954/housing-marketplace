#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

MESSAGE="${1:-MAKAZII preview update}"

echo "===== CHECKING TYPESCRIPT ====="
npx tsc --noEmit

echo
echo "===== PUBLISHING ANDROID PREVIEW UPDATE ====="
CI=1 npx eas-cli update \
  --channel preview \
  --environment preview \
  --platform android \
  --message "$MESSAGE"

echo
echo "SUCCESS: Preview update published."
