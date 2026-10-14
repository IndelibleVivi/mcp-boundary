import { afterEach, describe, expect, it } from "vitest";
import { getJson, postJson } from "../support/loopback.js";
import {
  CLIENT_PRINCIPALS,
  callSeamTool,
  CLOUDFLARE_SEAM_CLAIM,
  startEdgeProxy,
  UPSTREAM_CREDENTIAL,
  UpstreamMcpSurrogate,
  verbOnlyPolicyAllows,
  toolCallEnvelope,
  type EdgeProxyFixture,
} from "../support/cloudflare-deployment-seam.js";

const running: EdgeProxyFixture[] = [];

afterEach(async () => {
  await Promise.all(running.splice(0).map((proxy) => proxy.close()));
});

async function proxy(
  options: Parameters<typeof startEdgeProxy>[0],
): Promise<EdgeProxyFixture> {
  const started = await startEdgeProxy(options);
  running.push(started);
  return started;
}

const ALICE = CLIENT_PRINCIPALS.find(
  (entry) => entry.token === "client-alice-token",
)!;
const EDITOR = CLIENT_PRINCIPALS.find(
  (entry) => entry.token === "client-editor-token",
)!;

describe("Cloudflare deployment-seam local surrogate", () => {
  it("carries business read and write calls over POST and refuses GET", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream });

    const read = await callSeamTool(
      edge.endpoint,
      EDITOR.token,
      "read_document",
      {
        resource: "doc:42",
      },
    );
    const write = await callSeamTool(
      edge.endpoint,
      EDITOR.token,
      "update_document",
      {
        resource: "doc:42",
        body: "v2",
        operationId: "op-post",
      },
    );
    expect(read.status).toBe(200);
    expect(write.status).toBe(200);
    expect(edge.requests.map((entry) => entry.method)).toEqual([
      "POST",
      "POST",
    ]);

    const get = await getJson(edge.endpoint);
    expect(get.status).toBe(405);
  });

  it("authorizes the decoded tool effect, scope, and resource rather than the HTTP verb", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream });

    const aliceRead = await callSeamTool(
      edge.endpoint,
      ALICE.token,
      "read_document",
      {
        resource: "doc:42",
      },
    );
    expect(aliceRead.status).toBe(200);

    const aliceWrite = await callSeamTool(
      edge.endpoint,
      ALICE.token,
      "update_document",
      {
        resource: "doc:42",
        body: "nope",
        operationId: "op-alice",
      },
    );
    expect(errorMessage(aliceWrite.json)).toBe("forbidden:missing_scope");
    expect(upstream.writes()).toHaveLength(0);
    expect(upstream.versionOf("doc:42")).toBe(1);

    const wrongResource = await callSeamTool(
      edge.endpoint,
      EDITOR.token,
      "read_document",
      {
        resource: "doc:99",
      },
    );
    expect(errorMessage(wrongResource.json)).toBe(
      "forbidden:resource_not_authorized",
    );

    expect(
      edge.decisions.every((decision) => decision.basis === "tool_effect"),
    ).toBe(true);

    // The naive verb policy would have allowed Alice's POST write, which is the
    // failure this seam exists to reject.
    expect(verbOnlyPolicyAllows("POST")).toBe(true);
    expect(verbOnlyPolicyAllows("GET")).toBe(false);
  });

  it("treats the body, not a client routing header, as authoritative", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream });

    // Header claims a read; the body selects the write tool. Authorization must
    // follow the body, so Alice's read-only scope is insufficient.
    const disguised = await callSeamTool(
      edge.endpoint,
      ALICE.token,
      "update_document",
      { resource: "doc:42", body: "disguised", operationId: "op-disguised" },
      { "Mcp-Name": "read_document" },
    );
    expect(errorMessage(disguised.json)).toBe("forbidden:missing_scope");
    expect(upstream.writes()).toHaveLength(0);
  });

  it("keeps the client credential and the upstream credential independent", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream });

    await callSeamTool(edge.endpoint, EDITOR.token, "read_document", {
      resource: "doc:42",
    });
    await callSeamTool(edge.endpoint, EDITOR.token, "update_document", {
      resource: "doc:42",
      body: "v2",
      operationId: "op-creds",
    });

    expect(upstream.calls.map((call) => call.authorization)).toEqual([
      UPSTREAM_CREDENTIAL,
      UPSTREAM_CREDENTIAL,
    ]);
    expect(
      upstream.calls.some((call) => call.authorization === EDITOR.token),
    ).toBe(false);

    // The upstream rejects the client credential outright.
    const rejected = upstream.handle({
      op: "read",
      resource: "doc:42",
      authorization: EDITOR.token,
    });
    expect(rejected.status).toBe(401);
    expect(rejected.error).toBe("invalid_upstream_credential");
  });

  it("deduplicates a retry after the proxy blocks a result past the upstream effect", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream, blockResultAfterEffect: true });

    const first = await callSeamTool(
      edge.endpoint,
      EDITOR.token,
      "update_document",
      {
        resource: "doc:42",
        body: "v2",
        operationId: "op-1",
      },
    );
    expect(first.status).toBe(502);
    // A write increments the initial version 1 to 2 exactly once.
    expect(upstream.versionOf("doc:42")).toBe(2);
    expect(upstream.writes()).toHaveLength(1);
    expect(edge.blockedAfterEffectCount).toBe(1);

    const retry = await postJson(
      edge.endpoint,
      {
        ...toolCallEnvelope("update_document", {
          resource: "doc:42",
          body: "v2",
          operationId: "op-1",
        }),
        id: 99,
      },
      { authorization: `Bearer ${EDITOR.token}` },
    );
    expect(retry.status).toBe(200);
    expect(resultOf(retry.json).deduplicated).toBe(true);
    expect(upstream.versionOf("doc:42")).toBe(2);
    expect(upstream.writes()).toHaveLength(1);
  });

  it("conflicts when a retried operation identity carries a changed payload", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream });

    await callSeamTool(edge.endpoint, EDITOR.token, "update_document", {
      resource: "doc:42",
      body: "v2",
      operationId: "op-conflict",
    });
    const changed = await callSeamTool(
      edge.endpoint,
      EDITOR.token,
      "update_document",
      {
        resource: "doc:42",
        body: "v3",
        operationId: "op-conflict",
      },
    );
    expect(errorMessage(changed.json)).toBe("operation_id_conflict");
    expect(upstream.versionOf("doc:42")).toBe(2);
    expect(upstream.writes()).toHaveLength(1);
  });

  it("shows the duplication that appears without an operation-identity store", async () => {
    const upstream = new UpstreamMcpSurrogate();
    const edge = await proxy({ upstream, dedupe: false });

    await callSeamTool(edge.endpoint, EDITOR.token, "update_document", {
      resource: "doc:42",
      body: "v2",
      operationId: "op-retry",
    });
    await callSeamTool(edge.endpoint, EDITOR.token, "update_document", {
      resource: "doc:42",
      body: "v2",
      operationId: "op-retry",
    });
    expect(upstream.versionOf("doc:42")).toBe(3);
    expect(upstream.writes()).toHaveLength(2);
  });

  it("isolates operation identity by principal and resource", async () => {
    const upstream = new UpstreamMcpSurrogate({
      "doc:42": "first",
      "doc:43": "second",
    });
    const editor = { ...EDITOR, resources: ["doc:42", "doc:43"] };
    const other = {
      ...editor,
      subject: "user:other",
      token: "other-editor-token",
    };
    const edge = await proxy({ upstream, principals: [editor, other] });
    for (const [token, resource] of [
      [editor.token, "doc:42"],
      [other.token, "doc:42"],
      [editor.token, "doc:43"],
    ]) {
      const result = await callSeamTool(
        edge.endpoint,
        token!,
        "update_document",
        {
          resource,
          body: "updated",
          operationId: "same-local-id",
        },
      );
      expect(result.status).toBe(200);
      expect(resultOf(result.json).deduplicated).toBe(false);
    }
    expect(upstream.writes()).toHaveLength(3);
  });

  it("labels itself as a local surrogate", () => {
    expect(CLOUDFLARE_SEAM_CLAIM).toContain("Not a real OAuth library test");
  });
});

function errorMessage(json: unknown): string | undefined {
  return (json as { error?: { message?: string } }).error?.message;
}

function resultOf(json: unknown): Record<string, unknown> {
  return ((json as { result?: Record<string, unknown> }).result ??
    {}) as Record<string, unknown>;
}
