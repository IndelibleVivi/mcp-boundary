#!/usr/bin/env python3
"""Verify an unpacked candidate as bytes and resolve both manifest consumers.

This is package/loader-contract validation, not an actual host installation.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path, PurePosixPath
import tempfile
import zipfile

from build_plugin import ROOT, OUTPUT, compare_trees, codex_manifest


def check_archive(archive: Path) -> None:
    with tempfile.TemporaryDirectory(prefix='boundary-unpack-') as temp:
        unpacked = Path(temp)
        with zipfile.ZipFile(archive) as bundle:
            names = bundle.namelist()
            if len(names) != len(set(names)):
                raise ValueError('Duplicate ZIP paths')
            for name in names:
                pure = PurePosixPath(name)
                if pure.is_absolute() or '..' in pure.parts or '\\' in name:
                    raise ValueError(f'Unsafe ZIP path: {name}')
            bundle.extractall(unpacked)
        problems = compare_trees(OUTPUT, unpacked)
        if problems:
            raise ValueError('; '.join(problems))
        portable = json.loads((unpacked / 'plugin.json').read_text())
        legacy = json.loads((unpacked / '.codex-plugin/plugin.json').read_text())
        if legacy != codex_manifest(portable):
            raise ValueError('Manifest projection mismatch')
        # Simulate the two documented consumers; the inline object replaces the overlay.
        for interface in (portable['extensions']['com.openai']['interface'], legacy['interface']):
            for field in ('composerIcon', 'logo'):
                path = PurePosixPath(interface[field])
                if path.is_absolute() or '..' in path.parts or not unpacked.joinpath(*path.parts).is_file():
                    raise ValueError(f'Unresolved {field}')
        skills = sorted((unpacked / 'skills').glob('*/SKILL.md'))
        if [p.parent.name for p in skills] != ['mcp-boundary']:
            raise ValueError('Expected exactly one discoverable skill')
    print(f'PASS: {archive.name}: bytes, both manifest paths, assets and skill discovery (host install not verified)')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path, nargs='?', default=ROOT / 'dist' / f"mcp-boundary-{(ROOT / 'VERSION').read_text().strip()}.zip")
    args = parser.parse_args()
    check_archive(args.archive)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
