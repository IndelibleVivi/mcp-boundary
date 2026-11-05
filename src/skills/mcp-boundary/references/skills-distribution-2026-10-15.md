# Skills distribution

Choose this path when a workflow must travel with a server's tools. Do not turn the MCP Boundary plugin into a server: the Lab owns runnable server specimens.

## Contract and host selection

First assessed 2026-10-15; reassessed 2026-11-06. Extension: `io.modelcontextprotocol/skills`. The current specification is **Beta** under SEP-3392; its former `stable/` location meant a released text, not the new Stable maturity guarantee. SEP-2640 remains Final as a proposal record. Record extension maturity, specification revision and selected base protocol separately. Beta can introduce breaking changes without a new identifier; check any advertised `revision` before enabling an unfamiliar revision rather than inventing a numeric version.

For the full extension on `2026-07-28`, discover `capabilities.resources` and `capabilities.extensions["io.modelcontextprotocol/skills"]` through `server/discover`. Then enumerate `skills/list`, obtain the same entry through `skills/get({uri})`, and fetch files through `resources/read({uri})`. A static entry carries verbatim frontmatter and the complete resources array, each with URI, SHA-256 digest and byte size. Optional `resources/directory/read` requires `directoryRead: true`. The full extension also admits `resources: "dynamic"`; do not assume a static importer accepts it.

Identity is `(originating server identity, SKILL.md URI)`, including cache and approval records. The URI authority is a namespace, not an instruction to resolve a network host. Resolve supporting paths from the directory containing that SKILL.md. Reading a resource alone does not load or activate a skill: route activation through the host's skill loader and its approval/integrity rules. A changed skill must not silently inherit an unrelated server's approval.

While the host acts on a loaded skill, retain the entry used to load it. Verify each requested file against that held manifest; a live directory listing cannot authorize a newly added file. Refreshing a changed resources set invalidates content-bound approval and requires renewed approval. Fetch supporting files on demand. A digest matches advertised bytes; it is not a trust anchor.

## Complete the historical static-import path

On **2026-10-15**, OpenAI's `/plugins/build/mcp-server` page described a bounded Skills importer at submission-time Scan Tools whose initialization capability declaration used `capabilities.extensions`. That is a dated host observation and the basis for the repository's local scanner surrogate, not a current OpenAI requirement. The current `/plugins/build/mcp-server` page covers building an MCP server, and `plugins/deploy/submission` documents bundled-skill changes as package ZIP updates requiring review. Keep the extension contract, historical host path and current package path separate. Do not add an initialization flow to a July-only server to copy the historical example; establish the scanner's accepted transport/profile from current evidence first.

Start with one SKILL.md and one supporting file. Publish their complete manifest, return identical entries from list/get, and serve the advertised exact bytes. Hash UTF-8 text bytes or decoded blob bytes. When content changes, regenerate the manifest from the bytes being served before a new scan. The historical importer also checked frontmatter equality, safe unique paths and import limits. Consult current host evidence for limits rather than hard-coding vendor limits into a general server.

For the historical host path, after editing the server: (1) read back catalog and files, (2) run Scan Tools, (3) inspect imported skill content, (4) review and submit the plugin update under existing authority. A tool scan returning tools does not prove skill import succeeded. Any skill validation failure can preserve the prior imported snapshot. Diagnose the catalog/bytes/import layer before rewriting tool handlers. Preserve the old valid snapshot on failed import, then rescan after repair; do not publish a partial mixture. For a current MCP Boundary release, upload the complete plugin ZIP, inspect its metadata and packaged-skill findings, then submit that package version for review before publication.

## Executable acceptance

The repository Lab supplies a local distribution fixture and scanner surrogate. For a catalog/bytes freshness repair, exercise initial import, updated live bytes with an unchanged imported snapshot, successful rescan, then a mismatched digest. The last scan must retain the earlier skill while still returning tools.

Select acceptance examples by the path being changed. Check same-URI separation across servers when implementing or changing a host loader, shared cache or server selection. That identity rule does not expand a bounded catalog repair into a loader rewrite or require an owner question about an already excluded path. Complete the authorized repair and state any relevant untouched boundary. These are local mechanism checks; OpenAI import, installation and activation require an actual authorized host observation.

Sources: [Extension lifecycle](https://modelcontextprotocol.io/seps/3392-extension-lifecycle), [Skills specification](https://skills.extensions.modelcontextprotocol.io/specification/beta/skills), [SEP-2640](https://modelcontextprotocol.io/seps/2640-skills-extension), [OpenAI submission and package review](https://developers.openai.com/plugins/deploy/submission), [OpenAI build an MCP server](https://developers.openai.com/plugins/build/mcp-server), [Cloudflare Skills rollout](https://developers.cloudflare.com/changelog/post/2026-10-10-cloudflare-mcp-skills/).
