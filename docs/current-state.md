# Current state

Last reviewed: 2026-09-16

| Surface | State | Evidence / limit |
| --- | --- | --- |
| Unified repository | Merged to `main` at `ae3239e` | One continuing authority with one distributed skill, the maintained Guide, and the executable Lab |
| Source release | `0.2.0` release candidate | Version, manifest, generated package, changelog, website copy, and submission packet are prepared; no GitHub release or external publication is implied until completed |
| External plugin directory | `0.1.0` remains live | Skills and listing changes require a new reviewed plugin version; `0.2.0` is not public there until OpenAI approval and developer publication |
| Active skill | `src/skills/mcp-boundary/` | Live-path execution, control ownership, migration retirement, artifact/runtime reconciliation, named-host claim ceilings, and a small-task stop rule |
| Distributed package | `plugins/mcp-boundary/` | Contains the one pure skill `mcp-boundary`; no Guide, Lab runtime, server, app connector, auth flow, analytics, telemetry, or runtime dependency |
| Guide validation | `tools/guide-validation/` | Maintained current validators used by Guide tests and root CI; active mirror validation is check-only |
| Frozen historical skill | `guide/skill/mcp-server-engineering/` | Retained byte-preserved for provenance, release evidence, and historical reproducibility; no current CI or test caller executes its scripts |
| Guide origin | Initial import from `87238302209d654358dd64eb3972677e4cacf256` | Initial origin only; `guide/` is now maintained here and has no destructive re-import path |
| Lab origin | Initial import from `5a6deebbac96089588658452a00f2c52bad0dd2f` | Executable local specimen; its checks do not establish arbitrary production or named-host behavior |
| Submission materials | Prepared under `docs/submission/0.2.0.md` | Includes listing copy, release notes, starter prompts, and five positive plus three negative reviewer test cases |
| Behavior comparison | Cases and rubric registered | No-skill / historical-skill / `0.2.0` comparative runs are not yet executed; comparative improvement remains not verified and must not be claimed |
| Former repositories | Historical sources, not archived | Redirect and archival remain separate deliberate actions after the unified release is established |
