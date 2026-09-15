# Licensing map

MCP Boundary uses multiple licenses because its functional package, documentation, imported references, executable Lab, and visual identity are different governed materials. No repository-wide license overrides a more specific rule below.

## 1. Project-original functional material — SUL-1.0

The Sustainable Use License 1.0 in [`LICENSE`](LICENSE) applies to project-original functional material, including:

- `src/plugin/`;
- project-original files under `src/skills/mcp-boundary/`, except exact Apache-2.0 reference copies listed in section 3;
- `.agents/plugins/`, root `.github/workflows/`, root `scripts/`, root `tools/`, and project-original functional tests/fixtures under root `tests/` and `evaluations/`;
- `site/app.js` and `site/assets/identity.js` as functional code/data;
- corresponding generated functional files under `plugins/mcp-boundary/` and local ZIP packages.

SUL-1.0 is source-available and restricts use and distribution as stated in the license. It is not an OSI-approved open-source license.

## 2. Project-original documentation — CC BY-NC-SA 4.0

The documentation notice in [`LICENSE-DOCUMENTATION.md`](LICENSE-DOCUMENTATION.md) applies to project-original prose and documentation, including:

- root `README.md`, `README.zh-CN.md`, `AGENTS.md`, `CHANGELOG.md`, `PRIVACY.md`, `TERMS.md`, and this file;
- project-original files under root `docs/`, `evaluations/`, and `provenance/`;
- project-original prose in the active skill and authored references, to the extent that prose is independently copyrightable and not an exact Apache-2.0 copy.

Where a single file combines functional instructions and explanatory prose, both applicable grants operate on their respective material. The more restrictive applicable condition must be respected when the material cannot reasonably be separated.

## 3. Exact Field Guide reference copies — Apache-2.0

The Apache License 2.0 in [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt) applies to the exact copies listed in [`provenance/SOURCES.json`](provenance/SOURCES.json), including the selected protocol, JSON-RPC, HTTP, MCP Apps, and dated integration profiles under `src/skills/mcp-boundary/references/` and their generated package counterparts.

Exact hashes, source commits, and destination paths are recorded in that provenance file.

## 4. Imported Guide tree

`guide/` is a complete-tree import from the pinned MCP Server Engineering Field Guide revision recorded in [`provenance/UPSTREAMS.lock.json`](provenance/UPSTREAMS.lock.json). Files under `guide/` retain the license identified by `guide/LICENSING.md`, file-specific notices, and the licenses shipped inside that tree. Import into this repository does not replace or broaden those grants.

The historical skill inside `guide/skill/mcp-server-engineering/` is retained as source and evidence material. It is not part of the distributed MCP Boundary plugin.

## 5. Imported Field Lab tree

`lab/` is a complete-tree import from the pinned MCP App Production Field Lab revision recorded in [`provenance/UPSTREAMS.lock.json`](provenance/UPSTREAMS.lock.json). Files under `lab/` retain the license identified by `lab/LICENSING.md`, file-specific notices, and the licenses shipped inside that tree. Import into this repository does not replace or broaden those grants.

## 6. Offset identity and website visual expression — all rights reserved

Except for third-party rights and functional code separately licensed above, no license is granted to reproduce, adapt, distribute, or use the MCP Boundary name, Offset mark, visual identity, or distinctive website visual expression.

This reserved material includes:

- `brand/`;
- `site/index.html`, `site/styles.css`, and static image/SVG assets under `site/assets/`;
- `previews/`;
- `mcp-boundary-demo.html` as a combined visual publication;
- identity assets copied into `plugins/mcp-boundary/assets/`.

Repository access, plugin installation, or another license in this repository does not grant trademark or branding rights.

## 7. Generated package

`plugins/mcp-boundary/` and generated local ZIPs are mixed-license collections. Each distributed file keeps the license of its source counterpart. The package does not include `guide/` or `lab/`.

## Precedence

1. A file-specific notice, imported-tree licensing map, or exact-source mapping controls that material.
2. Section 6 controls identity and distinctive visual expression.
3. Sections 1 and 2 control project-original functional and documentary material respectively.
4. No license should be inferred for material not affirmatively covered by a grant.

Copyright © 2026 Faye (@IndelibleVivi) for project-original material she controls. Contributor and third-party rights remain with their respective rights holders.
