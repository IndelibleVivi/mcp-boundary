# Guide validation tools

This directory is the maintained validation-tool authority for the Guide inside
the unified MCP Boundary repository. Current CI, tests, and maintainer commands
must call these tools rather than execute scripts from the frozen historical
skill at `guide/skill/mcp-server-engineering/`.

The Python files are maintained Apache-2.0 derivatives of the historical Field
Guide validators. Their source mapping is recorded in
`provenance/SOURCES.json`, and the applicable license text is
`LICENSES/Apache-2.0.txt`.

`check_profile_mirrors.py` intentionally supports verification only. The
historical package keeps its former write-capable script for reproducibility,
but current tooling must not regenerate or maintain the frozen snapshot.
