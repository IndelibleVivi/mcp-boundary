---
profile_id: async-selection-2026-10-15
profile_version: 1
assessed_at: 2026-10-15
language: en
language_peer: async-selection-2026-10-15.zh-CN.md
---

# Tasks, Events and Code Mode selection

Base: `2026-07-28` / explicit host compatibility. Extension/spec: `Tasks overview and Events WG observed 2026-10-15`. Assessed: `2026-10-15`.

Choose by the work's initiator. Ordinary calls serve short work; negotiated Tasks continue initiated operations; a separate Events experiment receives new external issues; consider Code Mode for substantial composition. Do not add a resident service to distribute the skill.

## Integration

Tasks is outside the July core. Both server discovery and per-request client capabilities opt into `io.modelcontextprotocol/tasks`. Never return `resultType: "task"` without client support. Persist the task before responding; retain identity across restart. Use `tasks/get`, `tasks/update` for outstanding input, and cooperative `tasks/cancel`. Cancellation does not undo completed effects.

Cloudflare's October 13 Workers Issues rollout uses `events/list`, `events/subscribe` and signed webhooks. Its referenced Triggers & Events WG is experimental. Do not promote it into a stable universal Events contract or treat delivery as unlimited follow-up authorization.

## Positive example and counterexample

The Lab retains a separate Events experiment entry. Once an actual consumer is selected, verify the current signature scheme, duplicates/replay, subscription scope, unsubscribe and follow-up permissions. Until then these remain unverified. Keep task continuation separate from external notifications; delivery cannot replace durable operation state.

See the Cloudflare profile for Code Mode selection and its nested-upstream exclusion. Measure completed tasks, rework and unnecessary operations.

Run the local positive/counterexample lane from the repository root; inspect its [fixture source](../../lab/tests/support/experimental-events.ts) and [runner](../../lab/scripts/run-lab-fixtures.ts).

```bash
cd lab
npm run test:fixtures
```

## Evidence ceiling

This profile supplies selection guidance and an experiment entry, not a verified Events consumer, signature implementation or real Tasks host.

Sources:

- <https://modelcontextprotocol.io/extensions/tasks/overview>
- <https://developers.cloudflare.com/changelog/post/2026-10-13-cloudflare-mcp-events/>
- <https://github.com/modelcontextprotocol/experimental-ext-triggers-events>
