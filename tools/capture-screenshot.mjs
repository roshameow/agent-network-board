import fs from "node:fs";
import { CDP } from "./cdp.mjs";

const tab = await CDP.newTab(9236, "about:blank");
const c = await new CDP(tab.webSocketDebuggerUrl, { timeout: 60000 }).connect();
await c.send("Page.enable");
await c.send("Network.enable");
await c.send("Network.setCacheDisabled", { cacheDisabled: true });
await c.send("Page.navigate", { url: "https://roshameow.github.io/agent-network-board/" });
await c.waitFor("!!window.__anb", { timeout: 45000 });
await c.evaluate(`document.querySelector('#task-form button[type=submit]').click()`);
for (let i = 0; i < 360; i++) {
  const state = await c.evaluate(`({status:document.querySelector('#run-status').textContent, consent:document.querySelector('#consent-dialog').open})`);
  if (state.consent) await c.evaluate(`document.querySelector('#consent-dialog button[value="allow"]').click()`);
  if (state.status !== "running") break;
  await new Promise(r => setTimeout(r, 500));
}
await new Promise(r => setTimeout(r, 800));
const shot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const dir = new URL("../assets/", import.meta.url);
fs.mkdirSync(dir, { recursive: true });
const out = new URL("screenshot.png", dir);
fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(out.pathname);
await c.close();
