#!/usr/bin/env python3
"""Create a deterministic Codex-native MCP Boundary plugin ZIP."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile


ROOT = Path(__file__).resolve().parents[1]
VERSION = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
SOURCE = ROOT / "plugins" / "mcp-boundary"
DIST = ROOT / "dist"
ARCHIVE = DIST / f"mcp-boundary-{VERSION}.zip"
DIGEST = DIST / f"mcp-boundary-{VERSION}.zip.sha256"
FIXED_TIME = (2026, 9, 14, 0, 0, 0)


def package_files() -> list[Path]:
    files: list[Path] = []
    for path in SOURCE.rglob("*"):
        if path.is_symlink():
            raise ValueError(f"Symlinks are not portable: {path}")
        if path.is_file():
            files.append(path)
    root_manifest = SOURCE / "plugin.json"
    codex_manifest_path = SOURCE / ".codex-plugin/plugin.json"
    if root_manifest.exists():
        raise ValueError(
            "Root plugin.json would select the Agent Plugins conversion path; "
            "ship only .codex-plugin/plugin.json."
        )
    if not files or not codex_manifest_path.is_file():
        raise ValueError("Build the Codex-native plugin package before creating the ZIP.")
    codex_manifest = json.loads(codex_manifest_path.read_text(encoding="utf-8"))
    interface = codex_manifest.get("interface", {})
    if "screenshots" in interface or (SOURCE / "assets/screenshots").exists():
        raise ValueError(
            "ZIP uploads support skills only; remove interface.screenshots "
            "and packaged screenshot assets."
        )
    for field in ("composerIcon", "logo"):
        value = interface.get(field)
        if not isinstance(value, str) or not value.startswith("./assets/"):
            raise ValueError(f"Codex manifest is missing a valid interface.{field} path.")
        asset = SOURCE.joinpath(*PurePosixPath(value[2:]).parts)
        if not asset.is_file():
            raise ValueError(f"Codex manifest asset does not exist: {value}")
    return sorted(files, key=lambda item: item.relative_to(SOURCE).as_posix())


def safe_archive_name(path: Path) -> str:
    name = path.relative_to(SOURCE).as_posix()
    pure = PurePosixPath(name)
    if pure.is_absolute() or ".." in pure.parts or not pure.parts:
        raise ValueError(f"Unsafe package path: {name}")
    return name


def main() -> int:
    DIST.mkdir(parents=True, exist_ok=True)
    files = package_files()
    with zipfile.ZipFile(ARCHIVE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in files:
            info = zipfile.ZipInfo(safe_archive_name(path), FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.create_system = 3
            bundle.writestr(info, path.read_bytes(), compresslevel=9)
    digest = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    DIGEST.write_text(f"{digest}  {ARCHIVE.name}\n", encoding="utf-8")
    print(f"Created {ARCHIVE.relative_to(ROOT)} ({len(files)} files)")
    print(f"SHA-256 {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
