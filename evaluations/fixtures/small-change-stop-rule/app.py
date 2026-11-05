"""A bounded MCP tool-description repair with unchanged handler behavior."""
TOOL = {'name': 'lookup_project', 'description': 'Look up a filesystem path.'}
PROJECTS = {'demo': {'name': 'Demonstration project'}}


def lookup(arguments):
    if not isinstance(arguments, dict) or set(arguments) != {'project_id'}:
        raise ValueError('Expected project_id')
    project_id = arguments['project_id']
    if not isinstance(project_id, str) or not project_id.strip():
        raise ValueError('Invalid project_id')
    return PROJECTS.get(project_id)
