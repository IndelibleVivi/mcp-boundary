# Current state

Last reviewed: 2026-09-21

| Surface | State | Evidence / limit |
| --- | --- | --- |
| Unified repository | `0.2.0` integration and website merged to `main` at `98afefd` | One continuing authority with one distributed skill, the maintained Guide, and the executable Lab |
| Source release | `v0.2.0` live on GitHub | Annotated tag points to `98afefd`; the non-draft, non-prerelease release carries the 29-file ZIP and checksum sidecar. The remote ZIP digest is `c07e843cb186b3deec96a77ec852a847f0d54c18d41ec0c2e7b7a125134bf0aa` |
| External plugin directory | `0.2.0` live | Exact public listing `plugins_6aa72e81844081918770991deb1dbfc8` was observed on 2026-09-16 showing MCP Boundary version `0.2.0`, its three starter prompts, Developer Tools category, and public policy links |
| Active skill | `src/skills/mcp-boundary/` | Live-path execution, control ownership, migration retirement, artifact/runtime reconciliation, named-host claim ceilings, and a small-task stop rule |
| Distributed package | `plugins/mcp-boundary/` | Contains the one pure skill `mcp-boundary`; no Guide, Lab runtime, server, app connector, auth flow, analytics, telemetry, or runtime dependency |
| Guide validation | `tools/guide-validation/` | Maintained current validators used by Guide tests and root CI; active mirror validation is check-only |
| Frozen historical skill | `guide/skill/mcp-server-engineering/` | Retained byte-preserved for provenance, release evidence, and historical reproducibility; no current CI or test caller executes its scripts |
| Guide origin | Initial import from `87238302209d654358dd64eb3972677e4cacf256` | Initial origin only; `guide/` is now maintained here and has no destructive re-import path |
| Lab origin | Initial import from `5a6deebbac96089588658452a00f2c52bad0dd2f` | Executable local specimen; its checks do not establish arbitrary production or named-host behavior |
| Website | Four-route bilingual site live on GitHub Pages | Related-project [PR #5](https://github.com/IndelibleVivi/mcp-boundary/pull/5) merged as `d98f8e7`; deploy run `35538917612` and main validation run `35538917634` succeeded. Both Library routes returned `200` and exposed the language-matched related links in a live browser on 2026-09-21. Earlier SEO route and sitemap checks are recorded in [PR #4](https://github.com/IndelibleVivi/mcp-boundary/pull/4) |
| Site discoverability | Four canonical URLs in `site/sitemap.xml`, unique titles/descriptions, reciprocal `hreflang`, and directory homepage links | Deployed with unique titles/descriptions and reciprocal language alternates. Google Search Console ownership was verified and sitemap submission accepted on 2026-09-21; the live URL Inspection test reported crawl allowed and fetch successful, but the sitemap report still showed `Couldn't fetch` after one resubmission. Successful ingestion remains pending; a later URL Inspection check on 2026-09-21 confirmed that the homepage and Library are indexed. This does not establish ranking |
| Related projects | English and Chinese README and Library entries link to Servotab and Worker Routing | Published static links sit outside the ten-document Guide/Lab filter; desktop/mobile layouts, no-JavaScript links, and empty-result filtering were checked before deployment |
| Submission materials | Published record under `docs/submission/0.2.0.md` | Includes the public outcome plus listing copy, release notes, starter prompts, and five positive plus three negative reviewer test cases |
| Behavior comparison | Cases and rubric registered | No-skill / historical-skill / `0.2.0` comparative runs are not yet executed; comparative improvement remains not verified and must not be claimed |
| Former repositories | Historical sources, not archived | Redirect and archival remain separate deliberate actions after the unified release is established |

Release validation run `35059026233` completed successfully for `98afefd`, including plugin/workspace tests on Python 3.11 and 3.12, schema validation, Guide checks on Python 3.11 and 3.13, Lab checks, deterministic bundle verification, and artifact upload.
