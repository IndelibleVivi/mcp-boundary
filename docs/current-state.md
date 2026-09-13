# Current state

Last reviewed: 2026-09-14

| Surface | State | Evidence / limit |
| --- | --- | --- |
| Author source | `0.1.0`, public on `main` | Codex-native submission package and website implementation through commit `52eeff6edd235488f769cd509340367fe1444cfb` |
| Codex-native package | Generated and source-matched | `plugins/mcp-boundary/` contains only `.codex-plugin/plugin.json`; root `plugin.json` is absent so submission does not select Agent Plugins conversion. Codex plugin validation passed with composer icon and logo assets resolved |
| Local ZIP | Generated, not uploaded | Ignored `dist/mcp-boundary-0.1.0.zip`; deterministic SHA-256 `4e875ef60ad10c00ac6e797dc3f2ecbdb7c56ce22b20029e24137a3876c77c83` |
| Public GitHub repository | Published | `https://github.com/IndelibleVivi/mcp-boundary`, public, default branch `main` |
| GitHub Actions | Passed | `validate` run `34788617742` and `deploy-pages` run `34788617727` passed for commit `52eeff6edd235488f769cd509340367fe1444cfb` |
| Website source | One-page Offset + Porcelain source | `site/` plus portable `mcp-boundary-demo.html`; no public identity alternatives or appearance controls |
| GitHub Pages | Deployed | <https://indeliblevivi.github.io/mcp-boundary/> returned HTTP 200; live browser verified the final status copy, interaction, zero console errors/warnings, and same-origin-only static requests |
| User installation | Not performed | Package validation does not modify the user's installed plugin set |
| Implicit invocation/model behavior | Not verified | Static trigger design and fixtures do not substitute for model evaluation |
| External plugin directory | Not submitted | Faye retains the manual upload step |
| Named-host interoperability | Not verified | No named-host acceptance claim is made |

The plugin is intentionally pure-skill: no MCP server, app connector, hook, auth flow, telemetry, or developer-operated service.
