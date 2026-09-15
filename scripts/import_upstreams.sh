#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GUIDE_REPO="https://github.com/IndelibleVivi/mcp-server-engineering-field-guide.git"
GUIDE_SHA="87238302209d654358dd64eb3972677e4cacf256"
LAB_REPO="https://github.com/IndelibleVivi/mcp-app-production-fieldlab.git"
LAB_SHA="5a6deebbac96089588658452a00f2c52bad0dd2f"

if [[ "${1:-}" != "--write" ]]; then
  echo "Refusing to replace guide/ and lab/ without --write." >&2
  exit 2
fi

TMP="$(mktemp -d "${TMPDIR:-/tmp}/mcp-boundary-import.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

fetch_exact() {
  local repo="$1"
  local sha="$2"
  local destination="$3"
  git init -q "$destination"
  git -C "$destination" remote add origin "$repo"
  git -C "$destination" fetch -q --depth 1 origin "$sha"
  local actual
  actual="$(git -C "$destination" rev-parse FETCH_HEAD)"
  if [[ "$actual" != "$sha" ]]; then
    echo "Expected $sha from $repo, got $actual" >&2
    exit 1
  fi
  git -C "$destination" checkout -q --detach FETCH_HEAD
  rm -rf "$destination/.git"
}

fetch_exact "$GUIDE_REPO" "$GUIDE_SHA" "$TMP/guide"
fetch_exact "$LAB_REPO" "$LAB_SHA" "$TMP/lab"

rm -rf "$ROOT/guide" "$ROOT/lab"
mkdir -p "$ROOT/guide" "$ROOT/lab"
rsync -a --delete --exclude='.git' "$TMP/guide/" "$ROOT/guide/"
rsync -a --delete --exclude='.git' "$TMP/lab/" "$ROOT/lab/"

cat > "$ROOT/guide/MONOREPO-NOTE.md" <<NOTE
# Monorepo note

This tree was imported from \
\`IndelibleVivi/mcp-server-engineering-field-guide@$GUIDE_SHA\` for the MCP Boundary unified-workspace candidate.

Its historical \
\`skill/mcp-server-engineering/\` directory is retained for provenance, release evidence, validators, and reproducibility. It is not exposed by the MCP Boundary plugin manifest and is not a second recommended installation path. The active skill is \
\`../src/skills/mcp-boundary/\` from the repository root.

The local licensing map remains authoritative for this imported tree.
NOTE

cat > "$ROOT/lab/MONOREPO-NOTE.md" <<NOTE
# Monorepo note

This tree was imported from \
\`IndelibleVivi/mcp-app-production-fieldlab@$LAB_SHA\` for the MCP Boundary unified-workspace candidate.

It remains an executable, neutral evidence laboratory. Passing its checks proves only the named local specimen and receipt boundary; it does not establish arbitrary production or named-host behavior.

The local licensing map remains authoritative for this imported tree.
NOTE

python3 - "$ROOT" <<'PY'
from __future__ import annotations

import json
from pathlib import Path
import sys

root = Path(sys.argv[1])
path = root / "provenance/SOURCES.json"
data = json.loads(path.read_text(encoding="utf-8"))
data["recorded_at"] = "2026-09-15"
data["project_version"] = "0.2.0-alpha.1"
data["workspace_imports"] = json.loads(
    (root / "provenance/UPSTREAMS.lock.json").read_text(encoding="utf-8")
)["imports"]
path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY

echo "Imported Guide $GUIDE_SHA and Field Lab $LAB_SHA."
