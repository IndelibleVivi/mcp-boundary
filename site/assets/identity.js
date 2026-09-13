window.BOUNDARY_IDENTITY = {
  "mark": {
    "id": "offset",
    "label": "Offset",
    "zh": "错位",
    "rationale": "两段开口轮廓相向错开。它们有自己的边界，也留出共享的空间。",
    "geometry": "<path d=\"M35 11H13V44H28\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"6\" stroke-linejoin=\"miter\"/><path d=\"M29 53H51V20H36\" fill=\"none\" stroke=\"var(--mark-accent,currentColor)\" stroke-width=\"6\" stroke-linejoin=\"miter\"/>"
  },
  "tokens": {
    "version": "0.1.0",
    "status": "approved",
    "selected": "porcelain",
    "palette": {
      "id": "porcelain",
      "label": "Porcelain",
      "zh": "瓷白 · 钴蓝",
      "bg": "#F6F7F9",
      "panel": "#FFFFFF",
      "ink": "#182A44",
      "muted": "#56677D",
      "accent": "#315BE8",
      "soft": "#E8EDFF",
      "line": "#CED6E1",
      "strongLine": "#8593A7",
      "night": "#192D4B",
      "onNight": "#F0F3FC",
      "nightMuted": "#BBC8DD"
    },
    "typography": {
      "display": "Iowan Old Style, Baskerville, Georgia, Times New Roman, serif",
      "body": "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans CJK SC, sans-serif",
      "mono": "SFMono-Regular, Consolas, Liberation Mono, monospace"
    },
    "layout": {
      "maxWidth": 1248,
      "gutterDesktop": 48,
      "gutterMobile": 22,
      "controlMinHeight": 44,
      "radiusControl": 6,
      "radiusPanel": 8
    },
    "motion": {
      "transitionMs": 160,
      "traceMs": 750,
      "policy": "user-triggered only; reduced-motion disables transitions and trace"
    }
  }
};
