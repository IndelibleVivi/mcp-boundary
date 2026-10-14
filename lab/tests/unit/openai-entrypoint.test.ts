import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { entrypointUiAssets } from "../support/entrypoint-ui.js";
import { postJson } from "../support/loopback.js";
import {
  callFixtureTool,
  createEntrypointHost,
  ENTRYPOINT_TOOL_NAME,
  listFixtureTools,
  OPENAI_ALIAS_META_KEYS,
  OPENAI_FIXTURE_UI_URI,
  OPENAI_UI_META_KEY,
  startEntrypointFixture,
  type EntrypointFixture,
} from "../support/openai-entrypoint.js";

const running: EntrypointFixture[] = [];
beforeAll(async () => {
  await entrypointUiAssets();
}, 15_000);

afterEach(async () => {
  await Promise.all(running.splice(0).map((fixture) => fixture.close()));
});

async function fixture(): Promise<EntrypointFixture> {
  const started = await startEntrypointFixture();
  running.push(started);
  return started;
}

function structured(json: unknown): Record<string, unknown> {
  const result = (json as { result?: { structuredContent?: unknown } }).result;
  return (result?.structuredContent ?? {}) as Record<string, unknown>;
}

function errorOf(json: unknown): { code?: number; message?: string } {
  return ((json as { error?: { code?: number; message?: string } }).error ??
    {}) as { code?: number; message?: string };
}

describe("OpenAI entrypoint local fixture (ordinary tools/call)", () => {
  it("serves the exact advertised UI resource rather than the neutral specimen", async () => {
    const server = await fixture();
    const read = await postJson(server.endpoint, {
      jsonrpc: "2.0",
      id: 1,
      method: "resources/read",
      params: { uri: OPENAI_FIXTURE_UI_URI },
    });
    const result = read.json as {
      result: {
        contents: Array<{ uri: string; mimeType: string; text: string }>;
      };
    };
    expect(result.result.contents).toHaveLength(1);
    const resource = result.result.contents[0]!;
    expect(resource.uri).toBe(OPENAI_FIXTURE_UI_URI);
    expect(resource.mimeType).toBe("text/html;profile=mcp-app");
    expect(resource.text).toBe(
      await (await fetch(`${server.origin}/app`)).text(),
    );
    const missing = await postJson(server.endpoint, {
      jsonrpc: "2.0",
      id: 2,
      method: "resources/read",
      params: { uri: "ui://missing/view" },
    });
    expect(errorOf(missing.json).code).toBe(-32602);
  });
  it("advertises entrypoints and an optional, strict input schema", async () => {
    const server = await fixture();
    const { tools } = await listFixtureTools(server.endpoint);
    const tool = tools.find((entry) => entry.name === ENTRYPOINT_TOOL_NAME)!;
    const meta = tool._meta as Record<string, unknown>;
    expect(meta[OPENAI_ALIAS_META_KEYS.outputTemplate]).toBe(
      OPENAI_FIXTURE_UI_URI,
    );
    expect(meta.ui).toEqual({ resourceUri: OPENAI_FIXTURE_UI_URI });
    expect(meta[OPENAI_UI_META_KEY]).toEqual({
      entrypoints: [{ type: "global" }, { type: "thread" }],
    });

    const schema = tool.inputSchema as Record<string, unknown>;
    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties as object).sort()).toEqual([
      "probeId",
      "scenario",
    ]);
    expect(schema.required).toBeUndefined();
  });

  it("opens with {} to useful initial data, then adds user context", async () => {
    const server = await fixture();
    const host = createEntrypointHost({ entrypoints: true });
    expect(host.visibleEntrypoints(entrypointMeta())).toEqual([
      { type: "global" },
      { type: "thread" },
    ]);

    const initial = await host.openFromEntrypoint(server.endpoint);
    expect(initial.json.error).toBeUndefined();
    const initialData = structured(initial.json);
    expect(initialData.format).toBe("entrypoint-initial@1");
    expect(initialData.needs).toBe("scenario");
    expect(initialData.options).toEqual([
      "resource-delivery",
      "optional-capability",
    ]);
    // No scenario or probe id is fabricated for the user.
    expect(initialData.scenario).toBeUndefined();
    expect(initialData.probeId).toBeNull();

    const contextual = await host.callWithContext(server.endpoint, {
      scenario: "optional-capability",
      probeId: "probe-1",
    });
    const contextualData = structured(contextual.json);
    expect(contextualData.format).toBe("fieldlab-boundary-result@1");
    expect(contextualData.scenario).toBe("optional-capability");
    expect(contextualData.probeId).toBe("probe-1");
    expect(contextualData.evidenceCeiling).toBe("process");
  });

  it("falls back to a normal tools/call on a host without entrypoints", async () => {
    const server = await fixture();
    const host = createEntrypointHost({ entrypoints: false });
    expect(host.surfacesEntrypoints).toBe(false);
    expect(host.visibleEntrypoints(entrypointMeta())).toEqual([]);
    await expect(host.openFromEntrypoint(server.endpoint)).rejects.toThrow();

    const fallback = await host.callWithContext(server.endpoint, {
      scenario: "resource-delivery",
      probeId: "fallback-1",
    });
    expect(structured(fallback.json).probeId).toBe("fallback-1");
  });

  it("keeps global/thread selection in the host, not in the tool metadata", async () => {
    const server = await fixture();
    const threadOnly = createEntrypointHost({
      entrypoints: true,
      kinds: ["thread"],
    });
    expect(threadOnly.visibleEntrypoints(entrypointMeta())).toEqual([
      { type: "thread" },
    ]);
    // The server still declares both entrypoints; selection is a host choice.
    const { tools } = await listFixtureTools(server.endpoint);
    const meta = tools[0]?._meta as Record<string, unknown>;
    expect(
      (meta[OPENAI_UI_META_KEY] as { entrypoints: unknown }).entrypoints,
    ).toEqual([{ type: "global" }, { type: "thread" }]);
  });

  it("rejects unknown fields and wrong types without coercing input", async () => {
    const server = await fixture();
    const extra = await callFixtureTool(server.endpoint, {
      scenario: "resource-delivery",
      extra: "x",
    });
    expect(errorOf(extra.json).message).toBe("unexpected_argument:extra");

    const wrongScenario = await callFixtureTool(server.endpoint, {
      scenario: 5,
    });
    expect(errorOf(wrongScenario.json).message).toBe("invalid_scenario");

    const unknownScenario = await callFixtureTool(server.endpoint, {
      scenario: "not-a-scenario",
    });
    expect(errorOf(unknownScenario.json).message).toBe("invalid_scenario");

    const wrongProbe = await callFixtureTool(server.endpoint, {
      scenario: "resource-delivery",
      probeId: 7,
    });
    expect(errorOf(wrongProbe.json).message).toBe("invalid_probeId");

    const notObject = await callFixtureTool(
      server.endpoint,
      [] as unknown as Record<string, unknown>,
    );
    expect(errorOf(notObject.json).message).toBe("arguments_must_be_an_object");
  });
});

function entrypointMeta(): Record<string, unknown> {
  return {
    ui: { resourceUri: OPENAI_FIXTURE_UI_URI },
    [OPENAI_UI_META_KEY]: {
      entrypoints: [{ type: "global" }, { type: "thread" }],
    },
  };
}
