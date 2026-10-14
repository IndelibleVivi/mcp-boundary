import { parse as parseYaml } from "yaml";
import { buildWireRequest } from "./wire-2026-07-28.js";
import {
  byteLength,
  canonicalJson,
  postJson,
  sha256Hex,
  startHttpFixture,
} from "./loopback.js";

/**
 * Skills-over-MCP local fixture with one skill and one supporting file.
 *
 * Official observed stable shape (coordinator-verified 2026-10-15 against
 * `https://skills.extensions.modelcontextprotocol.io/specification/stable/skills`):
 *
 *   Skill = {
 *     uri: "skill://local-skills-fixture/weekly-report/SKILL.md",
 *     frontmatter: { name, description, ...all parsed frontmatter },
 *     resources: [
 *       { uri: ".../SKILL.md", digest: "sha256:<64 lower hex>", size: <utf8 bytes> },
 *       { uri: ".../reference.md", digest: "...", size: ... }
 *     ]
 *   }
 *
 * `server/discover` declares `capabilities.resources` and
 * `capabilities.extensions["io.modelcontextprotocol/skills"]`; `skills/list`
 * returns `{resultType:"complete",skills:[Skill]}`; `skills/get` takes
 * `{uri}` and returns `{resultType:"complete",skill:<the same Skill>}`;
 * `resources/read` returns `{resultType:"complete",contents:[{uri,mimeType:
 * "text/markdown",text}]}` for exactly that URI. There is no separate manifest
 * wrapper, no id lookup, and no `path/bytes/sha256` fields on the wire.
 *
 * The importer surrogate is an explicit local model of the bounded static
 * subset the OpenAI importer documents. It is not an OpenAI host and issues no
 * host receipt. A local snapshot identity is derived from the host connection
 * identity plus the skill URI; it is not a wire field.
 */

export const SKILLS_EXTENSION_ID = "io.modelcontextprotocol/skills";
export const SKILLS_FIXTURE_SERVER = "local-skills-fixture";
export const SKILLS_FIXTURE_SKILL_NAME = "weekly-report";
export const SKILLS_FIXTURE_TOOLS = ["run_weekly_report"] as const;

export function skillUriFor(path: string): string {
  return `skill://${SKILLS_FIXTURE_SERVER}/${SKILLS_FIXTURE_SKILL_NAME}/${path}`;
}

export const SKILLS_FIXTURE_SKILL_URI = skillUriFor("SKILL.md");

export function digestOf(content: string): string {
  return `sha256:${sha256Hex(content)}`;
}

export interface SkillFileSource {
  readonly path: string;
  readonly content: string;
}

export interface SkillSource {
  readonly name: string;
  readonly files: readonly SkillFileSource[];
}

export interface SkillResource {
  readonly uri: string;
  readonly digest: string;
  readonly size: number;
}

export interface SkillEntry {
  readonly uri: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly resources: readonly SkillResource[];
}

export function defaultSkillSource(): SkillSource {
  return {
    name: SKILLS_FIXTURE_SKILL_NAME,
    files: [
      {
        path: "SKILL.md",
        content: [
          "---",
          "name: weekly-report",
          "description: Produce a bounded weekly report from a declared template.",
          "---",
          "",
          "# Weekly report",
          "",
          "Body marker: alpha.",
          "",
        ].join("\n"),
      },
      {
        path: "reference.md",
        content: "Template marker: alpha-reference.\n",
      },
    ],
  };
}

/** Returns the raw frontmatter block, or undefined when there is none. */
export function frontmatterBlock(source: string): string | undefined {
  return /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1];
}

