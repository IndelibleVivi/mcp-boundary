# MCP Boundary repository contract

## Truth owners

- `src/skills/mcp-boundary/` is the author source for the active skill, agent metadata, assets, and bundled references. It is the only maintained and distributed skill.
- `src/plugin/plugin.json` is the author source for the Codex-native manifest. It uses top-level `skills` and `interface` fields.
- `plugins/mcp-boundary/` is generated distributable output. Change `src/`, legal, provenance, or approved public assets first, then run `python3 scripts/build_plugin.py --write`.
- `plugins/mcp-boundary/.codex-plugin/plugin.json` is the only distributed manifest and is copied byte-for-byte from the author source. Do not hand-edit it.
- `guide/` and `lab/` are ordinary maintained subtrees of this repository, not mirrors of still-authoritative upstream repositories. `provenance/UPSTREAMS.lock.json` owns the initial-import pins and continuing-authority record; `provenance/SOURCES.json` owns the exact-copy and influence map.
- `guide/skill/mcp-server-engineering/` is frozen historical release and evaluation material. It is not active, not distributed, not a recommended installation path, and not a maintenance target.
- `evaluations/` owns behavior cases and scoring rules for the installed skill. Registered cases do not establish behavior change without an executed run.
- `brand/`, `site/`, and `previews/` contain the one approved public identity: Offset + Porcelain. Do not reintroduce private identity comparisons, alternative marks, alternative palettes, or appearance controls.
- Root `.github/workflows/` owns repository CI and deployment: `pages.yml` is the canonical Pages path and publishes only `site/` to the `github-pages` environment, and `validate.yml` runs the plugin, Guide, and Lab checks. The imported `guide/.github/workflows/` and `lab/.github/workflows/` files are retired historical sources and are not executed.
- `docs/current-state.md` owns volatile source/package/publication status. README files own durable public product and installation behavior.

## Boundaries

- The distributed plugin is a pure-skill package. Adding an MCP server, app connector, hook, lifecycle service, authentication flow, telemetry, or remote runtime to it is an architecture change that requires owner intent. The executable Lab under `lab/` is repository evidence source, not plugin runtime.
- Keep one distributed skill. Do not add a second install path, revive the historical Guide skill, or copy its workflow wholesale into the active skill. The active skill must stay self-contained: its references must resolve inside its own package, and installed execution must not depend on reading `guide/`.
- There is no upstream re-import, updater, or synchronization path. Do not reintroduce a script that replaces `guide/` or `lab/`; later upstream changes arrive as ordinary reviewed pull requests with their own provenance note.
- Keep root `plugins/mcp-boundary/plugin.json` absent. Its presence selects the submission system's Agent Plugins conversion path and bypasses the native manifest metadata, including composer icon and logo fields.
- ZIP submission currently admits skills only. Keep `interface.screenshots` and packaged screenshot assets absent; public website previews remain outside the plugin package.
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

Run the affected subtree checks when changing `guide/`:

```bash
cd guide
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -v
python3 skill/mcp-server-engineering/scripts/validate_version_register.py VERSION-REGISTER.json
python3 skill/mcp-server-engineering/scripts/sync_profile_mirrors.py --check VERSION-REGISTER.json
python3 skill/mcp-server-engineering/scripts/check_bilingual_coverage.py .
python3 tools/validate_evaluation_corpus.py .
python3 skill/mcp-server-engineering/scripts/validate_skill_package.py skill/mcp-server-engineering
python3 skill/mcp-server-engineering/scripts/check_markdown_links.py .
```

Run the affected subtree checks when changing `lab/`:

```bash
cd lab
npm ci
npm run check
```

Run the browser workflow in `tests/CHECKS.md` when changing `site/`, the standalone page, browser interaction, screenshots, or public no-network claims.

Before commit or push, inspect status and staged diff, stage explicit public paths, and verify that private material, secrets, test reports, browser artifacts, and `dist/` are absent.

## Documentation triggers

- Update README files for user-visible capabilities, installation, defaults, limitations, privacy/security boundaries, or public identity.
- Update this file when canonical paths, generated/source boundaries, authority gates, or required checks change.
- Update `docs/current-state.md` when source, package, installed, deployed, Pages, directory, or release status changes.
- Update `CHANGELOG.md` only for shipped repository versions; do not describe directory or host publication that has not occurred.
- Keep current-facing documentation (`README*`, `docs/current-state.md`, `docs/UNIFIED-WORKSPACE.md`, `guide/README*`, `guide/MAINTENANCE*`, `lab/README*`, `lab/docs/current-state*`, `lab/AGENTS.md`) consistent with one continuing authority in this repository. Imported historical prose elsewhere may keep dated facts when they are clearly historical.
