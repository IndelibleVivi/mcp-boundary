# Boundary model

Use this note to locate where an MCP behavior can be enforced and where it can be observed.

## Five separate layers

| Layer | Typical owner | Claims it can establish |
| --- | --- | --- |
| Protocol | MCP revision and negotiated rules | Message shapes, lifecycle, capability semantics |
| SDK | Concrete dependency and code path | Helper behavior, defaults, generated types, runtime integration |
| Transport | Parent process or reachable HTTP service | Framing, connection/session behavior, streaming, reconnect, HTTP controls |
| Capability/effect | Application handler and downstream system | Validation, authorization, effect ordering, recovery, external mutation |
| Host | Named client or deployment environment | Admission, presentation, host policy, host-specific execution |

Do not collapse these layers into one label such as “MCP compliant.” Name the layer and claim.

## Trace template

For the behavior under review, write a short path:

```text
caller or host
  -> transport entrypoint
  -> protocol/SDK dispatch
  -> capability handler
  -> downstream effect
  -> returned observation
```

At each hop, identify:

- trusted and untrusted inputs;
- identity or authorization material;
- state ownership and lifetime;
- cancellation and failure propagation;
- externally visible effects;
- the observer that can establish success.

Add a control only where the path can enforce it. Add a check only where its observation can support the intended claim.

## Common category errors

- Applying HTTP origin or reconnection requirements directly to a raw stdio server.
- Treating transport session IDs as application authentication.
- Treating a schema-valid tool call as authorization for the tool's effect.
- Treating local browser rendering as evidence of named-host admission.
- Treating a newer protocol profile as the meaning of an older declared baseline.
- Treating an SDK upgrade as proof that every active caller uses the upgraded path.
- Treating a deployment or topology change (proxy, replica count, tunnel) as a code-level control.
- Treating a retried request as proof that the effect happened exactly once.
- Reporting a domain failure as a protocol error, or a protocol violation as a domain result.
- Treating a log line, trace, or transcript as reproduction of the effect it describes.
