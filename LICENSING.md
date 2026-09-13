# Licensing map

MCP Boundary uses multiple licenses because its functional package, documentation, imported references, and visual identity are different governed materials. No repository-wide license overrides a more specific rule below.

## 1. Project-original functional material — SUL-1.0

The Sustainable Use License 1.0 in [`LICENSE`](LICENSE) applies to project-original functional material, including:

- `src/plugin/`;
- project-original files under `src/skills/mcp-boundary/`, except exact Apache-2.0 reference copies listed in section 3;
- `.agents/plugins/`, `.github/workflows/`, `scripts/`, `tools/`, and functional test code/fixtures under `tests/`;
- `site/app.js` and `site/assets/identity.js` as functional code/data;
- corresponding generated functional files under `plugins/mcp-boundary/` and the local ZIP package.

SUL-1.0 is source-available and restricts use and distribution as stated in the license. It is not an OSI-approved open-source license.

## 2. Project-original documentation — CC BY-NC-SA 4.0

The documentation notice in [`LICENSE-DOCUMENTATION.md`](LICENSE-DOCUMENTATION.md) applies to project-original prose and documentation, including:

- `README.md`, `README.zh-CN.md`, `AGENTS.md`, `CHANGELOG.md`, `PRIVACY.md`, `TERMS.md`, and this file;
- project-original files under `docs/`;
- project-original Markdown under `tests/` and `provenance/`;
- project-original prose in the skill and its authored references, to the extent that prose is independently copyrightable and not an exact Apache-2.0 copy.

Where a single file combines functional instructions and project-original explanatory prose, both applicable grants operate on their respective material. The more restrictive applicable condition must be respected when the material cannot reasonably be separated.

## 3. Exact Field Guide reference copies — Apache-2.0

The Apache License 2.0 in [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt) applies to these exact copies from MCP Server Engineering Field Guide commit `87238302209d654358dd64eb3972677e4cacf256`:

- `src/skills/mcp-boundary/references/protocol-selection.md`;
- `src/skills/mcp-boundary/references/mcp-apps.md`;
- `src/skills/mcp-boundary/references/profiles/json-rpc-2.0.md`;
- `src/skills/mcp-boundary/references/profiles/http-rfc9110-rfc9112.md`;
- `src/skills/mcp-boundary/references/profiles/mcp-2025-06-18.md`;
- `src/skills/mcp-boundary/references/profiles/mcp-2025-11-25.md`;
- `src/skills/mcp-boundary/references/profiles/mcp-2026-07-28.md`;
- `src/skills/mcp-boundary/references/profiles/integration-guidance-2026-08-15.md`.

Their generated copies under `plugins/mcp-boundary/skills/mcp-boundary/` carry the same license. Exact hashes and source mappings are recorded in [`provenance/SOURCES.json`](provenance/SOURCES.json).

## 4. Offset identity and website visual expression — all rights reserved

Except for third-party rights and the functional code separately licensed above, no license is granted to reproduce, adapt, distribute, or use the MCP Boundary name, Offset mark, visual identity, or distinctive website visual expression.

This reserved material includes:

- `brand/`;
- `site/index.html`, `site/styles.css`, and static image/SVG assets under `site/assets/`;
- `previews/`;
- `mcp-boundary-demo.html` as a combined visual publication;
- identity assets and screenshots copied into `plugins/mcp-boundary/assets/`.

Repository access, plugin installation, or another license in this repository does not grant trademark or branding rights.

## 5. Generated package

`plugins/mcp-boundary/` and `dist/mcp-boundary-0.1.0.zip` are mixed-license collections. Each distributed file keeps the license of its source counterpart. The package root carries this map and the applicable notices with the same relative links used in the repository.

## Precedence

1. A file-specific third-party notice or exact-source mapping controls that material.
2. Section 4 controls identity and distinctive visual expression.
3. Sections 1 and 2 control project-original functional and documentary material respectively.
4. No license should be inferred for material not affirmatively covered by a grant.

Copyright © 2026 Faye (@IndelibleVivi) for project-original material she controls. Contributor and third-party rights remain with their respective rights holders.
