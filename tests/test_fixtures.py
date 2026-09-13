from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests/fixtures"


class ContractFixtureTests(unittest.TestCase):
    def test_fixture_outcomes_are_distinct(self) -> None:
        expected = {
            "positive-version-drift": "contradicted",
            "negative-stdio": "not_applicable",
            "clean-tool": "verified",
        }
        observed = {}
        for path in FIXTURES.glob("*/fixture.json"):
            data = json.loads(path.read_text(encoding="utf-8"))
            observed[data["id"]] = data["expected_outcome"]
            self.assertGreater(len(data["claim"]), 20)
            self.assertGreater(len(data["reason"]), 30)
        self.assertEqual(observed, expected)

    def test_clean_tool_rejects_before_effect(self) -> None:
        path = FIXTURES / "clean-tool/tool.py"
        spec = importlib.util.spec_from_file_location("clean_fixture_tool", path)
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with self.assertRaises(ValueError):
            module.run({"value": ""})
        self.assertEqual(module.effect_count, 0)
        self.assertEqual(module.run({"value": "boundary"}), "BOUNDARY")
        self.assertEqual(module.effect_count, 1)

    def test_version_drift_fixture_contains_both_revisions(self) -> None:
        source = (FIXTURES / "positive-version-drift/server.ts").read_text(encoding="utf-8")
        self.assertIn('manifestProtocol = "2026-07-28"', source)
        self.assertIn('activeProtocol = "2025-11-25"', source)

    def test_stdio_fixture_has_no_http_surface(self) -> None:
        source = (FIXTURES / "negative-stdio/server.py").read_text(encoding="utf-8")
        self.assertIn("sys.stdin", source)
        self.assertIn("sys.stdout", source)
        for term in ("http.server", "socket", "listen(", "bind("):
            self.assertNotIn(term, source)


if __name__ == "__main__":
    unittest.main()
