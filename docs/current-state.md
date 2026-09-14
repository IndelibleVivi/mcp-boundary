# Current state

Last reviewed: 2026-09-15

| Surface | State | Evidence / limit |
| --- | --- | --- |
| Author source | `0.1.0`, public on `main` | Skills-only Codex submission package through commit `a2b63e79514775a4df40de7fc51cfbc9a5556ecb` |
| Codex-native package | Generated and source-matched | `plugins/mcp-boundary/` contains only `.codex-plugin/plugin.json`; root `plugin.json`, `interface.screenshots`, and packaged screenshot assets are absent. Codex plugin validation passed with composer icon and logo assets resolved |
| Local ZIP | Generated, not uploaded | Ignored `dist/mcp-boundary-0.1.0.zip`; deterministic SHA-256 `a17bcfb07e43aa9fec70c4310dfd29ceb88605775381d5d217cd6d3c9c0c7377` |
| Public GitHub repository | Published | `https://github.com/IndelibleVivi/mcp-boundary`, public, default branch `main` |
| GitHub Actions | Passed | `validate` run `34865785399` and `deploy-pages` run `34865785457` passed for website commit `043a5fabf5ec021220a7d6c488c1ab76fa82337e` (header/ribbon/footer presentation); final package `validate` run `34789053017` passed for commit `a2b63e79514775a4df40de7fc51cfbc9a5556ecb` |
| Website source | One-page Offset + Porcelain source | `site/` plus portable `mcp-boundary-demo.html`; no public identity alternatives or appearance controls |
| GitHub Pages | Deployed | <https://indeliblevivi.github.io/mcp-boundary/> returned HTTP 200 and serves the refined header/ribbon/footer presentation (commit `043a5fabf5ec021220a7d6c488c1ab76fa82337e`); live browser verified the final status copy, interaction, zero console errors/warnings, and same-origin-only static requests |
| User installation | Not performed | Package validation does not modify the user's installed plugin set |
| Implicit invocation/model behavior | Not verified | Static trigger design and fixtures do not substitute for model evaluation |
| External plugin directory | Not submitted | Faye retains the manual upload step |
| Named-host interoperability | Not verified | No named-host acceptance claim is made |

The plugin is intentionally pure-skill: no MCP server, app connector, hook, auth flow, telemetry, or developer-operated service.
