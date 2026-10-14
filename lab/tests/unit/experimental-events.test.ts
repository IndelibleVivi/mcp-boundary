import { describe, expect, it } from "vitest";
import {
  createEventsFixture,
  EVENTS_FIXTURE_NOTES,
  EVENTS_FIXTURE_NOT_PROVEN,
  MCP_TASKS_EXTENSION_ID,
  SURROGATE_EVENTS_EXTENSION_ID,
  type EmittedEvent,
} from "../support/experimental-events.js";

const SAMPLE_EVENT: EmittedEvent = {
  id: "event-1",
  type: "document.updated",
  data: { resource: "doc:42", version: 2 },
};

describe("experimental events local fixture", () => {
  it("is off unless the server opts in", () => {
    const disabled = createEventsFixture({ enabled: false });
    expect(disabled.capabilities).toEqual({
      status: "disabled",
      optIn: false,
      consumer: null,
      replay: "not_implemented",
      signatures: "not_implemented",
    });
    const outcome = disabled.emit(SAMPLE_EVENT);
    expect(outcome).toEqual({
      accepted: false,
      delivered: 0,
      reason: "events_extension_not_enabled",
    });
    expect(disabled.delivered).toEqual([]);
    expect(() => disabled.subscribe(() => undefined)).toThrow();
  });

  it("delivers emitted envelopes to a local listener only", () => {
    const enabled = createEventsFixture({ enabled: true });
    const received: EmittedEvent[] = [];
    const unsubscribe = enabled.subscribe((event) => received.push(event));

    const outcome = enabled.emit(SAMPLE_EVENT);
    expect(outcome).toEqual({ accepted: true, delivered: 1 });
    expect(received).toEqual([SAMPLE_EVENT]);
    expect(enabled.delivered).toEqual([SAMPLE_EVENT]);
    expect(enabled.capabilities.consumer).toBeNull();

    unsubscribe();
    expect(enabled.emit({ ...SAMPLE_EVENT, id: "event-2" })).toEqual({
      accepted: true,
      delivered: 0,
    });
  });

  it("never claims replay or signature support", () => {
    const enabled = createEventsFixture({ enabled: true });
    expect(enabled.capabilities.replay).toBe("not_implemented");
    expect(enabled.capabilities.signatures).toBe("not_implemented");
    expect(enabled.replay(SAMPLE_EVENT.id)).toEqual({
      ok: false,
      reason: "replay_not_implemented",
    });
  });

  it("states its own limits instead of implying host event delivery", () => {
    const joined = EVENTS_FIXTURE_NOTES.join(" ");
    expect(joined).toContain("experimental working-group surface");
    expect(joined).toContain("No real consumer was exercised");
    expect(joined).toContain("signatures are not implemented");
    expect(joined).toContain("Replay and resumption are not implemented");
    expect(joined).toContain("negotiated extension");
    expect(joined).toContain("Code Mode is optional, not universal");
    expect(EVENTS_FIXTURE_NOT_PROVEN).toContain(
      "named-host event consumer behavior",
    );
  });

  it("keeps tasks in the extension namespace and names its own identifier as a surrogate", () => {
    expect(MCP_TASKS_EXTENSION_ID).toBe("io.modelcontextprotocol/tasks");
    expect(SURROGATE_EVENTS_EXTENSION_ID).not.toMatch(/^io\.modelcontextprotocol\//);
  });
});
