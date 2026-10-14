---
profile_id: skills-distribution-2026-10-15
profile_version: 1
assessed_at: 2026-10-15
language: en
language_peer: skills-distribution-2026-10-15.zh-CN.md
---

# Skills distribution and import

Base: `2026-07-28` / explicit host compatibility. Extension/spec: `stable observed 2026-10-15; SEP-2640 Final`. Assessed: `2026-10-15`.

Choose this path to ship multi-tool workflows with the server. The full extension targets `2026-07-28` and declares Resources and Skills through `server/discover`. OpenAI's importer still documents initialization capabilities and a bounded static subset. Record both paths rather than interpreting “Skills supported” as one loading behavior.

## Integration

Observe the capability, then use `skills/list`, `skills/get({uri})`, and `resources/read({uri})`. Static entries include verbatim frontmatter and all files, each with URI, SHA-256 digest and byte size. Directory reads require `directoryRead: true`. The full extension's dynamic manifests do not establish static-importer support.

Preserve both originating server and SKILL.md URI in identity, cache, approvals and materialized paths. Resolve references against that SKILL.md directory. An ordinary resource read retrieves content; the host's skill loader owns activation.

## Positive example and counterexample

The Lab serves one skill and a supporting file. Import once, change the content, compare live reads/catalog digests and sizes with the old snapshot, then rescan successfully. Deliberately mismatch a digest: tools remain visible while the last valid imported skills stay intact.

Repair the manifest/bytes boundary before touching tool handlers. Rescan and inspect imported content; OpenAI then requires review and plugin-version submission. Deployment alone proves none of those steps. Frontmatter, path and size checks also apply; consult the current importer for precise limits.

Run the local positive/counterexample lane from the repository root; inspect its [fixture source](../../lab/tests/support/skills-over-mcp.ts) and [runner](../../lab/scripts/run-lab-fixtures.ts).

```bash
cd lab
npm run test:fixtures
```

## Evidence ceiling

The local scanner is a surrogate. Actual Scan Tools, installation and activation require their own host observations. MCP Boundary remains a pure skill; server specimens stay in the Lab.

Sources:

- <https://skills.extensions.modelcontextprotocol.io/specification/stable/skills>
- <https://modelcontextprotocol.io/seps/2640-skills-extension>
- <https://developers.openai.com/plugins/build/mcp-server>
- <https://developers.cloudflare.com/changelog/post/2026-10-10-cloudflare-mcp-skills/>
