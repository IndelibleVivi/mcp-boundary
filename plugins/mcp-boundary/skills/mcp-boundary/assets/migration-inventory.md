# Migration inventory

| Item | Source behavior | Target behavior | Disposition | Active caller or observer | Removal / retention condition | Verification |
| --- | --- | --- | --- | --- | --- | --- |

Disposition values:

- `retained` — behavior remains intentionally supported;
- `replaced` — target behavior is canonical and callers were moved;
- `retired` — active path and claims were removed;
- `compatible` — a bounded adapter remains with an evidenced condition;
- `not applicable` — item does not exist at the relevant boundary.

Inventory relevant routes, methods, headers, state stores, background tasks, entrypoints, package scripts, adapters, fixtures, documentation claims, deployment settings, and host configuration. A passing target-path test does not prove the old path is gone.
