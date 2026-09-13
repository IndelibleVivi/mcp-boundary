# Privacy

Effective: 2026-09-14

## Plugin boundary

MCP Boundary is a pure-skill plugin. The distributed package contains local instruction text, reference files, and static identity assets. It does not:

- run a developer-operated server;
- create an account or authentication flow;
- collect analytics or telemetry;
- transmit repository content to Faye, Cove, or an MCP Boundary endpoint;
- store user prompts or project files in an MCP Boundary database;
- require an API key or secret.

An agent using the skill may inspect files, run commands, use a browser, connect to a named host, or call an external service when the user's task, installed tools, and permissions authorize that work. Those actions occur through the user's environment and the relevant platform or service, not through an MCP Boundary service. Their privacy and retention terms apply independently.

## Website boundary

The website source uses no analytics, remote fonts, cookies, account storage, or external runtime assets. It makes no programmatic network request to a project-operated endpoint. External links transmit a request only when a visitor follows them.

The official static website is hosted by GitHub Pages at <https://indeliblevivi.github.io/mcp-boundary/>. GitHub may process ordinary request metadata under its own terms. MCP Boundary adds no project analytics, cookies, account storage, or project-operated collection endpoint on top of that hosting layer. Consult [`docs/current-state.md`](docs/current-state.md) for the observed deployment state.

## Reports

Security or privacy concerns may be reported through the repository's GitHub issue interface without including credentials, private repositories, personal exports, or other sensitive data.
