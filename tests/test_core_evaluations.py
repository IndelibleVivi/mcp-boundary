from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / 'evaluations/fixtures'
CORE = [entry['id'] for entry in json.loads((ROOT / 'evaluations/cases.json').read_text())['cases']
        if entry['suite'] == 'core']


def corrected(case, target):
    if case == 'local-render-host-overclaim':
        path = target / 'assessment.json'
        data = json.loads(path.read_text())
        for key in ('named_host', 'owner_acceptance'):
            data[key].update(status='not_verified', evidence=[])
        path.write_text(json.dumps(data))
        return
    path = target / 'app.py'
    text = path.read_text()
    if case == 'stdio-http-category-error':
        start = text.index("    if not request.get('origin'):")
        end = text.index("    if request.get('method')", start)
        text = text[:start] + text[end:]
        text = text.replace("print('Fixture server started', flush=True)",
                            "print('Fixture server started', file=sys.stderr, flush=True)")
    elif case == 'migration-live-old-caller':
        start = text.index('def legacy_handler(')
        end = text.index('def current_handler(', start)
        text = text[:start] + text[end:]
        text = text.replace("{'legacy': legacy_handler, 'current': current_handler}",
                            "{'current': current_handler}")
        text = text.replace("{'cli': 'legacy', 'service': 'legacy'}",
                            "{'cli': 'current', 'service': 'current'}")
    elif case == 'schema-effect-authorization':
        text = text.replace('        self.effects.append',
                            "        if (principal, 'delete', item_id) not in grants:\n"
                            "            raise PermissionError('Missing delete grant')\n"
                            '        self.effects.append')
    elif case == 'source-artifact-runtime-drift':
        text = text.replace('        self.build()\n',
                            '        self.build()\n        self.install()\n        self.activate()\n')
    elif case == 'small-change-stop-rule':
        text = text.replace('Look up a filesystem path.', 'Look up a project by project ID.')
    else:
        raise ValueError(case)
    path.write_text(text)


class CoreEvaluationTests(unittest.TestCase):
    def check_candidate(self, case, target, passed):
        run = subprocess.run([sys.executable, '-B', 'evaluations/check_candidate.py', case, str(target)],
                             cwd=ROOT, text=True, capture_output=True, timeout=20)
        self.assertEqual(run.returncode, 0 if passed else 1, run.stdout + run.stderr)
        data = json.loads(run.stdout)
        self.assertEqual(data['passed'], passed)
        return data

    def copy_case(self, case, directory):
        target = Path(directory) / case
        shutil.copytree(FIXTURES / case, target,
                        ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        return target

    def test_all_six_broken_baselines_fail_and_valid_repairs_pass(self):
        self.assertEqual(len(CORE), 6)
        for case in CORE:
            with self.subTest(case=case), tempfile.TemporaryDirectory() as directory:
                target = self.copy_case(case, directory)
                self.check_candidate(case, target, False)
                corrected(case, target)
                self.check_candidate(case, target, True)

    def test_partial_migration_and_blanket_denial_do_not_count_as_repairs(self):
        mutations = [
            ('migration-live-old-caller', "'service': 'current'", "'service': 'legacy'"),
            ('schema-effect-authorization', "if (principal, 'delete', item_id) not in grants:", 'if True:'),
            ('source-artifact-runtime-drift', '        self.install()\n', ''),
            ('source-artifact-runtime-drift', '        self.activate()\n', ''),
            ('stdio-http-category-error', 'file=sys.stderr, flush=True', 'flush=True'),
            ('small-change-stop-rule', "return PROJECTS.get(project_id)", 'return None'),
        ]
        for case, old, new in mutations:
            with self.subTest(case=case, mutation=old), tempfile.TemporaryDirectory() as directory:
                target = self.copy_case(case, directory)
                corrected(case, target)
                path = target / 'app.py'
                text = path.read_text()
                self.assertIn(old, text)
                path.write_text(text.replace(old, new))
                self.check_candidate(case, target, False)

    def test_real_installed_runtime_is_observed_instead_of_candidate_reports(self):
        case = 'source-artifact-runtime-drift'
        with tempfile.TemporaryDirectory() as directory:
            target = self.copy_case(case, directory)
            corrected(case, target)
            path = target / 'app.py'
            path.write_text(path.read_text().replace("'installed/server.py']", "'source/server.py']"))
            result = self.check_candidate(case, target, False)
            self.assertIn('bypasses the installed artifact', result['error'])

    def test_effect_authorization_is_checked_on_every_route_before_mutation(self):
        case = 'schema-effect-authorization'
        with tempfile.TemporaryDirectory() as directory:
            target = self.copy_case(case, directory)
            corrected(case, target)
            path = target / 'app.py'
            text = path.read_text().replace(
                "        if (principal, 'delete', item_id) not in grants:\n"
                "            raise PermissionError('Missing delete grant')\n", '')
            text = text.replace('def call_tool(store, arguments, principal, grants):\n',
                                'def call_tool(store, arguments, principal, grants):\n'
                                "    if (principal, 'delete', arguments.get('item_id')) not in grants:\n"
                                "        raise PermissionError('Missing delete grant')\n")
            path.write_text(text)
            self.check_candidate(case, target, False)

    def test_host_claim_ceiling_preserves_local_evidence_and_protects_inputs(self):
        case = 'local-render-host-overclaim'
        for mutation in ('drop-local', 'invent-host', 'rewrite-observation'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as directory:
                target = self.copy_case(case, directory)
                corrected(case, target)
                path = target / 'assessment.json'
                data = json.loads(path.read_text())
                if mutation == 'drop-local':
                    data['local_render']['status'] = 'not_verified'
                elif mutation == 'invent-host':
                    data['named_host'].update(status='verified', evidence=['imagined-host-test'])
                else:
                    (target / 'observations.json').write_text('{}')
                path.write_text(json.dumps(data))
                self.check_candidate(case, target, False)

    def test_small_task_rejects_unrelated_files(self):
        case = 'small-change-stop-rule'
        with tempfile.TemporaryDirectory() as directory:
            target = self.copy_case(case, directory)
            corrected(case, target)
            (target / 'audit.md').write_text('Unrequested broad audit')
            self.check_candidate(case, target, False)

    def test_preparation_selects_core_cases_without_changing_october_default(self):
        for cases, arms, expected in (([], [], 9), (CORE, ['candidate'], 6)):
            with self.subTest(cases=cases), tempfile.TemporaryDirectory() as directory:
                out = Path(directory) / 'comparison'
                # Exercise preparation with a synthetic baseline available even in a
                # depth-one CI checkout; this is not a released-treatment model run.
                command = [sys.executable, '-B', 'evaluations/prepare_comparison.py',
                           '--out', str(out), '--baseline', 'HEAD']
                if cases:
                    command.extend(['--cases', *cases, '--arms', *arms])
                run = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=30)
                self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
                manifest = json.loads((out / 'comparison.json').read_text())
                jobs = json.loads((out / 'orders.json').read_text())['jobs']
                self.assertEqual(len(jobs), expected)
                self.assertEqual(len(manifest['jobs']), expected)
                for record, job in zip(manifest['jobs'], jobs):
                    self.assertEqual(record['id'], job['id'])
                    self.assertTrue(record['fixture_files'])
                    for name in record['allowed_files']:
                        self.assertIn(name, record['fixture_files'])
                        self.assertIn(name, job['task'])
                    self.assertNotIn('check_candidate.py', job['task'])


if __name__ == '__main__':
    unittest.main()
