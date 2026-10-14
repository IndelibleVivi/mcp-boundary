import { postJson, startHttpFixture } from "./loopback.js";
import { entrypointHostHtml, entrypointUiAssets } from "./entrypoint-ui.js";

/**
 * OpenAI global/thread entrypoint local fixture.
 *
 * Official facts (coordinator-verified 2026-10-15, from the
 * `openai/mcp-extensions` `docs/spec.md`): a tool advertises entrypoints as
 * `_meta["openai/ui"].entrypoints` with entries like `{"type":"global"}` and
 * `{"type":"thread"}`; the file entrypoint is a separate contract. Opening an
 * entrypoint is an ordinary `tools/call` with `arguments: {}` — there is no
 * separate entrypoint method. Whether the host shows a global or thread
 * entrypoint is a host UI decision, not a server capability or header.
 *
 * The tool schema has optional context fields and `additionalProperties:false`.
 * The same handler returns useful initial content and `structuredContent` when
 * opened with `{}`, and a contextualized result once the user supplies a
 * scenario. Missing business context is never fabricated: the initial result
 * asks the user to choose.
 *
 * The host helper below is a local host fixture. Its `surfacesEntrypoints`
 * boolean is local configuration used to exercise the no-entrypoint fallback.
 * This is a source-contract fixture and makes no named-host claim.
 */

export const OPENAI_FIXTURE_UI_URI =
  "ui://mcp-app-production-fieldlab/entrypoint/v1.html";

export const ENTRYPOINT_TYPES = ["global", "thread"] as const;
export type EntrypointType = (typeof ENTRYPOINT_TYPES)[number];

/** Entrypoints are declared under `_meta["openai/ui"].entrypoints`. */
export const OPENAI_UI_META_KEY = "openai/ui";

/** Existing repository aliases, reused verbatim. */
export const OPENAI_ALIAS_META_KEYS = {
  outputTemplate: "openai/outputTemplate",
  toolInvocationInvoking: "openai/toolInvocation/invoking",
  toolInvocationInvoked: "openai/toolInvocation/invoked",
} as const;

export const ENTRYPOINT_TOOL_NAME = "inspect_boundary";
export const ENTRYPOINT_SCENARIOS = [
  "resource-delivery",
  "optional-capability",
] as const;
export type EntrypointScenario = (typeof ENTRYPOINT_SCENARIOS)[number];

export function entrypointToolMeta(
  uiUri: string = OPENAI_FIXTURE_UI_URI,
): Record<string, unknown> {
  return {
    [OPENAI_ALIAS_META_KEYS.outputTemplate]: uiUri,
    ui: { resourceUri: uiUri },
    [OPENAI_UI_META_KEY]: {
      entrypoints: ENTRYPOINT_TYPES.map((type) => ({ type })),
    },
  };
}

export function entrypointToolInputSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      scenario: { type: "string", enum: [...ENTRYPOINT_SCENARIOS] },
      probeId: { type: "string" },
    },
    additionalProperties: false,
  };
}

export interface EntrypointFixture {
  readonly endpoint: string;
  readonly origin: string;
  readonly state: { toolCalls: number; resourceReads: number };
  close(): Promise<void>;
}

export async function startEntrypointFixture(
  uiUri: string = OPENAI_FIXTURE_UI_URI,
): Promise<EntrypointFixture> {
  const assets = await entrypointUiAssets();
  const state = { toolCalls: 0, resourceReads: 0 };
  const fixture = await startHttpFixture(async (request) => {
    if (request.path === "/app" && request.method === "GET") {
      return {
        headers: { "content-type": "text/html; charset=utf-8" },
        body: assets.app,
      };
    }
    if (request.path === "/" && request.method === "GET") {
      const initial = await callFixtureTool(`${fixture.origin}/mcp`, {});
      return {
        headers: { "content-type": "text/html; charset=utf-8" },
        body: entrypointHostHtml(initial.json.result, assets.hostScript),
      };
    }
    if (request.path !== "/mcp" || request.method !== "POST") {
      return { status: 404, body: JSON.stringify({ error: "not_found" }) };
    }
    try {
      const parsed = JSON.parse(request.body) as { method?: string };
      if (parsed?.method === "tools/call") state.toolCalls += 1;
      if (parsed?.method === "resources/read") state.resourceReads += 1;
    } catch {
      /* Dispatch owns the JSON-RPC parse error. */
    }
    return dispatch(request.body, uiUri, assets.app);
  });
  return {
    endpoint: `${fixture.origin}/mcp`,
    origin: fixture.origin,
    state,
    close: () => fixture.close(),
  };
}

interface EntrypointRequest {
  id?: unknown;
  method?: unknown;
  params?: { name?: unknown; arguments?: unknown; uri?: unknown };
}

function dispatch(rawBody: string, uiUri: string, html: string) {
  let parsed: EntrypointRequest;
  try {
    parsed = JSON.parse(rawBody) as EntrypointRequest;
  } catch {
    return jsonRpcError(null, -32700, "parse_error");
  }
  const id = parsed.id ?? null;
  switch (parsed.method) {
    case "resources/read":
      if (parsed.params?.uri !== uiUri)
        return jsonRpcError(id, -32602, "unknown_resource");
      return jsonRpcResult(id, {
        resultType: "complete",
        contents: [
          { uri: uiUri, mimeType: "text/html;profile=mcp-app", text: html },
        ],
      });
    case "tools/list":
      return jsonRpcResult(id, {
        resultType: "complete",
        tools: [
          {
            name: ENTRYPOINT_TOOL_NAME,
            description: "Return one deterministic MCP App boundary specimen.",
            inputSchema: entrypointToolInputSchema(),
            _meta: entrypointToolMeta(uiUri),
          },
        ],
      });
    case "tools/call":
      return callTool(id, parsed.params, uiUri);
    default:
      return jsonRpcError(id, -32601, "method_not_found");
  }
}

