"""The new handler works, but public callers still select the old transport."""


def legacy_handler(value):
    return {'transport': 'legacy-sse', 'value': value}


def current_handler(value):
    return {'transport': 'streamable-http', 'value': value}


ENTRYPOINTS = {'legacy': legacy_handler, 'current': current_handler}
CALLERS = {'cli': 'legacy', 'service': 'legacy'}


def invoke(caller, value):
    return ENTRYPOINTS[CALLERS[caller]](value)
