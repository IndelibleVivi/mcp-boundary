# 0.3.0 installed-content smoke

Observed on 2026-11-06 with `codex-cli 0.159.1`. This is a two-request release smoke, not a comparative evaluation or a named-host acceptance test.

The final portable `0.3.0` plugin was installed in an empty temporary Codex home. Each disposable fixture exposed that exact installed cache's skill directory through the supported repository-local `.agents/skills/mcp-boundary` path. The cache was checked against the generated package. No daily-profile plugin installation or credential copy was performed. CLI execution used the existing ChatGPT authentication, ignored user config and project instruction files, disabled other user skills and plugins, and kept raw events outside the repository. The CLI default model was used; its backend identity was not independently attested.

| Request | Invocation / observation | Result |
| --- | --- | --- |
| Repair the `empty-entrypoint` fixture | Explicit `$mcp-boundary` invocation. Command events show `SKILL.md` and relevant bundled references read from the installed directory. Only the fixture's `app.py` was changed. | Independent `check_candidate.py empty-entrypoint` passed: empty initial state, ordinary context call, invalid-input rejection, and metadata-free fallback retained. |
| Polish one ordinary English scheduling sentence | No skill invocation requested. | Returned only the rewritten sentence. No command or skill-body read was emitted. |

The positive observation proves explicit use of the installed skill content through repository-local discovery. The negative observation shows one ordinary request completed without loading that skill body. Neither establishes automatic activation for arbitrary MCP tasks, direct discovery through a daily plugin profile, desktop composer behavior, directory ingestion, comparative improvement, or production interoperability. The six core cases remain without model-comparison results.

The release ZIP identity is recorded in the [release notes](../docs/releases/0.3.0.md). The earlier [October comparison](october-2026-report.md) used explicit source-file loading and remains a separate observation.
