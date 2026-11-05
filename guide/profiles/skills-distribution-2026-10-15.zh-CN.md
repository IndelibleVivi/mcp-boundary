---
profile_id: skills-distribution-2026-10-15
profile_version: 3
assessed_at: 2026-11-06
language: zh-CN
language_peer: skills-distribution-2026-10-15.md
---

# Skills 分发与导入

Base: `2026-07-28` / explicit host compatibility. Extension/spec: `Beta; SEP-3392 transition observed 2026-11-06; SEP-2640 Final`. First assessed: `2026-10-15`. Reassessed: `2026-11-06`. OpenAI package-review path observed: `2026-11-06`.

选择这条路径，是为了把多工具工作流与服务器一起提供。完整扩展基于 `2026-07-28`，通过 `server/discover` 宣告 Resources 与 `io.modelcontextprotocol/skills`。**2026-10-15** 观察到的 OpenAI importer 页面以初始化能力为入口，并将自身实现称为 bounded static subset；这是带日期的 host 证据，也是本地 scanner surrogate 的来源，不是当前 OpenAI 要求。当前的 `<https://developers.openai.com/plugins/build/mcp-server>` 页面讲的是构建 MCP server。扩展契约、历史 host 路径和当前 package-review 路径应分别登记，不能由“支持 Skills”推导出同一加载行为。

## 接法

先发现能力，再走 `skills/list`、`skills/get({uri})`、`resources/read({uri})`。静态 entry 提供原样 frontmatter 和完整文件清单；每个文件有 URI、SHA-256 digest 与字节数。`resources/directory/read` 仅在 `directoryRead: true` 时可用。完整扩展允许 dynamic 清单，但不能据此认定静态 importer 接受它。

skill 身份是来源服务器与 SKILL.md URI 的组合；缓存、审批和物化路径都必须保留来源。相对引用从 SKILL.md 所在目录解析。普通 resource read 只取回内容，不等于宿主已加载或激活 skill。

SEP-3392 将 Skills 归为 Beta；旧 `stable/` 路径表示已发布文本。SEP Final 不等于 Stable 成熟度承诺。宿主作用于已加载 skill 时保留加载所用 entry，后续 supporting read 按该清单校验；resources 集合改变后重新获得 content-bound approval。实时目录列表不能扩展已获批准的清单。

## 正向例子与反例

Lab 提供一个 skill 和一个 supporting file：首次扫描后更改内容，对照实时读取、清单 digest/size 和旧导入快照；重扫成功后才更新快照。再故意制造 digest 不匹配，确认 tools 仍可返回，而已导入 skills 保留上次有效版本。

修复时先比对清单与实际字节。对于历史 host 路径，修复后重扫并读取导入产物，随后进行审阅与新插件版本提交；服务器部署成功并不证明这条链已经完成。frontmatter、路径与大小限制也需要检查。

对当前的 skills-only 插件更新，应上传完整的新 ZIP，检查 metadata 与 bundled-skill findings，再提交该 package version 供审阅。当前 OpenAI 文档要求 metadata 或 bundled-skill 变更上传新 ZIP；自动 continuous-update 路径针对 hosted MCP tools。审阅不等于批准或发布。

从仓库根目录运行本地正向／反例；可检查[fixture 源码](../../lab/tests/support/skills-over-mcp.ts)及[执行入口](../../lab/scripts/run-lab-fixtures.ts)。

```bash
cd lab
npm run test:fixtures
```

## 证据边界

本地 scanner 是 surrogate。真实 Scan Tools、安装、激活都仍需对应宿主观察。MCP Boundary 自身继续是纯 skill，示例服务器留在 Lab。

官方来源:

- <https://skills.extensions.modelcontextprotocol.io/specification/beta/skills>
- <https://modelcontextprotocol.io/seps/3392-extension-lifecycle>
- <https://modelcontextprotocol.io/seps/2640-skills-extension>
- <https://developers.openai.com/plugins/deploy/submission>
- <https://developers.openai.com/plugins/build/mcp-server>
- <https://developers.cloudflare.com/changelog/post/2026-10-10-cloudflare-mcp-skills/>
