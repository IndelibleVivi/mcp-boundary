import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  isMainModule,
  outputIsSafe,
  resolveProjectRoots,
} from "./repository-roots.mjs";

function fail(message) {
  throw new Error(message);
}

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, {
    cwd,
    env: {
      ...process.env,
      DO_NOT_TRACK: "1",
      SKYBRIDGE_TELEMETRY_DISABLED: "1",
    },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(
      `${command} ${arguments_.join(" ")} failed with exit code ${String(result.status)}.`,
    );
  }
}

function committedRevision(repositoryRoot) {
  const result = spawnSync(
    "git",
    ["-C", repositoryRoot, "rev-parse", "--verify", "HEAD^{commit}"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) throw result.error;
  const revision = String(result.stdout).trim();
  if (result.status !== 0 || !/^[a-f0-9]{40}$/.test(revision)) {
    fail(
      "The runtime lane requires HEAD to resolve to one committed revision.",
    );
  }
  return revision;
}

function assertClean(repositoryRoot) {
  const result = spawnSync(
    "git",
    ["-C", repositoryRoot, "status", "--porcelain=v1", "--untracked-files=all"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) throw result.error;
  if (result.status !== 0 || String(result.stdout).trim() !== "") {
    fail(
      "The runtime lane requires a completely clean committed tree, including no untracked files.",
    );
  }
}

export function validationCandidate(labRoot, repositoryRoot) {
  const configured = process.env.FIELDLAB_CANDIDATE?.trim();
  if (configured) return path.resolve(labRoot, configured);
  const revision = committedRevision(repositoryRoot);
  return path.join(
    labRoot,
    "runtime-candidates",
    `ci-${revision.slice(0, 12)}-${process.pid}`,
  );
}

export function runRuntimeLane() {
  const { labRoot, repositoryRoot } = resolveProjectRoots(import.meta.url);
  const startedAt = new Date().toISOString();
  run("npm", ["run", "check"], labRoot);
  run("npm", ["run", "test:host"], labRoot);
  run("npm", ["run", "test:entrypoint-view"], labRoot);
  // The check/host runs write ignored receipts; the source tree itself must
  // still be clean before the package lane resolves its committed revision.
  assertClean(repositoryRoot);
  const candidate = validationCandidate(labRoot, repositoryRoot);
  const safety = outputIsSafe({ labRoot, repositoryRoot }, candidate);
  if (!safety.safe) fail(safety.reason);
  run("npm", ["run", "package:runtime", "--", `--out=${candidate}`], labRoot);
  run(
    "npm",
    ["run", "smoke:runtime", "--", `--candidate=${candidate}`],
    labRoot,
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "verified",
        startedAt,
        completedAt: new Date().toISOString(),
        sequentialLane: [
          "npm run check",
          "npm run test:host",
          "npm run test:entrypoint-view",
          "npm run package:runtime",
          "npm run smoke:runtime",
        ],
        candidate: path.relative(labRoot, candidate),
        proofCeiling: "activated-runtime",
        notProven: [
          "operator-selected production runtime",
          "tunnel",
          "named-host admission",
          "owner acceptance",
        ],
      },
      null,
      2,
    )}\n`,
  );
}

if (isMainModule(import.meta.url)) {
  try {
    runRuntimeLane();
  } catch (error) {
    process.stderr.write(
      `validate-runtime-lane: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
