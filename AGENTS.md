# MCP Boundary repository contract

## Truth owners

- `src/skills/mcp-boundary/` is the author source for the skill, agent metadata, assets, and bundled references.
- `src/plugin/plugin.json` is the single author source for both package manifest formats. Its portable shape is copied to the package root; `extensions.com.openai` is normalized into the Codex-native top-level `interface` block.
- `plugins/mcp-boundary/` is generated distributable output. Change `src/`, legal, provenance, or approved public assets first, then run `python3 scripts/build_plugin.py --write`.
- `plugins/mcp-boundary/.codex-plugin/plugin.json` is required generated output for Codex ingestion. Do not hand-edit either generated manifest.
- `brand/`, `site/`, and `previews/` contain the one approved public identity: Offset + Porcelain. Do not reintroduce private identity comparisons, alternative marks, alternative palettes, or appearance controls.
- `.github/workflows/pages.yml` is the canonical Pages deployment path and publishes only `site/` to the `github-pages` environment.
- `docs/current-state.md` owns volatile source/package/publication status. README files own durable public product and installation behavior.

## Boundaries

- This is a pure-skill plugin. Adding an MCP server, app connector, hook, lifecycle service, authentication flow, telemetry, or remote runtime is an architecture change that requires owner intent.
- Keep the portable root `plugin.json` and Codex-native `.codex-plugin/plugin.json` in semantic parity through `scripts/build_plugin.py`; both are intentional consumers of the one author manifest.
- Treat bundled protocol profiles as dated evidence. Verify current official sources for “latest” protocol, host, SDK, or plugin-platform claims.
- Preserve the file-level license and provenance map in `LICENSING.md` and `provenance/SOURCES.json`.
- Private Faye/Cove continuity, design studies, raw exports, and handoffs never enter this worktree or a remote. Keep them in the configured private-continuity root outside the worktree.
- Do not change the Pages topology or custom domain, submit to an external plugin directory, install into a user profile, or publish a release without matching authority. Building a local ZIP does not imply any of those states.

## Verification

For a source change, run the narrow relevant checks. The full local release-candidate set is:

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py
skill-validate src/skills/mcp-boundary
skill-validate plugins/mcp-boundary/skills/mcp-boundary
python3 scripts/package_plugin.py
```

Run the browser workflow in `tests/CHECKS.md` when changing `site/`, the standalone page, browser interaction, screenshots, or public no-network claims.

Before commit or push, inspect status and staged diff, stage explicit public paths, and verify that private material, secrets, test reports, browser artifacts, and `dist/` are absent.

## Documentation triggers

- Update README files for user-visible capabilities, installation, defaults, limitations, privacy/security boundaries, or public identity.
- Update this file when canonical paths, generated/source boundaries, authority gates, or required checks change.
- Update `docs/current-state.md` when source, package, installed, deployed, Pages, directory, or release status changes.
- Update `CHANGELOG.md` only for shipped repository versions; do not describe directory or host publication that has not occurred.
