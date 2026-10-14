import {
  AppBridge,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";

async function start() {
  const initial = JSON.parse(
    document.querySelector("#initial-result")!.textContent!,
  );
  const frame = document.querySelector<HTMLIFrameElement>("iframe")!;
  const bridge = new AppBridge(
    null,
    { name: "Boundary local entrypoint host", version: "1" },
    { serverTools: {} },
  );
  bridge.oncalltool = async (params) => {
    const response = await fetch("/mcp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params,
      }),
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result.result;
  };
  bridge.oninitialized = () => {
    void bridge.sendToolResult(initial);
  };
  await bridge.connect(
    new PostMessageTransport(frame.contentWindow!, frame.contentWindow!),
  );
  frame.src = "/app";
}
void start().catch((error: unknown) => {
  document.querySelector("#host-status")!.textContent = String(error);
});
