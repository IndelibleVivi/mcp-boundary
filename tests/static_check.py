#!/usr/bin/env python3
"""Static public-asset and website checks; no model or host invocation."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import struct
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--no-report", action="store_true")
args = parser.parse_args()
checks: list[dict[str, str]] = []


def passed(name: str, detail: str) -> None:
    checks.append({"check": name, "status": "passed", "detail": detail})


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR", path
    return struct.unpack(">II", data[16:24])


marks = json.loads((ROOT / "brand/marks.json").read_text(encoding="utf-8"))
tokens = json.loads((ROOT / "brand/tokens.json").read_text(encoding="utf-8"))
assert marks["status"] == "approved" and marks["selected"] == "offset"
assert marks["mark"]["id"] == "offset" and "marks" not in marks
assert tokens["status"] == "approved" and tokens["selected"] == "porcelain"
assert tokens["palette"]["id"] == "porcelain" and "palettes" not in tokens
passed("single approved identity registry", "Only Offset + Porcelain exists in the public registries.")

svg_roots = [ROOT / "brand/exports", ROOT / "site/assets", ROOT / "src/skills/mcp-boundary/assets"]
svg_files = [path for base in svg_roots for path in base.rglob("*.svg")]
assert svg_files
for path in svg_files:
    ET.parse(path)
    source = path.read_text(encoding="utf-8").lower()
    for forbidden in ("<script", "javascript:", "<foreignobject", "<image", "onclick="):
        assert forbidden not in source, (path, forbidden)
passed("passive SVG assets", f"Parsed {len(svg_files)} selected SVG assets with active-content guards.")

expected_pngs = {
    "brand/exports/icon-400.png": (400, 400),
    "brand/exports/composer-icon.png": (512, 512),
    "brand/exports/logo.png": (1024, 1024),
    "brand/exports/social-card.png": (1200, 630),
}
for name, dimensions in expected_pngs.items():
    assert png_dimensions(ROOT / name) == dimensions, name
passed("public PNG dimensions", "Composer, logo, icon, and social-card dimensions match the manifest/design contract.")


class Paths(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[tuple[str, str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for field in ("href", "src"):
            if values.get(field):
                self.references.append((tag, field, values[field] or ""))


for path in (ROOT / "site/index.html", ROOT / "mcp-boundary-demo.html"):
    document = Paths()
    document.feed(path.read_text(encoding="utf-8"))
    for tag, _, reference in document.references:
        if reference.startswith(("#", "https://", "http://", "data:", "blob:")):
            if tag not in {"a", "meta"}:
                assert not reference.startswith(("https://", "http://")), (path, tag, reference)
            continue
        target = (path.parent / reference.split("?", 1)[0].split("#", 1)[0]).resolve()
        assert target.is_file(), (path, reference)
passed("static resources and links", "Local site resources resolve and only anchors target external origins.")

standalone = (ROOT / "mcp-boundary-demo.html").read_text(encoding="utf-8")
assert not re.search(r'<script\b[^>]*\bsrc=', standalone, re.IGNORECASE)
assert not re.search(r'<link\b[^>]*rel="stylesheet"', standalone, re.IGNORECASE)
assert 'content="data:image/png;base64,' in standalone
passed("portable standalone", "CSS, JavaScript, favicon, and social metadata image are inlined.")

identity = (ROOT / "site/assets/identity.js").read_text(encoding="utf-8")
assert '"id": "offset"' in identity and '"id": "porcelain"' in identity
assert '"marks"' not in identity and '"palettes"' not in identity
app = (ROOT / "site/app.js").read_text(encoding="utf-8")
for network_api in ("fetch(", "XMLHttpRequest", "WebSocket(", "EventSource(", "sendBeacon("):
    assert network_api not in app, network_api
passed("fixed identity and no programmatic network API", "The website cannot switch identity and declares no programmatic request primitive.")


def luminance(color: str) -> float:
    channels = [int(color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return sum(weight * value for weight, value in zip((0.2126, 0.7152, 0.0722), linear))


def contrast_ratio(first: str, second: str) -> float:
    low, high = sorted((luminance(first), luminance(second)))
    return (high + 0.05) / (low + 0.05)


palette = tokens["palette"]
contrast = []
for foreground, background in (
    ("ink", "bg"), ("muted", "bg"), ("accent", "bg"),
    ("ink", "panel"), ("muted", "panel"),
    ("onNight", "night"), ("nightMuted", "night"),
):
    ratio = contrast_ratio(palette[foreground], palette[background])
    assert ratio >= 4.5, (foreground, background, ratio)
    contrast.append({"foreground": foreground, "background": background, "ratio": round(ratio, 2)})
button_ratio = contrast_ratio("#FFFFFF", palette["accent"])
assert button_ratio >= 4.5, button_ratio
contrast.append({"foreground": "white", "background": "accent", "ratio": round(button_ratio, 2)})
passed("selected text-token contrast", "Core Porcelain text pairings meet 4.5:1 numerically; this is not a full accessibility audit.")

report = {
    "scope": "Selected public identity, static resource integrity, standalone portability, no-network source guard, and token contrast. No model, plugin installation, host, or deployment claims.",
    "checks": checks,
    "passed": len(checks),
    "contrast": contrast,
}
if not args.no_report:
    (ROOT / "tests/STATIC-RESULTS.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
print(json.dumps({"passed": len(checks), "svg_files": len(svg_files)}, indent=2))
