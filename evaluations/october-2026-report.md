# October 2026 behavior comparison

Status: **executed** on 2026-10-15. Nine initial repair sessions plus three fresh candidate follow-up sessions completed. The independent outcome checker passed 11 of the 12 artifacts. This does **not** establish an incremental completion advantage of the candidate over released `0.2.0`.

## Observed outcomes

| Repair case | No MCP skill | Released `0.2.0` | Initial candidate | Final candidate follow-up |
| --- | --- | --- | --- | --- |
| `skills-snapshot` | pass | pass | pass | pass |
| `empty-entrypoint` | **fail** | pass | pass | pass |
| `proxy-retry` | pass | pass | pass | pass |
| Completed outcomes | **2/3** | **3/3** | **3/3** | **3/3** |

The no-skill entrypoint repair added an empty-argument handler branch but left `context` required in the advertised input schema. A host validating that schema would still reject `{}` before dispatch. Both skill contexts repaired the schema and handler. The completed repairs remained in their authorized `app.py`; no arm added dependencies, infrastructure or extra target files.

The initial candidate's Skills repair added a nonblocking question about a cross-server loader requirement outside the bounded catalog repair. The recipe now selects that acceptance example only for loader/cache/server-selection work. Three fresh candidate sessions repeated the same tasks after this wording change; the extra scope question did not recur in that follow-up sample. The original candidate results are retained rather than replaced. This observation is not proof of a general causal improvement.

## Effort and proportionality

Observed tool invocations include skill/context reads, inspection, edits and self-checks. They are operation counts, not a count of unnecessary actions or a quality score.

| Case | No skill | `0.2.0` | Initial candidate | Final candidate |
| --- | --- | --- | --- | --- |
| `skills-snapshot` | 7 | 12 | 14 | 9 |
| `empty-entrypoint` | 6 | 11 | 14 | 13 |
| `proxy-retry` | 9 | 11 | 14 | 9 |
| Total tool invocations | 22 | 34 | 42 | 31 |

No cell received a coordinator repair turn or grader feedback. Internal self-check and repair remained inside each cell's one turn. All supplied skill entry files were observed in successful read-tool results; this supports explicit context delivery, not automatic activation or proof of every method instruction being applied.

Under the existing [rubric](rubric.json), the initial candidate Skills case receives `2/3` for proportion because of its extra scope question. The final candidate proxy case also receives `2/3`: it completed the task but introduced a generic `repr` fallback for non-JSON payloads that this JSON-only specimen did not need. The smaller invocation count therefore does not justify a claim of better code or lower maintenance cost. The `0.2.0` proxy result also asked a nonblocking question about conflict representation after already choosing a valid representation; the task did not require an owner decision for that choice.

## Conditions and acceptance

The configured requested model was `commandcode/deepseek-v4.1-flash` through the same authorized ACP route. Every cell had a fresh session, the same tools and full local-edit permission, a 30-second setup budget and 900-second task ceiling. Runs were serialized. The router did not independently attest provider identity. Each case used identical initial fixture bytes across arms; context and fixture identities are in [the result projection](october-2026-results.json).

The baseline skill source is release `v0.2.0` at `98afefddd644f465452fa27c010f2fc3b65de6a8`. Candidate contexts were copied from the active author source, with separate recorded identities before and after the scope calibration. The final context identity matches the delivered skill source. The treatment is explicit source-file loading, not installation or installed-skill trigger selection.

All three untouched fixtures fail their intended checks. During artifact review, the checker was corrected to assert the originally requested optional input schema and to accept either a structured conflict result or a custom conflict exception. Neither representation had been mandated by the task. All twelve outputs were evaluated against that same final checker; no model was shown its acceptance output or allowed to revise from it. This is an acceptance correction, not a preregistered benchmark claim.

Reproduce the input preparation with [the preparation script](prepare_comparison.py), run it through an already-authorized model harness, then apply [the independent checker](check_candidate.py). Use `--arms candidate` for a bounded fresh candidate follow-up. Raw model outputs, detailed tool traces, private harness handles and workspaces remain outside Git. Only this public-safe derived projection is published.

## What the evidence supports

In these small, well-specified repair tasks, both `0.2.0` and the candidate completed a schema repair that the no-skill sample missed. The final candidate completed all three repairs without the earlier scope question. The run does **not** show that the new recipes outperform `0.2.0` in completion rate, nor that they reduce real production rework or improve arbitrary MCP work.

There is one sample per cell, a same-owner grader, and a deliberately explicit task prompt. The original six registered cases remain unexecuted. Real OpenAI import, Cloudflare OAuth/Gateway, host admission and production activation are outside this experiment. Local CLI installation was checked separately in empty temporary homes for both portable and legacy-only manifests; local browser behavior was checked separately through the installed MCP Apps SDK bridge. Those observations do not extend the model comparison's boundary.
