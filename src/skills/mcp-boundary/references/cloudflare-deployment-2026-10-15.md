# Cloudflare authorization and proxy paths

Use this recipe for a Workers MCP deployment or a Portal-mediated failure. Assessed 2026-10-15; OAuth Provider API line: v1; Portal observations are vendor guidance, not universal MCP rules.

## Choose the authorization topology

A single simple service can retain the combined `OAuthProvider`. Split only when several MCP resource Workers need shared login or an existing authorization owner demands it. The split API uses `OAuthAuthorizationServer` for login/token issuance and `OAuthResourceServer` at each MCP service. Each service has its own protected resource URL and accepted audience; share the authorization server without accepting a token issued for another resource.

Read the migration skill shipped with the dependency actually installed at `node_modules/@cloudflare/workers-oauth-provider/skills/migrate-to-1.0/SKILL.md`, and inspect that version's types and official split example. Do not install a new version merely to read instructions. The authorization Worker exposes `validateToken(resource, token)` through a named `WorkerEntrypoint`; resource Workers call it through their `AUTH_SERVER` Service Binding. Configure the binding's `service` and `entrypoint` to the actual authorization Worker/export. Verify discovery metadata, a missing-token 401 challenge, correct-resource acceptance, wrong-resource rejection, and scope enforcement on the actual capability.

The announcement's POST-based scope example is unsuitable as a general MCP read/write classifier. Both read and write tools arrive through POST. After authenticating and decoding a valid call, map the method/tool to its business effect and required scope; reject unknown calls and unauthorized effects before dispatch. Test a read tool using POST with a read grant, a write denied by that grant, and a write accepted with the write grant. This is an example-boundary correction, not evidence of a library vulnerability.

## Trace both Portal hops

Record a row per hop: caller, callee, selected protocol revision, credential owner/audience, reachable capability, and observation. Portal independently selects client-side and upstream protocols. A July client may reach an older upstream; upgrading the front side does not migrate the backend. Do not forward client credentials upstream by assumption; establish the configured credential mapping.

```text
client -- client protocol / portal credential --> Portal
       -- upstream protocol / upstream credential --> resource Worker
       -- bound token validation --> authorization Worker
```

Inspect Gateway policy and the phase of denial. A result can be blocked after the upstream has completed an effect. Thus a client error leaves effect status uncertain. Reconcile by business operation identity before retrying. For retriable writes, scope the identity to principal/resource/action and bind it to the payload; the same identity and same payload returns the recorded outcome, while a different payload conflicts. Use atomic durable storage for production guarantees; an in-memory Lab map only proves one-process behavior. HTTP request IDs and JSON-RPC IDs alone do not provide this guarantee.

Acceptance: execute upstream once, block its response, retry with the same business identity and observe one effect. Include an unsafe retry that duplicates the effect to show the test can reject the wrong behavior. Do not infer failure-before-effect from an HTTP error or claim real Gateway acceptance from this surrogate.

## Decide on Code Mode

Portal Code Mode exposes `portal_codemode_search` and `portal_codemode_execute`. Try it for large catalogs, multi-step composition or filtering before results return. Keep a few clear domain tools when they already complete the task well. Assess completion, errors, recovery and unnecessary operations, not just advertised tool count. Current Portal guidance excludes upstream servers with their own Code Mode enabled: use the upstream full-tool endpoint/opt-out or turn off Portal Code Mode. Keep execution grants and effect authorization explicit.

Sources: [OAuth v1 and split example](https://developers.cloudflare.com/changelog/post/2026-10-01-workers-oauth-provider-1x/), [Portal protocol independence](https://developers.cloudflare.com/changelog/post/2026-08-25-mcp-portals-mcp-2026-07-28/), [Portal/Gateway and Code Mode](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/).
