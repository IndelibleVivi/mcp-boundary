from __future__ import annotations

import json
from pathlib import Path
import re
import unittest
from scripts.build_plugin import codex_manifest


ROOT = Path(__file__).resolve().parents[1]
VERSION = ROOT / "VERSION"
SOURCE_MANIFEST = ROOT / "src/plugin/plugin.json"
PACKAGE_MANIFEST = ROOT / "plugins/mcp-boundary/.codex-plugin/plugin.json"
SOURCE_PROVENANCE = ROOT / "provenance/SOURCES.json"
PACKAGE_PROVENANCE = ROOT / "plugins/mcp-boundary/provenance/SOURCES.json"
UPSTREAM_LOCK = ROOT / "provenance/UPSTREAMS.lock.json"
SUBMISSION = ROOT / "docs/submission/0.2.0.md"
RELEASE_SUBMISSION = ROOT / "docs/submission/0.3.0.md"
RELEASE_NOTES = ROOT / "docs/releases/0.3.0.md"
SITE = ROOT / "site/index.html"
LIBRARY = ROOT / "site/library.html"
CHANGELOG = ROOT / "CHANGELOG.md"


class ReleaseSubmissionTests(unittest.TestCase):
    def test_release_version_is_consistent(self) -> None:
        version = VERSION.read_text(encoding="utf-8").strip()
        self.assertEqual(version, "0.3.0")
        source = json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
        package = json.loads(PACKAGE_MANIFEST.read_text(encoding="utf-8"))
        provenance = json.loads(SOURCE_PROVENANCE.read_text(encoding="utf-8"))
        lock = json.loads(UPSTREAM_LOCK.read_text(encoding="utf-8"))
        self.assertEqual(source["version"], version)
        self.assertEqual(package, codex_manifest(source))
        self.assertEqual(provenance["project_version"], version)
        self.assertEqual(lock["workspace_version"], version)
        self.assertEqual(PACKAGE_PROVENANCE.read_bytes(), SOURCE_PROVENANCE.read_bytes())
        self.assertIn("## 0.3.0", CHANGELOG.read_text(encoding="utf-8"))
        self.assertIn("## 0.2.0", CHANGELOG.read_text(encoding="utf-8"))

    def test_submission_targets_existing_plugin_and_skills_only(self) -> None:
        text = SUBMISSION.read_text(encoding="utf-8")
        self.assertIn("plugins_6aa72e81844081918770991deb1dbfc8", text)
        self.assertIn("Submission type: **Skills only**", text)
        self.assertIn("dist/mcp-boundary-0.2.0.zip", text)
        self.assertIn("The existing listing was updated", text)
        self.assertIn("Observed public version: `0.2.0`", text)

    def test_submission_has_five_positive_and_three_negative_cases(self) -> None:
        text = SUBMISSION.read_text(encoding="utf-8")
        positive = re.findall(r"^### P([1-5]) —", text, flags=re.MULTILINE)
        negative = re.findall(r"^### N([1-3]) —", text, flags=re.MULTILINE)
        self.assertEqual(positive, ["1", "2", "3", "4", "5"])
        self.assertEqual(negative, ["1", "2", "3"])
        self.assertEqual(text.count("**Test account or fixture data**"), 5)

    def test_current_release_targets_existing_listing_without_overclaim(self) -> None:
        text = RELEASE_SUBMISSION.read_text(encoding="utf-8")
        self.assertIn("plugins_6aa72e81844081918770991deb1dbfc8", text)
        self.assertIn("**Version:** `0.3.0`", text)
        self.assertIn("**Submission type:** **Skills only**", text)
        self.assertIn("dist/mcp-boundary-0.3.0.zip", text)
        self.assertIn("Target state", text)
        self.assertIn("Actual state", text)
        self.assertIn("observed public directory version", text)
        self.assertIn("`0.2.0`", text)
        self.assertIn("review readiness", text)
        self.assertIn("not an approval", text)
        self.assertIn("no new listing", text)
        self.assertIn("current `/plugins/build/mcp-server`", text)
        self.assertIn("2026-10-15", text)
        self.assertIn("historical observation", text)
        self.assertIn("**Published**", text)
        self.assertIn("not byte identity with a local package", text)
        self.assertIn("local surrogate", text)

    def test_release_notes_preserve_evaluation_boundaries(self) -> None:
        notes = RELEASE_NOTES.read_text(encoding="utf-8")
        self.assertIn("No MCP skill", notes)
        self.assertIn("`2/3`", notes)
        self.assertIn("Released `0.2.0`", notes)
        self.assertIn("`3/3`", notes)
        self.assertIn("Initial candidate", notes)
        self.assertIn("Final candidate", notes)
        self.assertIn("six new core cases", notes.lower())
        self.assertIn("no model results", notes)
        self.assertIn("explicit source-file loading", notes)
        self.assertIn("not installed activation", notes)
        self.assertIn("October snapshot only", notes)

    def test_public_site_describes_current_source_without_directory_overclaim(self) -> None:
        text = SITE.read_text(encoding="utf-8")
        library = LIBRARY.read_text(encoding="utf-8")
        self.assertIn(">v0.3.0</a>", text)
        self.assertIn("The public directory listing is version 0.3.0", text)
        self.assertIn("--ref v0.3.0", text)
        self.assertIn("releases/tag/v0.3.0", text)
        self.assertIn("./library.html#guide", text)
        self.assertIn("./library.html#lab", text)
        self.assertIn("/mcp-boundary/blob/main/guide/", library)
        self.assertIn("/mcp-boundary/blob/main/lab/", library)
        self.assertNotIn("mcp-boundary-demo.html", text)
        for stale in (
            "0.2.0-alpha.1",
            "SOURCE PACKAGE 0.1.0",
            "Version 0.1.0 / explicitly bounded",
            "No external directory listing",
            "IndelibleVivi/mcp-server-engineering-field-guide",
        ):
            self.assertNotIn(stale, text)

    def test_historical_publication_records_remain_intact(self) -> None:
        historical = SUBMISSION.read_text(encoding="utf-8")
        self.assertIn("Observed public version: `0.2.0`", historical)
        self.assertIn("The public page does not expose the uploaded ZIP digest", historical)
        self.assertIn("not byte identity with a local package", historical)


if __name__ == "__main__":
    unittest.main()
