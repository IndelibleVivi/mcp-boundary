import { createHash } from "node:crypto";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * Bounded loopback HTTP fixture used by the October 2026 lab fixtures.
 *
 * These helpers are deliberately small: a fixture is a local surrogate that
 * makes one declared boundary observable. It is not a framework, an SDK
 * emulator, a named-host stand-in, or production compatibility evidence.
 */

export interface FixtureRequest {
  readonly method: string;
  readonly path: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string;
}

export interface FixtureResponse {
  readonly status?: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export type FixtureHandler = (
  request: FixtureRequest,
) => FixtureResponse | Promise<FixtureResponse>;

export interface RunningHttpFixture {
  readonly origin: string;
  readonly port: number;
  readonly requests: readonly FixtureRequest[];
  close(): Promise<void>;
}

function normalizeHeaders(
  headers: IncomingHttpHeaders,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) normalized[key] = value.join(", ");
    else if (value !== undefined) normalized[key] = value;
  }
  return normalized;
}

export async function startHttpFixture(
  handler: FixtureHandler,
): Promise<RunningHttpFixture> {
  const requests: FixtureRequest[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const url = request.url ?? "/";
      const fixtureRequest: FixtureRequest = {
        method: request.method ?? "GET",
        path: url.split("?")[0] ?? "/",
        url,
        headers: normalizeHeaders(request.headers),
        body: Buffer.concat(chunks).toString("utf8"),
      };
      requests.push(fixtureRequest);
      Promise.resolve(handler(fixtureRequest))
        .then((fixtureResponse) => {
          response.statusCode = fixtureResponse.status ?? 200;
          response.setHeader("content-type", "application/json");
          for (const [key, value] of Object.entries(
            fixtureResponse.headers ?? {},
          )) {
            response.setHeader(key, value);
          }
          response.end(fixtureResponse.body ?? "");
        })
        .catch((error: unknown) => {
          response.statusCode = 500;
          response.end(JSON.stringify({ fixture_error: String(error) }));
        });
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    port,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export interface JsonCallResult {
  readonly status: number;
  readonly json: unknown;
  readonly text: string;
}

export async function postJson(
  url: string,
  payload: unknown,
  headers: Readonly<Record<string, string>> = {},
): Promise<JsonCallResult> {
  return requestJson("POST", url, payload, headers);
}

export async function getJson(
  url: string,
  headers: Readonly<Record<string, string>> = {},
): Promise<JsonCallResult> {
  return requestJson("GET", url, undefined, headers);
}

async function requestJson(
  method: string,
  url: string,
  payload: unknown,
  headers: Readonly<Record<string, string>>,
): Promise<JsonCallResult> {
  const response = await fetch(url, {
    method,
    headers: {
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const text = await response.text();
  let json: unknown;
  if (text.length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }
  return { status: response.status, json, text };
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

/**
 * Deterministic JSON serialization with sorted object keys. Every fixture that
 * computes a digest over structured data pins the exact bytes it hashed with
 * this function so the digest binds one decision.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return Object.fromEntries(
      entries.map(([key, entryValue]) => [key, sortValue(entryValue)]),
    );
  }
  return value;
}
