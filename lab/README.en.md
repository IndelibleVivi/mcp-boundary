<!-- docs-pair: readme; locale: en; mirror: README.md -->

# MCP App Production Field Lab

[简体中文](./README.md)

MCP App Production Field Lab is the maintained executable, reproducible, claim-bounded engineering laboratory inside MCP Boundary. It separates the path from MCP App source through local process, exact resource delivery, browser host, clean package, activated runtime, tunnel, named host, and owner acceptance. The purpose is to stop “it opens locally” from becoming “the real host accepted it.”

> **Unified repository note.** This subtree is `lab/` inside the MCP Boundary repository. The publication, repository, and version-pin statements below are historical facts about the former standalone source repository, kept because they record how this evidence was produced. Continuing authority for this subtree is the root [`AGENTS.md`](../AGENTS.md); the method and protocol profiles are read from the local [`guide/`](../guide/) subtree; and the one active distributed skill is `src/skills/mcp-boundary/`. This subtree is not a separate repository, is not an installation path, and is not part of the distributed plugin package.

The former standalone repository's publication state was **`public-source` / source-available / unreleased package**. Its source remains available at [`IndelibleVivi/mcp-app-production-fieldlab`](https://github.com/IndelibleVivi/mcp-app-production-fieldlab), but it has no GitHub Release or registry publication. Project-original functional materials use `SUL-1.0`; original documentation, diagrams, and case-study expression use `CC-BY-NC-SA-4.0`. This is not OSI open source. `package.json` remains `private: true` to prevent accidental npm publication. The tunnel, named-host, and owner scenarios are operator runbooks and evidence contracts, not claims that those external steps have run.

![Field Lab: one neutral specimen, three projection boundaries, and four local receipts](docs/architecture/field-lab-evidence-chain.en.svg)

## Why this was a separate repository

When this Lab was a standalone repository, the Field Guide and the Lab answered different questions:

