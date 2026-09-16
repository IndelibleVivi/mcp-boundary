<p align="center"><img src="brand/exports/logo.png" width="152" alt="MCP Boundary mark"></p>

# MCP Boundary

**让真实运行的 MCP 路径经得起检查。**

MCP Boundary 是一项由三个相连表面组成的 MCP 工程项目：

- **Plugin**：可安装的 `$mcp-boundary` skill，负责实现、修复、迁移和验证真实 MCP 工程。
- **Guide**：完整的版本感知方法、协议 profiles、案例和证据纪律。
- **Lab**：可执行的 MCP App 标本与 receipt 机制，用来分别检验 source、process、artifact、runtime 和 host 层面的主张。

这是一个有意设计成单仓的项目。使用者只安装一个插件；维护者在同一个地方改进执行方法、保留深层解释、运行边界实验，也检验 skill 是否真正改善 agent 的结果。

插件本身保持轻量：它不启动 server、不注册 app connector、不要求认证、不发送 analytics 或 telemetry，也不引入 runtime dependency。Guide 与 Lab 都是仓库源码：可执行的 Lab 标本是工程证据，不是分发的插件运行时。

> `0.2.0` 已在公开插件目录上线。仓库源码与目录产物仍是两个独立的 release surface；确切的观察状态见当前状态记录。

[官网](https://indeliblevivi.github.io/mcp-boundary/) · [English](README.md) · [统一工作区设计](docs/UNIFIED-WORKSPACE.md) · [当前状态](docs/current-state.md) · [0.2.0 发布记录](docs/submission/0.2.0.md) · [许可](LICENSING.md)

## 使用插件

在支持 Agent Plugin marketplace 的当前 Codex CLI 中：

```bash
codex plugin marketplace add IndelibleVivi/mcp-boundary --ref main
codex plugin add mcp-boundary@mcp-boundary
```

这条仓库安装命令取得的是所选 Git ref 上的源码版本，与外部目录中已发布的产物不同。若要在候选版进入 `main` 前检查它，将 `main` 替换成对应分支名。安装后重启 Codex。

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

Lab 仍然是本地 surrogate，除非真的运行了某个明确外部 host。仓库检查通过无法证明 named-host admission、production activation、owner acceptance，也无法单独证明模型行为普遍改善。

## 合并来源

第一次单仓导入固定到：

- MCP Server Engineering Field Guide commit `87238302209d654358dd64eb3972677e4cacf256`；
- MCP App Production Field Lab commit `5a6deebbac96089588658452a00f2c52bad0dd2f`。

详见 [`provenance/UPSTREAMS.lock.json`](provenance/UPSTREAMS.lock.json)。`guide/` 与 `lab/` 已成为本仓库正常维护的子树，不存在重新导入或同步路径。本仓库是统一项目的开发权威；原仓库暂时保留为未归档的历史来源，后续归档必须单独、明确地决定。

由 Faye & Cove 共同创作。
