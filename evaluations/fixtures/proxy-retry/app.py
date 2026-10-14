"""Synthetic response-blocking proxy, business store and retrying client."""
import copy


class Store:
    def __init__(self):
        self.effects = []
        self.completed = {}

    def execute(self, principal, action, operation_id, payload, rpc_id):
        key = rpc_id  # transport identity changes on retry
        if key in self.completed:
            return copy.deepcopy(self.completed[key])
        self.effects.append((principal, action, copy.deepcopy(payload)))
        result = {'status': 'completed', 'effect': len(self.effects)}
        self.completed[key] = result
        return copy.deepcopy(result)


class Proxy:
    def __init__(self, store):
        self.store = store
        self.block_next = True

    def call(self, **request):
        result = self.store.execute(**request)
        if self.block_next:
            self.block_next = False
            raise RuntimeError('Gateway blocked response')
        return result


def retry_once(proxy, principal, action, operation_id, payload):
    for attempt in range(2):
        try:
            return proxy.call(principal=principal, action=action, operation_id=operation_id,
                              payload=payload, rpc_id=f'{operation_id}-request-{attempt}')
        except RuntimeError:
            if attempt:
                raise
