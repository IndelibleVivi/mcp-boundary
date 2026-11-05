"""Shape-valid delete requests reach the store without an effect grant."""
import copy


class Store:
    def __init__(self):
        self.items = {'alpha': 'A', 'beta': 'B'}
        self.effects = []

    def delete(self, arguments, principal, grants):
        if not isinstance(arguments, dict) or set(arguments) != {'item_id'}:
            raise ValueError('Invalid arguments')
        item_id = arguments['item_id']
        if not isinstance(item_id, str) or not item_id:
            raise ValueError('Invalid item ID')
        self.effects.append((principal, item_id))
        return self.items.pop(item_id, None)


def call_tool(store, arguments, principal, grants):
    return store.delete(copy.deepcopy(arguments), principal, grants)


def call_app(store, arguments, principal, grants):
    return store.delete(copy.deepcopy(arguments), principal, grants)
