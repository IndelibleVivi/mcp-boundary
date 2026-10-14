import { afterEach, describe, expect, it } from "vitest";
import { getJson, postJson } from "../support/loopback.js";
import {
  buildWireRequest,
  callWire,
  MCP_REVISION_2026_07_28,
  WIRE_ERROR_CODES,
  WIRE_HEADERS,
  WIRE_REQUEST_META_KEYS,
  WIRE_SERVER_INFO_META_KEY,
  WIRE_SERVER_NAME,
  WIRE_TOOL_NAME,
  startWireFixture,
  type WireFixture,
} from "../support/wire-2026-07-28.js";

const running: WireFixture[] = [];

afterEach(async () => {
  await Promise.all(running.splice(0).map((fixture) => fixture.close()));
});

async function fixture(): Promise<WireFixture> {
  const started = await startWireFixture();
  running.push(started);
  return started;
}

function resultOf(json: unknown): Record<string, unknown> {
  return ((json as { result?: Record<string, unknown> }).result ??
    {}) as Record<string, unknown>;
}

function errorOf(json: unknown): {
  code?: number;
  message?: string;
  data?: Record<string, unknown>;
} {
  return ((json as { error?: Record<string, unknown> }).error ?? {}) as {
    code?: number;
    message?: string;
    data?: Record<string, unknown>;
  };
}

