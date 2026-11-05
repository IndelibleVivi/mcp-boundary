<!-- docs-pair: current-state; locale: zh-CN; mirror: docs/current-state.en.md -->

# Current state

[English](./current-state.en.md)

Updated: 2026-11-06

## Classification

持续权威：本子树在 MCP Boundary 仓库内维护。根目录 `AGENTS.md` 拥有 repository contract，`src/skills/mcp-boundary/` 是唯一活跃分发的 skill，方法与 protocol profiles 就地读取本地 `guide/` 子树。下面的字段记录本子树原独立 source 的历史状态，以及其证据所针对的 method baseline。

- Status: `public-source`
- Version: `0.1.0-private.0`
- Current source: `https://github.com/IndelibleVivi/mcp-boundary/tree/main/lab`
- Historical source repository: `https://github.com/IndelibleVivi/mcp-app-production-fieldlab`
- Visibility: public
- Package publication: disabled by `package.json` `private: true`
- Functional license: `SUL-1.0` (source-available; use-restricted)
- Documentation license: `CC-BY-NC-SA-4.0`
- License map: `LICENSING.md`
- GitHub Release: none
- Assessed method baseline: MCP Server Engineering Field Guide `2.0.1`，固定 commit `dcb2c61a060948f92d35918af43919bdfde8b01a`
- Founding observation: Refrain commit `3e25c4b61eacaad502b4942e285855a7c38871ca`

历史 Field Guide pin 记录的是本 Lab 的 selected profiles 所针对的 release，它不是现行的 method authority。Public source repository 本身不构成 companion release；`FIELDLAB-REGISTER.json` 现在还记录本子树的持续权威。

## Implemented source surfaces

- 一个 deterministic、read-only 的 `inspect_boundary` tool；
- 一个 explicit-version、self-contained MCP App resource，build closure 拒绝 static/dynamic chunk escape 与 unsafe asset path；
- 分离的 model/component shared output 与 component-only metadata；
- canonical declarative evidence policy、scenario prerequisite graph/ceiling validation 与 exact scenario-aware receipt validation；
- capability-gated message/download probes：discovery 保留 `pending`/terminal distinctions，in-flight actions disabled + `aria-busy`，bridge disposition 不猜测未观察到的 host cause；
- receipt/scenario schemas 保留 exact method rungs、subject identities、evidence refs、distinct capability dispositions 与 `not_proven`；
- 七个 boundary scenarios，从 local resource delivery 一直到 owner acceptance；
- declared local-host profiles 与 observation ledger，明确设置 `namedHostSimulation: false`；
- clean-package 与 isolated-runtime commands；
- layered `SUL-1.0` / `CC-BY-NC-SA-4.0` licensing，含 private-source/third-party exclusions，并传播到 runtime candidates；
- 中文默认 + English mirror documentation、`DOCS-REGISTER.json` 与只验证 structure/shared facts 的 docs validator；
- credential-free、read-only 根目录 CI workflow source，包含单一 Lab runtime-lane entry；remote CI execution 在真实 remote run 前保持 `not_verified`；
- operator runbooks 与 pinned、public-safe 的 Refrain mechanism case study。

## 2026-10 local protocol fixtures

2026-10-15 加入五个独立、可运行的本地 fixture，并把它们接入新增的 `npm run test:fixtures`（`scripts/run-lab-fixtures.ts`）；`npm run check` 现在同时运行这批 unit tests 与 fixture runner：

- `wire-2026-07-28`：极小的 2026-07-28 wire specimen，覆盖 per-request `_meta`、`server/discover`、`MCP-Protocol-Version` / `Mcp-Method` / `Mcp-Name` 与 body 的一致性，以及 mismatch 与 unsupported-version rejection；
- `skills-over-mcp`：一个 skill 加一个 supporting file，`skills/list` / `skills/get` / `resources/read`，精确 per-resource `sha256:` digest 与 byte size，静态 snapshot 对比 live read，以及 digest 失败时保留旧 snapshot 且 tools 仍然可见；
- `cloudflare-deployment-seam`：read/write 业务调用都走 POST，authorization 依据 tool effect/scope/resource 而非 HTTP verb，client 与 upstream credential 独立，effect 之后 block result 时以 operation identity 去重；
- `openai-entrypoint`：global/thread entrypoint 通过普通 `tools/call` 加 `{}` 打开并返回初始数据，随后补充 context；host 没有 entrypoint 时退回普通 tool call；
- `experimental-events`：独立的 local opt-in Events fixture；没有真实 consumer、signature 或 replay 被验证。

