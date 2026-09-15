from __future__ import annotations

import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SOURCE_SKILL = ROOT / "src/skills/mcp-boundary"
PACKAGE_SKILL = ROOT / "plugins/mcp-boundary/skills/mcp-boundary"


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
        packaged = [p.name for p in (ROOT / "plugins/mcp-boundary/skills").iterdir() if p.is_dir()]
        self.assertEqual(packaged, ["mcp-boundary"])
        self.assertFalse((ROOT / "plugins/mcp-boundary/guide").exists())
        self.assertFalse((ROOT / "plugins/mcp-boundary/lab").exists())
        self.assertTrue((ROOT / "guide/skill/mcp-server-engineering/SKILL.md").is_file())
        self.assertTrue((ROOT / "guide/MONOREPO-NOTE.md").is_file())

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

    def test_root_explains_three_surfaces_and_single_skill(self) -> None:
        readme = (ROOT / "README.md").read_text()
        for term in ("**Plugin**", "**Guide**", "**Lab**", "Only `src/skills/mcp-boundary/`"):
            self.assertIn(term, readme)


if __name__ == "__main__":
    unittest.main()
