# OpenAI native entrypoints

Use for a user opening an App directly from navigation, a thread tab or a file. First assessed 2026-10-15; reassessed 2026-11-06 against OpenAI MCP Extensions `0.2.1` documentation (2026-10-21); this is host guidance, not the shared MCP Apps contract.

## Choose the surface and invocation

The advertised platform matrix's Web means Work browser and excludes classic ChatGPT. At the assessed source, global/thread entrypoints are listed across desktop, Work browser, iOS and Android; file handlers are desktop-only. This is documented expected support, not a runtime receipt. Recheck the exact host/version and capability before promising an entrypoint.

A tool registers entrypoints under `_meta["openai/ui"].entrypoints`, alongside the shared `_meta.ui.resourceUri`. Global and thread opens deliver `{}` arguments. Required model-filled context can therefore break direct opens. Provide an initial view that explains the available action and lets the user select or enter context. Keep context-dependent fields optional at open; validate them when the user invokes the dependent action. Never fill missing identity or grants with defaults.

```json
{
  "name": "open_workspace",
  "title": "Workspace inspector",
  "inputSchema": {
    "type": "object",
    "properties": {"context": {"type": "string"}},
    "additionalProperties": false
  },
  "_meta": {
    "ui": {"resourceUri": "ui://boundary/workspace"},
    "openai/ui": {"entrypoints": [{"type": "global"}, {"type": "thread"}]}
  }
}
```

Return useful initial `content`/`structuredContent` for `{}` and render that result without an automatic duplicate call. Context selection performs the next validated action. If the host has no native entrypoints, a normal tool call must still achieve the promised result. Keep model-visible text sufficient to continue when UI capability is absent. A file entrypoint has a separate file argument contract; do not impose the empty-object rule on it.

## Verify the path

Check empty arguments at the schema and handler, render/select/continue in the local fixture, and call the same ordinary tool with explicit context and with no entrypoint metadata. Assert malformed input still fails. A local opening flow proves those mechanisms; it does not prove sidebar admission, real host rendering, file grants or policy. Collect an exact host observation only under authorization.

## Select adjacent host capabilities

The October 21 revision documents Desktop WebMCP through `document.modelContext`. Feature-detect that API when app-local tools are required; ChatGPT does not support MCP Apps SDK `App.registerTool()`. Keep server tools as the ordinary path for server effects. Work browser composer mentions may search connected hosted apps; this does not grant Desktop filesystem access.

For model context, `content` represents what the user explicitly attaches and `structuredContent` supplies background state. Optional content-block `_meta["openai/group"].title` groups visible attachments; this metadata is excluded from model input. Each `ui/update-model-context` replaces the context from that app instance, so preserve the intended full selection rather than treating updates as append-only. A group's display label does not authorize an effect.

Mobile `ui/message` supports active/new conversation targets and editable drafts (`send: false`) subject to the documented content limitations; iOS resource links remain unsupported. Prefer `x-openai-input.type: "resource"` and `x-openai-thumbnail` over deprecated form aliases. Numeric answers are JSON numbers; request a string for exact large integers or decimal text. Verify the specific capability and host before claiming these paths work.

## Package separately from App capabilities

A pure-skill plugin needs no MCP server to adopt the portable root `plugin.json` format. Keep portable identity at the root and presentation under `extensions.com.openai.interface`. New portable hosts use the inline OpenAI object as a whole; they do not merge missing properties from the optional `.codex-plugin/plugin.json` overlay. Generate that legacy compatibility projection from the same author source so icons, prompts and identity cannot diverge. Discover skills in the fixed `skills/` directory. Do not add hooks, authentication or runtime wiring for a packaging migration.

Sources: [October 21 changes](https://github.com/openai/mcp-extensions/commit/0d3425887542226f4bfff0267b19f59916d02e1c), [OpenAI MCP Extensions](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md), [portable packaging and overlay precedence](https://developers.openai.com/plugins/build/plugins).
