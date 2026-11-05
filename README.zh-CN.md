<p align="center"><img src="brand/exports/logo.png" width="152" alt="MCP Boundary mark"></p>

# MCP Boundary

**让真实运行的 MCP 路径经得起检查。**

MCP Boundary 是一项由三个相连表面组成的 MCP 工程项目：

- **Plugin**：可安装的 `$mcp-boundary` skill，负责实现、修复、迁移和验证真实 MCP 工程。
- **Guide**：完整的版本感知方法、协议 profiles、案例和证据纪律。
- **Lab**：可执行的 MCP App 标本与 receipt 机制，用来分别检验 source、process、artifact、runtime 和 host 层面的主张。

这是一个有意设计成单仓的项目。使用者只安装一个插件；维护者在同一个地方改进执行方法、保留深层解释、运行边界实验，也检验 skill 是否真正改善 agent 的结果。

插件本身保持轻量：它不启动 server、不注册 app connector、不要求认证、不发送 analytics 或 telemetry，也不引入 runtime dependency。Guide 与 Lab 都是仓库源码：可执行的 Lab 标本是工程证据，不是分发的插件运行时。

> 仓库源码现为 `0.3.0`，已完成发布准备。公开插件目录中实际观察到的版本仍是 `0.2.0`，直到后续 listing 更新通过审阅并发布；仓库源码与目录产物仍是两个独立的 release surface。

