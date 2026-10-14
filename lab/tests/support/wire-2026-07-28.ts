import { postJson, startHttpFixture } from "./loopback.js";

/**
 * Wire-level local HTTP fixture for the MCP `2026-07-28` revision.
 *
 * Official facts (coordinator-verified 2026-10-15 against
 * `modelcontextprotocol.io/specification/2026-07-28/basic/index#meta`,
 * `.../basic/versioning`, `.../basic/transports/streamable-http`, and
 * `.../server/discover`):
 * - every request is self-describing through `params._meta`; protocol version
 *   and client capabilities are required there, client identity is optional;
 * - the transport mirrors the body into required `MCP-Protocol-Version` and
 *   `Mcp-Method` headers, and `Mcp-Name` for name-bearing methods;
 * - a mirrored header that is missing or disagrees with the body is rejected
 *   with `-32020` before any capability executes;
 * - an unsupported revision is rejected with `-32022`.
 *
 * This is a deliberately tiny local protocol specimen: it serves
 * `server/discover`, `tools/list`, and one `tools/call` handler only. It is not
 * an SDK, not production compatibility, and not a named-host observation.
 */

export const MCP_REVISION_2026_07_28 = "2026-07-28";
export const WIRE_SERVER_NAME = "october-2026-wire-fixture";
export const WIRE_SERVER_VERSION = "1.0.0";
export const WIRE_TOOL_NAME = "lab_echo";

/** Request `_meta` keys stated by the 2026-07-28 `_meta` section. */
export const WIRE_REQUEST_META_KEYS = {
  protocolVersion: "io.modelcontextprotocol/protocolVersion",
  clientCapabilities: "io.modelcontextprotocol/clientCapabilities",
  clientInfo: "io.modelcontextprotocol/clientInfo",
} as const;

/** Result `_meta` key carrying server identity. */
export const WIRE_SERVER_INFO_META_KEY = "io.modelcontextprotocol/serverInfo";

export const WIRE_HEADERS = {
  protocolVersion: "MCP-Protocol-Version",
  method: "Mcp-Method",
  name: "Mcp-Name",
} as const;

export const WIRE_ERROR_CODES = {
  headerMismatch: -32020,
  unsupportedProtocolVersion: -32022,
  invalidParams: -32602,
  methodNotFound: -32601,
  invalidRequest: -32600,
  parseError: -32700,
} as const;

export type WireRejectionReason =
  | "batch_not_supported"
  | "client_response_shape"
  | "not_a_request"
  | "invalid_request_metadata"
  | "missing_protocol_version_header"
  | "protocol_version_header_mismatch"
  | "missing_method_header"
  | "method_header_mismatch"
  | "missing_name_header"
  | "name_header_mismatch"
  | "unsupported_protocol_version"
  | "unknown_method";

export interface WireFixtureState {
  readonly executed: string[];
  readonly rejections: Array<{
    reason: WireRejectionReason;
    method: string | null;
  }>;
  acceptedNotifications: number;
  acceptedRequests: number;
}

export interface WireFixture {
  readonly endpoint: string;
  readonly state: WireFixtureState;
  close(): Promise<void>;
}

export interface WireRequestInput {
  readonly method: string;
  readonly id?: number;
  readonly params?: Record<string, unknown>;
  /** Pass `null` to omit the field entirely. */
  readonly protocolVersion?: string | null;
  readonly clientCapabilities?: Record<string, unknown> | null;
  /** Optional; when present must be an Implementation {name, version}. */
  readonly clientInfo?: Record<string, unknown> | null;
  /** `undefined` mirrors the body; `null` omits the header. */
  readonly protocolVersionHeader?: string | null;
  readonly methodHeader?: string | null;
  readonly nameHeader?: string | null;
}

export interface WireRequest {
  readonly headers: Record<string, string>;
  readonly body: Record<string, unknown>;
}

/**
 * Build a request that satisfies the fixture's wire contract. Each optional
 * override lets a test break exactly one field to observe the rejection it
 * produces.
 */
