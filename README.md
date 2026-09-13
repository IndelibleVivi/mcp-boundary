<p align="center"><img src="brand/exports/logo.png" width="152" alt="MCP Boundary mark"></p>

# MCP Boundary

**Make your MCP hold up.**

MCP Boundary is a pure-skill engineering plugin for building, inspecting, migrating, debugging, and verifying MCP systems at the boundary that actually owns the behavior: protocol, SDK, transport, capability/effect, or named host.

It is deliberately small. The plugin starts no server, registers no app connector, requests no authentication, sends no analytics, and adds no runtime dependency. It contributes one Codex skill plus dated engineering references.

[Website](https://indeliblevivi.github.io/mcp-boundary/) · [Website source](site/) · [中文说明](README.zh-CN.md) · [Current state](docs/current-state.md) · [Licensing](LICENSING.md)

## What it changes

MCP work often goes wrong through a category error rather than a syntax error: an HTTP control is applied to a parent-owned stdio process; a local render is reported as named-host support; a newer protocol profile is used to reinterpret a historical baseline; or a tool schema is mistaken for authorization to perform an effect.

MCP Boundary makes the agent establish the actual contract, trace ownership, complete the requested implementation, and attach each conclusion to an observer that can support it.

Use it to:

- build MCP tools, resources, prompts, servers, or Apps without silently shrinking the requested outcome;
- review protocol, SDK, transport, capability, effect, and trust boundaries;
- execute migrations with retained compatibility and deliberate retirement;
- debug local versus named-host behavior without overstating either;
- design proportionate checks and report `verified`, `contradicted`, `not verified`, or `not applicable` against a specific claim.

## Install from this repository

With a current Codex CLI that supports Agent Plugin marketplaces:

```bash
codex plugin marketplace add IndelibleVivi/mcp-boundary --ref main
codex plugin add mcp-boundary@mcp-boundary
```

Restart Codex after installation so the new plugin is discovered. The committed distributable package lives at [`plugins/mcp-boundary/`](plugins/mcp-boundary/) and uses the canonical Codex manifest at `.codex-plugin/plugin.json`, with explicit composer icon and logo paths. It intentionally has no root `plugin.json`: that filename selects the submission system's Agent Plugins conversion path instead of the native Codex manifest.

The ZIP submission surface currently admits skills only, so the plugin manifest does not declare `interface.screenshots` and the distributable does not contain screenshot assets. Public website previews remain in [`previews/`](previews/).

Installation is distinct from publication in any external plugin directory. See [current state](docs/current-state.md) for what has actually been published and verified.

## Use it

Explicit invocation:

```text
Use $mcp-boundary to inspect this MCP implementation against its actual protocol,
transport, runtime, and intended host. Do not edit the repository.
```

```text
Use $mcp-boundary to migrate this server to the selected protocol revision.
Preserve evidenced callers, retire the superseded path, and verify each boundary.
```

The skill also allows implicit invocation for clearly MCP-specific engineering tasks. It should not activate for ordinary APIs, generic frontend work, or incidental references to MCP.

## Repository layout

```text
src/skills/mcp-boundary/   author source for the skill and references
src/plugin/plugin.json     author source for the Codex-native manifest
plugins/mcp-boundary/      committed, generated distributable package
scripts/                   package build and deterministic ZIP tooling
tests/                     static, package, fixture, and website checks
site/                      one-page static website source
brand/                     approved Offset + Porcelain identity only
provenance/                exact-source and adaptation records
```

`src/` is the authoring truth. `scripts/build_plugin.py` copies the author manifest byte-for-byte to `.codex-plugin/plugin.json`. `plugins/mcp-boundary/` must match its author sources byte-for-byte for the files it distributes.

## Build and verify

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py
skill-validate src/skills/mcp-boundary
skill-validate plugins/mcp-boundary/skills/mcp-boundary
python3 scripts/package_plugin.py
```

The final command creates a deterministic local ZIP and SHA-256 record under ignored `dist/`. Packaging fails if a root `plugin.json` could select the conversion path, or if the Codex manifest and its composer icon/logo assets are missing. It does not upload or install anything.

Browser checks are documented in [tests/CHECKS.md](tests/CHECKS.md). They use the installed Playwright skill wrapper to exercise the static website, responsive layouts, keyboard interactions, clipboard fallback, no-JavaScript readability, and the no-external-request claim. They do not establish model behavior, named-host interoperability, directory acceptance, or a complete accessibility certification.

## Protocol profiles and provenance

The bundled protocol profiles are dated, revision-specific evidence. They do not assert that a later MCP revision can never exist. When a task asks about the newest protocol or current host behavior, the skill requires checking current official sources.

Several protocol/reference files are redistributed exactly from [MCP Server Engineering Field Guide](https://github.com/IndelibleVivi/mcp-server-engineering-field-guide) under Apache-2.0. Other methods were independently synthesized with recorded influences from that project, [MCP App Production Field Lab](https://github.com/IndelibleVivi/mcp-app-production-fieldlab), Servotab, and official Agent Plugin/MCP documentation. The file-level record is in [provenance/SOURCES.json](provenance/SOURCES.json) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Privacy and network boundary

The plugin itself is local instructional content: no service, telemetry, account, credential, or developer-operated network endpoint. An agent using the skill may still use repository tools, browsers, hosts, or external systems when the user's task and permissions authorize them; those systems retain their own data and authentication boundaries. See [PRIVACY.md](PRIVACY.md).

The official website is published through GitHub Pages at <https://indeliblevivi.github.io/mcp-boundary/>. It uses no project analytics, remote fonts, or external runtime assets. Its external links activate only when a visitor follows them; GitHub's hosting layer remains governed by GitHub's own terms and data practices.

## Licensing

This is a **source-available, layered-license repository**, not a blanket open-source grant:

- project-original functional material: `SUL-1.0`;
- project-original documentation: `CC BY-NC-SA 4.0`;
- exact Field Guide reference copies: `Apache-2.0`;
- the Offset identity and website visual expression: all rights reserved.

The authoritative file map and precedence rules are in [LICENSING.md](LICENSING.md). The word “source-available” describes access to source; it does not replace the applicable license terms.
