import { describe, expect, it } from "vitest";
// @ts-expect-error register-contracts is an executable ESM helper with tested exports.
import { packageMetadataMatchesCurrentLab } from "../../scripts/register-contracts.mjs";

const current = {
  repository: {
    type: "git",
    url: "git+https://github.com/IndelibleVivi/mcp-boundary.git",
    directory: "lab",
  },
  homepage:
    "https://github.com/IndelibleVivi/mcp-boundary/tree/main/lab#readme",
};

describe("Lab package repository metadata", () => {
  it("accepts only the current MCP Boundary lab location", () => {
    expect(packageMetadataMatchesCurrentLab(current)).toBe(true);
    expect(
      packageMetadataMatchesCurrentLab({
        ...current,
        repository: {
          ...current.repository,
          url: "git+https://github.com/IndelibleVivi/mcp-app-production-fieldlab.git",
        },
        homepage:
          "https://github.com/IndelibleVivi/mcp-app-production-fieldlab#readme",
      }),
    ).toBe(false);
    expect(
      packageMetadataMatchesCurrentLab({
        ...current,
        repository: { ...current.repository, directory: undefined },
      }),
    ).toBe(false);
  });
});
