#!/usr/bin/env python3
"""Prepare a fixed three-arm comparison; does not launch models or publish traces."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CASES = {entry['id']: entry for entry in json.loads(
    (ROOT / 'evaluations/cases.json').read_text())['cases']}
DEFAULT_CASES = ['skills-snapshot', 'empty-entrypoint', 'proxy-retry']


def snapshot_digest(path):
    digest = hashlib.sha256()
    for file in sorted(p for p in path.rglob('*') if p.is_file()):
        digest.update(file.relative_to(path).as_posix().encode() + b'\0' + file.read_bytes() + b'\0')
    return digest.hexdigest()


def prepare(out, baseline, arms, cases=DEFAULT_CASES):
    out.mkdir(parents=True, exist_ok=False, mode=0o700)
    # Author-source context loading, not user-profile installation.
    contexts = out / 'contexts'
    current = contexts / 'current-0.2.0'
    current.mkdir(parents=True)
    prefix = 'src/skills/mcp-boundary/'
    files = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', baseline, prefix], cwd=ROOT, text=True).splitlines()
    for source in files:
        destination = current / source.removeprefix(prefix)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(subprocess.check_output(['git', 'show', f'{baseline}:{source}'], cwd=ROOT))
    candidate = contexts / 'candidate'
    shutil.copytree(ROOT / prefix, candidate)
    manifest = {'schema_version': 1, 'baseline_revision': baseline, 'candidate_version': (ROOT / 'VERSION').read_text().strip(),
                'skill_context_sha256': {name: snapshot_digest(path) for name, path in [('current-0.2.0', current), ('candidate', candidate)]},
                'context_delivery': 'explicit file loading; not installed-skill activation', 'jobs': []}
    jobs = []
    for case in cases:
        entry = CASES[case]
        task = entry['task']
        for arm in arms:
            name = f'{case}-{arm}'
            target = out / 'workspaces' / name
            shutil.copytree(ROOT / 'evaluations/fixtures' / case, target, ignore=shutil.ignore_patterns('__pycache__'))
            context = '' if arm == 'none' else f'First load the MCP skill at {contexts / arm / "SKILL.md"} and its relevant references; use it to perform this task. '
            writable = ', '.join(entry['allowed_files'])
            task_text = context + task + f'\nThe exact authorized read/write target is {target}. You may also read the supplied skill context if any. Do not inspect other arms, evaluation checkers, the source repository, personal instructions or private continuity. You are not alone; do not revert others. Do not delegate. Edit only {writable}; no new dependencies or infrastructure. Run relevant local checks and repair within this turn; no Git, network, installation or account actions. Return a concise fix and verification report. Outcome requires implementation, not an audit report.'
            jobs.append({'id': name, 'verb': 'run', 'cwd': str(target), 'permissions': 'full', 'task': task_text, 'category': 'implementation'})
            manifest['jobs'].append({'id': name, 'case': case, 'arm': arm, 'target': str(target),
                                     'fixture_sha256': hashlib.sha256((target/entry['allowed_files'][0]).read_bytes()).hexdigest(),
                                     'fixture_files': {file.relative_to(target).as_posix(): hashlib.sha256(file.read_bytes()).hexdigest()
                                                       for file in sorted(target.rglob('*')) if file.is_file()},
                                     'allowed_files': entry['allowed_files']})
    (out / 'comparison.json').write_text(json.dumps(manifest, indent=2)+'\n')
    spec = {'schema': 'cwr.acp.order-spec/1', 'maxConcurrency': 1, 'capabilities': {'sharedWorkerHome': 'unvalidated'}, 'shared': '', 'jobs': jobs}
    (out / 'orders.json').write_text(json.dumps(spec, indent=2)+'\n')
    print(json.dumps({'comparison': str(out / 'comparison.json'), 'order_spec': str(out / 'orders.json'), 'jobs': len(jobs)}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True, help='New local-only evidence directory outside the worktree')
    parser.add_argument('--baseline', default='v0.2.0')
    parser.add_argument('--arms', nargs='+', choices=['none', 'current-0.2.0', 'candidate'], default=['none', 'current-0.2.0', 'candidate'])
    parser.add_argument('--cases', nargs='+', choices=list(CASES), default=DEFAULT_CASES,
                        help='Case IDs; defaults to the three October cases')
    args = parser.parse_args()
    out = args.out.resolve()
    if out.is_relative_to(ROOT):
        parser.error('Raw comparison workspaces and traces must stay outside the Git worktree')
    prepare(out, args.baseline, args.arms, args.cases)


if __name__ == '__main__':
    main()
