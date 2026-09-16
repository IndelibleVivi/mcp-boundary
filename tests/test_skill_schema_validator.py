from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
VALIDATOR = ROOT / "scripts/validate_skill_schema.py"

try:
    import yaml  # noqa: F401
except ModuleNotFoundError:
    yaml = None


@unittest.skipIf(yaml is None, "PyYAML is installed by the dedicated CI schema job")
class SkillSchemaValidatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        spec = importlib.util.spec_from_file_location("validate_skill_schema", VALIDATOR)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"cannot load {VALIDATOR}")
        cls.validator = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.validator)

    def write_skill(self, directory: str, text: str) -> Path:
        skill = Path(directory) / "test-skill"
        skill.mkdir()
        (skill / "SKILL.md").write_text(text, encoding="utf-8")
        return skill

    def test_current_source_and_package_are_valid(self) -> None:
        for skill in (
            ROOT / "src/skills/mcp-boundary",
            ROOT / "plugins/mcp-boundary/skills/mcp-boundary",
        ):
            with self.subTest(skill=skill):
                self.assertEqual(self.validator.validate_skill(skill), [])

    def test_invalid_yaml_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            skill = self.write_skill(
                directory,
                "---\nname: test-skill\ndescription: invalid: unquoted\n---\n# Test\n",
            )
            errors = self.validator.validate_skill(skill)
        self.assertTrue(any("Invalid YAML" in error for error in errors), errors)

    def test_schema_and_scaffold_errors_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            skill = self.write_skill(
                directory,
                "---\nname: Test_Skill\ndescription: \"<unfinished>\"\nextra: true\n---\n"
                "[TODO: replace this]\n",
            )
            errors = self.validator.validate_skill(skill)
        for expected in ("Unexpected key", "hyphen-case", "angle brackets", "unfinished TODO"):
            self.assertTrue(any(expected in error for error in errors), (expected, errors))
