"""Parent-owned JSON-lines MCP specimen; no HTTP server or external files."""
import json
import sys

CATALOG = {'public': 'Public fixture content'}


def dispatch(request):
    if not request.get('origin'):
        return {'jsonrpc': '2.0', 'id': request.get('id'),
                'error': {'code': -32000, 'message': 'HTTP Origin required'}}
    if request.get('method') != 'tools/call':
        return {'jsonrpc': '2.0', 'id': request.get('id'),
                'error': {'code': -32601, 'message': 'Method not found'}}
    params = request.get('params', {})
    key = params.get('arguments', {}).get('key')
    if params.get('name') != 'read_fixture' or key not in CATALOG:
        return {'jsonrpc': '2.0', 'id': request.get('id'),
                'error': {'code': -32602, 'message': 'Read not allowed'}}
    return {'jsonrpc': '2.0', 'id': request['id'],
            'result': {'content': [{'type': 'text', 'text': CATALOG[key]}]}}


def serve():
    print('Fixture server started', flush=True)
    for line in sys.stdin:
        print(json.dumps(dispatch(json.loads(line))), flush=True)


if __name__ == '__main__':
    serve()
