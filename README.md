<p align="center"><img src="brand/exports/logo.png" width="152" alt="MCP Boundary mark"></p>

# MCP Boundary

**Make the real MCP path hold up.**

MCP Boundary is one MCP engineering project with three connected surfaces:

- **Plugin** — the installable `$mcp-boundary` skill that builds, repairs, migrates, and verifies real MCP implementations.
- **Guide** — the complete revision-aware engineering method, protocol profiles, case studies, and evidence discipline.
- **Lab** — the executable MCP App specimen and receipt machinery used to test source, process, artifact, runtime, and host claims.

The repository is intentionally a monorepo. A user installs one plugin. A maintainer has one place to improve the method, preserve the underlying explanation, exercise boundary behavior, and evaluate whether the skill changes agent outcomes.

The plugin stays small. It starts no server, registers no app connector, requests no authentication, sends no analytics or telemetry, and adds no runtime dependency. The Guide and the Lab are repository source: the executable Lab specimen is engineering evidence, not distributed plugin runtime.

> [`v0.3.0` is released on GitHub](https://github.com/IndelibleVivi/mcp-boundary/releases/tag/v0.3.0). Version `0.3.0` is also live in the [public plugin directory](https://chatgpt.com/plugins/plugins_6aa72e81844081918770991deb1dbfc8). The repository tag and directory listing remain separate release surfaces.

[Website](https://indeliblevivi.github.io/mcp-boundary/) · [中文说明](README.zh-CN.md) · [Workspace design](docs/UNIFIED-WORKSPACE.md) · [Current state](docs/current-state.md) · [0.3.0 release notes](docs/releases/0.3.0.md) · [0.3.0 directory record](docs/submission/0.3.0.md) · [Licensing](LICENSING.md)

## Use the plugin

With a current Codex CLI that supports Agent Plugin marketplaces:

```bash
codex plugin marketplace add IndelibleVivi/mcp-boundary --ref v0.3.0
codex plugin add mcp-boundary@mcp-boundary
```

The pinned install requires the `v0.3.0` release tag and remains distinct from the externally published directory artifact. Use `--ref main` only to follow development after release; source on `main` may move independently of a published package. Restart Codex after installation.

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

guide/                     maintained Field Guide: method, profiles, cases, evidence
lab/                       maintained executable MCP App production field lab
evaluations/               behavior cases and rubric for the installed skill

scripts/                   plugin packaging and workspace validation
tools/guide-validation/    maintained Guide validators
tests/                     plugin and unified-workspace contracts
site/                      bilingual product site and Guide/Lab library
provenance/                exact-copy and initial-import records
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

## 0.3.0 changes

`0.3.0` adds [Skills distribution](guide/profiles/skills-distribution-2026-10-15.md), [Cloudflare authorization/proxy paths](guide/profiles/cloudflare-deployment-2026-10-15.md), [OpenAI native entrypoints](guide/profiles/openai-entrypoints-2026-10-15.md), and [Tasks/Events selection](guide/profiles/async-selection-2026-10-15.md). The active skill bundles self-contained recipes. The existing July core profiles remain the protocol baseline; these additions address extension and host behavior.

Packaging uses root portable `plugin.json` with inline OpenAI presentation, plus a generated Codex compatibility manifest. Both come from `src/plugin/plugin.json`. Archive/loader-contract checks are separate from actual host installation and directory publication. The public listing shows `0.3.0`; its displayed version and metadata do not expose the uploaded ZIP digest.

The November refresh separates extension maturity from SEP status: Skills and Tasks are Beta, while Events remains Experimental. Skills references use the current Beta specification; the OpenAI recipe follows the October 21 host guidance. See [Lab testing](lab/docs/TESTING.en.md) for the consolidated package path and root CI.

Current OpenAI plugin updates that change metadata or bundled skills use a new complete ZIP with package checks and review. The `plugins/deploy/submission` page observed on 2026-11-06 describes that path; it is distinct from the continuous tool-review flow for hosted MCP servers. The `plugins/build/mcp-server` Skills-importer behavior recorded on 2026-10-15 remains historical host evidence for the local scanner surrogate, not a current OpenAI requirement.

[Behavior evaluations](evaluations/README.md) supply fixtures and independent checkers for all nine cases, including the six original core scenarios. The October model comparison remains limited to its three cases; those six core cases have no model result. Fixture/checker validation does not establish model behavior or named-host support. See the [0.3.0 release notes](docs/releases/0.3.0.md) for the evidence boundary.

## Build and verify

Plugin and workspace checks:

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py --no-report
python3 scripts/validate_skill_schema.py \
  src/skills/mcp-boundary \
  plugins/mcp-boundary/skills/mcp-boundary
python3 scripts/package_plugin.py
python3 scripts/check_plugin_archive.py
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

Use `npm run validate:runtime-lane` for the complete browser, entrypoint, clean package and isolated-runtime lane. It requires a clean committed checkout and installed bundled Playwright Chromium; see [Lab testing](lab/docs/TESTING.en.md) for exact prerequisites.

The Lab remains a local surrogate unless an exact external host is exercised. Passing repository checks does not establish named-host admission, production activation, owner acceptance, or a general improvement in model behavior.

## Related projects

- [Servotab](https://servotab.com/) — engineering methods for general repository planning, implementation, debugging, review, and verification.
- [Worker Routing](https://indeliblevivi.github.io/codex-worker-routing/) — delegate bounded responsibilities to native or optional ACP workers, with a local Dispatch dashboard for inspecting the work.

## Unified provenance

The initial monorepo import is pinned to:

- MCP Server Engineering Field Guide commit `87238302209d654358dd64eb3972677e4cacf256`;
- MCP App Production Field Lab commit `5a6deebbac96089588658452a00f2c52bad0dd2f`.

See [`provenance/UPSTREAMS.lock.json`](provenance/UPSTREAMS.lock.json). `guide/` and `lab/` are ordinary maintained subtrees here, with no re-import or synchronization path. This repository is the development authority for the unified project. The former Guide and Lab repositories are archived read-only historical sources; their migration front doors and homepage links route continued development here.

Created by Faye & Cove.
