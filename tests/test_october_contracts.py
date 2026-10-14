from __future__ import annotations
import copy
import json
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class OctoberContracts(unittest.TestCase):
    def test_repair_fixtures_reject_the_broken_baselines(self):
        for case, reason in [('skills-snapshot', 'valid changed bytes cannot import'),
                             ('empty-entrypoint', 'Missing required context'),
                             ('proxy-retry', 'retry duplicated effect')]:
            run = subprocess.run([sys.executable, 'evaluations/check_candidate.py', case,
                                  str(ROOT / 'evaluations/fixtures' / case)], cwd=ROOT, capture_output=True, text=True)
            self.assertEqual(run.returncode, 1)
            self.assertEqual(json.loads(run.stdout)['error'], reason)

    def test_recipe_register_rejects_missing_observation_dimensions(self):
        with tempfile.TemporaryDirectory() as directory:
            guide = Path(directory) / 'guide'
            shutil.copytree(ROOT / 'guide', guide, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
            original = json.loads((guide / 'VERSION-REGISTER.json').read_text())
            entry = original['extension_host_profiles'][0]
            for field in ['hosts', 'assessed_at', 'extension_revision', 'consumption']:
                broken = copy.deepcopy(entry)
                broken.pop(field)
                register = copy.deepcopy(original)
                register['extension_host_profiles'] = [broken]
                path = guide / 'VERSION-REGISTER.json'
                path.write_text(json.dumps(register))
                run = subprocess.run([sys.executable, str(ROOT / 'tools/guide-validation/validate_version_register.py'), str(path)],
                                     text=True, capture_output=True)
                self.assertEqual(run.returncode, 1)
                self.assertIn(field, run.stderr)

    def test_archive_roundtrip_checks_all_distributed_bytes(self):
        for command in [('scripts/package_plugin.py',), ('scripts/check_plugin_archive.py',)]:
            run = subprocess.run([sys.executable, *command], cwd=ROOT, text=True, capture_output=True)
            self.assertEqual(run.returncode, 0, run.stdout + run.stderr)

    def test_standalone_link_scan_keeps_its_own_boundary(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            scan = base / 'scan'
            scan.mkdir()
            (base / 'outside.md').write_text('Outside the declared scan root.\n')
            (scan / 'README.md').write_text('[outside](../outside.md)\n')
            run = subprocess.run([sys.executable, 'tools/guide-validation/check_markdown_links.py', str(scan)],
                                 cwd=ROOT, capture_output=True, text=True)
            self.assertEqual(run.returncode, 1)
            self.assertIn('link escapes repository', run.stderr)
