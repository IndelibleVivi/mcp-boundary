effect_count = 0


def run(arguments: dict[str, object]) -> str:
    global effect_count
    value = arguments.get("value")
    if not isinstance(value, str) or not value:
        raise ValueError("value must be a non-empty string")
    effect_count += 1
    return value.upper()
