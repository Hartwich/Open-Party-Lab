#!/usr/bin/env bash
# Builds a Linux-native copy of the workspace for typechecking and running.
#
# The repo's npm workspace links are Windows junctions, which a Linux shell
# cannot follow. This mirrors the sources into a scratch directory and recreates
# the links as real symlinks, so `tsc` and `node` work normally. Nothing under
# the repo is modified.
#
#   scripts/sandbox-harness.sh [repo-path] [work-dir]
set -euo pipefail

# Resolved to an absolute path: the symlinks written below must not depend on
# the caller's working directory.
SRC="$(cd "${1:-$(dirname "$0")/..}" && pwd)"
W="${2:-/tmp/opl}"
NM="$SRC/node_modules"

rm -rf "$W"
mkdir -p "$W/local-games" "$W/node_modules/@open-party-lab" "$W/node_modules/@types"

cp -r "$SRC/packages" "$W/packages"
cp -r "$SRC/apps/server" "$W/server-app"
rm -rf "$W/server-app/node_modules" "$W/server-app/dist"
cp "$SRC/tsconfig.base.json" "$W/" 2>/dev/null || true

for game in $(ls "$SRC/local-games"); do
  mkdir -p "$W/local-games/$game"
  cp -r "$SRC/local-games/$game/src" "$W/local-games/$game/src" 2>/dev/null || true
  cp "$SRC/local-games/$game/tsconfig.json" "$SRC/local-games/$game/package.json" \
     "$W/local-games/$game/" 2>/dev/null || true
done

# Workspace packages as real symlinks.
for pkg in game-core protocol ui-kit utils; do
  ln -sfn "../../packages/$pkg" "$W/node_modules/@open-party-lab/$pkg"
done

for game in $(ls "$W/local-games"); do
  name=$(node -e "process.stdout.write(require('$W/local-games/$game/package.json').name)" 2>/dev/null || true)
  [ -n "$name" ] && ln -sfn "../../local-games/$game" "$W/node_modules/$name"
done

# Third-party packages borrowed from the real install.
for dep in typescript phaser three socket.io socket.io-client engine.io engine.io-parser \
           socket.io-parser socket.io-adapter ws cors debug ms accepts negotiator \
           mime-types mime-db vary base64id cookie "@socket.io" "@types/node" "@types/three"; do
  [ -e "$NM/$dep" ] && ln -sfn "$NM/$dep" "$W/node_modules/$dep"
done

echo "Harness bereit unter $W"
