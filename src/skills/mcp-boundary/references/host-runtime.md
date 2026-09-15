# Host, artifact, and runtime claims

Use this reference when source works locally but an installed client, deployment, MCP App host, or named host behaves differently.

## Evidence ladder

| Rung | A fresh observation can establish | It does not establish by itself |
| --- | --- | --- |
| source | manifest, schema, code path, static invariants | process behavior, built bytes, host behavior |
| process | real local protocol roundtrip and process lifecycle | clean package identity, deployment selection, named host |
| artifact | package or bundle contents tied to a source revision | that those bytes were launched |
| installed | exact bytes present at an installation location | that a client selected that installation |
| activated runtime | launched command, environment, identity readback, live behavior | tunnel or named-host admission |
| named host | discovery, resource admission, rendering, host-mediated effects for one host/account/date | other hosts, future policy/cache, owner judgment |
| owner | deliberate acceptance or rejection of the observed product behavior | later revisions or environments |

Use the narrowest rung that can answer the user's question. Retain `not verified` when the required observer is unavailable.

## Identity reconciliation

Compare these independently when relevant:

- source commit and dirty state;
- lockfile and resolved SDK versions;
- build input and output hashes;
- package manifest, included files, and package version;
- installation destination and update mechanism;
- client configuration and launched command;
- process environment, working directory, and executable identity;
- tunnel/proxy route and authentication owner;
- host discovery cache, capability surface, and resource URI identity.

A source fix with a stale package is still a stale package. A correct installation that the client does not select is still inactive. A discovered tool does not imply its App resource was admitted or rendered.

## MCP App projections

Observe model-visible content, shared structured data, component-only metadata, final DOM, and host capability dispositions separately. A sandbox limits parent-page access; it does not validate data, authorize tool calls, or make external network requests safe.

Classify host outcomes precisely: capability missing, request denied, policy denied, rejected input, technical failure, stale activation, cancelled, timed out, or owner rejected. Do not compress them into a generic “host error.”
