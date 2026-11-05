import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error package-runtime is an executable ESM script with tested exports.
import * as packageRuntime from "../../scripts/package-runtime.mjs";

const {
  assertNoTrackedInstallProjection,
  canonicalFileListBytes,
  CLEAN_WORKTREE_VALIDATION_SCRIPTS,
  parsePackageArguments,
  RUNTIME_ROOTS,
  runtimeFileEntries,
} = packageRuntime;
// @ts-expect-error repository-roots is an executable ESM helper with tested exports.
import { outputIsSafe } from "../../scripts/repository-roots.mjs";

const temporaryRoots: string[] = [];
const testRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function git(cwd: string, ...arguments_: string[]) {
  return execFileSync("git", arguments_, {
    cwd,
    encoding: "utf8",
  }).trim();
}

function writeFixtureFile(root: string, relativePath: string, content: string) {
  const target = path.join(root, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function createNestedMonorepoFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "fieldlab-monorepo-test-"));
  temporaryRoots.push(root);
  const repositoryRoot = path.join(root, "checkout");
  const labRoot = path.join(repositoryRoot, "lab");
  mkdirSync(path.join(labRoot, "scripts"), { recursive: true });
  cpSync(
    path.join(testRoot, "scripts", "package-runtime.mjs"),
    path.join(labRoot, "scripts", "package-runtime.mjs"),
  );
  cpSync(
    path.join(testRoot, "scripts", "repository-roots.mjs"),
    path.join(labRoot, "scripts", "repository-roots.mjs"),
  );
  writeFixtureFile(
    labRoot,
    "package.json",
    `${JSON.stringify(
      {
        name: "nested-fieldlab-fixture",
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          "validate:schemas":
            "node -e \"process.stdout.write('schemas ok\\\\n')\"",
          "validate:scenarios":
            "node -e \"process.stdout.write('scenarios ok\\\\n')\"",
          build: "node build.mjs",
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFixtureFile(
    labRoot,
    "package-lock.json",
    `${JSON.stringify(
      {
        name: "nested-fieldlab-fixture",
        version: "1.0.0",
        lockfileVersion: 3,
        requires: true,
        packages: {
          "": { name: "nested-fieldlab-fixture", version: "1.0.0" },
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFixtureFile(
    labRoot,
    ".gitignore",
    "node_modules/\ndist/\ntmp/\nruntime-candidates/\n",
  );
  writeFixtureFile(
    labRoot,
    "build.mjs",
    `import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("dist/evidence", { recursive: true });
writeFileSync("dist/marker.txt", "built in nested lab\\n");
writeFileSync(
  "dist/evidence/scenario.js",
  "export function validateScenarioSet(values) { return values; }\\n",
);
writeFileSync(
  "dist/evidence/receipt.js",
  "export function validateReceiptSetAgainstScenarios(receipts) { return receipts.map((receipt, index) => receipt.scenario ? receipt : { ...receipt, scenario: { id: 'package.clean-revision', revision: '1' }, subject: { source_revision: process.env.FIXTURE_REVISION, source_dirty: false, bundle_digest: receipt.bundleDigest }, claim: { method_rung: 'artifact', proof_ceiling: 'artifact' }, evidence_refs: ['candidate:release.json'], not_proven: ['runtime execution'] }); }\\n",
);
`,
  );
  writeFixtureFile(
    labRoot,
    "scenarios/package.clean-revision.json",
    `${JSON.stringify(
      {
        id: "package.clean-revision",
        revision: "1",
        not_proven: ["runtime execution"],
      },
      null,
      2,
    )}\n`,
  );
  for (const file of ["LICENSE", "LICENSE-DOCUMENTATION.md", "LICENSING.md"]) {
    writeFixtureFile(labRoot, file, "fixture license\n");
  }
  writeFixtureFile(labRoot, "deploy/runtime/Dockerfile", "FROM scratch\n");
  git(repositoryRoot, "init", "--quiet");
  git(repositoryRoot, "config", "user.email", "fixture@example.invalid");
  git(repositoryRoot, "config", "user.name", "Fixture");
  git(repositoryRoot, "add", ".");
  git(repositoryRoot, "commit", "--quiet", "-m", "fixture");
  const revision = git(repositoryRoot, "rev-parse", "HEAD");
  for (const file of [
    "mcp-resource-roundtrip.json",
    "mcp-host-profile-matrix.json",
  ]) {
    writeFixtureFile(
      labRoot,
      `tmp/receipts/${file}`,
      `${JSON.stringify(
        {
          subject: { source_revision: revision, source_dirty: false },
        },
        null,
        2,
      )}\n`,
    );
  }
  return { root, repositoryRoot, labRoot, revision };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("runtime package contract", () => {
  it("requires one explicit output and rejects unknown arguments", () => {
    expect(parsePackageArguments(["--out=tmp/candidate"])).toEqual({
      output: "tmp/candidate",
    });
    expect(() => parsePackageArguments([])).toThrow(/--out/);
    expect(() => parsePackageArguments(["--out=one", "--out=two"])).toThrow(
      /only once/,
    );
    expect(() => parsePackageArguments(["--force"])).toThrow(
      /Unknown argument/,
    );
  });

  it("builds a stable sorted file list without release.json", () => {
    const root = mkdtempSync(path.join(tmpdir(), "fieldlab-package-test-"));
    temporaryRoots.push(root);
    mkdirSync(path.join(root, "dist"));
    writeFileSync(path.join(root, "z.txt"), "z");
    writeFileSync(path.join(root, "dist", "a.txt"), "alpha");
    writeFileSync(path.join(root, "release.json"), "ignored");

    const entries = runtimeFileEntries(root) as Array<{
      path: string;
      bytes: number;
      sha256: string;
    }>;
    expect(entries.map((entry) => entry.path)).toEqual(["dist/a.txt", "z.txt"]);
    expect(entries[0]).toMatchObject({ bytes: 5 });
    expect(entries[0]?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(canonicalFileListBytes(entries).toString("utf8")).toBe(
      `${JSON.stringify(entries)}\n`,
    );
  });

  it("refuses a tracked install projection before npm ci", () => {
    const root = mkdtempSync(path.join(tmpdir(), "fieldlab-package-test-"));
    temporaryRoots.push(root);
    expect(() => assertNoTrackedInstallProjection(root)).not.toThrow();
    mkdirSync(path.join(root, "node_modules"));
    expect(() => assertNoTrackedInstallProjection(root)).toThrow(
      /committed revision contains node_modules/,
    );
  });

  it("keeps output outside the checkout, Lab root, and Git directory", () => {
    const roots = {
      repositoryRoot: path.resolve("/tmp/workspace/checkout"),
      labRoot: path.resolve("/tmp/workspace/checkout/lab"),
    };
    expect(outputIsSafe(roots, "/tmp/workspace/outside").safe).toBe(true);
    expect(
      outputIsSafe(
        roots,
        path.join(roots.repositoryRoot, "lab/runtime-candidates/x"),
      ).safe,
    ).toBe(true);
    expect(outputIsSafe(roots, roots.repositoryRoot).safe).toBe(false);
    expect(outputIsSafe(roots, roots.labRoot).safe).toBe(false);
    expect(outputIsSafe(roots, "/tmp/workspace").safe).toBe(false);
    expect(
      outputIsSafe(roots, path.join(roots.repositoryRoot, ".git/candidate"))
        .safe,
    ).toBe(false);
  });

  it("carries the complete layered license boundary into runtime artifacts", () => {
    for (const requiredPath of [
      "LICENSE",
      "LICENSE-DOCUMENTATION.md",
      "LICENSING.md",
    ]) {
      expect(RUNTIME_ROOTS).toContain(requiredPath);
    }

    const dockerfile = readFileSync("deploy/runtime/Dockerfile", "utf8");
    expect(dockerfile).toContain(
      "COPY LICENSE LICENSE-DOCUMENTATION.md LICENSING.md ./",
    );
  });

  it("keeps output aliases out of repository roots and Git metadata", () => {
    const root = mkdtempSync(path.join(tmpdir(), "fieldlab-output-alias-"));
    temporaryRoots.push(root);
    const repositoryRoot = path.join(root, "checkout");
    const labRoot = path.join(repositoryRoot, "lab");
    mkdirSync(labRoot, { recursive: true });
    mkdirSync(path.join(repositoryRoot, ".git"));
    const alias = path.join(root, "alias");
    symlinkSync(repositoryRoot, alias, "dir");
    const roots = { repositoryRoot, labRoot };
    expect(
      outputIsSafe(roots, path.join(alias, ".git/..hidden/output")).safe,
    ).toBe(false);
    expect(outputIsSafe(roots, alias).safe).toBe(false);
    expect(outputIsSafe(roots, path.join(alias, "lab")).safe).toBe(false);
    expect(outputIsSafe(roots, path.join(alias, ".git/new/output")).safe).toBe(
      false,
    );
    expect(
      outputIsSafe(roots, path.join(alias, "lab/runtime-candidates/new")).safe,
    ).toBe(true);
  });

  it("carries the exact scenario authority used by runtime evidence", () => {
    expect(RUNTIME_ROOTS).toContain("scenarios");

    const dockerfile = readFileSync("deploy/runtime/Dockerfile", "utf8");
    expect(dockerfile).toContain("COPY scenarios ./scenarios");
    expect(CLEAN_WORKTREE_VALIDATION_SCRIPTS).toEqual([
      "validate:schemas",
      "validate:scenarios",
    ]);
  });

  it("packages the nested Lab through an alias from a clean monorepo checkout", () => {
    const fixture = createNestedMonorepoFixture();
    const alias = path.join(fixture.root, "lab-alias");
    symlinkSync(fixture.labRoot, alias, "dir");
    const output = path.join(fixture.root, "candidate");
    const result = spawnSync(
      process.execPath,
      [path.join(alias, "scripts", "package-runtime.mjs"), `--out=${output}`],
      {
        cwd: fixture.labRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          DO_NOT_TRACK: "1",
          FIXTURE_REVISION: fixture.revision,
        },
      },
    );

    expect(result.status, result.stderr).toBe(0);
    const release = JSON.parse(
      readFileSync(path.join(output, "release.json"), "utf8"),
    ) as { sourceRevision: string };
    expect(release.sourceRevision).toBe(fixture.revision);
    expect(readFileSync(path.join(output, "dist", "marker.txt"), "utf8")).toBe(
      "built in nested lab\n",
    );
    expect(
      readFileSync(
        path.join(
          fixture.labRoot,
          "tmp",
          "receipts",
          "package.clean-revision@1.json",
        ),
        "utf8",
      ),
    ).toContain('"package.clean-revision"');
  });

  it("refuses a dirty monorepo and an existing nested output", () => {
    const fixture = createNestedMonorepoFixture();
    writeFixtureFile(fixture.labRoot, "dirty.txt", "dirty\n");
    const dirtyResult = spawnSync(
      process.execPath,
      [
        path.join(fixture.labRoot, "scripts", "package-runtime.mjs"),
        `--out=${path.join(fixture.root, "dirty-candidate")}`,
      ],
      { cwd: fixture.labRoot, encoding: "utf8" },
    );
    expect(dirtyResult.status).toBe(1);
    expect(dirtyResult.stderr).toContain("completely clean committed tree");

    rmSync(path.join(fixture.labRoot, "dirty.txt"));
    mkdirSync(path.join(fixture.labRoot, "existing-output"));
    const existingResult = spawnSync(
      process.execPath,
      [
        path.join(fixture.labRoot, "scripts", "package-runtime.mjs"),
        "--out=existing-output",
      ],
      { cwd: fixture.labRoot, encoding: "utf8" },
    );
    expect(existingResult.status).toBe(1);
    expect(existingResult.stderr).toContain("Refusing to overwrite");
  });
});
