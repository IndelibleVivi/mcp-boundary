# Skills distribution

Choose this path when a workflow must travel with a server's tools. Do not turn the MCP Boundary plugin into a server: the Lab owns runnable server specimens.

## Contract and host selection

Assessed 2026-10-15. Extension: `io.modelcontextprotocol/skills`; source revision: the official `stable` specification observed on that date (no invented numeric extension version). SEP-2640 is Final; the living specification owns subsequent requirements. Base revision is separately selected.

For the full extension on `2026-07-28`, discover `capabilities.resources` and `capabilities.extensions["io.modelcontextprotocol/skills"]` through `server/discover`. Then enumerate `skills/list`, obtain the same entry through `skills/get({uri})`, and fetch files through `resources/read({uri})`. A static entry carries verbatim frontmatter and the complete resources array, each with URI, SHA-256 digest and byte size. Optional `resources/directory/read` requires `directoryRead: true`. The full extension also admits `resources: "dynamic"`; do not assume a static importer accepts it.

Identity is `(originating server identity, SKILL.md URI)`, including cache and approval records. The URI authority is a namespace, not an instruction to resolve a network host. Resolve supporting paths from the directory containing that SKILL.md. Reading a resource alone does not load or activate a skill: route activation through the host's skill loader and its approval/integrity rules. A changed skill must not silently inherit an unrelated server's approval.

## Complete the static import path

OpenAI's current plugin documentation describes a bounded importer at submission-time Scan Tools. Its initialization capability declaration uses `capabilities.extensions`, not the earlier `experimental` location. Record this host path separately from the full extension's current discovery path. Do not add an initialize flow to a July-only server merely to copy an example; establish the scanner's accepted transport/profile first.

Start with one SKILL.md and one supporting file. Publish their complete manifest, return identical entries from list/get, and serve the advertised exact bytes. Hash UTF-8 text bytes or decoded blob bytes. When content changes, regenerate the manifest from the bytes being served before a new scan. OpenAI additionally checks frontmatter equality, safe unique paths and import limits. Consult the current importer page for limits rather than hard-coding vendor limits into a general server.

After editing the server: (1) read back catalog and files, (2) run Scan Tools, (3) inspect imported skill content, (4) review and submit the plugin update under existing authority. A tool scan returning tools does not prove skill import succeeded. Any skill validation failure can preserve the prior imported snapshot. Diagnose the catalog/bytes/import layer before rewriting tool handlers. Preserve the old valid snapshot on failed import, then rescan after repair; do not publish a partial mixture.

## Executable acceptance

The repository Lab supplies a local distribution fixture and scanner surrogate. For a catalog/bytes freshness repair, exercise initial import, updated live bytes with an unchanged imported snapshot, successful rescan, then a mismatched digest. The last scan must retain the earlier skill while still returning tools.

Select acceptance examples by the path being changed. Check same-URI separation across servers when implementing or changing a host loader, shared cache or server selection. That identity rule does not expand a bounded catalog repair into a loader rewrite or require an owner question about an already excluded path. Complete the authorized repair and state any relevant untouched boundary. These are local mechanism checks; OpenAI import, installation and activation require an actual authorized host observation.

Sources: [Skills specification](https://skills.extensions.modelcontextprotocol.io/specification/stable/skills), [SEP-2640](https://modelcontextprotocol.io/seps/2640-skills-extension), [OpenAI importer](https://developers.openai.com/plugins/build/mcp-server), [Cloudflare Skills rollout](https://developers.cloudflare.com/changelog/post/2026-10-10-cloudflare-mcp-skills/).
