# MCP Boundary behavior evaluations

These cases test material engineering outcomes. Package validity, prose quality, and repository tests do not substitute for a model run.

The October comparison uses three matched arms: **no MCP skill**, **released MCP Boundary `0.2.0`**, and **candidate `0.3.0-dev.1`**. The earlier historical `mcp-server-engineering` arm remains available for the original research corpus; it is not the baseline for this comparison and is never a second active install path.

The three executable cases are `skills-snapshot`, `empty-entrypoint`, and `proxy-retry`. Each has a deliberately broken synthetic fixture in `fixtures/` and an independent outcome checker. The original six registered cases remain registered; an October run does not execute them by implication.

## Reproduce the experiment

Prepare immutable skill contexts and nine fresh workspaces outside the Git worktree:

```bash
python3 evaluations/prepare_comparison.py \
  --out /path/to/private-evidence/new-comparison --baseline v0.2.0
```

This only prepares inputs; it launches no model and uses no credentials. `comparison.json` records exact fixture identities and both skill-context digests. `orders.json` defines nine explicit repair responsibilities and a serial batch. The output directory is private (`0700`). Use `--arms candidate` for a fresh candidate-only follow-up. Use an already-authorized model/worker harness, not a new account or provider introduced by this repository. Keep model, harness, permissions, time budget, task prompt, fixture and available tools fixed across arms. Start a fresh session per case/arm; do not continue an earlier treatment into another.

Load each supplied skill context through its SKILL.md and relevant references. The treatment is **explicit file-context loading**, not installed-skill auto-activation. Keep skill snapshots read-only and do not expose other arms or the acceptance checker to the repair session. Workers may edit only their target `app.py`; they may run local self-checks. No network, dependencies, deployment or account actions are part of these tasks.

After each terminal run, execute the independent checker from the coordinator:

```bash
python3 evaluations/check_candidate.py skills-snapshot TARGET
python3 evaluations/check_candidate.py empty-entrypoint TARGET
python3 evaluations/check_candidate.py proxy-retry TARGET
```

The untouched fixtures must fail their intended checks. A terminal model response alone is not success. Record failed checks, unfinished runs, allowed-file changes, coordinator rework and unnecessary expansion; use tool traces for operation counts only when actual traces are available. The existing `rubric.json` governs qualitative review; professional-sounding language has no independent score. A long report without a repair fails requested outcome.

## Results and limits

Execution status and the public-safe result projection are recorded in [the October report](october-2026-report.md). Raw outputs, private harness handles and detailed traces stay outside this repository.

A same-owner, one-run-per-cell comparison is development evidence. It is neither independent assurance nor a statistical estimate of general improvement. Explicitly loaded source context does not prove installation, trigger selection or automatic reference loading. Keep task completion, rework, excess operations and host behavior separate.