export function buildWireRequest(input: WireRequestInput): WireRequest {
  const meta: Record<string, unknown> = {};
  if (input.protocolVersion !== null) {
    meta[WIRE_REQUEST_META_KEYS.protocolVersion] =
      input.protocolVersion ?? MCP_REVISION_2026_07_28;
  }
  if (input.clientCapabilities !== null) {
    meta[WIRE_REQUEST_META_KEYS.clientCapabilities] =
      input.clientCapabilities ?? {};
  }
  if (input.clientInfo) {
    meta[WIRE_REQUEST_META_KEYS.clientInfo] = input.clientInfo;
  }

  const bodyVersion = meta[WIRE_REQUEST_META_KEYS.protocolVersion];
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  const protocolVersionHeader =
    input.protocolVersionHeader === undefined
      ? typeof bodyVersion === "string"
        ? bodyVersion
        : null
      : input.protocolVersionHeader;
  if (protocolVersionHeader !== null) {
    headers[WIRE_HEADERS.protocolVersion] = protocolVersionHeader;
  }
  const methodHeader =
    input.methodHeader === undefined ? input.method : input.methodHeader;
  if (methodHeader !== null) headers[WIRE_HEADERS.method] = methodHeader;
  const nameHeader =
    input.nameHeader === undefined ? namingValue(input) : input.nameHeader;
  if (nameHeader !== null) headers[WIRE_HEADERS.name] = nameHeader;

  const body: Record<string, unknown> = {
    jsonrpc: "2.0",
    method: input.method,
    params: { ...(input.params ?? {}), _meta: meta },
  };
  if (input.id !== undefined) body.id = input.id;
  return { headers, body };
}

function namingValue(input: WireRequestInput): string | null {
  const params = input.params;
  if (input.method === "tools/call") {
    return typeof params?.name === "string" ? params.name : null;
  }
  if (input.method === "resources/read") {
    return typeof params?.uri === "string" ? params.uri : null;
  }
  if (input.method === "prompts/get") {
    return typeof params?.name === "string" ? params.name : null;
  }
  return null;
}

export async function startWireFixture(): Promise<WireFixture> {
  const state: WireFixtureState = {
    executed: [],
    rejections: [],
    acceptedNotifications: 0,
    acceptedRequests: 0,
  };
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
    return handle(request.body, request.headers, state);
  });
  return {
    endpoint: `${fixture.origin}/mcp`,
    state,
    close: () => fixture.close(),
  };
}

