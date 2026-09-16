#!/usr/bin/env python3
"""Inline the fixed public website into one portable file:// page."""

from pathlib import Path
import base64


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
value = (SITE / "index.html").read_text(encoding="utf-8")
value = value.replace(
    '<link rel="stylesheet" href="./styles.css">',
    "<style>\n" + (SITE / "styles.css").read_text(encoding="utf-8") + "\n</style>",
)
inline_scripts = []
for filename in ("assets/identity.js", "app.js"):
    script = (SITE / filename).read_text(encoding="utf-8")
    if "</script" in script.lower():
        raise ValueError(f"Unsafe script closing token in {filename}")
    value = value.replace(
        f'<script src="./{filename}" defer></script>',
        "",
    )
    inline_scripts.append("<script>\n" + script + "\n</script>")
value = value.replace("</body>", "\n".join(inline_scripts) + "\n</body>")
favicon = base64.b64encode((SITE / "assets/favicon.svg").read_bytes()).decode()
value = value.replace(
    'href="./assets/favicon.svg"',
    f'href="data:image/svg+xml;base64,{favicon}"',
)
social = base64.b64encode((SITE / "assets/social-card.png").read_bytes()).decode()
value = value.replace(
    'content="./assets/social-card.png"',
    f'content="data:image/png;base64,{social}"',
)
value = value.replace(
    'content="https://indeliblevivi.github.io/mcp-boundary/assets/social-card.png"',
    f'content="data:image/png;base64,{social}"',
)
value = value.replace('href="./index.html', 'href="./mcp-boundary-demo.html')
value = value.replace(
    'href="./library.html',
    'href="https://indeliblevivi.github.io/mcp-boundary/library.html',
)
value = value.replace(
    'href="./zh/index.html',
    'href="https://indeliblevivi.github.io/mcp-boundary/zh/',
)
(ROOT / "mcp-boundary-demo.html").write_text(value, encoding="utf-8")
print(f"mcp-boundary-demo.html {len(value.encode())} bytes")
