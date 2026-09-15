from __future__ import annotations

import hashlib
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SKILL = ROOT / "src/skills/mcp-boundary"
PACKAGE = ROOT / "plugins/mcp-boundary"
PACKAGE_SKILL = PACKAGE / "skills/mcp-boundary"
LOCK = ROOT / "provenance/UPSTREAMS.lock.json"
SOURCES = ROOT / "provenance/SOURCES.json"

CURRENT_FACING_DOCS = (
    "README.md",
    "README.zh-CN.md",
    "docs/current-state.md",
    "docs/UNIFIED-WORKSPACE.md",
    "guide/README.md",
    "guide/README.zh-CN.md",
    "guide/MAINTENANCE.md",
    "guide/MAINTENANCE.zh-CN.md",
    "lab/README.md",
    "lab/README.en.md",
    "lab/docs/current-state.md",
    "lab/docs/current-state.en.md",
    "lab/AGENTS.md",
)

# Claims the unified import retracted: no external workflow authority, no current
# separate-repository framing for the Lab.
RETRACTED_CLAIMS = (
    "Softpowers",
    "Why this is a separate repository",
)

SKIPPED_SCAN_DIRS = {
    ".git",
    ".playwright-cli",
    "dist",
    "node_modules",
    "output",
    "playwright-report",
    "runtime-candidates",
    "test-results",
    "tmp",
    "__pycache__",
}


class UnifiedWorkspaceTests(unittest.TestCase):
    def test_pinned_imports_are_present(self) -> None:
        lock = json.loads((ROOT / "provenance/UPSTREAMS.lock.json").read_text())
        pins = {item["destination"]: item["commit"] for item in lock["imports"]}
        self.assertEqual(
            pins,
            {
                "guide/": "87238302209d654358dd64eb3972677e4cacf256",
                "lab/": "5a6deebbac96089588658452a00f2c52bad0dd2f",
            },
        )
        self.assertTrue((ROOT / "guide/FIELD-GUIDE.md").is_file())
        self.assertTrue((ROOT / "guide/VERSION-REGISTER.json").is_file())
        self.assertTrue((ROOT / "lab/package.json").is_file())
        self.assertTrue((ROOT / "lab/src/server.ts").is_file())

    def test_only_boundary_skill_is_distributed(self) -> None:
        packaged = [p.name for p in (PACKAGE / "skills").iterdir() if p.is_dir()]
        self.assertEqual(packaged, ["mcp-boundary"])
        self.assertFalse((PACKAGE / "guide").exists())
        self.assertFalse((PACKAGE / "lab").exists())
        self.assertTrue((ROOT / "guide/skill/mcp-server-engineering/SKILL.md").is_file())
        self.assertTrue((ROOT / "guide/MONOREPO-NOTE.md").is_file())
        self.assertEqual(
            sorted(path.name for path in SOURCE_SKILL.iterdir() if path.is_dir()),
            ["agents", "assets", "references"],
        )

    def test_lock_records_continuing_authority_and_frozen_history(self) -> None:
        lock = json.loads(LOCK.read_text())
        authority = lock["continuing_authority"]
        self.assertEqual(authority["active_skill"], "src/skills/mcp-boundary/")
        self.assertEqual(authority["distributed_plugin"], "plugins/mcp-boundary/")
        self.assertEqual(authority["active_skill_id"], "mcp-boundary")
        self.assertTrue((ROOT / authority["repository_contract"]).is_file())
        for item in lock["imports"]:
            self.assertEqual(item["continuing_authority_after_import"], "mcp-boundary")
            self.assertEqual(item["mode"], "complete-tree-with-local-license")

        frozen = lock["frozen_historical_skills"]
        self.assertEqual(
            [item["path"] for item in frozen],
            ["guide/skill/mcp-server-engineering"],
        )
        for item in frozen:
            self.assertEqual(item["status"], "historical")
            self.assertTrue((ROOT / item["path"] / "SKILL.md").is_file(), item["path"])
            self.assertFalse((PACKAGE / item["path"]).exists(), item["path"])
            self.assertNotIn(item["skill_id"], [p.name for p in (PACKAGE / "skills").iterdir()])

    def test_no_reimport_or_sync_script_is_present(self) -> None:
        self.assertFalse((ROOT / "scripts/import_upstreams.sh").exists())
        offenders = [
            path.relative_to(ROOT).as_posix()
            for path in ROOT.rglob("*")
            if path.is_file()
            and not SKIPPED_SCAN_DIRS.intersection(path.parts)
            and "import_upstreams" in path.name
        ]
        self.assertEqual(offenders, [])

    def test_exact_copies_match_the_imported_guide_source(self) -> None:
        records = json.loads(SOURCES.read_text())["exact_copies"]
        self.assertEqual(len(records), 8)
        for record in records:
            self.assertEqual(record["license"], "Apache-2.0")
            self.assertEqual(record["source_project"], "MCP Server Engineering Field Guide")
            imported = ROOT / "guide" / record["source_path"]
            authored = ROOT / record["destination_path"]
            packaged = PACKAGE_SKILL / authored.relative_to(SOURCE_SKILL)
            self.assertTrue(imported.is_file(), record["source_path"])
            self.assertEqual(imported.read_bytes(), authored.read_bytes(), record["source_path"])
            self.assertEqual(packaged.read_bytes(), authored.read_bytes(), record["destination_path"])
            self.assertEqual(
                hashlib.sha256(authored.read_bytes()).hexdigest(),
                record["sha256"],
                record["destination_path"],
            )

    def test_execution_references_are_packaged(self) -> None:
        for relative in (
            "SKILL.md",
            "references/execution-workflow.md",
            "references/control-order.md",
            "references/host-runtime.md",
            "assets/boundary-run.md",
            "assets/migration-inventory.md",
        ):
            self.assertEqual(
                (SOURCE_SKILL / relative).read_bytes(),
                (PACKAGE_SKILL / relative).read_bytes(),
                relative,
            )

    def test_registered_behavior_cases_cover_material_failures(self) -> None:
        data = json.loads((ROOT / "evaluations/cases.json").read_text())
        ids = {case["id"] for case in data["cases"]}
        self.assertEqual(
            ids,
            {
                "stdio-http-category-error",
                "local-render-host-overclaim",
                "migration-live-old-caller",
                "schema-effect-authorization",
                "source-artifact-runtime-drift",
                "small-change-stop-rule",
            },
        )

    def test_current_facing_docs_keep_one_authority(self) -> None:
        for relative in CURRENT_FACING_DOCS:
            text = (ROOT / relative).read_text(encoding="utf-8")
            self.assertIn("src/skills/mcp-boundary/", text, relative)
            for claim in RETRACTED_CLAIMS:
                self.assertNotIn(claim, text, f"{relative}: retracted claim {claim!r}")

    def test_root_readme_pairs_state_surfaces_and_pure_skill_boundary(self) -> None:
        readme = (ROOT / "README.md").read_text()
        for term in ("**Plugin**", "**Guide**", "**Lab**", "Only `src/skills/mcp-boundary/`"):
            self.assertIn(term, readme)
        for term in ("starts no server", "no analytics or telemetry", "no runtime dependency"):
            self.assertIn(term, readme)
        chinese = (ROOT / "README.zh-CN.md").read_text()
        for term in ("不启动 server", "不发送 analytics 或 telemetry", "runtime dependency"):
            self.assertIn(term, chinese)


if __name__ == "__main__":
    unittest.main()
