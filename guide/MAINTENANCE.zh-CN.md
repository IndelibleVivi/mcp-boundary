# Maintenance workflow

简体中文 · [English](MAINTENANCE.md)

Guide、protocol profiles、moving integration guidance、case-study receipts 与活跃 Boundary skill 的 version pressure 不同。只更新当前最小 authority，再同步仍然服务于现行产品的 peers。

## 统一仓库状态

本目录是 MCP Boundary 仓库中的 `guide/`。Repository contract 是根目录 `AGENTS.md`；唯一活跃分发的 skill 是 `../src/skills/mcp-boundary/`；初次导入的 pin 位于 `../provenance/UPSTREAMS.lock.json`。`skill/mcp-server-engineering/` 及其 `VERSION-REGISTER.json` bindings 已为本次候选冻结为历史 release 与 evaluation 材料。当前工作直接更新 `guide/` 与活跃 Boundary skill；不能从冻结 skill 重新生成，也不能写回冻结 skill。下方检查历史 package 的命令只验证保留的 snapshot。

## 出现新 MCP revision 时

1. 核验 official specification index 与 changelog。
2. 在 `profiles/` 下新增 English 与简体中文 peers，不要在旧 profile 中重写 historical requirements。
3. 在有必要时，于新旧 profiles 同时记录 migration boundary。
4. 更新 `profiles/README*`，以及 current truth 已改变的 Guide prose。
5. 把选定 English profile 加入 `../src/skills/mcp-boundary/references/profiles/`，更新 active protocol-selection path 与 `../provenance/SOURCES.json`，再重新生成 plugin package。Root tests 会把 exact copies 与 canonical Guide profile bytes 绑定。
6. 普通 current work 不更新已冻结的 `VERSION-REGISTER.json` 或历史 skill。只有历史材料记录的 evidence 确实错误时才修正，并记录 correction provenance。
7. 为 removed、added、changed behavior 加入 revision-bound tests 或 test guidance。
8. 除非属于 normative protocol text，否则 host/product guidance 留在带日期的 moving profile。

## Bilingual synchronization

- English 与 `zh-CN` 是 semantic peers，不是 source/summary 关系。
- IDs、version values、normative keywords、code、methods、headers、claim status、receipts 与 residuals 保持一致。
- Prose 可以自然化，但 translation 不能把 `SHOULD` 强化成 `MUST`，也不能把 `unknown` 变成 `verified`。
- 两份 peer files 在同一个可 review commit 中修改。

## Evidence updates

- 不能修改旧 receipt 来代表新 execution。
- New run 使用新 receipt ID 或显式 versioned receipt set。
- Raw private output 若含 local paths 或 sensitive material，应留在 public repository 外。
- Public projection 保留 provenance，并说明删除了什么。
- 只有 execution ownership 真实变化时，才能把 `reproduced` 改成 `independently-reproduced`。

## Skill updates

- 活跃 skill 的改动属于 `../src/skills/mcp-boundary/`，而不是已冻结的 `skill/mcp-server-engineering/`。其 `SKILL.md` 保持成比例的 controller；详细 method 放在 `references/`，可复用 output files 放在 `assets/`。
- 只加载 task-relevant profile。
- Reference 只有在会改变 agent behavior 时才加入。
- 同时运行 official skill validator 与 repository-local structural validator。
- Material workflow change 应在 pinned public 或 synthetic server 上 forward-test，不能暴露 private source。

## Architecture atlas updates

- 把 `docs/architecture/architecture-model.json` 作为 regions、nodes、states、edges、unknowns、selected views 与 render contract 的 semantic authority。
- English / 简体中文之间保持 stable `R/N/S/E/U` identities。Ownership、version、evidence status 或 feedback route 改变时，先改 model。
- 新 form factor 使用原生 layout；只有 reader 的问题发生实质变化时才新建 semantic
  view。不能把 landscape canvas crop、rotate 或 splice 成 portrait detail page。
- Landscape repository / full-screen 与 portrait document / print layouts 都能 materially help 时，把它们作为 native siblings 保留。两者共用一个 semantic model 与 stable IDs，明确各自 reader job，不能让 layout variants 漂移成两套 truth。
- 三组 deep views 的 `.excalidraw` geometry 保持 editable，publication SVGs 保持成对；依次运行 `prepare_bilingual_architecture_scenes.py`、`layout_portrait_architecture_scenes.py` 与 `render_architecture_svgs.py`。
- `V-FRONT` 作为两张 self-contained native-SVG source/publication siblings 维护。Semantics 改变时先改 model，再同步两个 language files，检查 XML 与 forbidden external dependencies，并实际查看 1600×900 / README-width browser renders。
- 在各自 intended reading scale 检查十二张 deep-atlas SVG 与两张 `V-FRONT` SVG。Script 或 XML check 成功并不证明 legibility、connector routing、sibling alignment 或 semantic completeness。

## External review handoff

- 优先传递 public repository URL 与 full commit hash，不把 ZIP attachment 作为默认路径。
- 必须使用 archive 时，在传输前运行 `scan_review_bundle.py`，并要求 reviewer 在 ingestion 后重新检查 strict UTF-8、`U+FFFD`、inventory 与 manifest。
- Read-only sandbox 只能防止 mutation，不能证明 evaluation agent 无法读取 oracle。每次只把当前 fixture、prompt 与 fixture-local metadata 物化到独立 temporary repository。
- 若传输改变 bytes，立即停止 exact-code claims，改从 pinned public commit 或经过验证的 strict-UTF-8 text bundle 恢复；损坏 artifact 只作为 transfer evidence 保留。

## Release checks

运行：

```bash
PYTHONDONTWRITEBYTECODE=1 python3 skill/mcp-server-engineering/scripts/check_python_syntax.py skill/mcp-server-engineering/scripts tools tests
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -v
python3 skill/mcp-server-engineering/scripts/validate_version_register.py VERSION-REGISTER.json
python3 skill/mcp-server-engineering/scripts/sync_profile_mirrors.py --check VERSION-REGISTER.json
python3 skill/mcp-server-engineering/scripts/check_bilingual_coverage.py .
python3 tools/validate_evaluation_corpus.py .
python3 skill/mcp-server-engineering/scripts/validate_skill_package.py skill/mcp-server-engineering
python3 skill/mcp-server-engineering/scripts/check_markdown_links.py .
python3 skill/mcp-server-engineering/scripts/scan_review_bundle.py .
git diff --check
```

上方 version-register、mirror 与 historical-skill 命令只验证冻结的 `2.0.1` snapshot；它们不是 current active skill 的写入步骤。Current Guide 或活跃 skill 改动后，还要回到仓库根目录运行 `AGENTS.md` 中的 root plugin/workspace checks。若 installed skill 正在检查另一个 repository，应相对该 active skill package 的 `SKILL.md` 解析资源，不能在 target repository 中按同名文件碰运气。

随后 inspect staged diff，确认没有 private continuity 或 raw logs 进入 repo，intentional commit、push、verify GitHub Actions；只有 remote commit 确定后再为 documented release 打 tag。