/** Parse frontmatter with the pinned YAML parser; malformed content is rejected. */
export async function parseFrontmatter(
  source: string,
): Promise<Record<string, unknown> | undefined> {
  const block = frontmatterBlock(source);
  if (block === undefined) return undefined;
  try {
    const parsed = parseYaml(block);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

interface SkillRuntime {
  source: SkillSource;
  skillUriOverride?: string;
  digestOverrides: Map<string, { digest: string; size: number }>;
  droppedResources: Set<string>;
}

export interface SkillsFixture {
  readonly endpoint: string;
  readonly tools: readonly string[];
  setFileContent(path: string, content: string): void;
  corruptResource(path: string, digest: string, size?: number): void;
  acceptCurrentState(): void;
  dropResource(path: string): void;
  removeFile(path: string): void;
  overrideSkillUri(uri: string): void;
  liveSkill(): Promise<SkillEntry>;
  close(): Promise<void>;
}

export async function startSkillsFixture(
  initial: SkillSource = defaultSkillSource(),
): Promise<SkillsFixture> {
  const runtime: SkillRuntime = {
    source: initial,
    digestOverrides: new Map(),
    droppedResources: new Set(),
  };
  const fixture = await startHttpFixture((request) => {
    if (request.path !== "/mcp" || request.method !== "POST") {
      return { status: 404, body: JSON.stringify({ error: "not_found" }) };
    }
    return dispatch(request.body, runtime);
  });
  return {
    endpoint: `${fixture.origin}/mcp`,
    tools: SKILLS_FIXTURE_TOOLS,
    setFileContent(path, content) {
      runtime.source = {
        ...runtime.source,
        files: runtime.source.files.map((file) =>
          file.path === path ? { path, content } : file,
        ),
      };
      runtime.digestOverrides.delete(path);
    },
    corruptResource(path, digest, size) {
      const file = findFile(runtime, path);
      runtime.digestOverrides.set(path, {
        digest,
        size: size ?? byteLength(file.content),
      });
    },
    acceptCurrentState() {
      runtime.digestOverrides.clear();
      runtime.droppedResources.clear();
    },
    dropResource(path) {
      runtime.droppedResources.add(path);
    },
    removeFile(path) {
      runtime.source = {
        ...runtime.source,
        files: runtime.source.files.filter((file) => file.path !== path),
      };
    },
    overrideSkillUri(uri) {
      runtime.skillUriOverride = uri;
    },
    liveSkill: () => buildSkill(runtime),
    close: () => fixture.close(),
  };
}

function findFile(runtime: SkillRuntime, path: string): SkillFileSource {
  const file = runtime.source.files.find((entry) => entry.path === path);
  if (!file) throw new Error(`Unknown skill file ${path}.`);
  return file;
}

async function buildSkill(runtime: SkillRuntime): Promise<SkillEntry> {
  const skillDoc = runtime.source.files.find(
    (file) => file.path === "SKILL.md",
  );
  const frontmatter = skillDoc
    ? ((await parseFrontmatter(skillDoc.content)) ?? {})
    : {};
  return {
    uri: runtime.skillUriOverride ?? SKILLS_FIXTURE_SKILL_URI,
    frontmatter,
    resources: runtime.source.files.map((file) => {
      const override = runtime.digestOverrides.get(file.path);
      return {
        uri: skillUriFor(file.path),
        digest: override?.digest ?? digestOf(file.content),
        size: override?.size ?? byteLength(file.content),
      };
    }),
  };
}

async function dispatch(rawBody: string, runtime: SkillRuntime) {
  let parsed: {
    id?: unknown;
    method?: unknown;
    params?: Record<string, unknown>;
  };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }
  const id = parsed.id ?? null;
  switch (parsed.method) {
    case "server/discover":
      return jsonRpcResult(id, {
        resultType: "complete",
        supportedVersions: ["2026-07-28"],
        capabilities: {
          resources: {},
          extensions: { [SKILLS_EXTENSION_ID]: {} },
        },
      });
    case "tools/list":
      return jsonRpcResult(id, {
        resultType: "complete",
        tools: [...SKILLS_FIXTURE_TOOLS],
      });
    case "skills/list":
      return jsonRpcResult(id, {
        resultType: "complete",
        skills: [await buildSkill(runtime)],
      });
    case "skills/get": {
      const skill = await buildSkill(runtime);
      if (parsed.params?.uri !== skill.uri) {
        return jsonRpcError(id, -32602, "Unknown skill URI.");
      }
      return jsonRpcResult(id, { resultType: "complete", skill });
    }
    case "resources/read": {
      const uri = String(parsed.params?.uri);
      const file = runtime.source.files.find(
        (entry) => skillUriFor(entry.path) === uri,
      );
      if (!file || runtime.droppedResources.has(file.path)) {
        return jsonRpcError(id, -32602, `Resource unavailable: ${uri}`);
      }
      return jsonRpcResult(id, {
        resultType: "complete",
        contents: [{ uri, mimeType: "text/markdown", text: file.content }],
      });
    }
    default:
      return jsonRpcError(id, -32601, "Method not found.");
  }
}

function jsonRpcResult(id: unknown, result: unknown) {
  return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", id, result }) };
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return {
    status: 200,
    body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }),
  };
}

