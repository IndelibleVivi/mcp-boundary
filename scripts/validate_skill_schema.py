#!/usr/bin/env python3
"""Validate Codex skill frontmatter and unfinished scaffold markers."""

from __future__ import annotations

import argparse
from pathlib import Path
import re
import sys

import yaml


ALLOWED_PROPERTIES = {"name", "description", "license", "allowed-tools", "metadata"}
MAX_NAME_LENGTH = 64
MAX_DESCRIPTION_LENGTH = 1024


def validate_skill(skill_path: Path) -> list[str]:
    skill_file = skill_path / "SKILL.md"
    if not skill_file.is_file():
        return ["SKILL.md not found"]

    try:
        content = skill_file.read_text(encoding="utf-8", errors="strict")
    except (OSError, UnicodeError) as exc:
        return [f"cannot read SKILL.md as strict UTF-8: {exc}"]
    if not content.startswith("---"):
        return ["No YAML frontmatter found"]

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return ["Invalid frontmatter format"]

    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        return [f"Invalid YAML in frontmatter: {exc}"]
    if not isinstance(frontmatter, dict):
        return ["Frontmatter must be a YAML dictionary"]

    errors: list[str] = []
    unexpected = set(frontmatter) - ALLOWED_PROPERTIES
    if unexpected:
        errors.append(
            "Unexpected key(s) in SKILL.md frontmatter: "
            f"{', '.join(sorted(str(key) for key in unexpected))}. Allowed properties are: "
            f"{', '.join(sorted(ALLOWED_PROPERTIES))}"
        )
    for required in ("name", "description"):
        if required not in frontmatter:
            errors.append(f"Missing '{required}' in frontmatter")

    name = frontmatter.get("name", "")
    if not isinstance(name, str):
        errors.append(f"Name must be a string, got {type(name).__name__}")
    else:
        name = name.strip()
        if name and not re.fullmatch(r"[a-z0-9-]+", name):
            errors.append(
                f"Name '{name}' should be hyphen-case "
                "(lowercase letters, digits, and hyphens only)"
            )
        if name.startswith("-") or name.endswith("-") or "--" in name:
            errors.append(
                f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
            )
        if len(name) > MAX_NAME_LENGTH:
            errors.append(
                f"Name is too long ({len(name)} characters). "
                f"Maximum is {MAX_NAME_LENGTH} characters."
            )

    description = frontmatter.get("description", "")
    if not isinstance(description, str):
        errors.append(
            f"Description must be a string, got {type(description).__name__}"
        )
    else:
        description = description.strip()
        if description.startswith("[TODO:"):
            errors.append("Description contains an unfinished TODO placeholder")
        if "<" in description or ">" in description:
            errors.append("Description cannot contain angle brackets (< or >)")
        if len(description) > MAX_DESCRIPTION_LENGTH:
            errors.append(
                f"Description is too long ({len(description)} characters). "
                f"Maximum is {MAX_DESCRIPTION_LENGTH} characters."
            )

    fence_marker: str | None = None
    fence_length = 0
    for line in content[match.end() :].splitlines():
        fence = re.match(
            r"^[ \t]*(?:(?:[-+*]|\d+[.)])[ \t]+)?(`{3,}|~{3,})(.*)$", line
        )
        if fence:
            marker = fence.group(1)
            if fence_marker is None:
                fence_marker = marker[0]
                fence_length = len(marker)
            elif (
                marker[0] == fence_marker
                and len(marker) >= fence_length
                and not fence.group(2).strip()
            ):
                fence_marker = None
                fence_length = 0
            continue
        if fence_marker is None and re.fullmatch(
            r"[ ]{0,3}\[TODO:[^\n]*\][ \t]*", line
        ):
            errors.append("Skill instructions contain an unfinished TODO placeholder")
            break
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("skills", type=Path, nargs="+")
    args = parser.parse_args()
    failed = False
    for skill in args.skills:
        errors = validate_skill(skill)
        if errors:
            failed = True
            for error in errors:
                print(f"FAIL: {skill}: {error}", file=sys.stderr)
        else:
            print(f"PASS: {skill}: skill schema is valid")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