function callTool(
  id: unknown,
  params: EntrypointRequest["params"],
  uiUri: string,
) {
  if (params?.name !== ENTRYPOINT_TOOL_NAME) {
    return jsonRpcError(id, -32602, "unknown_tool");
  }
  const args = params.arguments;
  if (!isPlainObject(args)) {
    return jsonRpcError(id, -32602, "arguments_must_be_an_object");
  }
  const record = args as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key !== "scenario" && key !== "probeId") {
      return jsonRpcError(id, -32602, `unexpected_argument:${key}`);
    }
  }
  const scenario = record.scenario;
  if (scenario !== undefined && !isScenario(scenario)) {
    return jsonRpcError(id, -32602, "invalid_scenario");
  }
  const probeId = record.probeId;
  if (probeId !== undefined && typeof probeId !== "string") {
    return jsonRpcError(id, -32602, "invalid_probeId");
  }

  if (scenario === undefined) {
    // Initial open with {}: return useful UI data and ask the user to choose.
    return jsonRpcResult(id, {
      resultType: "complete",
      content: [
        {
          type: "text",
          text: "Choose a scenario to inspect a boundary.",
        },
      ],
      structuredContent: {
        format: "entrypoint-initial@1",
        ui: { resourceUri: uiUri },
        needs: "scenario",
        options: [...ENTRYPOINT_SCENARIOS],
        probeId: null,
      },
      _meta: { ui: { resourceUri: uiUri } },
    });
  }

  return jsonRpcResult(id, {
    resultType: "complete",
    content: [
      {
        type: "text",
        text: `Boundary specimen ${probeId ?? "unset"} is ready for ${scenario}.`,
      },
    ],
    structuredContent: {
      format: "fieldlab-boundary-result@1",
      scenario,
      probeId: probeId ?? null,
      evidenceCeiling: "process",
    },
    _meta: { ui: { resourceUri: uiUri } },
  });
}

function isScenario(value: unknown): value is EntrypointScenario {
  return (
    typeof value === "string" &&
    (ENTRYPOINT_SCENARIOS as readonly string[]).includes(value)
  );
}

function isPlainObject(value: unknown): boolean {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

export interface EntrypointCallResult {
  readonly status: number;
  readonly json: {
    readonly result?: Record<string, unknown>;
    readonly error?: { readonly code: number; readonly message: string };
  };
}

export async function callFixtureTool(
  endpoint: string,
  argumentsInput: Record<string, unknown>,
): Promise<EntrypointCallResult> {
  const response = await postJson(endpoint, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: ENTRYPOINT_TOOL_NAME, arguments: argumentsInput },
  });
  return {
    status: response.status,
    json: response.json as EntrypointCallResult["json"],
  };
}

export async function listFixtureTools(
  endpoint: string,
): Promise<{ tools: Array<Record<string, unknown>> }> {
  const response = await postJson(endpoint, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/list",
    params: {},
  });
  const json = response.json as {
    result?: { tools: Array<Record<string, unknown>> };
  };
  return { tools: json.result?.tools ?? [] };
}

export interface EntrypointHostOptions {
  /** Local host fixture configuration: does this host surface entrypoint UI? */
  readonly entrypoints: boolean;
  /** Which entrypoint types this host offers. Defaults to all declared types. */
  readonly kinds?: readonly EntrypointType[];
}

export interface EntrypointHostFixture {
  readonly surfacesEntrypoints: boolean;
  readonly kinds: readonly EntrypointType[];
  /** Entrypoints this host would show for a tool, filtered from its own config. */
  visibleEntrypoints(
    toolMeta: Record<string, unknown>,
  ): Array<{ type: EntrypointType }>;
  /** Open the entrypoint: an ordinary tools/call with `{}`. */
  openFromEntrypoint(endpoint: string): Promise<EntrypointCallResult>;
  /** Ordinary tool call carrying user-supplied context. */
  callWithContext(
    endpoint: string,
    args: Record<string, unknown>,
  ): Promise<EntrypointCallResult>;
}

export function createEntrypointHost(
  options: EntrypointHostOptions,
): EntrypointHostFixture {
  const kinds = options.kinds ?? ENTRYPOINT_TYPES;
  return {
    surfacesEntrypoints: options.entrypoints,
    kinds,
    visibleEntrypoints(toolMeta) {
      if (!options.entrypoints) return [];
      const declared =
        (toolMeta[OPENAI_UI_META_KEY] as { entrypoints?: unknown })
          ?.entrypoints ?? [];
      if (!Array.isArray(declared)) return [];
      return declared
        .filter(
          (entry): entry is { type: EntrypointType } =>
            isPlainObject(entry) &&
            kinds.includes((entry as { type: EntrypointType }).type),
        )
        .map((entry) => ({ type: entry.type }));
    },
    async openFromEntrypoint(endpoint) {
      if (!options.entrypoints) {
        throw new Error(
          "This host does not surface entrypoints; use callWithContext instead.",
        );
      }
      return callFixtureTool(endpoint, {});
    },
    callWithContext(endpoint, args) {
      return callFixtureTool(endpoint, args);
    },
  };
}
