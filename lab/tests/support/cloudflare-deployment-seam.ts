import {
  canonicalJson,
  postJson,
  sha256Hex,
  startHttpFixture,
} from "./loopback.js";

/**
 * Cloudflare deployment-seam local surrogate.
 *
 * Provenance: the work order anchors this fixture at the 2026-10-01 Workers
 * OAuth provider changelog and the Cloudflare One MCP portals documentation.
 * Neither page was reachable from this environment, so this fixture models the
 * seam with a declared local contract and does not claim to test a real OAuth
 * library, a real Cloudflare Gateway, or a real MCP portal. A POST example is
 * not used to assert any OAuth library vulnerability.
 *
 * What the seam demonstrates:
 * - business read and write MCP calls both arrive as HTTP POST;
 * - authorization is decided from the decoded tool name, required scope, and
 *   resource subject, never from the HTTP verb or a client routing header;
 * - the client-facing credential and the upstream credential are independent;
 * - a gateway can block a result after the upstream effect already happened, so
 *   a stable, explicit operation identity is what prevents retry duplication.
 */

export const CLOUDFLARE_SEAM_CLAIM =
  "Local surrogate for a Cloudflare One MCP portal / Workers OAuth provider seam. Not a real OAuth library test and not a real Gateway test.";

export const UPSTREAM_CREDENTIAL = "upstream-svc-token";

export interface ClientPrincipal {
  readonly token: string;
  readonly subject: string;
  readonly scopes: readonly string[];
  readonly resources: readonly string[];
}

export const CLIENT_PRINCIPALS: readonly ClientPrincipal[] = [
  {
    token: "client-alice-token",
    subject: "user:alice",
    scopes: ["docs:read"],
    resources: ["doc:42"],
  },
  {
    token: "client-editor-token",
    subject: "user:editor",
    scopes: ["docs:read", "docs:write"],
    resources: ["doc:42"],
  },
];

export const TOOL_SCOPES = {
  read_document: "docs:read",
  update_document: "docs:write",
} as const;

export type SeamTool = keyof typeof TOOL_SCOPES;

export type AuthorizationReason =
  "allowed" | "unknown_tool" | "missing_scope" | "resource_not_authorized";

export interface AuthorizationDecision {
  readonly allowed: boolean;
  readonly basis: "tool_effect";
  readonly requiredScope: string;
  readonly reason: AuthorizationReason;
}

export function authorizeToolCall(
  principal: ClientPrincipal,
  tool: string,
  resource: string,
): AuthorizationDecision {
  if (!(tool in TOOL_SCOPES)) {
    return {
      allowed: false,
      basis: "tool_effect",
      requiredScope: "",
      reason: "unknown_tool",
    };
  }
  const requiredScope = TOOL_SCOPES[tool as SeamTool];
  if (!principal.scopes.includes(requiredScope)) {
    return {
      allowed: false,
      basis: "tool_effect",
      requiredScope,
      reason: "missing_scope",
    };
  }
  if (!principal.resources.includes(resource)) {
    return {
      allowed: false,
      basis: "tool_effect",
      requiredScope,
      reason: "resource_not_authorized",
    };
  }
  return {
    allowed: true,
    basis: "tool_effect",
    requiredScope,
    reason: "allowed",
  };
}

/**
 * Counterexample policy kept only so a test can show why HTTP-verb
 * authorization is wrong: it treats every POST as write-capable and cannot
 * distinguish a read effect from a write effect.
 */
export function verbOnlyPolicyAllows(httpMethod: string): boolean {
  return httpMethod === "POST";
}

export interface UpstreamRequest {
  readonly op: "read" | "write";
  readonly resource: string;
  readonly body?: string;
  readonly operationId?: string;
  readonly authorization?: string;
}

export interface UpstreamResponse {
  readonly status: number;
  readonly value?: { readonly body: string; readonly version: number };
  readonly error?: string;
}

export interface UpstreamCall {
  readonly op: "read" | "write";
  readonly resource: string;
  readonly operationId?: string;
  readonly authorization?: string;
}

/**
 * Independent upstream MCP surrogate. It speaks its own envelope and enforces
 * its own credential, which the client never holds.
 */
export class UpstreamMcpSurrogate {
  private readonly documents = new Map<
    string,
    { body: string; version: number }
  >();
  readonly calls: UpstreamCall[] = [];

  constructor(initial: Record<string, string> = { "doc:42": "initial" }) {
    for (const [resource, body] of Object.entries(initial)) {
      this.documents.set(resource, { body, version: 1 });
    }
  }

  handle(request: UpstreamRequest): UpstreamResponse {
    this.calls.push({
      op: request.op,
      resource: request.resource,
      operationId: request.operationId,
      authorization: request.authorization,
    });
    if (request.authorization !== UPSTREAM_CREDENTIAL) {
      return { status: 401, error: "invalid_upstream_credential" };
    }
    const current = this.documents.get(request.resource);
    if (request.op === "read") {
      if (!current) return { status: 404, error: "not_found" };
      return { status: 200, value: { ...current } };
    }
    const version = (current?.version ?? 0) + 1;
    const body = request.body ?? current?.body ?? "";
    this.documents.set(request.resource, { body, version });
    return { status: 200, value: { body, version } };
  }

  versionOf(resource: string): number {
    return this.documents.get(resource)?.version ?? 0;
  }

  bodyOf(resource: string): string {
    return this.documents.get(resource)?.body ?? "";
  }

  writes(): UpstreamCall[] {
    return this.calls.filter((call) => call.op === "write");
  }
}

