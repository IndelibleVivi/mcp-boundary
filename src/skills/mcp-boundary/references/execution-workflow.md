# Execution workflow

Use this workflow to finish real MCP work without turning every task into an audit ceremony.

## 1. Target

Write one sentence that describes the user's requested result and one sentence that describes the highest boundary required for completion. Examples:

- “Repair the stdio server so the configured client can initialize and call `search`.” Completion requires a real process launched through the client's active command path.
- “Show whether this App works in ChatGPT.” Completion requires an exact named-host observation; local rendering remains useful evidence below that boundary.
- “Upgrade to revision X and remove the old session path.” Completion requires source migration, active caller migration, fresh runtime checks, and absence or deliberate retention of the superseded path.

Record authorization limits before changing dependencies, deployments, accounts, external data, or public releases.

## 2. Inventory only what can affect the target

Find the canonical repository and revision, then inspect:

- active client or host configuration;
- executable entrypoints and package scripts;
- SDK imports and lockfile versions;
- declared/negotiated protocol revisions;
- tools, resources, prompts, subscriptions, and Apps metadata in scope;
- downstream effects and their authorization owner;
- build, package, install, launch, proxy/tunnel, and host layers that can select different bytes.

Do not treat search matches as active paths. Confirm callers, manifests, package contents, commands, or runtime identity.

## 3. State a working claim

Use a falsifiable form:

```text
Claim: the failure is owned by <layer> because <specific path or observation>.
Qualifying observer: <check that can reject this explanation>.
```

A confident explanation without a qualifying observer remains an inference.

## 4. Change the owner

Modify the narrowest layer that owns the behavior. Preserve product behavior unless change is authorized. When equivalent MCP, REST, UI bridge, or internal routes reach one effect, converge on one capability authority unless the product deliberately gives them different permissions.

If the required control belongs to a parent process, proxy, authorization server, package manager, deployment selector, or named host, put it there or state that the current code cannot enforce it.

## 5. Advance evidence

Move only as far as the task requires:

```text
source
  -> process
  -> artifact
  -> installed package
  -> activated runtime
  -> named host
  -> owner acceptance
```

Each step requires its own observation. A lower step can contradict a higher claim, but passing a lower step does not automatically verify the higher one.

## 6. Retire and reconcile

For migrations and replacement paths, search callers, entrypoints, exports, handlers, adapters, state stores, fixtures, docs, package scripts, deployment settings, and host configuration. Mark each relevant item retained, replaced, retired, or intentionally compatible.

Update claims whose truth changed. Keep historical baselines named as historical; do not rewrite them to resemble the new target.

## 7. Stop

Stop when the requested outcome has qualifying evidence and the final diff contains no unintended path. Do not add unrelated controls, documents, matrices, or tests after the material uncertainty is closed.
