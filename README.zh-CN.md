<p align="center"><img src="brand/exports/logo.png" width="152" alt="MCP Boundary 标志"></p>

# MCP Boundary

**让你的 MCP 真正站得住。**

MCP Boundary 是一个 pure-skill engineering plugin，用来 build、inspect、migrate、debug 和 verify MCP 系统。它先找到真正拥有行为的边界——protocol、SDK、transport、capability/effect 或 named host——再实施和验证，而不是把所有问题含混地叫作“MCP 合规”。

它不会启动 server、注册 app connector、要求 auth、发送 analytics 或加入 runtime dependency。整个 plugin 只有一个 Codex skill 和一组有明确日期、revision 与 provenance 的工程参考。

[官网](https://indeliblevivi.github.io/mcp-boundary/) · [English README](README.md) · [官网源码](site/) · [当前状态](docs/current-state.md) · [许可边界](LICENSING.md)

## 它解决什么

很多 MCP 问题不是语法错，而是 boundary category error：把 HTTP 控制直接套到 parent-owned stdio；把 local render 写成 named-host support；用新协议 profile 重写历史 baseline；或把 tool schema 当成执行副作用的 authorization。

MCP Boundary 会要求 agent：

- 先识别 declared / negotiated protocol、实际 SDK 和 active code path；
- 沿 transport、handler 与 downstream effect 追踪 ownership；
- implementation 请求必须做出完整可用的 change，不能偷换成报告；
- migration 必须分别处理 target、retained compatibility 与 retired behavior；
- 每个结论都绑定能证明它的 observer；
- 把 `verified`、`contradicted`、`not verified`、`not applicable` 用在具体 claim 上，而不是当万能进度条。

## 从这个 repo 安装

使用支持 Agent Plugin marketplace 的当前 Codex CLI：

```bash
codex plugin marketplace add IndelibleVivi/mcp-boundary --ref main
codex plugin add mcp-boundary@mcp-boundary
```

安装后重启 Codex。可分发 package 已提交在 [`plugins/mcp-boundary/`](plugins/mcp-boundary/)，唯一 manifest 是 canonical `.codex-plugin/plugin.json`，其中明确声明 composer icon 与 logo。Package 刻意不含 root `plugin.json`，因为该文件名会让提交器选择 Agent Plugins conversion path，而不是直接使用 Codex-native manifest。

当前 ZIP submission surface 只接收 skills，因此 manifest 不声明 `interface.screenshots`，分发包也不携带 screenshot assets；公开官网截图仍保留在 [`previews/`](previews/) 中。

“源码已公开”“本地已安装”“外部 plugin directory 已收录”是三个不同状态；实际状态以 [docs/current-state.md](docs/current-state.md) 为准。

## 调用示例

```text
Use $mcp-boundary to inspect this MCP implementation against its actual protocol,
transport, runtime, and intended host. Do not edit the repository.
```

```text
Use $mcp-boundary to migrate this server to the selected protocol revision.
Preserve evidenced callers, retire the superseded path, and verify each boundary.
```

它允许在明显的 MCP engineering task 中 implicit invocation，但不应因为普通 API、泛 frontend work 或随口提到 MCP 就触发。

## 构建与验证

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py
skill-validate src/skills/mcp-boundary
skill-validate plugins/mcp-boundary/skills/mcp-boundary
python3 scripts/package_plugin.py
```

最后一条只在 ignored `dist/` 里生成 deterministic ZIP 和 SHA-256 记录；若 package 含有会触发 conversion 的 root `plugin.json`，或 Codex manifest 的 composer icon / logo 无法解析到包内文件，打包都会直接失败。它不会上传或安装。浏览器检查范围见 [tests/CHECKS.md](tests/CHECKS.md)。

## Privacy 与 licensing

Plugin 本身只是本地 instruction/reference content：没有 developer-operated service、telemetry、账号、credential 或网络 endpoint。Agent 依照用户任务调用的 repo tool、browser、host 或外部系统仍各自拥有独立的数据与授权边界，详见 [PRIVACY.md](PRIVACY.md)。

这个 repo 使用 layered licensing，并不是一张 MIT 式总授权：

- project-original functional material：`SUL-1.0`；
- project-original documentation：`CC BY-NC-SA 4.0`；
- Field Guide 精确复制的 reference：`Apache-2.0`；
- Offset identity 与官网视觉表达：保留全部权利。

精确到文件的 map 见 [LICENSING.md](LICENSING.md)。
