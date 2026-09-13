# Current state

Last reviewed: 2026-09-14

| Surface | State | Evidence / limit |
| --- | --- | --- |
| Author source | `0.1.0`, public on `main` | Initial source commit `206e5202a197d7f3515f1822719162c594598244` |
| Portable package | Generated and source-matched | `plugins/mcp-boundary/`; local build check and GitHub Actions validation passed |
| Local ZIP | Generated, not uploaded | Ignored `dist/mcp-boundary-0.1.0.zip`; SHA-256 `012e41429d6e88e0d07b818df89477c0781e7965b0c9da916510edc9568760d9` |
| Public GitHub repository | Published | `https://github.com/IndelibleVivi/mcp-boundary`, public, default branch `main` |
| GitHub Actions | Passed | `validate` run `34787017461` passed for initial source commit |
| Website source | One-page Offset + Porcelain source | `site/` and `mcp-boundary-demo.html`; no public deployment implied |
| GitHub Pages | Not deployed | Enabling Pages is a separate external mutation |
| User installation | Not performed | Package validation does not modify the user's installed plugin set |
| Implicit invocation/model behavior | Not verified | Static trigger design and fixtures do not substitute for model evaluation |
| External plugin directory | Not submitted | Faye retains the manual upload step |
| Named-host interoperability | Not verified | No named-host acceptance claim is made |

The plugin is intentionally pure-skill: no MCP server, app connector, hook, auth flow, telemetry, or developer-operated service.
