import { afterEach, describe, expect, it } from "vitest";
import { byteLength } from "../support/loopback.js";
import { startWireFixture } from "../support/wire-2026-07-28.js";
import {
  digestOf,
  parseFrontmatter,
  SKILLS_EXTENSION_ID,
  SKILLS_FIXTURE_SKILL_URI,
  SKILLS_FIXTURE_TOOLS,
  SkillScanImporter,
  skillUriFor,
  skillsCall,
  startSkillsFixture,
  type SkillEntry,
  type SkillsFixture,
} from "../support/skills-over-mcp.js";

const running: SkillsFixture[] = [];

afterEach(async () => {
  await Promise.all(running.splice(0).map((fixture) => fixture.close()));
});

async function fixture(): Promise<SkillsFixture> {
  const started = await startSkillsFixture();
  running.push(started);
  return started;
}

async function listSkill(endpoint: string): Promise<SkillEntry> {
  const response = await skillsCall<{ skills: SkillEntry[] }>(
    endpoint,
    "skills/list",
  );
  if (response.isError) throw new Error(response.message);
  return response.result.skills[0]!;
}

describe("skills-over-MCP local fixture", () => {
  it("sends helper calls with the required modern wire metadata", async () => {
    const wire = await startWireFixture();
    try {
      const response = await skillsCall(wire.endpoint, "tools/list");
      expect(response.isError).toBe(false);
    } finally {
      await wire.close();
    }
  });
  it("preserves structured frontmatter and rejects malformed YAML", async () => {
    expect(
      await parseFrontmatter(
        "---\nname: weekly-report\ndescription: Report.\nmetadata:\n  reviewed: true\n---\nBody",
      ),
    ).toEqual({
      name: "weekly-report",
      description: "Report.",
      metadata: { reviewed: true },
    });
    expect(
      await parseFrontmatter(
        "---\nname: [broken\ndescription: Report.\n---\nBody",
      ),
    ).toBeUndefined();
  });

  it("declares the skills extension in discover and serves the stable Skill shape", async () => {
    const server = await fixture();
    const discover = await skillsCall<{
      capabilities: Record<string, unknown>;
    }>(server.endpoint, "server/discover");
    if (discover.isError) throw new Error(discover.message);
    expect(discover.result.capabilities).toEqual({
      resources: {},
      extensions: { [SKILLS_EXTENSION_ID]: {} },
    });

    const skill = await listSkill(server.endpoint);
    expect(skill.uri).toBe(SKILLS_FIXTURE_SKILL_URI);
    expect(skill.frontmatter).toMatchObject({
      name: "weekly-report",
      description: "Produce a bounded weekly report from a declared template.",
    });
    expect(skill.resources.map((resource) => resource.uri)).toEqual([
      skillUriFor("SKILL.md"),
      skillUriFor("reference.md"),
    ]);
    for (const resource of skill.resources) {
      expect(resource.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(Number.isSafeInteger(resource.size)).toBe(true);
    }

    const get = await skillsCall<{ skill: SkillEntry }>(
      server.endpoint,
      "skills/get",
      { uri: SKILLS_FIXTURE_SKILL_URI },
    );
    if (get.isError) throw new Error(get.message);
    expect(get.result.skill).toEqual(skill);
  });

  it("returns resource bytes and their exact digest and size", async () => {
    const server = await fixture();
    const skill = await listSkill(server.endpoint);
    const support = skill.resources.find(
      (resource) => resource.uri === skillUriFor("reference.md"),
    )!;
    const read = await skillsCall<{
      contents: Array<{ uri: string; mimeType: string; text: string }>;
    }>(server.endpoint, "resources/read", { uri: support.uri });
    if (read.isError) throw new Error(read.message);
    const content = read.result.contents[0]!;
    expect(content.uri).toBe(support.uri);
    expect(content.mimeType).toBe("text/markdown");
    expect(digestOf(content.text)).toBe(support.digest);
    expect(byteLength(content.text)).toBe(support.size);
    expect(content.text).toContain("alpha-reference");
  });

  it("imports a snapshot keyed by connection identity plus skill URI", async () => {
    const server = await fixture();
    const importer = new SkillScanImporter(server.endpoint);
    const scan = await importer.scan();

    expect(scan.imported).toEqual([SKILLS_FIXTURE_SKILL_URI]);
    expect(scan.failed).toEqual([]);
    expect(scan.tools).toEqual([...SKILLS_FIXTURE_TOOLS]);

    const snapshot = importer.snapshot(SKILLS_FIXTURE_SKILL_URI);
    expect(snapshot?.serverIdentity).toBe(server.endpoint);
    expect(snapshot?.skillUri).toBe(SKILLS_FIXTURE_SKILL_URI);
    expect(Object.keys(snapshot?.resources ?? {}).sort()).toEqual([
      skillUriFor("SKILL.md"),
      skillUriFor("reference.md"),
    ]);
    expect(snapshot?.resources[skillUriFor("reference.md")]).toContain(
      "alpha-reference",
    );
    expect(importer.snapshot("skill://other/other/SKILL.md")).toBeUndefined();
  });

  it("keeps a static snapshot while a live read sees changed content", async () => {
    const server = await fixture();
    const importer = new SkillScanImporter(server.endpoint);
    await importer.scan();
    const before = importer.snapshot(SKILLS_FIXTURE_SKILL_URI);

    const alphaDigest = digestOf("Template marker: alpha-reference.\n");
    const betaDigest = digestOf("Template marker: beta-reference.\n");
    server.setFileContent("reference.md", "Template marker: beta-reference.\n");
    const live = await importer.liveRead();

    expect(
      live.resources.find((r) => r.uri === skillUriFor("reference.md"))?.digest,
    ).toBe(betaDigest);
    expect(
      live.resources.find((r) => r.uri === skillUriFor("reference.md"))?.digest,
    ).not.toBe(alphaDigest);
    expect(
      importer.snapshot(SKILLS_FIXTURE_SKILL_URI)?.resources[
        skillUriFor("reference.md")
      ],
    ).toContain("alpha-reference");

    const rescan = await importer.scan();
    expect(rescan.imported).toEqual([SKILLS_FIXTURE_SKILL_URI]);
    const after = importer.snapshot(SKILLS_FIXTURE_SKILL_URI);
    expect(after?.resources[skillUriFor("reference.md")]).toContain(
      "beta-reference",
    );
    expect(after?.entryIdentity).not.toBe(before?.entryIdentity);
  });

  it("leaves the prior snapshot in place when a resource digest fails, while tools stay visible", async () => {
    const server = await fixture();
    const importer = new SkillScanImporter(server.endpoint);
    await importer.scan();
    const before = importer.snapshot(SKILLS_FIXTURE_SKILL_URI);

    server.corruptResource("reference.md", `sha256:${"0".repeat(64)}`);
    const scan = await importer.scan();

    expect(scan.imported).toEqual([]);
    expect(scan.failed).toEqual([
      {
        uri: SKILLS_FIXTURE_SKILL_URI,
        reason: "resource_digest_mismatch",
        priorSnapshotRetained: true,
      },
    ]);
    expect(scan.tools).toEqual([...SKILLS_FIXTURE_TOOLS]);
    expect(importer.visibleTools()).toEqual([...SKILLS_FIXTURE_TOOLS]);
    expect(importer.snapshot(SKILLS_FIXTURE_SKILL_URI)?.entryIdentity).toBe(
      before?.entryIdentity,
    );
  });

  it("rejects an incomplete skill whose listed resource cannot be read", async () => {
    const server = await fixture();
    server.dropResource("reference.md");
    const importer = new SkillScanImporter(server.endpoint);
    const scan = await importer.scan();
    expect(scan.failed).toEqual([
      {
        uri: SKILLS_FIXTURE_SKILL_URI,
        reason: "missing_resource",
        priorSnapshotRetained: false,
      },
    ]);
  });

  it("rejects a skill document without valid frontmatter", async () => {
    const server = await fixture();
    server.setFileContent("SKILL.md", "# Weekly report\n\nNo frontmatter.\n");
    const importer = new SkillScanImporter(server.endpoint);
    const scan = await importer.scan();
    expect(scan.failed).toEqual([
      {
        uri: SKILLS_FIXTURE_SKILL_URI,
        reason: "frontmatter_mismatch",
        priorSnapshotRetained: false,
      },
    ]);
  });

  it("rejects a skill URI that escapes the fixture namespace", async () => {
    const server = await fixture();
    server.overrideSkillUri("skill://local-skills-fixture/../secret/SKILL.md");
    const importer = new SkillScanImporter(server.endpoint);
    const scan = await importer.scan();
    expect(scan.failed[0]?.reason).toBe("path_traversal");
    expect(scan.tools).toEqual([...SKILLS_FIXTURE_TOOLS]);
  });

  it("imports cleanly when the skill and its resources shrink together", async () => {
    const server = await fixture();
    server.removeFile("reference.md");
    const importer = new SkillScanImporter(server.endpoint);
    const scan = await importer.scan();
    expect(scan.imported).toEqual([SKILLS_FIXTURE_SKILL_URI]);
    expect(
      Object.keys(importer.snapshot(SKILLS_FIXTURE_SKILL_URI)?.resources ?? {}),
    ).toEqual([skillUriFor("SKILL.md")]);
  });

  it("answers an unknown skill URI with -32602", async () => {
    const server = await fixture();
    const get = await skillsCall(server.endpoint, "skills/get", {
      uri: "skill://local-skills-fixture/other/SKILL.md",
    });
    expect(get.isError).toBe(true);
    if (get.isError) expect(get.code).toBe(-32602);
  });
});
