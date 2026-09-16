# Unified workspace design

MCP Boundary consolidates three formerly separate public surfaces into one development authority while preserving their distinct proof roles.

## Product boundary

| Surface | Owns | Does not establish by itself |
| --- | --- | --- |
| `src/skills/mcp-boundary/` | The active agent workflow: build, repair, migrate, host-debug, and verify | That a particular model will invoke it correctly or improve every task |
| `guide/` | Stable method, revision profiles, case studies, templates, evidence grammar | Target-repository runtime behavior or named-host acceptance |
| `lab/` | Executable neutral specimen, local host profiles, package/runtime receipts | Production selection, arbitrary host compatibility, or owner judgment |
| `evaluations/` | Cases and scoring rules for comparing agent behavior | Independent assurance unless an independent runner executes and records them |

A method can explain a control without proving an implementation. A Lab run can prove its own specimen without proving a user's repository. A plugin can direct work without making its final claims true. The unified repository keeps those ceilings visible while removing duplicate product entry points.

## One active skill

`src/skills/mcp-boundary/` is the only maintained and distributed skill. The historical `guide/skill/mcp-server-engineering/` directory remains byte-preserved inside the imported Guide because it contains release evidence and the exact historical workflow, including the scripts that shipped with it. It is excluded from `plugins/mcp-boundary/` and must not be offered as a second installation path.

Current Guide validation is owned by `tools/guide-validation/`. CI, tests, and maintainer commands call that directory, so the historical package can remain frozen while validators evolve with the continuing Guide. The active profile-mirror tool is check-only and cannot rewrite the historical snapshot.

Future method improvements should land in the canonical Guide material and the active Boundary skill in the same pull request when both truths change. Historical evidence stays immutable unless the evidence itself is being corrected with provenance.

## Live-path model

A Boundary task traces the path that can produce the observed result:

```text
caller or named host
  -> active configuration and entrypoint
  -> transport framing and lifecycle
  -> protocol / SDK dispatch
  -> capability handler and authorization
  -> downstream effect
  -> projection / package / deployment
  -> qualifying observer
```

The task closes only at the boundary requested by the user. Source-complete, process-verified, artifact-matched, activated-runtime, named-host-observed, and owner-accepted are separate states.

## Import model

The initial unified import copied complete trees from two pinned commits, including their local licenses and historical evidence:

- `guide/` from `IndelibleVivi/mcp-server-engineering-field-guide@87238302209d654358dd64eb3972677e4cacf256`;
- `lab/` from `IndelibleVivi/mcp-app-production-fieldlab@5a6deebbac96089588658452a00f2c52bad0dd2f`.

`provenance/UPSTREAMS.lock.json` records those two commits as the origin of the subtrees; `provenance/SOURCES.json` records the exact-copy and influence mapping. The import did not merge Git histories or imply that the former repositories were authored under one blanket license.

`guide/` and `lab/` are ordinary maintained subtrees of this repository. There is no re-import, updater, or synchronization script: a later upstream change would arrive as an ordinary reviewed pull request with its own provenance note, not as a destructive re-copy this repository can run over local work. The former repositories remain unarchived historical sources.

`guide/skill/mcp-server-engineering/` is frozen historical release and evaluation material for this candidate. It is not active, not distributed, and not a maintenance target; the active distributed skill is `src/skills/mcp-boundary/`.

## Release sequence

1. Complete the unified import on a branch.
2. Run plugin, Guide, Lab, and workspace checks.
3. Compare the active Boundary skill against no-skill and historical-skill baselines on the registered cases.
4. Review public wording, licenses, provenance, and website routes.
5. Release the unified plugin.
6. Update former repositories to point here, then archive them only after links and release history are preserved.

The external plugin listing remains on the stable release until step 5.