describe("MCP 2026-07-28 wire fixture (local protocol specimen)", () => {
  it("serves discover, list, and call for a self-describing request", async () => {
    const wire = await fixture();

    const discover = await callWire(
      wire.endpoint,
      buildWireRequest({ method: "server/discover", id: 1 }),
    );
    expect(discover.status).toBe(200);
    const discovered = resultOf(discover.json);
    expect(discovered.resultType).toBe("complete");
    expect(discovered.supportedVersions).toEqual([MCP_REVISION_2026_07_28]);
    expect(discovered.capabilities).toEqual({ tools: {} });
    expect(discovered.cacheScope).toBe("public");
    expect(typeof discovered.ttlMs).toBe("number");
    expect(
      (discovered._meta as Record<string, unknown>)[WIRE_SERVER_INFO_META_KEY],
    ).toMatchObject({ name: WIRE_SERVER_NAME, version: "1.0.0" });

    const list = await callWire(
      wire.endpoint,
      buildWireRequest({ method: "tools/list", id: 2 }),
    );
    const listed = resultOf(list.json);
    expect(listed.resultType).toBe("complete");
    const tool = (listed.tools as Array<Record<string, unknown>>)[0];
    expect(tool?.name).toBe(WIRE_TOOL_NAME);
    expect(tool?.inputSchema).toMatchObject({ type: "object" });

    const call = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 3,
        params: { name: WIRE_TOOL_NAME, arguments: { message: "hi" } },
      }),
    );
    expect(resultOf(call.json).resultType).toBe("complete");
    expect(wire.state.executed).toEqual([WIRE_TOOL_NAME]);
    expect(wire.state.rejections).toEqual([]);
  });

  it("succeeds without an optional client identity", async () => {
    const wire = await fixture();
    const request = buildWireRequest({ method: "tools/list", id: 5 });
    const meta = (request.body.params as { _meta: Record<string, unknown> })
      ._meta;
    expect(meta[WIRE_REQUEST_META_KEYS.clientInfo]).toBeUndefined();
    const response = await callWire(wire.endpoint, request);
    expect(response.status).toBe(200);
    expect(resultOf(response.json).resultType).toBe("complete");
  });

  it("treats client capabilities as per-request data, not sticky state", async () => {
    const wire = await fixture();
    const first = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/list",
        id: 6,
        clientCapabilities: { sampling: {} },
      }),
    );
    const second = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/list",
        id: 7,
        clientCapabilities: {},
      }),
    );
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const missingAfterValid = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/list",
        id: 8,
        clientCapabilities: null,
      }),
    );
    expect(missingAfterValid.status).toBe(400);
    expect(errorOf(missingAfterValid.json).code).toBe(
      WIRE_ERROR_CODES.invalidParams,
    );
    // The server advertises only its own tools capability, never the client's.
    for (const response of [first, second]) {
      expect(resultOf(response.json).capabilities).toBeUndefined();
    }
  });

  it("rejects missing or malformed request metadata with HTTP 400 -32602", async () => {
    const wire = await fixture();
    const missing = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 10,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        protocolVersion: null,
        clientCapabilities: null,
      }),
    );
    expect(missing.status).toBe(400);
    expect(errorOf(missing.json).code).toBe(WIRE_ERROR_CODES.invalidParams);

    const malformed = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 11,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        clientInfo: { name: "only-a-name" },
      }),
    );
    expect(malformed.status).toBe(400);
    expect(errorOf(malformed.json).code).toBe(WIRE_ERROR_CODES.invalidParams);
    expect(wire.state.executed).toEqual([]);
  });

  it("rejects an unsupported revision with HTTP 400 -32022 and its data", async () => {
    const wire = await fixture();
    const response = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/list",
        id: 20,
        protocolVersion: "2025-11-25",
      }),
    );
    expect(response.status).toBe(400);
    const error = errorOf(response.json);
    expect(error.code).toBe(WIRE_ERROR_CODES.unsupportedProtocolVersion);
    expect(error.data).toEqual({
      supported: [MCP_REVISION_2026_07_28],
      requested: "2025-11-25",
    });
  });

  it("rejects a missing or mismatched MCP-Protocol-Version header with -32020", async () => {
    const wire = await fixture();
    const missing = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/list",
        id: 30,
        protocolVersionHeader: null,
      }),
    );
    expect(missing.status).toBe(400);
    expect(errorOf(missing.json).code).toBe(WIRE_ERROR_CODES.headerMismatch);

    const mismatch = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/list",
        id: 31,
        protocolVersion: "2026-07-28",
        protocolVersionHeader: "2025-11-25",
      }),
    );
    expect(mismatch.status).toBe(400);
    expect(errorOf(mismatch.json).code).toBe(WIRE_ERROR_CODES.headerMismatch);
    expect(wire.state.rejections.map((entry) => entry.reason)).toEqual([
      "missing_protocol_version_header",
      "protocol_version_header_mismatch",
    ]);
  });

  it("rejects a missing or mismatched Mcp-Method header before execution", async () => {
    const wire = await fixture();
    const missing = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 40,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        methodHeader: null,
      }),
    );
    expect(missing.status).toBe(400);
    expect(errorOf(missing.json).code).toBe(WIRE_ERROR_CODES.headerMismatch);

    const mismatch = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 41,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        methodHeader: "tools/list",
      }),
    );
    expect(mismatch.status).toBe(400);
    expect(errorOf(mismatch.json).code).toBe(WIRE_ERROR_CODES.headerMismatch);
    expect(wire.state.executed).toEqual([]);
  });

  it("rejects a missing or mismatched Mcp-Name header for tools/call", async () => {
    const wire = await fixture();
    const missing = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 50,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        nameHeader: null,
      }),
    );
    expect(missing.status).toBe(400);
    expect(errorOf(missing.json).code).toBe(WIRE_ERROR_CODES.headerMismatch);

    const mismatch = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 51,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        nameHeader: "other_tool",
      }),
    );
    expect(mismatch.status).toBe(400);
    expect(errorOf(mismatch.json).code).toBe(WIRE_ERROR_CODES.headerMismatch);
    expect(wire.state.executed).toEqual([]);
  });

  it("rejects batch and client-response bodies with HTTP 400", async () => {
    const wire = await fixture();
    const batch = await postJson(wire.endpoint, [
      buildWireRequest({ method: "tools/list", id: 1 }).body,
    ]);
    expect(batch.status).toBe(400);
    expect(errorOf(batch.json).code).toBe(WIRE_ERROR_CODES.invalidRequest);

    const responseShape = await postJson(wire.endpoint, {
      jsonrpc: "2.0",
      id: 1,
      result: { anything: true },
    });
    expect(responseShape.status).toBe(400);
    expect(errorOf(responseShape.json).code).toBe(
      WIRE_ERROR_CODES.invalidRequest,
    );
  });

  it("answers removed lifecycle methods and unknown methods with -32601", async () => {
    const wire = await fixture();
    const initialize = await callWire(
      wire.endpoint,
      buildWireRequest({ method: "initialize", id: 60 }),
    );
    expect(errorOf(initialize.json).code).toBe(WIRE_ERROR_CODES.methodNotFound);
    const unknown = await callWire(
      wire.endpoint,
      buildWireRequest({ method: "resources/subscribe", id: 61 }),
    );
    expect(errorOf(unknown.json).code).toBe(WIRE_ERROR_CODES.methodNotFound);
  });

  it("accepts a notification with no id without executing anything", async () => {
    const wire = await fixture();
    const notification = await postJson(
      wire.endpoint,
      { jsonrpc: "2.0", method: "notifications/progress", params: {} },
      { [WIRE_HEADERS.method]: "notifications/progress" },
    );
    expect(notification.status).toBe(202);
    expect(notification.text).toBe("");
    expect(wire.state.acceptedNotifications).toBe(1);
    expect(wire.state.executed).toEqual([]);
  });

  it("refuses GET on the MCP endpoint", async () => {
    const wire = await fixture();
    const get = await getJson(wire.endpoint);
    expect(get.status).toBe(405);
  });
});
