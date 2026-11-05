import { spawnSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(message) {
  throw new Error(message);
}

function escapes(relative) {
  return (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  );
}

export function isMainModule(moduleUrl, entry = process.argv[1]) {
  if (entry === undefined) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(moduleUrl));
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return false;
    throw error;
  }
}

function canonicalPath(value) {
  let existing = path.resolve(value);
  const suffix = [];
  while (!lstatSync(existing, { throwIfNoEntry: false })) {
    suffix.unshift(path.basename(existing));
    existing = path.dirname(existing);
  }
  return path.join(realpathSync(existing), ...suffix);
}

export function resolveProjectRoots(moduleUrl) {
  const labRoot = path.resolve(path.dirname(fileURLToPath(moduleUrl)), "..");
  const result = spawnSync(
    "git",
    ["-C", labRoot, "rev-parse", "--show-toplevel"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(
      `The Field Lab must be inside a Git checkout: ${String(result.stderr ?? "").trim()}`,
    );
  }
  const repositoryRoot = path.resolve(String(result.stdout).trim());
  const labRelativePath = path.relative(repositoryRoot, labRoot);
  if (escapes(labRelativePath)) {
    fail("The Field Lab must resolve inside the enclosing Git checkout.");
  }
  return { labRoot, repositoryRoot, labRelativePath };
}

export function resolveLabRootInCheckout(checkoutRoot, labRelativePath) {
  const labRoot = path.resolve(checkoutRoot, labRelativePath);
  const relativeToCheckout = path.relative(checkoutRoot, labRoot);
  if (escapes(relativeToCheckout)) {
    fail("The temporary Field Lab root escaped its clean checkout.");
  }
  return labRoot;
}

export function outputIsSafe(roots, output) {
  const labRoot = canonicalPath(roots.labRoot);
  const repositoryRoot = canonicalPath(roots.repositoryRoot);
  const resolvedOutput = canonicalPath(output);
  const covers = (parent, child) => {
    const relative = path.relative(parent, child);
    return !escapes(relative);
  };
  if (
    covers(resolvedOutput, repositoryRoot) ||
    covers(resolvedOutput, labRoot)
  ) {
    return {
      safe: false,
      reason:
        "Output must not be the repository or Field Lab root, or one of their parents.",
    };
  }
  if (covers(path.join(repositoryRoot, ".git"), resolvedOutput)) {
    return { safe: false, reason: "Output must not be inside .git." };
  }
  return { safe: true };
}
