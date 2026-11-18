import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));

test("published artifacts are valid JSON", () => {
  for (const file of ["agent-manifest.json", "agent_network_board.network.json", "links.json",
    "peer/agent-manifest.json", "peer/receipt_notary.network.json", "peer/links.json"]) {
    assert.doesNotThrow(() => json(file), file);
  }
});

test("manifest names the real network and front agent", () => {
  const manifest = json("agent-manifest.json");
  const network = json("agent_network_board.network.json");
  const entry = manifest.networks.find(n => n.name === "agent_network_board");
  assert.ok(entry, "manifest must publish agent_network_board");
  assert.equal(entry.hocon, "./agent_network_board.network.json");
  assert.ok(network.tools.some(a => a.name === entry.front_man), "front agent must exist");
});

test("network has unique agents, schemas, and resolvable internal tools", () => {
  for (const file of ["agent_network_board.network.json", "peer/receipt_notary.network.json"]) {
    const network = json(file);
    const names = network.tools.map(a => a.name);
    assert.equal(new Set(names).size, names.length, `${file} duplicate agent names`);
    assert.ok(names.length >= 2, `${file} needs at least two agents`);
    for (const agent of network.tools) {
      assert.ok(agent.function?.description, `${agent.name} description`);
      assert.equal(agent.function?.parameters?.type, "object", `${agent.name} schema`);
      assert.ok(agent.instructions, `${agent.name} instructions`);
      for (const ref of agent.tools || []) {
        if (/^https?:\/\//.test(ref)) continue;
        assert.ok(names.includes(ref) || Object.hasOwn(network.link_slots || {}, ref), `${agent.name} references missing tool ${ref}`);
      }
    }
  }
});

test("peer link is exact and uses a distinct browser origin", () => {
  const links = json("links.json");
  const target = links.networks.agent_network_board.receipt_notary_peer;
  assert.equal(target.split("/").pop(), "receipt_notary");
  const caller = new URL("https://roshameow.github.io/agent-network-board/");
  const peer = new URL(target);
  assert.notEqual(caller.origin, peer.origin, "peer must be a distinct origin");
  assert.equal(peer.protocol, "https:");
});

test("public artifacts contain no credential markers", () => {
  const files = [
    "agent-manifest.json", "agent_network_board.network.json", "links.json",
    "site-actions.js", "peer/agent-manifest.json", "peer/receipt_notary.network.json",
    "peer/site-actions.js",
  ];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /sk-[A-Za-z0-9_-]{12,}/, file);
    assert.doesNotMatch(text, /Authorization:\s*Bearer\s+[A-Za-z0-9]/i, file);
  }
});

test("network definitions are data-only", () => {
  for (const file of ["agent_network_board.network.json", "peer/receipt_notary.network.json"]) {
    const text = read(file);
    assert.doesNotMatch(text, /include\s+"/, file);
    assert.doesNotMatch(text, /\$\{/, file);
    assert.doesNotMatch(text, /os\.environ|ENV\[/i, file);
  }
});
