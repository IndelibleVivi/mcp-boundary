#!/usr/bin/env python3
"""One-shot bootstrap for the unified MCP Boundary review branch."""

from __future__ import annotations

import base64
import io
from pathlib import Path
import shutil
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
PARTS = ROOT / "scripts" / "bootstrap-payload"


def extract_payload() -> None:
    encoded = "".join(
        path.read_text(encoding="ascii").strip()
        for path in sorted(PARTS.glob("part-*.txt"))
    )
    if not encoded:
        raise RuntimeError("bootstrap payload is missing")
    archive = base64.b64decode(encoded, validate=True)
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as bundle:
        for member in bundle.getmembers():
            target = (ROOT / member.name).resolve()
            if ROOT.resolve() not in target.parents and target != ROOT.resolve():
                raise RuntimeError(f"unsafe payload path: {member.name}")
            if member.issym() or member.islnk():
                raise RuntimeError(f"links are not allowed in payload: {member.name}")
        bundle.extractall(ROOT, filter="data")


def run(*command: str) -> None:
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    extract_payload()
    run("bash", "scripts/import_upstreams.sh", "--write")
    run("python3", "scripts/build_plugin.py", "--write")
    shutil.rmtree(PARTS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
