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

## Stdio

For parent-owned stdio, begin at the parent command, environment, process lifecycle, and SDK framing boundary. Keep stdout protocol-clean and route diagnostics to stderr or the established logging path. Mark HTTP-only controls not applicable unless an evidenced wrapper introduces HTTP.

Check the command the client actually launches, not merely the repository's preferred development command.
