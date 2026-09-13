from __future__ import annotations

import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import struct
import subprocess
import sys
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/skills/mcp-boundary"
SOURCE_MANIFEST = ROOT / "src/plugin/plugin.json"
PACKAGE = ROOT / "plugins/mcp-boundary"
ROOT_MANIFEST = PACKAGE / "plugin.json"
CODEX_MANIFEST = PACKAGE / ".codex-plugin/plugin.json"


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError(f"Not a PNG: {path}")
    return struct.unpack(">II", data[16:24])


class DistributablePackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.codex_manifest = json.loads(CODEX_MANIFEST.read_text(encoding="utf-8"))

    def test_codex_manifest_identity(self) -> None:
        self.assertEqual(CODEX_MANIFEST.read_bytes(), SOURCE_MANIFEST.read_bytes())
        self.assertNotIn("$schema", self.codex_manifest)
        self.assertNotIn("extensions", self.codex_manifest)
        self.assertEqual(self.codex_manifest["name"], "mcp-boundary")
        self.assertEqual(
            self.codex_manifest["version"],
            (ROOT / "VERSION").read_text().strip(),
        )
        self.assertEqual(self.codex_manifest["skills"], "./skills/")

    def test_submission_package_avoids_agent_plugins_conversion(self) -> None:
        self.assertFalse(ROOT_MANIFEST.exists())

    def test_codex_interface_assets_resolve(self) -> None:
        for field in ("composerIcon", "logo"):
            self.assertTrue(
                self.resolve_package_path(self.codex_manifest["interface"][field]).is_file()
            )

    def test_plugin_is_pure_skill(self) -> None:
        for key in ("mcpServers", "apps", "hooks", "commands", "services"):
            self.assertNotIn(key, self.codex_manifest)
        self.assertEqual(
            [path.name for path in (PACKAGE / "skills").iterdir() if path.is_dir()],
            ["mcp-boundary"],
        )
        self.assertFalse(any((PACKAGE / name).exists() for name in ("hooks", "apps", "mcp", "servers")))

    def test_openai_interface_contract(self) -> None:
        interface = self.codex_manifest["interface"]
        self.assertEqual(interface["displayName"], "MCP Boundary")
        self.assertTrue(20 <= len(interface["shortDescription"]) <= 64)
        prompts = interface["defaultPrompt"]
        self.assertLessEqual(len(prompts), 3)
        for prompt in prompts:
            self.assertLessEqual(len(prompt), 128)
            self.assertIn("$mcp-boundary", prompt)
        for field in ("composerIcon", "logo"):
            path = self.resolve_package_path(interface[field])
            self.assertTrue(path.is_file())
        self.assertNotIn("screenshots", interface)
        self.assertFalse((PACKAGE / "assets/screenshots").exists())

    def test_package_asset_dimensions(self) -> None:
        self.assertEqual(png_dimensions(PACKAGE / "assets/composer-icon.png"), (512, 512))
        self.assertEqual(png_dimensions(PACKAGE / "assets/logo.png"), (1024, 1024))

    def test_skill_frontmatter_and_references(self) -> None:
        skill = (PACKAGE / "skills/mcp-boundary/SKILL.md").read_text(encoding="utf-8")
        self.assertTrue(skill.startswith("---\nname: mcp-boundary\n"))
        self.assertIn("allow_implicit_invocation: true", (PACKAGE / "skills/mcp-boundary/agents/openai.yaml").read_text())
        for target in re.findall(r"\[[^]]+\]\((references/[^)]+)\)", skill):
            self.assertTrue((PACKAGE / "skills/mcp-boundary" / target).is_file(), target)

    def test_exact_copy_provenance(self) -> None:
        provenance = json.loads((ROOT / "provenance/SOURCES.json").read_text(encoding="utf-8"))
        self.assertEqual(len(provenance["exact_copies"]), 8)
        for record in provenance["exact_copies"]:
            source = ROOT / record["destination_path"]
            packaged = PACKAGE / "skills/mcp-boundary" / source.relative_to(SOURCE)
            self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(), record["sha256"])
            self.assertEqual(packaged.read_bytes(), source.read_bytes())
            self.assertEqual(record["license"], "Apache-2.0")

    def test_public_website_has_one_approved_identity_and_one_page(self) -> None:
        marks = json.loads((ROOT / "brand/marks.json").read_text(encoding="utf-8"))
        tokens = json.loads((ROOT / "brand/tokens.json").read_text(encoding="utf-8"))
        self.assertEqual(marks["status"], "approved")
        self.assertEqual(marks["selected"], marks["mark"]["id"])
        self.assertNotIn("marks", marks)
        self.assertEqual(tokens["status"], "approved")
        self.assertEqual(tokens["selected"], tokens["palette"]["id"])
        self.assertNotIn("palettes", tokens)
        self.assertEqual([path.name for path in (ROOT / "site").glob("*.html")], ["index.html"])
        self.assertEqual([path.name for path in ROOT.glob("mcp-boundary*.html")], ["mcp-boundary-demo.html"])
        page = (ROOT / "site/index.html").read_text(encoding="utf-8")
        app = (ROOT / "site/app.js").read_text(encoding="utf-8")
        for retired_control in ("data-open-studio", "data-mark-choices", "data-palette-choices"):
            self.assertNotIn(retired_control, page + app)
        self.assertNotIn("URLSearchParams", app)

    def test_generated_package_matches_author_sources(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/build_plugin.py", "--check"],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_no_symlinks_or_unsafe_package_paths(self) -> None:
        for path in PACKAGE.rglob("*"):
            self.assertFalse(path.is_symlink(), path)
            relative = PurePosixPath(path.relative_to(PACKAGE).as_posix())
            self.assertFalse(relative.is_absolute())
            self.assertNotIn("..", relative.parts)

    def test_svg_assets_are_passive(self) -> None:
        for path in PACKAGE.rglob("*.svg"):
            ET.parse(path)
            text = path.read_text(encoding="utf-8").lower()
            for forbidden in ("<script", "javascript:", "<foreignobject", "<image", "onclick="):
                self.assertNotIn(forbidden, text, path)

    def resolve_package_path(self, value: str) -> Path:
        self.assertTrue(value.startswith("./assets/"), value)
        relative = PurePosixPath(value[2:])
        self.assertNotIn("..", relative.parts)
        return PACKAGE.joinpath(*relative.parts)


if __name__ == "__main__":
    unittest.main()
