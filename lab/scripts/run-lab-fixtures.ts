import {
  buildWireRequest,
  callSeamTool,
  callWire,
  CLIENT_PRINCIPALS,
  CLOUDFLARE_SEAM_CLAIM,
  createEntrypointHost,
  createEventsFixture,
  digestOf,
  listFixtureTools,
  MCP_REVISION_2026_07_28,
  OPENAI_UI_META_KEY,
  SkillScanImporter,
  SKILLS_FIXTURE_SKILL_URI,
  skillUriFor,
  startEdgeProxy,
  startEntrypointFixture,
  startSkillsFixture,
  startWireFixture,
  UPSTREAM_CREDENTIAL,
  UpstreamMcpSurrogate,
  WIRE_ERROR_CODES,
  WIRE_TOOL_NAME,
  type EmittedEvent,
} from "../tests/support/index.js";

/**
 * Runnable end-to-end pass over the October 2026 lab fixtures. Four fixtures bind real loopback servers and Events uses a separate local listener; each exercises a positive path and at least one
 * counterexample, and reports only what it actually observed. The run proves
 * local process behavior: not SDK, not named-host, not tunnel, not production
 * compatibility.
 */

interface FixtureOutcome {
  readonly id: string;
  readonly claim: string;
  readonly observations: Record<string, unknown>;
  readonly notProven: readonly string[];
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function resultOf(json: unknown): Record<string, unknown> {
  return ((json as { result?: Record<string, unknown> }).result ??
    {}) as Record<string, unknown>;
}

function structuredOf(json: unknown): Record<string, unknown> {
  return (resultOf(json).structuredContent ?? {}) as Record<string, unknown>;
}

function errorOf(json: unknown): { code?: number; message?: string } {
  return ((json as { error?: { code?: number; message?: string } }).error ??
    {}) as { code?: number; message?: string };
}

async function runWireFixture(): Promise<FixtureOutcome> {
  const wire = await startWireFixture();
  try {
    const discover = await callWire(
      wire.endpoint,
      buildWireRequest({ method: "server/discover", id: 1 }),
    );
    assert(
      resultOf(discover.json).resultType === "complete",
      "wire discover result missing resultType",
    );
    assert(
      JSON.stringify(resultOf(discover.json).supportedVersions) ===
        JSON.stringify([MCP_REVISION_2026_07_28]),
      "wire discover returned an unexpected revision set",
    );
    const mismatch = await callWire(
      wire.endpoint,
      buildWireRequest({
        method: "tools/call",
        id: 2,
        params: { name: WIRE_TOOL_NAME, arguments: {} },
        methodHeader: "tools/list",
      }),
    );
    assert(
      mismatch.status === 400 &&
        errorOf(mismatch.json).code === WIRE_ERROR_CODES.headerMismatch,
      "wire Mcp-Method mismatch was not rejected with -32020",
    );
    assert(
      wire.state.executed.length === 0,
      "wire header mismatch still executed a tool",
    );
    return {
      id: "wire-2026-07-28",
      claim:
        "The local 2026-07-28 wire contract rejects mirrored header/body disagreements before execution and serves self-describing requests.",
      observations: {
        revision: MCP_REVISION_2026_07_28,
        headerMismatchStatus: mismatch.status,
        headerMismatchCode: errorOf(mismatch.json).code,
        executedTools: wire.state.executed.length,
      },
      notProven: ["SDK or production compatibility", "named-host behavior"],
    };
  } finally {
    await wire.close();
  }
}

async function runSkillsFixture(): Promise<FixtureOutcome> {
  const server = await startSkillsFixture();
  try {
    const importer = new SkillScanImporter(server.endpoint);
    const firstScan = await importer.scan();
    const firstSnapshot = importer.snapshot(SKILLS_FIXTURE_SKILL_URI);
    server.setFileContent("reference.md", "Template marker: beta-reference.\n");
    const live = await importer.liveRead();
    server.corruptResource("reference.md", `sha256:${"0".repeat(64)}`);
    const failedScan = await importer.scan();
    assert(
      firstScan.imported.includes(SKILLS_FIXTURE_SKILL_URI),
      "skills fixture did not import",
    );
    assert(
      firstSnapshot?.resources[skillUriFor("reference.md")]?.includes(
        "alpha-reference",
      ) === true,
      "skills snapshot did not capture the original bytes",
    );
    assert(
      live.resources.find(
        (resource) => resource.uri === skillUriFor("reference.md"),
      )?.digest === digestOf("Template marker: beta-reference.\n"),
      "skills live read did not observe changed content",
    );
    assert(
      failedScan.failed[0]?.reason === "resource_digest_mismatch",
      "skills digest mismatch was not rejected",
    );
    assert(
      failedScan.tools.length > 0 &&
        importer.snapshot(SKILLS_FIXTURE_SKILL_URI) !== undefined,
      "skills tools or prior snapshot were lost on failure",
    );
    return {
      id: "skills-over-mcp",
      claim:
        "A static scan import pins exact per-resource sha256 digests and sizes, a live read sees changed content, and a failed resource digest leaves the prior snapshot while tools stay visible.",
      observations: {
        imported: firstScan.imported,
        liveDigestChanged: true,
        snapshotRetainedOnFailure: true,
        toolsVisibleOnFailure: failedScan.tools.length,
      },
      notProven: [
        "OpenAI host import behavior or receipt",
        "dynamic resources / directoryRead behavior",
        "named-host behavior",
      ],
    };
  } finally {
    await server.close();
  }
}

async function runCloudflareSeam(): Promise<FixtureOutcome> {
  const upstream = new UpstreamMcpSurrogate();
  const edge = await startEdgeProxy({ upstream, blockResultAfterEffect: true });
  try {
    const editor = CLIENT_PRINCIPALS.find(
      (entry) => entry.token === "client-editor-token",
    )!;
    const alice = CLIENT_PRINCIPALS.find(
      (entry) => entry.token === "client-alice-token",
    )!;
    const blocked = await callSeamTool(
      edge.endpoint,
      editor.token,
      "update_document",
      { resource: "doc:42", body: "v2", operationId: "op-runner" },
    );
    await callSeamTool(edge.endpoint, editor.token, "update_document", {
      resource: "doc:42",
      body: "v2",
      operationId: "op-runner",
    });
    const aliceWrite = await callSeamTool(
      edge.endpoint,
      alice.token,
      "update_document",
      { resource: "doc:42", body: "nope", operationId: "op-alice" },
    );
    assert(
      blocked.status === 502,
      "seam did not block the result after effect",
    );
    assert(
      upstream.versionOf("doc:42") === 2,
      "seam retry duplicated the upstream effect",
    );
    assert(
      errorOf(aliceWrite.json).code !== undefined,
      "seam did not deny the unauthorized write",
    );
    assert(
      upstream.calls.every(
        (call) => call.authorization === UPSTREAM_CREDENTIAL,
      ),
      "seam forwarded the client credential upstream",
    );
    return {
      id: "cloudflare-deployment-seam",
      claim: CLOUDFLARE_SEAM_CLAIM,
      observations: {
        blockedAfterEffect: blocked.status,
        retryDeduplicated: true,
        upstreamEffects: upstream.writes().length,
        clientCredentialForwarded: false,
      },
      notProven: [
        "real OAuth library behavior",
        "real Cloudflare Gateway or portal behavior",
        "named-host behavior",
      ],
    };
  } finally {
    await edge.close();
  }
}

async function runEntrypointFixture(): Promise<FixtureOutcome> {
  const server = await startEntrypointFixture();
  try {
    const { tools } = await listFixtureTools(server.endpoint);
    const meta = (tools[0]?._meta ?? {}) as Record<string, unknown>;
    const host = createEntrypointHost({ entrypoints: true });
    const initial = await host.openFromEntrypoint(server.endpoint);
    const contextual = await host.callWithContext(server.endpoint, {
      scenario: "optional-capability",
      probeId: "runner",
    });
    const fallbackHost = createEntrypointHost({ entrypoints: false });
    const fallback = await fallbackHost.callWithContext(server.endpoint, {
      scenario: "resource-delivery",
      probeId: "fallback",
    });
    assert(
      structuredOf(initial.json).format === "entrypoint-initial@1",
      "entrypoint did not return initial UI data for {}",
    );
    assert(
      structuredOf(contextual.json).probeId === "runner",
      "contextual tool call failed",
    );
    assert(
      fallbackHost.visibleEntrypoints(meta).length === 0 &&
        structuredOf(fallback.json).probeId === "fallback",
      "no-entrypoint fallback failed",
    );
    return {
      id: "openai-entrypoint",
      claim:
        "Opening an entrypoint is an ordinary tools/call with {} that returns useful initial data; user context follows in the same tool; a host without entrypoints falls back to an ordinary tool call.",
      observations: {
        initialFormat: structuredOf(initial.json).format,
        entrypointsDeclared: (
          meta[OPENAI_UI_META_KEY] as { entrypoints?: unknown }
        )?.entrypoints,
        fallbackUsed: true,
      },
      notProven: ["named-host behavior", "file entrypoint contract"],
    };
  } finally {
    await server.close();
  }
}

function runEventsFixture(): FixtureOutcome {
  const disabled = createEventsFixture({ enabled: false });
  const enabled = createEventsFixture({ enabled: true });
  const received: EmittedEvent[] = [];
  enabled.subscribe((event) => received.push(event));
  const event: EmittedEvent = {
    id: "event-1",
    type: "document.updated",
    data: { resource: "doc:42", version: 2 },
  };
  enabled.emit(event);
  const offOutcome = disabled.emit(event);
  assert(
    offOutcome.accepted === false,
    "events fixture emitted while disabled",
  );
  assert(
    received.length === 1,
    "events fixture did not deliver to its listener",
  );
  assert(
    enabled.replay("event-1").ok === false,
    "events fixture claimed replay support",
  );
  return {
    id: "experimental-events",
    claim:
      "Events are a local opt-in fixture; no real consumer, signature, or replay was exercised.",
    observations: {
      optInRequired: true,
      deliveredToLocalListener: received.length,
      replay: enabled.capabilities.replay,
      signatures: enabled.capabilities.signatures,
    },
    notProven: [
      "named-host event consumer behavior",
      "event signature verification",
      "event replay or resumption",
    ],
  };
}

const outcomes: FixtureOutcome[] = [
  await runWireFixture(),
  await runSkillsFixture(),
  await runCloudflareSeam(),
  await runEntrypointFixture(),
  runEventsFixture(),
];

process.stdout.write(
  `${JSON.stringify(
    {
      format: "mcp-app-fieldlab-local-fixtures@1",
      generated_at: new Date().toISOString(),
      claim_ceiling: "process",
      named_host_simulation: false,
      fixtures: outcomes,
    },
    null,
    2,
  )}\n`,
);
