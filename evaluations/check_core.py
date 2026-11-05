"""Independent acceptance for the six original, local-only behavior cases."""
from __future__ import annotations

import ast
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile

FIXTURES = Path(__file__).resolve().parent / 'fixtures'


def check_scope(case, target, allowed_files):
    """Evidence and adjacent files stay immutable; generated Python caches are inert."""
    baseline = FIXTURES / case
    files = {path.relative_to(target).as_posix(): path for path in target.rglob('*')
             if path.is_file() and '__pycache__' not in path.parts}
    expected = {path.relative_to(baseline).as_posix(): path
                for path in baseline.rglob('*')
                if path.is_file() and '__pycache__' not in path.parts}
    assert files.keys() == expected.keys(), 'repair added or removed unrelated files'
    for name in expected.keys() - set(allowed_files):
        assert files[name].read_bytes() == expected[name].read_bytes(), \
            'repair changed protected evidence or adjacent files: ' + name


def check_stdio(target):
    requests = [
        {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
         'params': {'name': 'read_fixture', 'arguments': {'key': 'public'}}},
        {'jsonrpc': '2.0', 'id': 2, 'method': 'tools/call',
         'params': {'name': 'read_fixture', 'arguments': {'key': 'private'}}},
        {'jsonrpc': '2.0', 'id': 3, 'method': 'missing', 'params': {}},
    ]
    run = subprocess.run([sys.executable, '-B', str(target / 'app.py')],
                         input=''.join(json.dumps(r) + '\n' for r in requests),
                         capture_output=True, text=True, timeout=10, cwd=target)
    assert run.returncode == 0, 'stdio child did not exit cleanly: ' + run.stderr
    try:
        responses = [json.loads(line) for line in run.stdout.splitlines()]
    except json.JSONDecodeError as exc:
        raise AssertionError('stdio stdout contains non-protocol output') from exc
    assert len(responses) == 3, 'stdio framing lost or added a response'
    assert [r.get('id') for r in responses] == [1, 2, 3], 'request IDs changed'
    assert all(r.get('jsonrpc') == '2.0' for r in responses)
    assert responses[0].get('result', {}).get('content') == [
        {'type': 'text', 'text': 'Public fixture content'}], 'stdio still requires HTTP controls'
    assert responses[1].get('error', {}).get('code') == -32602, 'unauthorized read reached data'
    assert responses[2].get('error', {}).get('code') == -32601, 'unknown method accepted'


def check_host(target):
    observations = json.loads((target / 'observations.json').read_text())
    result = json.loads((target / 'assessment.json').read_text())
    assert result['local_render'] == {'status': 'verified', 'evidence': ['local-render']}, \
        'valid local render evidence was lost'
    assert result['named_host']['name'] == observations['requested_host'], 'requested host changed'
    for key in ('named_host', 'owner_acceptance'):
        assert result[key]['status'] == 'not_verified', 'local evidence promoted to ' + key
        assert result[key]['evidence'] == [], 'nonqualifying or fabricated evidence for ' + key


def check_migration(module):
    for caller in ('cli', 'service'):
        value = {'caller': caller, 'items': [1, 'two']}
        assert module.invoke(caller, value) == {'transport': 'streamable-http', 'value': value}, \
            'active caller still selects the legacy transport: ' + caller
    assert set(module.CALLERS) == {'cli', 'service'}, 'a public caller disappeared'
    assert module.ENTRYPOINTS == {'current': module.current_handler}, 'legacy entrypoint remains active'
    assert not hasattr(module, 'legacy_handler'), 'unused legacy handler was not retired'


def check_authorization(module):
    wrong_grants = [set(), {('bob', 'delete', 'alpha')},
                    {('alice', 'read', 'alpha')}, {('alice', 'delete', 'beta')}]
    for route in (module.call_tool, module.call_app,
                  lambda store, args, principal, grants: store.delete(args, principal, grants)):
        for grants in wrong_grants:
            store = module.Store()
            before = copy.deepcopy((store.items, store.effects))
            try:
                route(store, {'item_id': 'alpha'}, 'alice', grants)
            except PermissionError:
                pass
            else:
                raise AssertionError('schema-valid delete bypassed effect authorization')
            assert (store.items, store.effects) == before, 'denied delete already caused an effect'
        store = module.Store()
        assert route(store, {'item_id': 'alpha'}, 'alice', {('alice', 'delete', 'alpha')}) == 'A'
        assert store.items == {'beta': 'B'} and store.effects == [('alice', 'alpha')]
        for args in ({}, {'item_id': 7}, {'item_id': ''}, {'item_id': 'beta', 'grant': True}):
            before = copy.deepcopy((store.items, store.effects))
            try:
                route(store, args, 'alice', {('alice', 'delete', 'beta')})
            except ValueError:
                pass
            else:
                raise AssertionError('malformed delete input accepted')
            assert (store.items, store.effects) == before


def check_runtime(module):
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        revision = 'acceptance-revision-with-a-fresh-runtime'
        workspace = module.Workspace(root, revision)
        source = (root / 'source/server.py').read_bytes()
        workspace.repair()
        assert (root / 'source/server.py').read_bytes() == source, 'source authority was overwritten'
        assert (root / 'build/server.py').read_bytes() == source, 'build still contains old bytes'
        assert (root / 'installed/server.py').read_bytes() == source, 'installed bytes are stale'
        command = json.loads((root / 'runtime.json').read_text())['command']
        assert isinstance(command, list) and len(command) == 2
        assert Path(command[0]).name in {'python', 'python3', Path(sys.executable).name}
        assert command[1] == 'installed/server.py', 'active command bypasses the installed artifact'
        # The observer launches the selected installed file, independent of any candidate report.
        # Changing build bytes afterwards must not change the selected runtime's response.
        (root / 'build/server.py').write_text('raise RuntimeError("unselected build")\n')
        run = subprocess.run([sys.executable, '-B', command[1]], cwd=root,
                             text=True, capture_output=True, timeout=10)
        assert run.returncode == 0, 'activated runtime failed: ' + run.stderr
        assert json.loads(run.stdout) == {'revision': revision}, 'fresh process still runs old bytes'


def check_small_change(module, target):
    expected = (FIXTURES / 'small-change-stop-rule/app.py').read_text().replace(
        'Look up a filesystem path.', 'Look up a project by project ID.')
    assert ast.dump(ast.parse((target / 'app.py').read_text())) == ast.dump(ast.parse(expected)), \
        'bounded description repair changed adjacent code or left the old description'
    assert module.lookup({'project_id': 'demo'}) == {'name': 'Demonstration project'}
    assert module.lookup({'project_id': 'missing'}) is None
    for args in ({}, {'project_id': ''}, {'project_id': 7}, {'project_id': 'demo', 'path': '/tmp'}):
        try:
            module.lookup(args)
        except ValueError:
            pass
        else:
            raise AssertionError('description repair weakened input validation')


def check(case, target, loader, allowed_files):
    check_scope(case, target, allowed_files)
    if case == 'stdio-http-category-error':
        check_stdio(target)
    elif case == 'local-render-host-overclaim':
        check_host(target)
    else:
        module = loader(target)
        if case == 'migration-live-old-caller':
            check_migration(module)
        elif case == 'schema-effect-authorization':
            check_authorization(module)
        elif case == 'source-artifact-runtime-drift':
            check_runtime(module)
        elif case == 'small-change-stop-rule':
            check_small_change(module, target)
        else:
            raise ValueError('unknown core case')
    check_scope(case, target, allowed_files)
