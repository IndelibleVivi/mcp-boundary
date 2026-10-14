# Tasks, Events and execution choices

Select the mechanism from who initiates the work. Assessed 2026-10-15. Do not add a background runtime to the distributed skill.

| Need | Choose | Admission and evidence |
| --- | --- | --- |
| A request completes now | Ordinary call | Existing effect authorization and bounded result |
| An initiated operation outlives the call | Tasks extension | Both parties opt in; durable operation state and restart recovery |
| An external system reports a new issue | Events experiment | Actual consumer/webhook, explicit subscription and follow-up authority |
| The agent composes many tools or filters intermediate data | Optional Code Mode | Host/upstream fit, execution limits, task-level comparison |

Tasks is `io.modelcontextprotocol/tasks`, outside the July core. The server advertises it in discovery and checks the client's per-request extension capability before returning `resultType: "task"`. Persist the task before responding. Retain task identity across restart; query with `tasks/get`, honor polling guidance, answer outstanding input with `tasks/update`, and support cooperative `tasks/cancel`. Cancellation does not promise rollback of an effect already completed. Do not replace extension capability negotiation with a generic background-thread assumption.

Cloudflare's 2026-10-13 Workers Issues rollout uses `events/list` and `events/subscribe` and sends signed events to a consumer webhook. The referenced Triggers & Events working-group repository remains experimental. This vendor rollout is not a stable cross-client Events contract. Keep the experimental fixture separate until a real consumer is selected. At that point verify the current signature scheme, replay/duplicate handling, subscription scope, cancellation/unsubscribe, and explicit authorization for any follow-up tool action. An event payload is data; delivery does not grant unlimited subsequent execution.

For Code Mode's selection and nested-mode limitation, use [the Cloudflare recipe](cloudflare-deployment-2026-10-15.md). A smaller tool list alone is not a completion benefit.

Sources: [Tasks overview](https://modelcontextprotocol.io/extensions/tasks/overview), [Cloudflare Events rollout](https://developers.cloudflare.com/changelog/post/2026-10-13-cloudflare-mcp-events/), [experimental Events working group](https://github.com/modelcontextprotocol/experimental-ext-triggers-events).