interface JsonRpcMessage {
  id?: unknown;
  method?: unknown;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

type FixtureResult = {
  status: number;
  headers?: Record<string, string>;
  body: string;
};

function handle(
  rawBody: string,
  headers: Readonly<Record<string, string>>,
  state: WireFixtureState,
): FixtureResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return error(null, WIRE_ERROR_CODES.parseError, "Parse error", 400);
  }
  if (Array.isArray(parsed) || parsed === null || typeof parsed !== "object") {
    return reject(state, "batch_not_supported", null, null);
  }
  const message = parsed as JsonRpcMessage;
  const id = message.id ?? null;

  if (message.result !== undefined || message.error !== undefined) {
    return reject(state, "client_response_shape", null, id);
  }
  if (typeof message.method !== "string") {
    return reject(state, "not_a_request", null, id);
  }
  const method = message.method;

  if (message.id === undefined) {
    // Notifications carry no request side effect.
    state.acceptedNotifications += 1;
    return { status: 202, body: "" };
  }

  const params = asRecord(message.params);
  const meta = asRecord(params?._meta);
  const protocolVersion = meta?.[WIRE_REQUEST_META_KEYS.protocolVersion];
  const clientCapabilities = meta?.[WIRE_REQUEST_META_KEYS.clientCapabilities];
  const clientInfo = meta?.[WIRE_REQUEST_META_KEYS.clientInfo];
  if (
    typeof protocolVersion !== "string" ||
    !isPlainObject(clientCapabilities) ||
    (clientInfo !== undefined && !isImplementation(clientInfo))
  ) {
    return reject(
      state,
      "invalid_request_metadata",
      method,
      id,
      WIRE_ERROR_CODES.invalidParams,
    );
  }

  const versionHeader = headers[WIRE_HEADERS.protocolVersion.toLowerCase()];
  if (!versionHeader) {
    return reject(
      state,
      "missing_protocol_version_header",
      method,
      id,
      WIRE_ERROR_CODES.headerMismatch,
    );
  }
  if (versionHeader !== protocolVersion) {
    return reject(
      state,
      "protocol_version_header_mismatch",
      method,
      id,
      WIRE_ERROR_CODES.headerMismatch,
    );
  }
  const methodHeader = headers[WIRE_HEADERS.method.toLowerCase()];
  if (!methodHeader) {
    return reject(
      state,
      "missing_method_header",
      method,
      id,
      WIRE_ERROR_CODES.headerMismatch,
    );
  }
  if (methodHeader !== method) {
    return reject(
      state,
      "method_header_mismatch",
      method,
      id,
      WIRE_ERROR_CODES.headerMismatch,
    );
  }
  const expectedName = nameBearingValue(method, params);
  if (expectedName !== undefined) {
    const nameHeader = headers[WIRE_HEADERS.name.toLowerCase()];
    if (!nameHeader) {
      return reject(
        state,
        "missing_name_header",
        method,
        id,
        WIRE_ERROR_CODES.headerMismatch,
      );
    }
    if (nameHeader !== expectedName) {
      return reject(
        state,
        "name_header_mismatch",
        method,
        id,
        WIRE_ERROR_CODES.headerMismatch,
      );
    }
  }

  if (protocolVersion !== MCP_REVISION_2026_07_28) {
    state.rejections.push({
      reason: "unsupported_protocol_version",
      method,
    });
    return error(
      id,
      WIRE_ERROR_CODES.unsupportedProtocolVersion,
      "Unsupported protocol version",
      400,
      {
        supported: [MCP_REVISION_2026_07_28],
        requested: protocolVersion,
      },
    );
  }

  state.acceptedRequests += 1;
  switch (method) {
    case "server/discover":
      return ok(id, {
        resultType: "complete",
        supportedVersions: [MCP_REVISION_2026_07_28],
        capabilities: { tools: {} },
        ttlMs: 300_000,
        cacheScope: "public",
        _meta: serverMeta(),
      });
    case "tools/list":
      return ok(id, {
        resultType: "complete",
        tools: [
          {
            name: WIRE_TOOL_NAME,
            description: "Echo one message; deterministic local specimen.",
            inputSchema: {
              type: "object",
              properties: { message: { type: "string" } },
              additionalProperties: false,
            },
          },
        ],
        _meta: serverMeta(),
      });
    case "tools/call": {
      const name = params?.name;
      if (name !== WIRE_TOOL_NAME) {
        return error(
          id,
          WIRE_ERROR_CODES.invalidParams,
          `Unknown tool ${String(name)}`,
          200,
        );
      }
      state.executed.push(WIRE_TOOL_NAME);
      return ok(id, {
        resultType: "complete",
        content: [{ type: "text", text: `executed:${WIRE_TOOL_NAME}` }],
        structuredContent: { tool: WIRE_TOOL_NAME, executed: true },
        _meta: serverMeta(),
      });
    }
    default:
      return reject(
        state,
        "unknown_method",
        method,
        id,
        WIRE_ERROR_CODES.methodNotFound,
        200,
      );
  }
}

function nameBearingValue(
  method: string,
  params: Record<string, unknown> | undefined,
): string | undefined {
  if (method === "tools/call" || method === "prompts/get") {
    return typeof params?.name === "string" ? params.name : undefined;
  }
  if (method === "resources/read") {
    return typeof params?.uri === "string" ? params.uri : undefined;
  }
  return undefined;
}

function serverMeta(): Record<string, unknown> {
  return {
    [WIRE_SERVER_INFO_META_KEY]: {
      name: WIRE_SERVER_NAME,
      version: WIRE_SERVER_VERSION,
    },
  };
}

function ok(id: unknown, result: Record<string, unknown>): FixtureResult {
  return { status: 200, body: JSON.stringify({ jsonrpc: "2.0", id, result }) };
}

function error(
  id: unknown,
  code: number,
  message: string,
  status: number,
  data?: Record<string, unknown>,
): FixtureResult {
  return {
    status,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data ? { data } : {}) },
    }),
  };
}

function reject(
  state: WireFixtureState,
  reason: WireRejectionReason,
  method: string | null,
  id: unknown = null,
  code: number = WIRE_ERROR_CODES.invalidRequest,
  status = 400,
): FixtureResult {
  state.rejections.push({ reason, method });
  return error(id, code, reason, status);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isPlainObject(value) ? (value as Record<string, unknown>) : undefined;
}

function isPlainObject(value: unknown): boolean {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isImplementation(value: unknown): boolean {
  const record = asRecord(value);
  return (
    record !== undefined &&
    typeof record.name === "string" &&
    typeof record.version === "string"
  );
}

export interface WireCallOutcome {
  readonly status: number;
  readonly json: unknown;
}

export async function callWire(
  endpoint: string,
  request: WireRequest,
): Promise<WireCallOutcome> {
  const response = await postJson(endpoint, request.body, request.headers);
  return { status: response.status, json: response.json };
}
