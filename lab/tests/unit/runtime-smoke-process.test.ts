import { spawn, type ChildProcess } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error runtime-smoke is an executable ESM script with tested exports.
import * as runtimeSmokeModule from "../../scripts/runtime-smoke.mjs";

const { stopChild, waitForHealth } = runtimeSmokeModule;

// Port 1 is closed, so any accidental health fetch fails fast rather than
// resolving; the fetch call counter is the real assertion.
const UNREACHABLE_URL = "http://127.0.0.1:1/healthz";
const SIGNAL_EXIT = 'process.kill(process.pid, "SIGTERM");';
const COMPLETION_BOUND_MS = 2_000;

const ownedChildren: ChildProcess[] = [];

function spawnOwned(source: string): ChildProcess {
  const child = spawn(process.execPath, ["-e", source], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  ownedChildren.push(child);
  return child;
}

// Independent of the module under test so fixture cleanup never depends on the
// condition it is meant to exercise.
function fixtureExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit(child: ChildProcess): Promise<void> {
  if (fixtureExited(child)) return Promise.resolve();
  return new Promise((resolve) => child.once("exit", () => resolve()));
}

function waitForStdout(child: ChildProcess, marker: string): Promise<void> {
  return new Promise((resolve) => {
    child.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString("utf8").includes(marker)) resolve();
    });
  });
}

function countHealthFetches(): { calls: unknown[]; restore: () => void } {
  const original = globalThis.fetch;
  const calls: unknown[] = [];
  globalThis.fetch = (async (...args: unknown[]) => {
    calls.push(args);
    throw new Error("an exited child must be recognized before any fetch");
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

async function settledWithin(
  promise: Promise<unknown>,
  ms: number,
): Promise<"settled" | "pending"> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise.then(() => "settled" as const),
      new Promise<"pending">((resolve) => {
        timer = setTimeout(() => resolve("pending"), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

afterEach(async () => {
  for (const child of ownedChildren.splice(0)) {
    if (!fixtureExited(child)) child.kill("SIGKILL");
    await waitForExit(child);
  }
});

describe("runtime smoke process contract", () => {
  it("recognizes a signal exit before it fetches health", async () => {
    const child = spawnOwned(SIGNAL_EXIT);
    await waitForExit(child);
    expect(child.exitCode).toBeNull();
    expect(child.signalCode).toBe("SIGTERM");

    const fetchSpy = countHealthFetches();
    try {
      await expect(waitForHealth(UNREACHABLE_URL, child)).rejects.toThrow(
        /signal SIGTERM/,
      );
      expect(fetchSpy.calls).toHaveLength(0);
    } finally {
      fetchSpy.restore();
    }
  });

  it("reports an ordinary nonzero exit instead of a health result", async () => {
    const child = spawnOwned("process.exit(7);");
    await waitForExit(child);
    expect(child.exitCode).toBe(7);
    expect(child.signalCode).toBeNull();

    const fetchSpy = countHealthFetches();
    try {
      await expect(waitForHealth(UNREACHABLE_URL, child)).rejects.toThrow(
        /code 7/,
      );
      expect(fetchSpy.calls).toHaveLength(0);
    } finally {
      fetchSpy.restore();
    }
  });

  it("stops an already signal-exited child promptly and safely when repeated", async () => {
    const child = spawnOwned(SIGNAL_EXIT);
    await waitForExit(child);
    expect(child.exitCode).toBeNull();
    expect(child.signalCode).toBe("SIGTERM");

    // The real exported cleanup must return, not wait on an exit event that was
    // already emitted before it was called.
    expect(await settledWithin(stopChild(child), COMPLETION_BOUND_MS)).toBe(
      "settled",
    );
    expect(await settledWithin(stopChild(child), COMPLETION_BOUND_MS)).toBe(
      "settled",
    );
  });

  it("stops a running cooperative child without leaving it alive", async () => {
    const child = spawnOwned(
      'process.on("SIGTERM", () => process.exit(0));' +
        'process.stdout.write("ready");' +
        "setInterval(() => {}, 1_000);",
    );
    await waitForStdout(child, "ready");
    expect(fixtureExited(child)).toBe(false);

    await stopChild(child);
    // A skipped cleanup would leave this cooperative child running here.
    expect(fixtureExited(child)).toBe(true);
    expect(child.exitCode).toBe(0);
    expect(child.signalCode).toBeNull();
  });
});
