import { describe, expect, it } from "vitest";
// @ts-expect-error current-state-validation is an executable ESM helper with tested exports.
import { validateCurrentCandidateFacts } from "../../scripts/current-state-validation.mjs";

const measured = {
  candidate_source_revision: "5eba892b6be5407b0ac4aa658f398f7b2eec5373",
  candidate_file_count: 43,
  bundle_digest:
    "sha256:2e7dba961f82f120fdbdf68e440f5d64f7d0db89f566bf8ea0ff987026e2b014",
};

describe("current candidate identity status", () => {
  it("requires measured identities for a verified candidate or runtime", () => {
    expect(() =>
      validateCurrentCandidateFacts(
        {
          candidate_source_revision: null,
          candidate_file_count: null,
          bundle_digest: null,
        },
        "verified",
        "not_verified",
      ),
    ).toThrow(/measured value/);
    expect(() =>
      validateCurrentCandidateFacts(measured, "not_verified", "not_verified"),
    ).toThrow(/must be null/);
  });

  it("accepts null only while candidate and runtime remain unverified", () => {
    expect(() =>
      validateCurrentCandidateFacts(
        {
          candidate_source_revision: null,
          candidate_file_count: null,
          bundle_digest: null,
        },
        "not_verified",
        "not_verified",
      ),
    ).not.toThrow();
    expect(() =>
      validateCurrentCandidateFacts(measured, "verified", "verified"),
    ).not.toThrow();
  });
});