| Surface                                                                                                           | Authority                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [MCP Server Engineering Field Guide](https://github.com/IndelibleVivi/mcp-server-engineering-field-guide) `2.0.1` | Stable methods, dated protocol/integration profiles, evidence grammar, and the general MCP engineering skill                    |
| This Field Lab                                                                                                    | Neutral executable specimen, declared local-host profiles, scenario definitions, package/runtime observations, bounded receipts |
| [MCP Boundary](https://github.com/IndelibleVivi/mcp-boundary) (continuing authority)                              | Repository contract, the active `mcp-boundary` skill, plugin packaging, and publication gates                                   |
| [Refrain](https://github.com/IndelibleVivi/refrain) (private source authority; link requires access)              | Product source, renderer, deployment, runtime, and owner truth for the founding case                                            |

The historical method pin lives in [`FIELDLAB-REGISTER.json`](FIELDLAB-REGISTER.json): the selected profiles were assessed against MCP Server Engineering Field Guide release `2.0.1` at commit `dcb2c61a060948f92d35918af43919bdfde8b01a`, and the register also records the continuing authority for this subtree. That pin is dated evidence of the assessed baseline, not a live method authority. The Lab reads method and protocol profiles from the local [`guide/`](../guide/) subtree in place; it copies no Field Guide profiles, creates no second general-purpose skill, and does not make Refrain a runtime dependency.

![Field Guide and Field Lab in their former two-repository layout, joined by a version pin, scenario contract, and receipt grammar](docs/architecture/field-guide-field-lab.en.svg)

## Specimen contract

The Lab exposes one deterministic, read-only tool/view specimen:

- tool: `inspect_boundary`
- resource: `ui://mcp-app-production-fieldlab/inspect-boundary/v1.html`
- MIME: `text/html;profile=mcp-app`
- output: model-readable text, model/component-shared `structuredContent`, and component-only `_meta` that does not enter model-visible structured output
- UI effects: selection stays view-local; message/download requests require a user gesture and an advertised host capability
- production App document: all JS/CSS is inline; build closure rejects static or dynamic chunk escape and requires no external asset/network fetch

The UI is an evidence surface, not a product dashboard. It makes the differences among model-visible, component-visible, component-only, and host-capability projections directly observable.

## Quick start

Node.js `>=22.23.1` is required.

```bash
npm ci
npm run check
```

`npm run check` covers the register, layered licensing, bilingual document structure/shared facts, schema and scenario semantics, typechecking, unit tests, the production build, and a real MCP client's loopback roundtrip. `validate:docs` proves only pair topology and registered shared-fact synchronization; it does not claim that a machine has verified full semantic translation equivalence.

Run the browser-host lane separately:

```bash
# One-time Playwright Chromium installation; this is a separate network action.
npx playwright install chromium

npm run test:host
```

`test:host` mounts the exact built MCP resource under three declared local profiles: `restricted`, `capability-success`, and `capability-rejected`. It is a local surrogate, not a ChatGPT emulator.

Clean-package and isolated-runtime proof must start from a clean committed revision and use a new ignored output path:

```bash
npm run package:runtime -- --out=runtime-candidates/fieldlab-review
npm run smoke:runtime -- --candidate=runtime-candidates/fieldlab-review
```

See the [package and loopback runbook](docs/runbooks/package-and-loopback.en.md) for prerequisites, checkpoints, and claim ceilings. Tunnel and real-host procedures deliberately have no default runner; see the [tunnel and named-host runbook](docs/runbooks/tunnel-and-named-host.en.md).

## Evidence ladder

Every receipt has one `method_rung` and records `not_proven` explicitly. Lower-level evidence never upgrades a higher-level claim automatically.

| Rung                | May prove                                                                                                        | Does not yet prove                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `source`            | Schema, contract, and source-level invariants                                                                    | Process behavior, built bytes, or host behavior  |
| `process`           | Fresh local MCP roundtrip and behavior under declared local-browser profiles                                     | Clean-package identity, tunnel, or named host    |
| `artifact`          | Runtime files and bundle identity from a clean committed revision                                                | Candidate execution or production selection      |
| `activated-runtime` | Identity readback from the exact candidate/process; with a separate operator receipt, only that selected runtime | Tunnel, host admission, or owner acceptance      |
| `named-host`        | Fresh discovery, resource admission, and observed dispositions on one named host/account/date                    | Other hosts, future policy/cache, owner judgment |
| `owner`             | Deliberate owner acceptance or rejection of an exact revision and host interaction                               | A later revision or another environment          |

`not_verified` means that no qualifying observation exists yet; it is not a failure. Capability discovery, request disposition, and root-cause confidence are also separate dimensions. `pending`, `missing`, `denied`, `rejected`, `cancelled`, `policy_denied`, and `technical_failure` must not collapse into one generic error.

## Repository map

| Path                                                           | Role                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`SPEC.en.md`](SPEC.en.md)                                     | Programme contract, non-goals, and acceptance boundaries                                        |
| [`FIELDLAB-REGISTER.json`](FIELDLAB-REGISTER.json)             | Field Guide version pin, selected profiles, founding provenance, and publication state          |
| [`DOCS-REGISTER.json`](DOCS-REGISTER.json)                     | Chinese/English pairs, registered shared facts, and current-state synchronization contract      |
| [`docs/architecture/`](docs/architecture)                      | Bilingual native-SVG front doors for the Lab evidence chain and Guide/Lab companion boundary    |
| [`LICENSING.md`](LICENSING.md)                                 | Governing functional/documentation path map and private-source/third-party exclusions           |
| [`src/`](src)                                                  | Neutral server, exact resource contract, view, and evidence policy/schema                       |
| [`host-harness/`](host-harness)                                | Declared local profiles and observable ledger; it does not simulate a named host                |
| [`scenarios/`](scenarios)                                      | Versioned scenario contracts and their authorization classes                                    |
| [`schemas/`](schemas)                                          | Generated scenario and receipt JSON Schemas                                                     |
| [`docs/TESTING.en.md`](docs/TESTING.en.md)                     | Command topology, scenario matrix, and failure localization                                     |
| [`docs/runbooks/`](docs/runbooks)                              | Operator procedures; a runbook is not evidence that the procedure ran                           |
| [`case-studies/refrain/`](case-studies/refrain)                | Pinned public-safe mechanism extraction; no product code or runtime-authority transfer          |
| [`.github/workflows/verify.yml`](.github/workflows/verify.yml) | Retained historical witness workflow from the former standalone repository; GitHub does not execute nested workflow files, and the root `.github/workflows/validate.yml` now runs the Lab checks |

Raw receipts, Playwright traces/screenshots, credentials, cookies, private URLs, and unsanitized named-host evidence must stay in ignored/local-only locations. A sanitized receipt is a derived projection, not independent reproduction.

## Publication and rights

This repository uses path-level layered licensing:

- project-original functional materials use [SUL-1.0](LICENSE). It permits personal, non-commercial, and internal business use, and permits free provision or redistribution to others only for non-commercial purposes; it does not permit paid distribution, commercial external provision, or paid hosting;
- project-original documentation, diagrams, and case-study expression use [CC BY-NC-SA 4.0](LICENSE-DOCUMENTATION.md), identifier `CC-BY-NC-SA-4.0`, requiring attribution, NonCommercial use, and ShareAlike terms;
- see the governing English map [LICENSING.md](LICENSING.md) for exact path scope, private Refrain provenance, and third-party exclusions; the [Chinese licensing explanation](LICENSING.zh-CN.md) is provided for reading convenience only.

Do not infer additional permissions from the Field Guide, private Refrain source, or dependency licenses. GitHub source visibility, a GitHub Release, npm publication, and separate commercial permission remain distinct boundaries.

Created by Faye & Cove.
