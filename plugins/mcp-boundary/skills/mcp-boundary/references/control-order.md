# Control order and resource ownership

Use this reference when HTTP, connection admission, parsing, concurrency, cancellation, or low-level lifecycle behavior matters.

## Follow consumption order

A typical HTTP path may consume authority and resources in this order:

```text
connection / task admission
  -> header completion and timeout
  -> request-target and effective authority
  -> framing and early policy
  -> bounded body consumption
  -> strict decode and JSON classification
  -> MCP revision and JSON-RPC dispatch
  -> method authorization and argument limits
  -> capability effect
  -> projection and serialization
  -> bounded write / disconnect / retry handling
```

Frameworks may hide or reorder hooks. Inspect the actual framework/runtime owner rather than assuming this exact linear shape.

A control cannot protect an event that already happened. Examples:

- a capability semaphore acquired after body parsing does not limit slow or oversized incomplete requests;
- handler argument validation does not repair ambiguous HTTP framing already accepted by a server or proxy;
- a timeout installed after SDK dispatch does not bound header or body intake;
- cancellation observed after an external mutation needs effect identity or compensation; it cannot make the mutation unhappen;
- a response-size check after full serialization does not bound peak serialization memory.

## Separate control families

Name each control and the resource or authority it protects:

- bind and reachability;
- connection and task admission;
- Host / effective authority;
- Origin validation;
- CORS response policy;
- transport session identity;
- application authentication;
- authorization and scopes;
- framing, body, parser, and result budgets;
- capability concurrency and rate limits;
- durable state locking and effect identity;
- output write and backpressure;
- TLS, proxy, tunnel, and deployment policy.

A tunnel changes reachability. It does not validate tool arguments. CORS is a browser response policy. It does not authenticate non-browser callers. A transport session can correlate messages without authorizing an application effect.

## Accepted protocol language and error families

Define the accepted protocol language before dispatch instead of adapting malformed input into something executable:

- identify the selected revision's transport framing, encoding, media types, JSON grammar, JSON-RPC message kinds, method domain, ID domain, and parameter schemas;
- decode required UTF-8 strictly and reject framing or JSON ambiguity before partial execution;
- reject unknown methods and invalid arguments before capability effects;
- apply `Accept`, `Content-Type`, streaming, and response-shape rules from the selected protocol and HTTP profiles rather than treating one revision's binding as a universal rule.

Keep three error families separate, because callers recover from each differently:

| Family | Owner | Typical case | Caller-visible shape |
| --- | --- | --- | --- |
| Transport / HTTP | server or proxy | malformed framing, unsupported media type under the selected binding, oversized body | transport outcome and any revision-defined response |
| Protocol | JSON-RPC or MCP layer | unknown method, invalid params, parse error | protocol error with a stable code |
| Domain result | capability handler | business rejection, empty result, partial success | successful protocol response carrying a domain outcome |

A domain failure reported as a protocol error, or a protocol violation reported as a domain result, moves the recovery decision to the wrong layer. Authorization belongs to the capability/effect boundary and must reject before the effect; its caller-visible mapping still follows the selected protocol and product contract.

## Budgets before and after dispatch

Name both the resource a budget protects and the layer that installs it. A budget installed after dispatch bounds only post-dispatch work:

- before dispatch: connection and task admission, header and body byte limits, body-read timeout, request-target length, concurrent request count;
- around dispatch: argument size and depth limits, per-method concurrency and rate limits, cancellation propagation;
- after dispatch: response byte limits, serialization peak, queue depth, write backpressure.

A response-size check that runs after full serialization does not bound peak serialization memory. A handler-level concurrency limit does not bound requests that never reach the handler. State which budget is missing before claiming that a resource is protected.

## Mutable state, effect identity, and retry

A retry is a new request, not a replay of the old outcome:

- give each state-changing effect an identity the caller can reuse, so a retry is distinguishable from a second effect;
- decide what a retry of an in-flight or already-applied operation returns before it is first needed;
- treat a timeout or cancellation as an unknown outcome whenever the effect may already have happened, not as a failure;
- do not let a retry path silently duplicate an external mutation; make the operation idempotent at the effect boundary or compensate explicitly;
- keep transport session identity, request identity, and effect identity separate; a reconnect does not create a new effect identity.

## Diagnostics and sensitive data

Log identity, not payload:

- keep authentication material, cookies, tokens, full tool arguments, resource bodies, and personal data out of logs, traces, and error messages;
- prefer request id, effect id, revision, capability name, and outcome class;
- keep stdout protocol-clean for stdio and route diagnostics to stderr or the established logging path;
- treat a redacted or truncated sample as derived evidence, not as the original observation.

## Deployment topology

The same code behind a different topology has different controls and a different failure owner:

- local parent-owned process: the parent owns lifecycle, environment, and reachability;
- single reachable service: the process owns bind, admission, and session state;
- proxy, gateway, or tunnel in front: the proxy can own framing limits, header policy, timeouts, and reachability while the application still owns capability authorization;
- multiple replicas: session affinity, shared state, and per-replica caches change what a session, a rate limit, or a cache entry means.

Name which layer owns bind and reachability, framing limits, session identity, and authorization before claiming a control is in force.

## Stdio

For parent-owned stdio, begin at the parent command, environment, process lifecycle, and SDK framing boundary. Keep stdout protocol-clean and route diagnostics to stderr or the established logging path. Mark HTTP-only controls not applicable unless an evidenced wrapper introduces HTTP.

Check the command the client actually launches, not merely the repository's preferred development command.
