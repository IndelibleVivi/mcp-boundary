---
profile_id: openai-entrypoints-2026-10-15
profile_version: 1
assessed_at: 2026-10-15
language: zh-CN
language_peer: openai-entrypoints-2026-10-15.md
---

# OpenAI 原生入口

Base: `2026-07-28` / explicit host compatibility. Extension/spec: `moving spec observed 2026-10-15`. Assessed: `2026-10-15`.

适用于用户从导航、thread 或文件直接打开 App。上游支持表描述预期平台能力；其中 Web 指 Work browser，排除 classic ChatGPT。观察日的 global/thread 列覆盖 desktop、Work browser、iOS、Android，file handler 仅列 desktop；它不是本仓库的宿主实测。

## 接法

在 tool 的 `_meta["openai/ui"].entrypoints` 注册 global/thread/file，保留 shared `_meta.ui.resourceUri`。global/thread 首次调用 arguments 为 `{}`；input schema 和 handler 都须接受，并返回有意义的初始视图。让用户接着选择 context，再验证和执行依赖该 context 的动作；不要虚构缺失身份或权限。首屏使用初始 tool result，避免无故重复调用。

file 入口另有 file argument contract，不能套用空对象规则。没有原生入口的宿主仍应通过普通 tool call 完成承诺功能，并保留可供模型使用的结果。

## 正向例子与反例

Lab 的空参数 open 返回初始状态，随后用户提交 context；同一 handler 在没有入口能力时也可由普通工具调用。对照 required context 的旧 schema，可以定位“模型调用正常、直接打开失败”的差别。无效输入继续拒绝。

包装另走 portable root `plugin.json`，OpenAI 展示信息放 `extensions.com.openai.interface`。该 inline object 整体替代兼容 overlay，不做逐字段 merge。由一份作者源生成根清单和 `.codex-plugin/plugin.json`，检查 icons/prompts/identity 与 ZIP 一致。固定 `skills/` 目录发现 skill，无需引入 MCP runtime。

从仓库根目录运行本地正向／反例；可检查[fixture 源码](../../lab/tests/support/openai-entrypoint.ts)及[执行入口](../../lab/scripts/run-lab-fixtures.ts)。

```bash
cd lab
npm run test:fixtures
```

额外的本地浏览器检查使用已安装的 MCP Apps SDK bridge 渲染独立 resource，验证首屏仅调用一次以及用户选择后的下一次调用。sandbox 保留 `allow-scripts`；操作按钮通过 bridge 发起工具调用，避免依赖 native form submission。需要已安装的 bundled Playwright Chromium：

```bash
npm run test:entrypoint-view
```

## 证据边界

本地调用与拆包校验不证明真实 sidebar admission、host rendering、安装或激活。当前 public listing 与候选源码版本分别记录。

官方来源:

- <https://github.com/openai/mcp-extensions/blob/main/docs/spec.md>
- <https://developers.openai.com/plugins/build/plugins>
