#!/usr/bin/env python3
"""Regenerate the approved Offset + Porcelain public assets."""

from pathlib import Path
import html
import json
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
mark_registry = json.loads((ROOT / "brand/marks.json").read_text(encoding="utf-8"))
token_registry = json.loads((ROOT / "brand/tokens.json").read_text(encoding="utf-8"))
mark = mark_registry["mark"]
palette = token_registry["palette"]


def svg(inner: str, width: int = 64, height: int = 64, view: str = "0 0 64 64", title: str = "MCP Boundary") -> str:
    escaped = html.escape(title)
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{view}" role="img" aria-label="{html.escape(title, quote=True)}"><title>{escaped}</title>{inner}</svg>\n'


def geometry(color: str, accent: str | None = None) -> str:
    return mark["geometry"].replace(
        "var(--mark-accent,currentColor)", accent or color
    ).replace("currentColor", color)


def write(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def png(source: Path, target: Path, size: int) -> None:
    try:
        import cairosvg

        cairosvg.svg2png(
            url=str(source),
            write_to=str(target),
            output_width=size,
            output_height=size,
        )
        return
    except ModuleNotFoundError:
        pass
    sips = shutil.which("sips")
    if not sips:
        raise RuntimeError("PNG export requires CairoSVG or macOS sips.")
    subprocess.run(
        [sips, "-s", "format", "png", str(source), "--out", str(target)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    subprocess.run(
        [sips, "-z", str(size), str(size), str(target)],
        check=True,
        stdout=subprocess.DEVNULL,
    )


exports = ROOT / "brand/exports"
write(exports / "mark.svg", svg(mark["geometry"], title="MCP Boundary — Offset"))
write(exports / "mark-ink.svg", svg(geometry(palette["ink"]), title="MCP Boundary — Offset ink"))
write(exports / "mark-white.svg", svg(geometry(palette["onNight"]), title="MCP Boundary — Offset white"))
write(exports / "mark-accent.svg", svg(geometry(palette["ink"], palette["accent"]), title="MCP Boundary — Offset accent"))
write(exports / "tile.svg", svg(
    f'<rect width="128" height="128" fill="{palette["night"]}"/><g transform="translate(26 26) scale(1.1875)">{geometry(palette["onNight"], "#9FB6FF")}</g>',
    128,
    128,
    "0 0 128 128",
    "MCP Boundary directory tile",
))
write(exports / "tile-light.svg", svg(
    f'<rect width="128" height="128" fill="{palette["soft"]}"/><g transform="translate(26 26) scale(1.1875)">{geometry(palette["ink"], palette["accent"])}</g>',
    128,
    128,
    "0 0 128 128",
    "MCP Boundary light tile",
))
png(exports / "mark-ink.svg", exports / "icon-400.png", 400)
png(exports / "mark-ink.svg", exports / "composer-icon.png", 512)
png(exports / "tile.svg", exports / "logo.png", 1024)
png(exports / "tile-light.svg", exports / "logo-light.png", 1024)


def text(x: int, y: int, value: str, size: int = 16, fill: str | None = None, serif: bool = False, extra: str = "") -> str:
    family = "Georgia,serif" if serif else "Arial,sans-serif"
    return f'<text x="{x}" y="{y}" fill="{fill or palette["ink"]}" font-family="{family}" font-size="{size}" {extra}>{html.escape(value)}</text>'


social_inner = f'<rect width="1200" height="630" fill="{palette["bg"]}"/><path d="M64 110H1136M64 542H1136" stroke="{palette["line"]}"/>'
social_inner += f'<g transform="translate(58 40) scale(.8)">{geometry(palette["ink"], palette["accent"])}</g>'
social_inner += text(122, 77, "MCP Boundary", 27, serif=True)
social_inner += text(1136, 75, "SOURCE PACKAGE 0.1.0", 12, palette["muted"], extra='text-anchor="end" letter-spacing="2"')
social_inner += text(64, 235, "Make your MCP", 78, serif=True)
social_inner += text(64, 332, "hold up.", 94, palette["accent"], serif=True, extra='font-style="italic"')
social_inner += text(68, 414, "Build. Inspect. Migrate. Verify the actual boundary.", 22, palette["muted"])
social_inner += f'<g transform="translate(887 186) scale(3.5)">{geometry(palette["ink"], palette["accent"])}</g>'
social_inner += text(64, 586, "A pure-skill engineering plugin / Codex-first", 16, palette["muted"])
social_inner += text(1136, 586, "Faye & Cove", 16, palette["muted"], extra='text-anchor="end"')
social = exports / "social-card.svg"
write(social, svg(social_inner, 1200, 630, "0 0 1200 630", "MCP Boundary social card"))
try:
    import cairosvg

    cairosvg.svg2png(url=str(social), write_to=str(exports / "social-card.png"))
except ModuleNotFoundError:
    sips = shutil.which("sips")
    if not sips:
        raise RuntimeError("PNG export requires CairoSVG or macOS sips.")
    subprocess.run(
        [sips, "-s", "format", "png", str(social), "--out", str(exports / "social-card.png")],
        check=True,
        stdout=subprocess.DEVNULL,
    )

for name in ("social-card.png", "mark-accent.svg", "logo.png"):
    shutil.copyfile(exports / name, ROOT / "site/assets" / name)
shutil.copyfile(exports / "mark-accent.svg", ROOT / "site/assets/favicon.svg")
shutil.copyfile(exports / "icon-400.png", ROOT / "src/skills/mcp-boundary/assets/icon-400.png")
shutil.copyfile(exports / "mark.svg", ROOT / "src/skills/mcp-boundary/assets/mark.svg")
write(
    ROOT / "site/assets/identity.js",
    "window.BOUNDARY_IDENTITY = "
    + json.dumps({"mark": mark, "tokens": token_registry}, ensure_ascii=False, indent=2)
    + ";\n",
)

print("Generated the approved Offset + Porcelain assets and fixed site identity data.")