[官网](https://indeliblevivi.github.io/mcp-boundary/) · [English](README.md) · [统一工作区设计](docs/UNIFIED-WORKSPACE.md) · [当前状态](docs/current-state.md) · [0.3.0 发布说明](docs/releases/0.3.0.md) · [0.2.0 发布记录](docs/submission/0.2.0.md) · [许可](LICENSING.md)

## 使用插件

在支持 Agent Plugin marketplace 的当前 Codex CLI 中：

```bash
codex plugin marketplace add IndelibleVivi/mcp-boundary --ref v0.3.0
codex plugin add mcp-boundary@mcp-boundary
```

固定安装需要 `v0.3.0` release tag，且仍不同于外部目录中已发布的产物。仅在发布后希望持续跟踪开发时才使用 `--ref main`；`main` 上的源码可能与已发布 package 独立变化。安装后重启 Codex。

示例：

```text
使用 $mcp-boundary 修复这个 MCP 接入。沿真实 caller、entrypoint、
transport、handler、package 与 runtime 追查；完成修复，并在真正能证明
该行为的边界运行检查。
```

```text
使用 $mcp-boundary 将这个 server 迁移到选定协议版本。保留有证据支持的
caller，退休旧路径，并区分 source、process、artifact、runtime 与
named-host 的结果。
```

skill 可以为明确的 MCP 工程任务隐式触发；普通 API、泛前端工作和仅仅提到 MCP 的文案不应触发它。

## 仓库结构

```text
src/skills/mcp-boundary/   唯一维护并发布的 skill 源码与参考资料
plugins/mcp-boundary/      自动生成的可分发插件

guide/                     现役 Field Guide：方法、profiles、案例与证据
lab/                       现役可执行 MCP App production field lab
evaluations/               对 skill 行为进行比较的案例与评分规则

scripts/                   插件打包与工作区验证工具
tools/guide-validation/    现役 Guide validators
tests/                     插件与统一工作区契约
site/                      中英文产品官网与 Guide/Lab 工程资料库
provenance/                精确复制与首次导入记录
```

只有 `src/skills/mcp-boundary/` 是活跃分发的 skill。`guide/skill/mcp-server-engineering/` 是冻结的历史发布与评估材料，只用于来源与复现；它不是推荐的安装路径，插件 manifest 也不会暴露它。

## skill 实际改变什么

MCP 工作经常停在错误的一层：源码已经正确，安装产物仍旧；本地页面能渲染，named host 却拒绝；新 transport 测试通过，caller 仍然进入旧路径；tool schema 合法，实际 effect 仍未被授权。

MCP Boundary 会要求 agent：

1. 固定用户真正要的结果和获准操作的范围；
2. 从 caller 或 host 一直追到返回观察结果的活跃路径；
3. 找到真正拥有该行为的层；
4. 在活跃路径上完成修改；
5. 运行能够推翻关键错误行为的最窄检查；
6. 关闭迁移和 runtime 缺口，同时保留证据上限。

它也有明确停止条件：清楚的小改动保持小，不扩张成仪式化全面审计。

## 0.3.0 更新

`0.3.0` 新增 [Skills 分发](guide/profiles/skills-distribution-2026-10-15.zh-CN.md)、[Cloudflare 授权／代理](guide/profiles/cloudflare-deployment-2026-10-15.zh-CN.md)、[OpenAI 原生入口](guide/profiles/openai-entrypoints-2026-10-15.zh-CN.md)和 [Tasks/Events 选型](guide/profiles/async-selection-2026-10-15.zh-CN.md)。active skill 自带可独立使用的 recipes。现有七月核心 profile 保留；本轮补扩展与宿主行为。

插件包采用根目录 portable `plugin.json`，内含 OpenAI 展示信息，同时生成 Codex 兼容清单；两者只维护 `src/plugin/plugin.json` 这一份作者源。拆包及 loader-contract 检查与真实安装、目录发布分别记录。公开目录中观察到的版本仍为 `0.2.0`。

十一月更新区分 extension 成熟度与 SEP 状态：Skills 和 Tasks 为 Beta，Events 为 Experimental；Skills 规范使用当前 Beta 入口，OpenAI recipe 同步 10 月 21 日的 host guidance。Lab 的合仓打包路径与根 CI 见 [Lab 测试说明](lab/docs/TESTING.md)。

当前 OpenAI 插件在更新 metadata 或 bundled skills 时，要求上传完整的新 ZIP，并接受 package checks 与审阅。2026-11-06 观察到的 `plugins/deploy/submission` 页面描述的是这条路径，不同于 hosted MCP server 的continuous tool review。2026-10-15 记录的 `plugins/build/mcp-server` Skills-importer 行为属于本地 scanner surrogate 的历史 host 证据，不是当前 OpenAI 要求。

[行为评估](evaluations/README.md)为全部九个案例提供 fixture / 独立 checker，包括六个原始核心场景。十月模型比较仍只覆盖其中三个案例；这六个核心场景尚无模型结果。fixture 与 checker 验证不等于模型比较已经执行；本地机制也不证明真实宿主支持。证据边界见 [0.3.0 发布说明](docs/releases/0.3.0.md)。

## 构建与验证

插件和统一工作区：

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py --no-report
python3 scripts/validate_skill_schema.py \
  src/skills/mcp-boundary \
  plugins/mcp-boundary/skills/mcp-boundary
python3 scripts/package_plugin.py
python3 scripts/check_plugin_archive.py
```

Guide：

```bash
cd guide
python -m unittest discover -v
python ../tools/guide-validation/validate_version_register.py VERSION-REGISTER.json
python ../tools/guide-validation/check_profile_mirrors.py VERSION-REGISTER.json
python ../tools/guide-validation/check_bilingual_coverage.py .
python tools/validate_evaluation_corpus.py .
python ../tools/guide-validation/check_markdown_links.py .
```

Lab：

```bash
cd lab
npm ci
npm run check
```

完整 browser、entrypoint、clean package 与 isolated runtime 检查使用 `npm run validate:runtime-lane`，需要 clean committed checkout 和已安装的 bundled Playwright Chromium；精确步骤见 [Lab 测试说明](lab/docs/TESTING.md)。

Lab 仍然是本地 surrogate，除非真的运行了某个明确外部 host。仓库检查通过无法证明 named-host admission、production activation、owner acceptance，也无法单独证明模型行为普遍改善。

## 相关项目

- [Servotab](https://servotab.com/) — 为一般仓库工作提供 planning、implementation、debugging、review 与 verification 方法。
- [Worker Routing](https://indeliblevivi.github.io/codex-worker-routing/zh/) — 将有明确边界的完整责任交给 native 或可选 ACP worker，并通过本地 Dispatch 面板查看工作记录。

## 合并来源

第一次单仓导入固定到：

- MCP Server Engineering Field Guide commit `87238302209d654358dd64eb3972677e4cacf256`；
- MCP App Production Field Lab commit `5a6deebbac96089588658452a00f2c52bad0dd2f`。

详见 [`provenance/UPSTREAMS.lock.json`](provenance/UPSTREAMS.lock.json)。`guide/` 与 `lab/` 已成为本仓库正常维护的子树，不存在重新导入或同步路径。本仓库是统一项目的开发权威；原 Guide 与 Lab 仓库现已归档为只读历史来源，其迁移首页与仓库 homepage 均将后续开发指回这里。

由 Faye & Cove 共同创作。
