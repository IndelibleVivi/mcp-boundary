from __future__ import annotations

import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
VERSION = ROOT / "VERSION"
SOURCE_MANIFEST = ROOT / "src/plugin/plugin.json"
PACKAGE_MANIFEST = ROOT / "plugins/mcp-boundary/.codex-plugin/plugin.json"
SUBMISSION = ROOT / "docs/submission/0.2.0.md"
SITE = ROOT / "site/index.html"
CURRENT_STATE = ROOT / "docs/current-state.md"
CHANGELOG = ROOT / "CHANGELOG.md"


class ReleaseSubmissionTests(unittest.TestCase):
    def test_release_version_is_consistent(self) -> None:
        version = VERSION.read_text(encoding="utf-8").strip()
        self.assertEqual(version, "0.2.0")
        source = json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
        package = json.loads(PACKAGE_MANIFEST.read_text(encoding="utf-8"))
        self.assertEqual(source["version"], version)
        self.assertEqual(package, source)
        self.assertIn("## 0.2.0", CHANGELOG.read_text(encoding="utf-8"))

    def test_submission_targets_existing_plugin_and_skills_only(self) -> None:
        text = SUBMISSION.read_text(encoding="utf-8")
        self.assertIn("plugins_6aa72e81844081918770991deb1dbfc8", text)
        self.assertIn("Submission type: **Skills only**", text)
        self.assertIn("dist/mcp-boundary-0.2.0.zip", text)
        self.assertIn("create an update/new version for the existing MCP Boundary plugin", text)
        self.assertNotIn("create a second public plugin", text.lower())

    def test_submission_has_five_positive_and_three_negative_cases(self) -> None:
        text = SUBMISSION.read_text(encoding="utf-8")
        for index in range(1, 6):
            self.assertIn(f"### P{index} —", text)
        for index in range(1, 4):
            self.assertIn(f"### N{index} —", text)
        self.assertEqual(text.count("### P"), 5)
        self.assertEqual(text.count("### N"), 3)

    def test_public_site_describes_current_source_without_directory_overclaim(self) -> None:
        text = SITE.read_text(encoding="utf-8")
        self.assertIn("SOURCE 0.2.0 · PURE SKILL · GUIDE + LAB", text)
        self.assertIn("Version 0.2.0 / pure skill", text)
        self.assertIn("/mcp-boundary/tree/main/guide", text)
        self.assertIn("/mcp-boundary/tree/main/lab", text)
        for stale in (
            "SOURCE PACKAGE 0.1.0",
            "Version 0.1.0 / explicitly bounded",
            "No external directory listing",
            "IndelibleVivi/mcp-server-engineering-field-guide",
        ):
            self.assertNotIn(stale, text)

    def test_external_listing_state_remains_bounded_until_publication(self) -> None:
        state = CURRENT_STATE.read_text(encoding="utf-8")
        self.assertIn("`0.1.0` remains live", state)
        self.assertIn("`0.2.0` is not public there until OpenAI approval", state)
        submission = SUBMISSION.read_text(encoding="utf-8")
        self.assertIn("Comparative improvement over no-skill", submission)
        self.assertIn("has not been measured and is not claimed", submission)


if __name__ == "__main__":
    unittest.main()
