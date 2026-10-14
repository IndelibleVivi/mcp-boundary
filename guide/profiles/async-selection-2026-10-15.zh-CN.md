---
profile_id: async-selection-2026-10-15
profile_version: 1
assessed_at: 2026-10-15
language: zh-CN
language_peer: async-selection-2026-10-15.md
---

# Tasks、Events 与 Code Mode 选型

Base: `2026-07-28` / explicit host compatibility. Extension/spec: `Tasks overview and Events WG observed 2026-10-15`. Assessed: `2026-10-15`.

先按工作由谁发起选路径。短操作用普通调用；已发起的长工作用协商后的 Tasks；外部新问题通知用独立 Events 实验；大量工具组合才评估 Code Mode。不要为分发 skill 增加常驻服务。

## 接法

Tasks 不属于七月核心。server discovery 与 client 逐请求能力均须 opt in `io.modelcontextprotocol/tasks`；未声明支持的 client 不应收到 `resultType: "task"`。先持久创建 task，再返回 task identity；`tasks/get` 查询、`tasks/update` 补充 outstanding input、`tasks/cancel` 协作取消。重启后能恢复 identity；取消不代表撤回已完成 effect。

Cloudflare 10 月 13 日的 Workers Issues 能力使用 `events/list`、`events/subscribe` 和签名 webhook；引用的 Triggers & Events WG 仍是 experimental。不能写成稳定通用 MCP Events 契约，也不能把收到事件当作无限制后续执行授权。

## 正向例子与反例

Lab 保留独立 Events 实验入口。选定真实 consumer 后再测试当前签名方案、重复与 replay、订阅 scope、取消订阅和后续动作权限；没有消费者时明确未验证。Tasks continuation 与外部事件通知分别建模，避免以通知代替持久任务状态。

Code Mode 的采用条件与不支持 nested upstream 的限制见 Cloudflare profile。一次任务能否完成、返工和多余操作才是指标。

从仓库根目录运行本地正向／反例；可检查[fixture 源码](../../lab/tests/support/experimental-events.ts)及[执行入口](../../lab/scripts/run-lab-fixtures.ts)。

```bash
cd lab
npm run test:fixtures
```

## 证据边界

此处提供选型和实验入口，不宣称 Events consumer、签名或真实 Tasks host 已跑通。

官方来源:

- <https://modelcontextprotocol.io/extensions/tasks/overview>
- <https://developers.cloudflare.com/changelog/post/2026-10-13-cloudflare-mcp-events/>
- <https://github.com/modelcontextprotocol/experimental-ext-triggers-events>