export interface SkillsRpcError {
  readonly isError: true;
  readonly code: number;
  readonly message: string;
}

export type SkillsRpcOutcome<T> =
  { readonly isError: false; readonly result: T } | SkillsRpcError;

export async function skillsCall<T>(
  endpoint: string,
  method: string,
  params: Record<string, unknown> = {},
): Promise<SkillsRpcOutcome<T>> {
  const request = buildWireRequest({ method, id: 1, params });
  const response = await postJson(endpoint, request.body, request.headers);
  const json = response.json as
    { result?: unknown; error?: { code: number; message: string } } | undefined;
  if (json?.error) {
    return {
      isError: true,
      code: json.error.code,
      message: json.error.message,
    };
  }
  if (!json || !("result" in json)) {
    return {
      isError: true,
      code: -32603,
      message: "Malformed fixture response.",
    };
  }
  return { isError: false, result: json.result as T };
}

export type SkillImportFailureReason =
  | "invalid_skill_uri"
  | "path_traversal"
  | "missing_skill_document"
  | "missing_resource"
  | "resource_digest_mismatch"
  | "resource_size_mismatch"
  | "frontmatter_mismatch";

export interface ImportedSkillSnapshot {
  readonly serverIdentity: string;
  readonly skillUri: string;
  readonly frontmatter: Readonly<Record<string, unknown>>;
  readonly resources: Readonly<Record<string, string>>;
  /** Local derived identity; never a wire field. */
  readonly entryIdentity: string;
}

export interface SkillImportFailure {
  readonly uri: string;
  readonly reason: SkillImportFailureReason;
  readonly priorSnapshotRetained: boolean;
}

export interface SkillScanResult {
  readonly tools: readonly string[];
  readonly capabilities: Record<string, unknown>;
  readonly imported: readonly string[];
  readonly failed: readonly SkillImportFailure[];
}

type ImportOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: SkillImportFailureReason };

export function entryIdentity(skill: SkillEntry): string {
  return digestOf(
    `${skill.uri}\n${skill.resources
      .map((resource) => `${resource.uri}@${resource.digest}`)
      .join("\n")}`,
  );
}

/**
 * Explicit local surrogate for a host-side skill importer. `scan` performs a
 * static snapshot import keyed by the connection identity plus the skill URI.
 * `liveRead` always reads the current server state. This is a local model, not
 * a host.
 */
export class SkillScanImporter {
  private readonly snapshots = new Map<string, ImportedSkillSnapshot>();
  private tools: readonly string[] = [];
  private capabilities: Record<string, unknown> = {};

  constructor(private readonly endpoint: string) {}

