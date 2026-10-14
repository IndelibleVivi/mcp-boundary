import { chromium, expect, type Browser } from "@playwright/test";
import {
  startEntrypointFixture,
  OPENAI_FIXTURE_UI_URI,
} from "../tests/support/openai-entrypoint.js";
import { postJson } from "../tests/support/loopback.js";

const server = await startEntrypointFixture();
let browser: Browser | undefined;
try {
  browser = await chromium.launch({ headless: true });
  const resource = await postJson(server.endpoint, {
    jsonrpc: "2.0",
    id: 1,
    method: "resources/read",
    params: { uri: OPENAI_FIXTURE_UI_URI },
  });
  const contents = (
    resource.json as {
      result: { contents: Array<{ text: string; mimeType: string }> };
    }
  ).result.contents;
  if (
    contents.length !== 1 ||
    contents[0]?.mimeType !== "text/html;profile=mcp-app"
  )
    throw new Error("UI resource mismatch");
  const served = await (await fetch(`${server.origin}/app`)).text();
  if (served !== contents[0].text)
    throw new Error("Browser view differs from MCP resource bytes");
  const page = await browser.newPage();
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  await page.route("**/*", async (route) => {
    if (
      route
        .request()
        .url()
        .startsWith(server.origin + "/")
    )
      await route.continue();
    else {
      failures.push("Unexpected external request");
      await route.abort();
    }
  });
  await page.goto(server.origin);
  const app = page.frameLocator("iframe");
  await expect(app.getByRole("status")).toHaveText(
    "Choose a scenario to inspect a boundary.",
  );
  if (server.state.toolCalls !== 1)
    throw new Error("Initial rendering repeated the tool call");
  await app.getByLabel("Scenario").selectOption("optional-capability");
  await app.getByLabel("Probe ID").fill("from-user");
  await app.getByRole("button", { name: "Inspect boundary" }).click();
  await expect(app.getByRole("status")).toHaveText(
    "Ready: optional-capability",
  );
  await expect(app.locator("#result")).toContainText('"probeId": "from-user"');
  if (server.state.toolCalls !== 2)
    throw new Error("Context action did not use one tool call");
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(
    JSON.stringify({
      status: "verified",
      boundary: "local browser + installed MCP Apps SDK bridge",
      initialCalls: 1,
      contextCalls: 1,
      exactResourceBytes: true,
      notProven: ["named-host admission", "OpenAI platform rendering"],
    }),
  );
} finally {
  await browser?.close();
  await server.close();
}
