#!/usr/bin/env python3
"""Build or verify the committed Codex-native plugin package from author sources."""

from __future__ import annotations

import argparse
import filecmp
import os
from pathlib import Path
import shutil
import tempfile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "plugins" / "mcp-boundary"


def copy_file(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def build_candidate(destination: Path) -> None:
    manifest_source = ROOT / "src/plugin/plugin.json"
    copy_file(
        manifest_source,
        destination / ".codex-plugin/plugin.json",
    )
    shutil.copytree(
        ROOT / "src/skills/mcp-boundary",
        destination / "skills/mcp-boundary",
        dirs_exist_ok=True,
    )

    for name in ("composer-icon.png", "logo.png"):
        copy_file(ROOT / "brand/exports" / name, destination / "assets" / name)
    copy_file(
        ROOT / "previews/home-desktop.png",
        destination / "assets/screenshots/home-desktop.png",
    )
    copy_file(
        ROOT / "previews/home-mobile.png",
        destination / "assets/screenshots/home-mobile.png",
    )

    legal_files = {
        "LICENSE": "LICENSE",
        "LICENSE-DOCUMENTATION.md": "LICENSE-DOCUMENTATION.md",
        "LICENSING.md": "LICENSING.md",
        "THIRD_PARTY_NOTICES.md": "THIRD_PARTY_NOTICES.md",
        "LICENSES/Apache-2.0.txt": "LICENSES/Apache-2.0.txt",
    }
    for source, target in legal_files.items():
        copy_file(ROOT / source, destination / target)
    copy_file(
        ROOT / "provenance/SOURCES.json",
        destination / "provenance/SOURCES.json",
    )


def tree_files(root: Path) -> set[Path]:
    if not root.exists():
        return set()
    return {
        path.relative_to(root)
        for path in root.rglob("*")
        if path.is_file() and not path.is_symlink()
    }


def compare_trees(expected: Path, actual: Path) -> list[str]:
    problems: list[str] = []
    expected_files = tree_files(expected)
    actual_files = tree_files(actual)
    for missing in sorted(expected_files - actual_files):
        problems.append(f"missing: {missing.as_posix()}")
    for extra in sorted(actual_files - expected_files):
        problems.append(f"unexpected: {extra.as_posix()}")
    for relative in sorted(expected_files & actual_files):
        if not filecmp.cmp(expected / relative, actual / relative, shallow=False):
            problems.append(f"different: {relative.as_posix()}")
    for path in actual.rglob("*") if actual.exists() else ():
        if path.is_symlink():
            problems.append(f"symlink not allowed: {path.relative_to(actual).as_posix()}")
    return problems


def write_output(candidate: Path) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    backup = OUTPUT.with_name(f".{OUTPUT.name}.previous-{os.getpid()}")
    if backup.exists():
        shutil.rmtree(backup)
    if OUTPUT.exists():
        OUTPUT.rename(backup)
    try:
        shutil.move(str(candidate), str(OUTPUT))
    except Exception:
        if backup.exists() and not OUTPUT.exists():
            backup.rename(OUTPUT)
        raise
    if backup.exists():
        shutil.rmtree(backup)


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="replace generated package")
    mode.add_argument("--check", action="store_true", help="verify generated package")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory(prefix="mcp-boundary-build-") as temp:
        candidate = Path(temp) / "mcp-boundary"
        build_candidate(candidate)
        if args.check:
            problems = compare_trees(candidate, OUTPUT)
            if problems:
                print("Generated package is out of date:")
                for problem in problems:
                    print(f"- {problem}")
                return 1
            print(f"Package matches author sources ({len(tree_files(candidate))} files).")
            return 0
        write_output(candidate)

    print(f"Built {OUTPUT.relative_to(ROOT)} ({len(tree_files(OUTPUT))} files).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
