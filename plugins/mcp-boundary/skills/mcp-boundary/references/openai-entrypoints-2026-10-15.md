# OpenAI native entrypoints

Use for a user opening an App directly from navigation, a thread tab or a file. Assessed 2026-10-15 against OpenAI MCP Extensions' moving specification; this is host guidance, not the shared MCP Apps contract.

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

## Package separately from App capabilities

A pure-skill plugin needs no MCP server to adopt the portable root `plugin.json` format. Keep portable identity at the root and presentation under `extensions.com.openai.interface`. New portable hosts use the inline OpenAI object as a whole; they do not merge missing properties from the optional `.codex-plugin/plugin.json` overlay. Generate that legacy compatibility projection from the same author source so icons, prompts and identity cannot diverge. Discover skills in the fixed `skills/` directory. Do not add hooks, authentication or runtime wiring for a packaging migration.

Sources: [OpenAI MCP Extensions](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md), [portable packaging and overlay precedence](https://developers.openai.com/plugins/build/plugins).
