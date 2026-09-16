<p align="center"><img src="brand/exports/logo.png" width="152" alt="MCP Boundary mark"></p>

# MCP Boundary

**Make the real MCP path hold up.**

MCP Boundary is one MCP engineering project with three connected surfaces:

- **Plugin** — the installable `$mcp-boundary` skill that builds, repairs, migrates, and verifies real MCP implementations.
- **Guide** — the complete revision-aware engineering method, protocol profiles, case studies, and evidence discipline.
- **Lab** — the executable MCP App specimen and receipt machinery used to test source, process, artifact, runtime, and host claims.

The repository is intentionally a monorepo. A user installs one plugin. A maintainer has one place to improve the method, preserve the underlying explanation, exercise boundary behavior, and evaluate whether the skill changes agent outcomes.

The plugin stays small. It starts no server, registers no app connector, requests no authentication, sends no analytics or telemetry, and adds no runtime dependency. The Guide and the Lab are repository source: the executable Lab specimen is engineering evidence, not distributed plugin runtime.

> `0.2.0-alpha.1` is an unreleased source version. The externally published stable plugin remains `0.1.0` until a release is deliberately published.

[Website](https://indeliblevivi.github.io/mcp-boundary/) · [中文说明](README.zh-CN.md) · [Workspace design](docs/UNIFIED-WORKSPACE.md) · [Current state](docs/current-state.md) · [Licensing](LICENSING.md)

## Use the plugin

With a current Codex CLI that supports Agent Plugin marketplaces:

```bash
codex plugin marketplace add IndelibleVivi/mcp-boundary --ref main
codex plugin add mcp-boundary@mcp-boundary
```

This repository command installs the source at the selected Git ref; it is distinct from the externally published stable listing. To inspect a candidate before it reaches `main`, replace `main` with that branch name. Restart Codex after installation.

Example tasks:

```text
Use $mcp-boundary to repair this MCP integration. Trace the active caller,
entrypoint, transport, handler, package, and runtime; implement the fix and run
checks at the boundary that can prove it.
```

```text
Use $mcp-boundary to migrate this server to the selected protocol revision.
Preserve evidenced callers, retire superseded paths, and distinguish source,
process, artifact, runtime, and named-host results.
```

The skill may activate implicitly for clearly MCP-specific engineering work. It should stay out of ordinary APIs, generic frontend tasks, and incidental mentions of MCP.

## Repository map

```text
src/skills/mcp-boundary/   canonical skill source and packaged references
plugins/mcp-boundary/      generated distributable plugin

guide/                     imported Field Guide: method, profiles, cases, evidence
lab/                       imported executable MCP App production field lab
evaluations/               behavior cases and rubric for the installed skill

scripts/                   plugin packaging and workspace validation
tools/guide-validation/    maintained Guide validators
tests/                     plugin and unified-workspace contracts
site/                      bilingual product site and Guide/Lab library
provenance/                exact-copy and upstream-import records
```

Only `src/skills/mcp-boundary/` is the active distributed skill. `guide/skill/mcp-server-engineering/` is frozen historical release and evaluation material kept for provenance and reproducibility; it is not a recommended installation path, and the plugin manifest does not expose it.

## What the skill changes

MCP failures often survive because work stops at the wrong layer. Source can be correct while the installed artifact is stale. A local resource can render while the named host rejects it. A new transport can pass tests while a caller still enters the retired path. A schema-valid call can still be unauthorized to perform its effect.

MCP Boundary makes the agent:

1. fix the requested outcome and authorized scope;
2. trace the live path from caller or host to returned observation;
3. locate the layer that owns the behavior;
4. implement the complete change on the active path;
5. run the narrowest check that can reject the material wrong behavior;
6. close migration and runtime gaps without overstating what was observed.

It also has a stop rule: small, clear MCP changes should remain small.

## Build and verify

Plugin and workspace checks:

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py --no-report
```

Guide checks:

```bash
cd guide
python -m unittest discover -v
python ../tools/guide-validation/validate_version_register.py VERSION-REGISTER.json
python ../tools/guide-validation/check_profile_mirrors.py VERSION-REGISTER.json
python ../tools/guide-validation/check_bilingual_coverage.py .
python tools/validate_evaluation_corpus.py .
python ../tools/guide-validation/check_markdown_links.py .
```

Lab checks:

```bash
cd lab
npm ci
npm run check
```

The Lab remains a local surrogate unless an exact external host is exercised. Passing repository checks does not establish named-host admission, production activation, owner acceptance, or a general improvement in model behavior.

## Unified provenance

The initial monorepo import is pinned to:

- MCP Server Engineering Field Guide commit `87238302209d654358dd64eb3972677e4cacf256`;
- MCP App Production Field Lab commit `5a6deebbac96089588658452a00f2c52bad0dd2f`.

See [`provenance/UPSTREAMS.lock.json`](provenance/UPSTREAMS.lock.json). `guide/` and `lab/` are ordinary maintained subtrees here, with no re-import or synchronization path. This repository is the development authority for the unified project; the former repositories remain unarchived historical sources until a separate archival decision is deliberately completed.

Created by Faye & Cove.