export interface EdgeProxyOptions {
  readonly upstream: UpstreamMcpSurrogate;
  readonly principals?: readonly ClientPrincipal[];
  readonly blockResultAfterEffect?: boolean;
  readonly dedupe?: boolean;
}

export interface EdgeProxyFixture {
  readonly endpoint: string;
  readonly blockedAfterEffectCount: number;
  readonly decisions: readonly AuthorizationDecision[];
  readonly requests: readonly {
    readonly method: string;
    readonly path: string;
  }[];
  close(): Promise<void>;
}

export const SEAM_TOOL_NAMES: readonly SeamTool[] = [
  "read_document",
  "update_document",
];

export async function startEdgeProxy(
  options: EdgeProxyOptions,
): Promise<EdgeProxyFixture> {
  const principals = options.principals ?? CLIENT_PRINCIPALS;
  const dedupe = options.dedupe ?? true;
  const decisions: AuthorizationDecision[] = [];
  const dedupStore = new Map<
    string,
    {
      readonly fingerprint: string;
      readonly value: { body: string; version: number };
    }
  >();
  let blockedAfterEffectCount = 0;

  const fixture = await startHttpFixture((request) => {
    if (request.path !== "/mcp") {
      return { status: 404, body: JSON.stringify({ error: "not_found" }) };
    }
    if (request.method !== "POST") {
      return {
        status: 405,
        headers: { allow: "POST" },
        body: JSON.stringify({ error: "method_not_allowed" }),
      };
    }
    let parsed: {
      id?: unknown;
      method?: unknown;
      params?: { name?: unknown; arguments?: Record<string, unknown> };
    };
    try {
      parsed = JSON.parse(request.body);
    } catch {
      return { status: 400, body: JSON.stringify({ error: "parse_error" }) };
    }
    if (parsed.method !== "tools/call") {
      return {
        status: 200,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: parsed.id ?? null,
          error: { code: -32601, message: "method_not_found" },
        }),
      };
    }

    // The body is authoritative. A client-supplied routing header never
    // selects or authorizes the effect.
    const tool = String(parsed.params?.name);
    const args = parsed.params?.arguments ?? {};
    const resource = String(args.resource ?? "");
    const token = readBearer(request.headers.authorization);
    const principal = principals.find((entry) => entry.token === token);
    if (!principal) {
      return jsonRpcError(parsed.id, 4001, "unauthenticated");
    }

    const decision = authorizeToolCall(principal, tool, resource);
    decisions.push(decision);
    if (!decision.allowed) {
      return jsonRpcError(parsed.id, 4003, `forbidden:${decision.reason}`);
    }

    if (tool === "read_document") {
      const upstream = options.upstream.handle({
        op: "read",
        resource,
        authorization: UPSTREAM_CREDENTIAL,
      });
      if (upstream.status !== 200) {
        return jsonRpcError(
          parsed.id,
          4004,
          upstream.error ?? "upstream_error",
        );
      }
      return jsonRpcResult(parsed.id, {
        tool,
        resource,
        body: upstream.value?.body,
        version: upstream.value?.version,
      });
    }

    const operationId =
      typeof args.operationId === "string" ? args.operationId : undefined;
    const body = String(args.body ?? "");
    const operationKey = canonicalJson({
      subject: principal.subject,
      tool,
      resource,
      operationId,
    });
    const fingerprint = sha256Hex(canonicalJson({ resource, body }));
    if (dedupe && operationId) {
      const existing = dedupStore.get(operationKey);
      if (existing) {
        if (existing.fingerprint !== fingerprint) {
          return jsonRpcError(parsed.id, 4009, "operation_id_conflict");
        }
        return jsonRpcResult(parsed.id, {
          tool,
          resource,
          body: existing.value.body,
          version: existing.value.version,
          deduplicated: true,
        });
      }
    }

    const upstream = options.upstream.handle({
      op: "write",
      resource,
      body,
      operationId,
      authorization: UPSTREAM_CREDENTIAL,
    });
    if (upstream.status !== 200 || !upstream.value) {
      return jsonRpcError(parsed.id, 4004, upstream.error ?? "upstream_error");
    }
    if (dedupe && operationId) {
      dedupStore.set(operationKey, { fingerprint, value: upstream.value });
    }
    if (options.blockResultAfterEffect) {
      blockedAfterEffectCount += 1;
      // Simulated gateway failure: the effect is committed upstream, but the
      // client never receives a result.
      return {
        status: 502,
        body: JSON.stringify({ error: "upstream_result_blocked" }),
      };
    }
    return jsonRpcResult(parsed.id, {
      tool,
      resource,
      body: upstream.value.body,
      version: upstream.value.version,
      deduplicated: false,
    });
  });

  return {
    endpoint: `${fixture.origin}/mcp`,
    get blockedAfterEffectCount() {
      return blockedAfterEffectCount;
    },
    decisions,
    get requests() {
      return fixture.requests.map((entry) => ({
        method: entry.method,
        path: entry.path,
      }));
    },
    close: () => fixture.close(),
  };
}

export interface SeamCallResult {
  readonly status: number;
  readonly json: unknown;
}

export function toolCallEnvelope(
  name: SeamTool,
  args: Record<string, unknown>,
): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  };
}

export async function callSeamTool(
  endpoint: string,
  token: string,
  name: SeamTool,
  args: Record<string, unknown>,
  extraHeaders: Readonly<Record<string, string>> = {},
): Promise<SeamCallResult> {
  const result = await postJson(endpoint, toolCallEnvelope(name, args), {
    authorization: `Bearer ${token}`,
    ...extraHeaders,
  });
  return { status: result.status, json: result.json };
}

function readBearer(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^Bearer\s+(.+)$/.exec(value);
  return match ? match[1] : undefined;
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