  async scan(): Promise<SkillScanResult> {
    const toolResponse = await skillsCall<{ tools: string[] }>(
      this.endpoint,
      "tools/list",
    );
    if (!toolResponse.isError) this.tools = toolResponse.result.tools;

    const discoverResponse = await skillsCall<{
      capabilities?: Record<string, unknown>;
    }>(this.endpoint, "server/discover");
    if (!discoverResponse.isError) {
      this.capabilities = discoverResponse.result.capabilities ?? {};
    }

    const listResponse = await skillsCall<{ skills: SkillEntry[] }>(
      this.endpoint,
      "skills/list",
    );
    const imported: string[] = [];
    const failed: SkillImportFailure[] = [];
    if (!listResponse.isError) {
      for (const skill of listResponse.result.skills) {
        const outcome = await this.importOne(skill);
        if (outcome.ok) imported.push(skill.uri);
        else {
          failed.push({
            uri: skill.uri,
            reason: outcome.reason,
            priorSnapshotRetained: this.snapshots.has(
              this.snapshotKey(skill.uri),
            ),
          });
        }
      }
    }
    return {
      tools: this.tools,
      capabilities: this.capabilities,
      imported,
      failed,
    };
  }

  private snapshotKey(skillUri: string): string {
    // Connection identity plus skill URI; never the URI alone.
    return `${this.endpoint}|${skillUri}`;
  }

  private async importOne(skill: SkillEntry): Promise<ImportOutcome> {
    if (!skill.uri.startsWith(`skill://${SKILLS_FIXTURE_SERVER}/`)) {
      return { ok: false, reason: "invalid_skill_uri" };
    }
    if (skill.uri.split("/").includes("..")) {
      return { ok: false, reason: "path_traversal" };
    }
    if (!skill.resources.some((resource) => resource.uri === skill.uri)) {
      return { ok: false, reason: "missing_skill_document" };
    }

    const files: Record<string, string> = {};
    for (const resource of skill.resources) {
      if (resource.uri.split("/").includes("..")) {
        return { ok: false, reason: "path_traversal" };
      }
      const readResponse = await skillsCall<{
        contents: Array<{ uri: string; mimeType: string; text: string }>;
      }>(this.endpoint, "resources/read", { uri: resource.uri });
      if (readResponse.isError)
        return { ok: false, reason: "missing_resource" };
      const content = readResponse.result.contents[0];
      if (!content || content.uri !== resource.uri) {
        return { ok: false, reason: "missing_resource" };
      }
      if (digestOf(content.text) !== resource.digest) {
        return { ok: false, reason: "resource_digest_mismatch" };
      }
      if (byteLength(content.text) !== resource.size) {
        return { ok: false, reason: "resource_size_mismatch" };
      }
      files[resource.uri] = content.text;
    }

    const parsedFrontmatter = await parseFrontmatter(files[skill.uri] ?? "");
    if (
      !parsedFrontmatter ||
      typeof parsedFrontmatter.name !== "string" ||
      typeof parsedFrontmatter.description !== "string" ||
      canonicalJson(parsedFrontmatter) !== canonicalJson(skill.frontmatter)
    ) {
      return { ok: false, reason: "frontmatter_mismatch" };
    }

    this.snapshots.set(this.snapshotKey(skill.uri), {
      serverIdentity: this.endpoint,
      skillUri: skill.uri,
      frontmatter: skill.frontmatter,
      resources: files,
      entryIdentity: entryIdentity(skill),
    });
    return { ok: true };
  }

  async liveRead(): Promise<SkillEntry> {
    const listResponse = await skillsCall<{ skills: SkillEntry[] }>(
      this.endpoint,
      "skills/list",
    );
    if (listResponse.isError) throw new Error(listResponse.message);
    const skill = listResponse.result.skills[0];
    if (!skill) throw new Error("No skill was returned.");
    return skill;
  }

  snapshot(skillUri: string): ImportedSkillSnapshot | undefined {
    return this.snapshots.get(this.snapshotKey(skillUri));
  }

  visibleTools(): readonly string[] {
    return this.tools;
  }
}
