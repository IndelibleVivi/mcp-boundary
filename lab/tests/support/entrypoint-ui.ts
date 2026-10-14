import { resolve } from "node:path";
import { build, type Rollup } from "vite";

async function bundle(name: string) {
  const root = resolve(import.meta.dirname, "../..");
  const result = await build({
    configFile: false,
    root,
    logLevel: "silent",
    build: {
      target: "es2022",
      minify: true,
      write: false,
      rollupOptions: {
        input: resolve(root, `tests/support/${name}.ts`),
        output: { format: "es", inlineDynamicImports: true },
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs
    .flatMap((output) => (output as Rollup.RollupOutput).output)
    .filter((item): item is Rollup.OutputChunk => item.type === "chunk");
  if (chunks.length !== 1)
    throw new Error("Expected one self-contained fixture script");
  return chunks[0]!.code.replace(/<\/script/gi, "<\\/script");
}

let assets: Promise<{ app: string; hostScript: string }> | undefined;
export function entrypointUiAssets() {
  assets ??= Promise.all([
    bundle("entrypoint-app"),
    bundle("entrypoint-host"),
  ]).then(([app, hostScript]) => ({
    hostScript,
    app: `<!doctype html><html lang="en"><meta charset="utf-8"><title>Boundary entrypoint</title>
<style>body{font:16px/1.5 system-ui;margin:32px;max-width:680px}label{display:block;margin:16px 0}select,input,button{font:inherit;padding:8px}pre{white-space:pre-wrap}</style>
<h1>Boundary entrypoint</h1><p id="status" role="status">Waiting for initial tool result…</p>
<form><label>Scenario <select id="scenario" required><option value="">Select a scenario</option></select></label>
<label>Probe ID <input id="probe" autocomplete="off"></label><button type="button">Inspect boundary</button></form>
<pre id="result"></pre><script type="module">${app}</script></html>`,
  }));
  return assets;
}

export function entrypointHostHtml(initialResult: unknown, hostScript: string) {
  const encoded = JSON.stringify(initialResult).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Local entrypoint host</title>
<p id="host-status">Local SDK bridge fixture; named-host behavior is not verified.</p>
<iframe title="Boundary entrypoint app" style="width:100%;height:650px;border:0" sandbox="allow-scripts"></iframe>
<script id="initial-result" type="application/json">${encoded}</script><script type="module">${hostScript}</script></html>`;
}
