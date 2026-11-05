---
profile_id: openai-entrypoints-2026-10-15
profile_version: 2
assessed_at: 2026-11-06
language: en
language_peer: openai-entrypoints-2026-10-15.zh-CN.md
---

# OpenAI native entrypoints

Base: `2026-07-28` / explicit host compatibility. Extension/spec: `OpenAI MCP Extensions 0.2.1; 2026-10-21 documentation`. First assessed: `2026-10-15`. Reassessed: `2026-11-06`.

Use for an App opened from navigation, a thread or a file. The upstream matrix describes expected platform support. Web means Work browser and excludes classic ChatGPT. At assessment, global/thread entries span desktop, Work browser, iOS and Android; file handlers list desktop only. This is documentation, not a host test by this repository.

## Integration

Register global/thread/file entries in tool `_meta["openai/ui"].entrypoints` alongside shared `_meta.ui.resourceUri`. Global/thread opens send `{}`. Both schema and handler must accept it and return a useful initial view. Let the user select context before validating and executing dependent actions; never fabricate identity or grants. Render the initial tool result without a gratuitous duplicate call.

File entries have a different file argument contract. Hosts without native entries must still complete the promised function through ordinary tool calls with useful model-visible results.

## Adjacent host capabilities

The October 21 documentation adds Desktop WebMCP through `document.modelContext`; ChatGPT does not support SDK `App.registerTool()`. Feature-detect the API and keep server effects on server tools. Work browser mentions support connected hosted-app resource search, without Desktop file grants.

Use `content` for explicit attachments and `structuredContent` for background state. Optional `_meta["openai/group"].title` groups content blocks; block metadata is excluded from model input. Each context update replaces that app instance's prior context. Mobile messages support active/new targets and editable drafts, subject to iOS resource-link limitations. Use resource/thumbnail form fields over deprecated aliases; request strings for exact large integers and decimal text. These are documented capabilities, not local or named-host observations.

## Positive example and counterexample

The Lab opens with empty arguments, then accepts user context; ordinary calls work without entrypoint capabilities. Compare a schema requiring context to isolate why model-mediated use succeeds while direct opening fails. Invalid input remains rejected.

Packaging separately uses portable root `plugin.json`, with OpenAI presentation in `extensions.com.openai.interface`. The inline object replaces the compatibility overlay as a whole. Generate root and `.codex-plugin/plugin.json` from one author source; verify icons, prompts, identity and ZIP consistency. The fixed `skills/` directory discovers skills without adding MCP runtime.

Run the local positive/counterexample lane from the repository root; inspect its [fixture source](../../lab/tests/support/openai-entrypoint.ts) and [runner](../../lab/scripts/run-lab-fixtures.ts).

```bash
cd lab
npm run test:fixtures
```

An additional local browser check uses the installed MCP Apps SDK bridge to render the independent resource, verifying one initial call and the next call after user selection. The sandbox retains `allow-scripts`; the action button calls through the bridge instead of relying on native form submission. Requires installed bundled Playwright Chromium:

```bash
npm run test:entrypoint-view
```

## Evidence ceiling

Local calls and archive checks do not establish sidebar admission, host rendering, installation or activation. Record public listing and candidate source versions separately.

Sources:

- <https://github.com/openai/mcp-extensions/blob/main/docs/spec.md>
- <https://github.com/openai/mcp-extensions/commit/0d3425887542226f4bfff0267b19f59916d02e1c>
- <https://developers.openai.com/plugins/build/plugins>
