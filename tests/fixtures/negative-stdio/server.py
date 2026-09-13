import sys


def serve() -> None:
    for line in sys.stdin:
        sys.stdout.write(line)
        sys.stdout.flush()
