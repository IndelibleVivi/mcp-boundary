# Experimental Events fixture (local, opt-in)

This directory models an experimental Events surface as a local, opt-in
fixture. The upstream Events surface is an experimental working-group area, not
settled core behavior. This fixture is **not** runtime integration: no
production server, host harness, packaged candidate, or named host consumes
these events.

## What the fixture does

- a server must explicitly opt in (`createEventsFixture({ enabled: true })`);
- when enabled, it emits declared event envelopes to an in-process listener and
  records what it delivered;
- when disabled, it delivers nothing and reports
  `reason: "events_extension_not_enabled"`.

## What is not verified

- **No real consumer was exercised.** Delivery went only to a local listener
  inside the same process. No host, gateway, or remote consumer received an
  event.
- **Signatures are not implemented.** No signature was produced, trusted, or
  verified.
- **Replay and resumption are not implemented.** `replay()` always reports
  `replay_not_implemented`; no redelivery was exercised.

These limits are declared in `EVENTS_FIXTURE_NOTES` and
`EVENTS_FIXTURE_NOT_PROVEN` so a reader cannot mistake a green local test for
host event delivery.

## Adjacent guidance that stays separate

- Tasks remain a negotiated extension (`io.modelcontextprotocol/tasks`), not
  core background work. The 2026-07-28 profile moves task support behind the
  extension framework on purpose.
- Code Mode is optional and not universal.

## Where the extension identifier comes from

The [2026-10-13 Cloudflare rollout](https://developers.cloudflare.com/changelog/post/2026-10-13-cloudflare-mcp-events/) motivates this experiment. The events extension identifier used here (`SURROGATE_EVENTS_EXTENSION_ID`)
is declared by the fixture and labelled `SURROGATE`: it is a local label for an
experimental surface, not a verified stable identifier. Re-check the official
source before relying on the exact string.
