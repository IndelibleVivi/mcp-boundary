#!/usr/bin/env python3
"""Exercise portable and legacy Codex installation in empty temporary homes."""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

from build_plugin import ROOT, OUTPUT, compare_trees, tree_files


def install_and_check(temp: Path, mode: str, candidate_version: str) -> None:
    marketplace = temp / 'marketplace'
    package = marketplace / 'plugins/mcp-boundary'
    for relative in tree_files(OUTPUT):
        if mode == 'legacy-only' and relative == Path('plugin.json'):
            continue
        target = package / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUTPUT / relative, target)
    catalog = marketplace / '.agents/plugins/marketplace.json'
    catalog.parent.mkdir(parents=True)
    catalog.write_bytes((ROOT / '.agents/plugins/marketplace.json').read_bytes())
    task_home = temp / 'codex'
    task_home.mkdir()
    # Supported runtime setting, with no credentials or daily-profile files copied.
    env = {**os.environ, 'CODEX_HOME': str(task_home)}
    for arguments in [('plugin', 'marketplace', 'add', str(marketplace), '--json'),
                      ('plugin', 'add', 'mcp-boundary@mcp-boundary', '--json')]:
        run = subprocess.run(['codex', *arguments], cwd=temp, env=env, text=True, capture_output=True)
        if run.returncode:
            raise RuntimeError(run.stdout + run.stderr)
    listing = json.loads(subprocess.check_output(['codex', 'plugin', 'list', '--json'], cwd=temp, env=env, text=True))
    installed = listing['installed']
    if len(installed) != 1 or not installed[0]['enabled'] or installed[0]['version'] != candidate_version:
        raise ValueError(f'{mode}: candidate did not install and enable at the expected version')
    cache = task_home / 'plugins/cache/mcp-boundary/mcp-boundary' / candidate_version
    problems = compare_trees(package, cache)
    if problems:
        raise ValueError('; '.join(problems))
    if mode == 'portable':
        manifest = json.loads((cache / 'plugin.json').read_text())
        interface = manifest['extensions']['com.openai']['interface']
    else:
        interface = json.loads((cache / '.codex-plugin/plugin.json').read_text())['interface']
    for field in ('composerIcon', 'logo'):
        if not (cache / interface[field]).is_file():
            raise ValueError(f'{mode}: installed asset missing: {field}')
    if not (cache / 'skills/mcp-boundary/SKILL.md').is_file():
        raise ValueError(f'{mode}: installed skill missing')


def main():
    observer = subprocess.check_output(['codex', '--version'], text=True).strip()
    candidate_version = (ROOT / 'VERSION').read_text().strip()
    modes = ['portable', 'legacy-only']
    with tempfile.TemporaryDirectory(prefix='boundary-codex-install-') as folder:
        for mode in modes:
            temp = Path(folder) / mode
            temp.mkdir()
            install_and_check(temp, mode, candidate_version)
    print(json.dumps({'status': 'verified', 'observer': observer, 'version': candidate_version,
                      'modes': modes, 'boundary': 'temporary local install, cache bytes and asset paths',
                      'not_proven': ['model skill activation', 'desktop composer rendering', 'directory importer', 'daily user profile']}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
