# Migration method

Use this note for protocol revision, SDK generation, transport, packaging, or host-integration migrations.

## Define three truths

1. **Baseline**: the contract and behavior currently in use.
2. **Target**: the desired contract and the reason it is needed.
3. **Compatibility**: callers or environments that must continue to work during transition.

Do not reinterpret the baseline through the target profile. Inspect both on their own terms.

## Execute the migration

- inventory active entrypoints, callers, registrations, manifests, generated files, tests, and docs;
- resolve protocol and SDK upgrade order before dependent refactors;
- implement the target on the canonical path;
- adapt retained callers deliberately;
- remove superseded imports, flags, handlers, configs, tests, and claims;
- retain a compatibility path only for an evidenced caller, staged boundary, or operational rollback;
- name the condition that retires any retained path.

## Prove completion

Verify the new path, retained compatibility, and retired behavior separately. Search again for old entrypoints and callers after the edit. Keep source-complete, packaged, deployed, and named-host-observed status distinct.
