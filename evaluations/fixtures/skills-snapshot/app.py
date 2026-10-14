"""Synthetic server and static importer; no remote host is contacted."""
import copy
import hashlib

URI = 'skill://example/inspect/SKILL.md'
SUPPORT = 'skill://example/inspect/references/steps.md'


def digest(text):
    return 'sha256:' + hashlib.sha256(text.encode()).hexdigest()


class Server:
    def __init__(self):
        self.files = {URI: '---\nname: inspect\ndescription: Inspect a workspace.\n---\nRead references/steps.md.\n', SUPPORT: 'Workflow v1'}
        self.published = self._entry()

    def _entry(self):
        return {'uri': URI, 'frontmatter': {'name': 'inspect', 'description': 'Inspect a workspace.'},
                'resources': [{'uri': uri, 'digest': digest(text), 'size': len(text.encode())}
                              for uri, text in self.files.items()]}

    def deploy(self, text):
        self.files[SUPPORT] = text
        # BUG: deployed bytes change but catalog still advertises old bytes.

    def list_skills(self):
        return [copy.deepcopy(self.published)]

    def get_skill(self, uri):
        if uri != URI:
            raise KeyError(uri)
        return copy.deepcopy(self.published)

    def read(self, uri):
        return self.files[uri]


class Importer:
    def __init__(self):
        self.snapshot = {}

    def scan(self, server):
        candidate = {}
        for entry in server.list_skills():
            for resource in entry['resources']:
                content = server.read(resource['uri'])
                if digest(content) != resource['digest'] or len(content.encode()) != resource['size']:
                    return {'tools': ['inspect'], 'skills_updated': False}
                candidate[resource['uri']] = content
        self.snapshot = candidate
        return {'tools': ['inspect'], 'skills_updated': True}
