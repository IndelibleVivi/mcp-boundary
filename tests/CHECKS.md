# Verification contract

## Source and package

```bash
python3 scripts/build_plugin.py --write
python3 scripts/build_plugin.py --check
python3 -m unittest discover -s tests -p 'test_*.py'
python3 tests/static_check.py
skill-validate src/skills/mcp-boundary
skill-validate plugins/mcp-boundary/skills/mcp-boundary
python3 scripts/package_plugin.py
```

GitHub Actions also installs the pinned dependency in `requirements/skill-validation.txt` and runs `scripts/validate_skill_schema.py` against both skill paths. That repository-local gate reproduces the frontmatter, naming, and unfinished-scaffold checks used by the current installed `skill-validate`, so schema validation is enforced remotely rather than relying only on a maintainer workstation.

These checks cover author/generated Codex manifest parity, absence of the root manifest that would select Agent Plugins conversion, absence of unsupported screenshot configuration/assets, Codex composer/logo asset resolution, pure-skill packaging, exact-copy hashes, license/provenance presence, safe archive paths, passive SVG assets, the single approved public identity, three bounded contract fixtures, website resource integrity, and numeric contrast for the selected palette.

The fixtures provide deterministic evidence for package and teaching-contract checks. They do **not** prove that a model will invoke the skill correctly or produce the expected diagnosis.

## Browser workflow

Check Playwright availability first, then serve the repository root and run the browser contract through the installed Playwright skill wrapper:

```bash
command -v npx >/dev/null 2>&1
python3 -m http.server 8877 --bind 127.0.0.1
~/.codex/skills/playwright/scripts/playwright_cli.sh \
  -s=mcp-boundary open http://127.0.0.1:8877/site/
~/.codex/skills/playwright/scripts/playwright_cli.sh \
  -s=mcp-boundary run-code --filename tests/browser_check.js
~/.codex/skills/playwright/scripts/playwright_cli.sh \
  -s=mcp-boundary close
```

Keep the local server running while the three Playwright commands execute, then stop it. The browser check covers:

- fixed Offset + Porcelain identity, including hostile legacy query parameters;
- case and prompt selection with keyboard behavior;
- clipboard-denied fallback;
- responsive widths from 320 to 1440 pixels with no document overflow;
- reduced-motion behavior;
- readable no-JavaScript content;
- the portable standalone page when served from the same local origin;
- absence of browser JavaScript errors and programmatic external requests.

It refreshes the committed homepage desktop/mobile screenshots and returns a structured pass list. Static checks establish that the standalone file has its CSS, JavaScript, favicon, and social image inlined; this CLI run does not separately exercise `file://` navigation. The browser check requires the Playwright skill wrapper and its managed browser, so it is intentionally not part of dependency-free CI.

## Claims these checks do not establish

- installed or implicit model invocation behavior;
- comparative behavior with and without the skill;
- acceptance by a plugin directory or a named host;
- GitHub Pages deployment;
- production MCP interoperability;
- a complete accessibility, security, privacy, or legal certification.

Those require the relevant exact observer and should remain `not verified` until exercised.
