#!/usr/bin/env python3
"""Independent outcome checks for the October synthetic repair tasks."""
import argparse
import copy
import importlib.util
import json
from pathlib import Path


def load(target):
    spec = importlib.util.spec_from_file_location('candidate', target / 'app.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def check(case, target):
    m = load(target)
    if case == 'skills-snapshot':
        server, importer = m.Server(), m.Importer()
        assert importer.scan(server)['skills_updated']
        first = copy.deepcopy(importer.snapshot)
        server.deploy('Workflow v2 — changed supporting file')
        assert importer.snapshot == first, 'deployment alone changed imported snapshot'
        assert server.read(m.SUPPORT).endswith('supporting file')
        assert server.list_skills()[0] == server.get_skill(m.URI), 'list/get disagree'
        assert importer.scan(server)['skills_updated'], 'valid changed bytes cannot import'
        assert importer.snapshot[m.SUPPORT] == server.read(m.SUPPORT)
        old = copy.deepcopy(importer.snapshot)
        original = server.list_skills
        def damaged():
            entries = original()
            entries[0]['resources'][0]['digest'] = 'sha256:' + '0' * 64
            return entries
        server.list_skills = damaged
        result = importer.scan(server)
        assert result['tools'] == ['inspect'] and not result['skills_updated']
        assert importer.snapshot == old, 'failed import lost last valid snapshot'
    elif case == 'empty-entrypoint':
        initial = m.open_directly()
        assert initial['structuredContent']['state'] == 'initial'
        assert initial['content'][0]['text'].strip()
        assert 'context' not in m.DESCRIPTOR['inputSchema'].get('required', []), 'schema still requires model-filled context'
        assert m.ordinary_call('chosen')['structuredContent'] == {'state': 'ready', 'context': 'chosen'}
        for args in ({'context': ''}, {'context': 7}, {'unexpected': 'x'}):
            try:
                m.call(args)
            except ValueError:
                pass
            else:
                raise AssertionError('invalid input accepted')
        m.DESCRIPTOR['_meta'].pop('openai/ui')
        assert m.ordinary_call('fallback')['structuredContent']['context'] == 'fallback'
    elif case == 'proxy-retry':
        store = m.Store()
        result = m.retry_once(m.Proxy(store), 'alice', 'write', 'op-1', {'value': 1})
        assert result['status'] == 'completed' and len(store.effects) == 1, 'retry duplicated effect'
        assert store.execute('alice', 'write', 'op-1', {'value': 1}, 'rpc-new') == result
        try:
            conflict = store.execute('alice', 'write', 'op-1', {'value': 2}, 'rpc-conflict')
        except Exception:
            pass
        else:
            assert isinstance(conflict, dict) and conflict.get('status') == 'conflict', 'operation ID reused with changed payload'
        assert len(store.effects) == 1
        store.execute('bob', 'write', 'op-1', {'value': 1}, 'rpc-other')
        store.execute('alice', 'other-action', 'op-1', {'value': 1}, 'rpc-action')
        assert len(store.effects) == 3, 'operation identity crosses principal/action'
    else:
        raise ValueError('unknown case')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('case', choices=['skills-snapshot', 'empty-entrypoint', 'proxy-retry'])
    parser.add_argument('target', type=Path)
    args = parser.parse_args()
    try:
        check(args.case, args.target)
    except Exception as exc:
        print(json.dumps({'case': args.case, 'passed': False, 'error': str(exc)}))
        return 1
    print(json.dumps({'case': args.case, 'passed': True}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
