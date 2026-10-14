/**
 * Barrel for the October 2026 lab fixtures. The runner script and any recipe
 * can import the fixtures from here.
 *
 * These fixtures are local surrogates. They are not an SDK, not production
 * compatibility, and not named-host evidence.
 */

export * from "./wire-2026-07-28.js";
export * from "./skills-over-mcp.js";
export * from "./cloudflare-deployment-seam.js";
export * from "./openai-entrypoint.js";
export * from "./experimental-events.js";
export {
  byteLength,
  canonicalJson,
  sha256Hex,
  startHttpFixture,
  postJson,
  getJson,
  type FixtureRequest,
  type FixtureResponse,
  type RunningHttpFixture,
} from "./loopback.js";
