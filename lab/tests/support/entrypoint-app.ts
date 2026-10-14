import { App } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "Boundary entrypoint view", version: "1" }, {});
const status = document.querySelector<HTMLElement>("#status")!;
const scenario = document.querySelector<HTMLSelectElement>("#scenario")!;
const probe = document.querySelector<HTMLInputElement>("#probe")!;
const form = document.querySelector<HTMLFormElement>("form")!;
const output = document.querySelector<HTMLElement>("#result")!;

function render(data: Record<string, unknown> | undefined) {
  if (data?.format === "entrypoint-initial@1") {
    status.textContent = "Choose a scenario to inspect a boundary.";
    scenario.replaceChildren(new Option("Select a scenario", ""));
    for (const value of data.options as string[])
      scenario.add(new Option(value, value));
  } else if (data?.format === "fieldlab-boundary-result@1") {
    status.textContent = `Ready: ${String(data.scenario)}`;
    output.textContent = JSON.stringify(data, null, 2);
  }
}
app.ontoolresult = (result) => render(result.structuredContent);
form.querySelector("button")!.addEventListener("click", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  void (async () => {
    const result = await app.callServerTool({
      name: "inspect_boundary",
      arguments: {
        scenario: scenario.value,
        ...(probe.value ? { probeId: probe.value } : {}),
      },
    });
    if (result.isError) throw new Error("Tool rejected context");
    render(result.structuredContent);
  })().catch((error: unknown) => {
    status.textContent = String(error);
  });
});
void app.connect().catch((error: unknown) => {
  status.textContent = String(error);
});
