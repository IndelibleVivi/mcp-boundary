"""A real filesystem and child process model source/build/install/activation."""
import json
from pathlib import Path
import shutil


class Workspace:
    def __init__(self, root, revision):
        self.root = Path(root)
        for directory in ('source', 'build', 'installed'):
            (self.root / directory).mkdir(parents=True)
        self.source = self.root / 'source/server.py'
        self.artifact = self.root / 'build/server.py'
        self.installed = self.root / 'installed/server.py'
        self.config = self.root / 'runtime.json'
        self.source.write_text('import json\nprint(json.dumps(' +
                               repr({'revision': revision}) + '))\n')
        stale = 'import json\nprint(json.dumps({"revision": "old"}))\n'
        self.artifact.write_text(stale)
        self.installed.write_text(stale)
        self.config.write_text(json.dumps({'command': ['python', 'build/server.py']}))

    def build(self):
        shutil.copyfile(self.source, self.artifact)

    def install(self):
        shutil.copyfile(self.artifact, self.installed)

    def activate(self):
        self.config.write_text(json.dumps({'command': ['python', 'installed/server.py']}))

    def repair(self):
        self.build()