2026-10-15 在具备真实 loopback 的本机完成 `npm run check`：84 个 tests 通过，build、SDK resource smoke 与五个 fixture 摘要全部通过。另行执行 `npm run test:entrypoint-view`，用已安装的 MCP Apps SDK bridge 和 bundled Chromium 验证独立 UI resource、空参数初始视图及用户选择 context 后的调用；首屏没有重复调用。没有测试真实 OAuth library、Gateway、OpenAI importer 或 named host。去重身份隔离 principal/tool/resource，并绑定 payload；存储只在单个 proxy process 内有效，不能提供跨重启或跨 proxy 的 exactly-once 保证。

统一仓库的 [validation run 38636644934](https://github.com/IndelibleVivi/mcp-boundary/actions/runs/38636644934) 已在 implementation commit `ca0a118` 上通过；CI 执行了新增的 loopback fixtures。该历史 run 早于当前 monorepo package/runtime repair，不验证本次修复。

## 当前 packaging repair

Lab 现在显式区分两个 root：enclosing MCP Boundary Git checkout 用于 committed revision、cleanliness 与 detached worktree；`lab/` 用于 npm install、build output、runtime roots、candidate 与 ignored receipts。Disposable Git monorepo regression 会从 nested `lab/` 执行真实 packager，并验证 clean-worktree build 与 receipt placement。

根目录 `lab` CI job 运行 `npm ci`、安装一次 bundled Playwright Chromium，再运行 `npm run validate:runtime-lane`。这个 provider-neutral entry 顺序覆盖 source/process checks、local host matrix、standalone entrypoint view、clean package 与 isolated runtime smoke。

最近一次完整本地 source/process 记录（2026-10-15）包含 `2` 个 generated-schema checks、`7` 个 scenario validations 与 `84` 个 unit tests。新增回归检查已通过 focused runs，当前完整测试总数仍待新 CI 观察；旧计数不证明新的 candidate/runtime。

当前修复的完整 package 与 isolated runtime result 仍为 `not_verified`；完整 lane 需要 clean committed checkout。新 entry 的 remote CI execution 同样为 `not_verified`。下面的 historical candidate 与 receipt identities 仅证明其记录的 revision。

当前尚未观察到的 candidate identities：

- current candidate source revision: `not observed`
- current candidate file count: `not observed`
- current bundle digest: `not observed`

## Historical clean-candidate evidence

Historical clean candidate source revision: `5eba892b6be5407b0ac4aa658f398f7b2eec5373`

Historical clean candidate file count: `43`

Historical clean candidate bundle digest: `sha256:2e7dba961f82f120fdbdf68e440f5d64f7d0db89f566bf8ea0ff987026e2b014`

2026-08-29 已对 review-hardening source/process、declared local-browser、clean-package 与 isolated-runtime boundaries 完成 fresh local verification。该 historical package/runtime proof 固定到 clean implementation commit `5eba892b6be5407b0ac4aa658f398f7b2eec5373`。本文件是随后只记录证据的 documentation update，不改变 candidate identity。更早的 `dbab424...` 与 `ed016da...` candidates 只保留为 historical evidence，不是当前 revision 的 proof。

该 historical clean commit 上的 `npm run check` 包含：

- register、layered-license 与 bilingual-doc validation；
- `2` 个 generated-schema checks；
- `7` 个 scenario validations；
- TypeScript typecheck；
- `40` 个 unit tests（`7/7` test files）；
- production build；
- real MCP client discovery、tool call 与 exact resource roundtrip。

上文当前的 `84`-test contract count 描述后来维护中的 test coverage，不属于这份 2026-08-29 historical candidate record。

Fresh MCP process receipt 位于 local-only 的 `tmp/receipts/mcp-resource-roundtrip.json`，绑定：

- resource: `ui://mcp-app-production-fieldlab/inspect-boundary/v1.html`
- MIME: `text/html;profile=mcp-app`
- bytes: `552146`
- SHA-256: `13e0d52a1cf4b4239459065d508ab934a939ab199d44d943c4e5e543ec13ffb8`
- MCP initialize server version: `0.1.0-private.0`
- source revision: `5eba892b6be5407b0ac4aa658f398f7b2eec5373`
- source dirty: `false`

Browser-host lane 通过 exact Playwright JSON attestation 的 `5/5` Chromium tests，覆盖 `restricted`、`capability-success`、`capability-rejected`、pending/terminal capability semantics、keyboard reachability、busy state 与 320px/390px overflow。Host receipt 与上述 clean source/resource identity exact join，`namedHostSimulation: false`，最高 ceiling=`process`。

当前 clean committed-tree candidate 与 isolated readback：

- candidate: `runtime-candidates/5eba892-fieldlab-review` (ignored/local-only)
- file closure: `43` files，包括 candidate-owned `scenarios/`、compiled evidence policy、`LICENSE`、`LICENSE-DOCUMENTATION.md` 与 `LICENSING.md`
- bundle digest: `sha256:2e7dba961f82f120fdbdf68e440f5d64f7d0db89f566bf8ea0ff987026e2b014`
- canonical SUL-1.0 SHA-256: `c6d0dde0f0463c800e542d7d64237ffef37f43b17004975a558604f17b5d1af1`
- exact read-back resource bytes: `552146`
- exact read-back resource SHA-256: `13e0d52a1cf4b4239459065d508ab934a939ab199d44d943c4e5e543ec13ffb8`
- package receipt: `tmp/receipts/package.clean-revision@1.json` (ignored/local-only)
- validated receipt: `tmp/receipts/runtime.isolated-readback@1.json` (ignored/local-only)
- proof ceiling: `activated-runtime`，仅限 disposable isolated process

Fresh run 已验证 candidate file/digest closure、candidate-owned full scenario set、四份 receipt 的 transitive prerequisite joins、production dependency install、same-origin `/healthz` release identity、package-authoritative MCP version、MCP discovery/tool call/resource readback、component-only projection，以及在 runtime receipt 落盘前完成 child stop 与 temporary projection cleanup。

独立仓库合并前，GitHub Actions [`Verify` run 33260710317](https://github.com/IndelibleVivi/mcp-app-production-fieldlab/actions/runs/33260710317) 已在 commit `7305e1ddf4491dfa56fe8d653252a81bda0f6da5` 上完成并得到 `success`。`Source and process`、`Local browser host`、`Clean package and isolated runtime` 三个历史 jobs 全部通过，check-run annotation count 均为 `0`。它仍是那个 exact historical remote run 的证据，不证明当前根目录 workflow source。

| Boundary id                   | Status         | Current claim                                                                      |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| `source-checks`               | `verified`     | 2026-08-29 clean commit 5eba892 and 2026-10-15 local run; ceiling=`process`        |
| `local-protocol-fixtures`     | `verified`     | 2026-10-15 local loopback and SDK bridge run; ceiling=`process`                    |
| `resource-roundtrip`          | `verified`     | 2026-08-29 clean commit 5eba892；exact resource identity 见上                      |
| `local-host-matrix`           | `verified`     | 2026-08-29 local Chromium host run；exact five-test attestation，ceiling=`process` |
| `clean-runtime-candidate`     | `not_verified` | 当前 monorepo packaging repair 尚无 clean committed candidate                      |
| `isolated-runtime-readback`   | `not_verified` | 当前 monorepo candidate 尚未在 isolated process 中运行                             |
| `remote-ci-execution`         | `not_verified` | 新的根目录 runtime-lane witness 尚未在 GitHub Actions 完成                         |
| `operator-production-runtime` | `not_verified` | 未尝试 operator service installation 或 production selection                       |
| `tunnel`                      | `not_verified` | External gate；未访问 credential/profile，未运行 preflight/activation              |
| `named-host`                  | `not_verified` | External/account gate；未执行 authenticated named-host exercise                    |
| `owner-acceptance`            | `not_verified` | Owner-only gate；未请求或记录 owner observation                                    |
| `release-publication`         | `not_verified` | 未创建 GitHub Release，也未进行 registry/container publication                     |

## Remaining gates

当前 Lab changes 尚未 commit，因此 clean package 与 isolated runtime lane 仍未验证。获得授权的 commit 后，应在那个 clean commit 上从 `lab/` 运行 `npm run validate:runtime-lane`。Operator production selection、container activation/publication、tunnel、named host、owner acceptance 与 GitHub/npm publication 继续是独立 gates；本轮均未执行。
