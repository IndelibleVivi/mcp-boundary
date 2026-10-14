"""Synthetic global/thread entrypoint and ordinary tool call."""
DESCRIPTOR = {
    'name': 'inspect_workspace',
    'inputSchema': {'type': 'object', 'properties': {'context': {'type': 'string'}},
                    'required': ['context'], 'additionalProperties': False},
    '_meta': {'ui': {'resourceUri': 'ui://example/inspect'},
              'openai/ui': {'entrypoints': [{'type': 'global'}, {'type': 'thread'}]}}
}


def call(arguments):
    schema = DESCRIPTOR['inputSchema']
    if not isinstance(arguments, dict) or set(arguments) - set(schema['properties']):
        raise ValueError('Invalid arguments')
    if any(key not in arguments for key in schema.get('required', [])):
        raise ValueError('Missing required context')
    context = arguments['context']
    if not isinstance(context, str) or not context.strip():
        raise ValueError('Invalid context')
    return {'content': [{'type': 'text', 'text': 'Inspecting ' + context}],
            'structuredContent': {'state': 'ready', 'context': context}}


def open_directly():
    return call({})


def ordinary_call(context):
    return call({'context': context})
