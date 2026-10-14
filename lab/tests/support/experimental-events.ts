/**
 * Experimental Events local opt-in fixture (not runtime integration).
 *
 * Provenance: the 2026-10-13 Cloudflare MCP Events changelog links to an experimental
 * working-group surface rather than settled core behavior. This fixture models
 * only an opt-in local surface: a server explicitly enables the events
 * extension, emits envelopes to a local listener, and truthfully reports that
 * no real consumer, no signatures, and no replay were exercised. The extension
 * identifier below is declared by this fixture and marked SURROGATE.
 *
 * Nothing here is wired into the production server, the host harness, or the
 * package. It is a separate, local, opt-in entry.
 */

/** SURROGATE: declared events extension identifier. */
export const SURROGATE_EVENTS_EXTENSION_ID = "fieldlab-local-events";

/** Stated verbatim by `guide/profiles/mcp-2026-07-28.md`. */
export const MCP_TASKS_EXTENSION_ID = "io.modelcontextprotocol/tasks";

export interface EventsCapabilities {
  readonly status: "disabled" | "experimental";
  readonly optIn: boolean;
  readonly consumer: null;
  readonly replay: "not_implemented";
  readonly signatures: "not_implemented";
}

export interface EmittedEvent {
  readonly id: string;
  readonly type: string;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface EmitOutcome {
  readonly accepted: boolean;
  readonly delivered: number;
  readonly reason?: "events_extension_not_enabled";
}

export interface EventsFixtureOptions {
  readonly enabled: boolean;
}

export interface EventsFixture {
  readonly capabilities: EventsCapabilities;
  readonly notes: readonly string[];
  readonly delivered: readonly EmittedEvent[];
  subscribe(listener: (event: EmittedEvent) => void): () => void;
  emit(event: EmittedEvent): EmitOutcome;
  replay(eventId: string): {
    readonly ok: false;
    readonly reason: "replay_not_implemented";
  };
}

export const EVENTS_FIXTURE_NOTES: readonly string[] = [
  "Events are an experimental working-group surface, not settled core behavior.",
  "No real consumer was exercised; events were delivered only to an in-process local listener.",
  "Event signatures are not implemented and no signature was verified.",
  "Replay and resumption are not implemented and no replay was exercised.",
  "Tasks remain a negotiated extension, not core background work.",
  "Code Mode is optional, not universal.",
];

export const EVENTS_FIXTURE_NOT_PROVEN: readonly string[] = [
  "named-host event consumer behavior",
  "event signature verification",
  "event replay or resumption",
];

export function createEventsFixture(
  options: EventsFixtureOptions,
): EventsFixture {
  const listeners = new Set<(event: EmittedEvent) => void>();
  const delivered: EmittedEvent[] = [];
  const capabilities: EventsCapabilities = options.enabled
    ? {
        status: "experimental",
        optIn: true,
        consumer: null,
        replay: "not_implemented",
        signatures: "not_implemented",
      }
    : {
        status: "disabled",
        optIn: false,
        consumer: null,
        replay: "not_implemented",
        signatures: "not_implemented",
      };

  return {
    capabilities,
    notes: EVENTS_FIXTURE_NOTES,
    delivered,
    subscribe(listener) {
      if (!options.enabled) {
        throw new Error("Events extension is not enabled.");
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      if (!options.enabled) {
        return {
          accepted: false,
          delivered: 0,
          reason: "events_extension_not_enabled",
        };
      }
      for (const listener of listeners) listener(event);
      delivered.push(event);
      return { accepted: true, delivered: listeners.size };
    },
    replay() {
      return { ok: false, reason: "replay_not_implemented" };
    },
  };
}
