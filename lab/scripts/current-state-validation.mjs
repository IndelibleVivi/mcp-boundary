export function validateCurrentCandidateFacts(
  facts,
  candidateStatusValue,
  runtimeStatusValue,
) {
  const observed =
    candidateStatusValue === "verified" || runtimeStatusValue === "verified";
  for (const field of [
    "candidate_source_revision",
    "candidate_file_count",
    "bundle_digest",
  ]) {
    const value = facts[field];
    if (observed) {
      const measured =
        field === "candidate_file_count"
          ? Number.isSafeInteger(value) && value > 0
          : field === "candidate_source_revision"
            ? typeof value === "string" && /^[a-f0-9]{40}$/.test(value)
            : typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
      if (!measured) {
        throw new Error(
          `DOCS-REGISTER current_state.${field} must carry a measured value when candidate/runtime evidence is verified.`,
        );
      }
    } else if (value !== null) {
      throw new Error(
        `DOCS-REGISTER current_state.${field} must be null while current candidate/runtime evidence is not verified.`,
      );
    }
  }
  for (const [status, statusLabel] of [
    [candidateStatusValue, "clean-runtime-candidate"],
    [runtimeStatusValue, "isolated-runtime-readback"],
  ]) {
    if (!["verified", "not_verified", "failed"].includes(status)) {
      throw new Error(
        `DOCS-REGISTER current_state must record ${statusLabel} status.`,
      );
    }
  }
}
