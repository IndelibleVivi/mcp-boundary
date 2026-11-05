# MCP Boundary behavior evaluations

These cases test material engineering outcomes. Package validity, prose quality, and repository tests do not substitute for a model run.

The October comparison uses three matched arms: **no MCP skill**, **released MCP Boundary `0.2.0`**, and **candidate `0.3.0-dev.1`**. The earlier historical `mcp-server-engineering` arm remains available for the original research corpus; it is not the baseline for this comparison and is never a second active install path.

All nine registered cases now have deliberately broken local fixtures and independent outcome checks. The November addition covers the original six core cases; **no model runs have been executed for those six**. The October results remain evidence for their three original cases only.

`cases.json` owns the task prompt, suite, fixture path and writable files. Most cases allow only `app.py`; `local-render-host-overclaim` allows only `assessment.json` and protects the supplied observations. The core checker rejects unrelated file changes. Fixtures use synthetic data and standard-library processes; they require no host accounts, network or dependencies.

| Core case | Qualifying outcome |
| --- | --- |
| `stdio-http-category-error` | A real parent-owned child exchanges clean JSON lines without HTTP controls; unauthorized reads still fail |
| `local-render-host-overclaim` | Keep verified local evidence while named-host and owner claims remain not verified |
| `migration-live-old-caller` | Both public callers reach the new handler and the old entrypoint is retired |
| `schema-effect-authorization` | Every route checks the exact principal/action/item grant before the effect |
| `source-artifact-runtime-drift` | Matching build/installed bytes and a fresh child executing the selected installed file |
| `small-change-stop-rule` | Only the requested description changes; adjacent behavior and files are preserved |

## Reproduce the experiment

Prepare immutable skill contexts and nine fresh workspaces outside the Git worktree:

```bash
python3 evaluations/prepare_comparison.py \
  --out /path/to/private-evidence/new-comparison --baseline v0.2.0
```

This only prepares inputs; it launches no model and uses no credentials. `comparison.json` records exact fixture identities and both skill-context digests. `orders.json` defines nine explicit repair responsibilities and a serial batch. The output directory is private (`0700`). Use `--arms candidate` for a fresh candidate-only follow-up. Use an already-authorized model/worker harness, not a new account or provider introduced by this repository. Keep model, harness, permissions, time budget, task prompt, fixture and available tools fixed across arms. Start a fresh session per case/arm; do not continue an earlier treatment into another.

The default still selects the three October cases. Select the six core cases explicitly (18 workspaces across three arms):

```bash
python3 evaluations/prepare_comparison.py \
  --out /path/to/private-evidence/core-comparison --baseline v0.2.0 \
  --cases stdio-http-category-error local-render-host-overclaim \
    migration-live-old-caller schema-effect-authorization \
    source-artifact-runtime-drift small-change-stop-rule
```

`--cases` accepts any registered case IDs. All input files have recorded identities, including protected evidence; `allowed_files` records each task's writable projection. The prepared candidate context comes from the current source, not the frozen October treatment. Reproducing that historical treatment requires its original source snapshot.

Load each supplied skill context through its SKILL.md and relevant references. The treatment is **explicit file-context loading**, not installed-skill auto-activation. Keep skill snapshots read-only and do not expose other arms or the acceptance checker to the repair session. Workers may edit only the files named in their order; they may run local self-checks. No network, dependencies, deployment or account actions are part of these tasks.

After each terminal run, execute the independent checker from the coordinator:

```bash
python3 evaluations/check_candidate.py skills-snapshot TARGET
python3 evaluations/check_candidate.py empty-entrypoint TARGET
python3 evaluations/check_candidate.py proxy-retry TARGET
python3 evaluations/check_candidate.py source-artifact-runtime-drift TARGET
```

The untouched fixtures must fail their intended checks. A terminal model response alone is not success. Record failed checks, unfinished runs, allowed-file changes, coordinator rework and unnecessary expansion; use tool traces for operation counts only when actual traces are available. The existing `rubric.json` governs qualitative review; professional-sounding language has no independent score. A long report without a repair fails requested outcome.

The repository tests validate the checker itself with broken baselines, valid repairs and partial fixes: migrating only one caller, guarding only one effect route, building without installing/activating, or promoting local evidence must fail. This validates the test mechanism, not model performance. Run this local lane with `python3 -m unittest -v tests.test_core_evaluations`.

## Results and limits

Execution status and the public-safe result projection are recorded in [the October report](october-2026-report.md). Raw outputs, private harness handles and detailed traces stay outside this repository.

A same-owner, one-run-per-cell comparison is development evidence. It is neither independent assurance nor a statistical estimate of general improvement. Explicitly loaded source context does not prove installation, trigger selection or automatic reference loading. Keep task completion, rework, excess operations and host behavior separate.
