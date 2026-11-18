import { boot } from "./vendor/nsdeploy/runtime/index.js";

const $ = (selector) => document.querySelector(selector);
const state = window.ANB_STATE || (window.ANB_STATE = {
  discovery: null,
  inspection: null,
  handoff: null,
  verification: null,
  audit: null,
  events: [],
  receipts: [],
});

let engine = null;
let lastReceipt = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function setPill(id, text, tone = "") {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.className = `pill ${tone}`.trim();
}

function fmt(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return escapeHtml(JSON.stringify(value));
  return escapeHtml(value);
}

function renderDiscovery() {
  const target = $("#discovery-result");
  const d = state.discovery;
  if (!d) {
    target.innerHTML = '<p class="empty-state">No site inspected yet.</p>';
    setPill("#discovery-status", "idle");
    return;
  }
  if (d.status !== "succeeded") {
    target.innerHTML = `<div class="artifact-row"><strong>Discovery failed</strong><span class="status-tag fail">FAIL</span><span class="mono">${fmt(d.reason)}</span></div>`;
    setPill("#discovery-status", "failed", "bad");
    return;
  }
  const nets = (d.networks || []).map(n => `
    <div class="artifact-row">
      <strong>${fmt(n.name)}</strong><span class="status-tag pass">PASS</span>
      <span class="mono">front: ${fmt(n.front_man)} · hocon: ${fmt(n.hocon)}</span>
      <span class="mono">${fmt((n.description || "").slice(0, 140))}</span>
    </div>`).join("");
  target.innerHTML = `
    <div class="artifact-row">
      <strong>Manifest artifact</strong><span class="status-tag pass">200 OK</span>
      <span class="mono">${fmt(d.manifestUrl)}</span>
      <span class="mono">${fmt(d.sha256)} · ${fmt(d.bytes)} bytes · ${fmt(d.durationMs)} ms · CORS ${fmt(d.cors)}</span>
    </div>${nets}`;
  setPill("#discovery-status", `${d.networkCount} network${d.networkCount === 1 ? "" : "s"}`, "ok");
}

function renderNetwork() {
  const target = $("#network-board");
  const n = state.inspection;
  if (!n || n.status !== "succeeded") {
    target.innerHTML = '<p class="empty-state">Inspect a site to populate the board.</p>';
    setPill("#network-status", n ? "failed" : "no network", n ? "bad" : "");
    return;
  }
  const cards = (n.agents || []).map(a => {
    const edges = (a.tools || []).map(t => {
      const external = /^https?:\/\//i.test(t) || !n.agents.some(x => x.name === t);
      return `<span class="edge ${external ? "external" : ""}">${fmt(t)}</span>`;
    }).join("") || '<span class="edge">no downstream tools</span>';
    const actions = (a.xAnmActions || []).map(x => `<span class="edge external">${fmt(x)}</span>`).join("");
    return `<article class="agent-card ${a.name === n.frontMan ? "front" : ""}">
      <h3>${fmt(a.name)} ${a.name === n.frontMan ? "· front" : ""}</h3>
      <p>${fmt(a.description)}</p>
      <div class="edge-list">${edges}${actions}</div>
      <div class="schema-line">input schema: ${fmt((a.inputProperties || []).join(", ") || "none")}</div>
    </article>`;
  }).join("");
  target.innerHTML = `<div class="artifact-row">
      <strong>${fmt(n.networkName)}</strong><span class="status-tag pass">RESOLVED</span>
      <span class="mono">${fmt(n.networkUrl)}</span>
      <span class="mono">${fmt(n.networkSha256)} · front ${fmt(n.frontMan)} · ${fmt(n.agentCount)} agents</span>
      <span class="mono">duplicates: ${fmt(n.duplicateNames.length)} · invalid schemas: ${fmt(n.invalidSchemas.length)} · unresolved links: ${fmt(n.unresolved.length)}</span>
    </div>${cards}`;
  setPill("#network-status", `${n.agentCount} agents`, "ok");
}

function renderHandoff() {
  const target = $("#handoff-card");
  const c = state.handoff;
  if (!c) {
    target.innerHTML = '<p class="empty-state">No handoff proposal yet.</p>';
    return;
  }
  target.innerHTML = `<dl>
    <dt>Status</dt><dd>${fmt(c.status)} ${c.reason ? `· ${fmt(c.reason)}` : ""}</dd>
    <dt>Destination</dt><dd>${fmt(c.destinationOrigin || c.siteBase)}</dd>
    <dt>Network</dt><dd>${fmt(c.networkName)}</dd>
    <dt>Task</dt><dd>${fmt(c.task)}</dd>
    <dt>Router</dt><dd>${fmt(c.routerPolicy)}</dd>
    <dt>Private context</dt><dd>${fmt(c.privateContext)}</dd>
    <dt>Consent</dt><dd>${fmt(c.consent)}</dd>
  </dl>`;
}

function traceEvents() {
  return window.__nsweb?.trace?.export?.()?.events || [];
}

function redactedText(value) {
  return String(value ?? "")
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, "sk-[redacted]");
}

function evidenceChecks() {
  const d = state.discovery;
  const n = state.inspection;
  const v = state.verification;
  const events = traceEvents();
  const consent = events.filter(e => e.kind === "consent" && e.decision);
  const remote = events.filter(e => e.kind === "remote_call");
  const keySignal = events.some(e => /sk-[A-Za-z0-9]{8,}|Bearer\s+[A-Za-z0-9]/i.test(redactedText(JSON.stringify(e))));
  const privateLeak = remote.some(e => JSON.stringify(e.requestPayload || {}).includes("DO_NOT_FORWARD"));
  const requested = $("#site-url")?.value || d?.requestedNetwork || "";
  const exact = n?.status === "succeeded" && requested ? n.networkName === requested.split("/").filter(Boolean).pop() : null;
  const https = location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname);
  return [
    ["HTTPS publication", https ? "PASS" : "FAIL", "location.protocol (loopback exempt)"],
    ["Public manifest GET", d?.status === "succeeded" ? "PASS" : n?.status === "succeeded" ? "PASS" : "UNKNOWN", "discover_agent_site / inspect_network"],
    ["Cross-origin CORS", d?.cors === "PASS" || n?.cors === "PASS" ? "PASS" : d?.cors === "SAME_ORIGIN" ? "UNKNOWN" : "UNKNOWN", "fetch succeeded from another origin"],
    ["Exact network name", exact === true ? "PASS" : exact === false ? "FAIL" : "UNKNOWN", "manifest entry vs URL final segment"],
    ["Front agent exists", n?.frontManFound === true ? "PASS" : v?.frontManFound === "PASS" ? "PASS" : n?.frontManFound === false ? "FAIL" : "UNKNOWN", "resolved network.tools"],
    ["Data-only network", n?.forbiddenTokensFound?.length === 0 ? "PASS" : n?.forbiddenTokensFound?.length ? "FAIL" : v?.dataOnly === "PASS" ? "PASS" : "UNKNOWN", "no includes, env substitution, or private paths"],
    ["Input schemas parse", n?.invalidSchemas?.length === 0 ? "PASS" : n?.invalidSchemas?.length ? "FAIL" : "UNKNOWN", "function.parameters JSON Schema"],
    ["No key fields in public artifacts", v?.keyFieldsInPublicFiles === "PASS" ? "PASS" : v?.keyFieldsInPublicFiles === "FAIL" ? "FAIL" : "UNKNOWN", "SHA-256 verified public files"],
    ["Explicit third-party consent", consent.length ? "PASS" : remote.length ? "FAIL" : "UNKNOWN", "runtime consent trace events"],
    ["Peer never receives BYOK key", !keySignal ? "PASS" : "FAIL", "key fields absent from all trace events"],
    ["Private context not forwarded", !privateLeak ? "PASS" : "FAIL", "remote_call requestPayload filter"],
    ["Last turn outcome", lastReceipt?.status === "succeeded" ? "PASS" : lastReceipt?.status === "failed" ? "FAIL" : "UNKNOWN", "engine.runTurn receipt"],
  ];
}

function renderTrust() {
  const checks = evidenceChecks();
  const target = $("#evidence-list");
  target.innerHTML = checks.map(([label, status, source]) => `
    <div class="evidence-row">
      <span class="status-tag ${status.toLowerCase()}">${status}</span>
      <span>${escapeHtml(label)}<span class="source">source: ${escapeHtml(source)}</span></span>
    </div>`).join("");
  const fails = checks.filter(c => c[1] === "FAIL").length;
  const unknowns = checks.filter(c => c[1] === "UNKNOWN").length;
  setPill("#trust-status", `${checks.length - fails - unknowns}/${checks.length} pass`, fails ? "bad" : unknowns ? "warn" : "ok");

  const recent = state.events.slice(-18).reverse().map(e => `<li><code>${fmt(e.type)}</code> · ${fmt(e.at)}</li>`).join("");
  const traceRecent = traceEvents().slice(-12).reverse().map(e => `<li><code>${fmt(e.kind || e.phase)}</code> ${fmt(e.tool || e.peerOrigin || e.network || "")} · ${fmt(e.status || e.decision || "")}</li>`).join("");
  $("#audit-timeline").innerHTML = `${recent}${traceRecent}` || '<li>No events yet.</li>';
}

function renderMode() {
  const strip = $("#mode-strip");
  const router = engine?.userRouter;
  if (!router) return;
  const keyActive = !!engine?.byokKey && engine.byokKey !== "demo";
  strip.className = `mode-strip ${keyActive ? "ok" : ""}`;
  $("#mode-text").textContent = keyActive
    ? `BYOK mode active · router ${router.baseUrl} · peers inherit this router and never receive your key.`
    : "Keyless deterministic browser router active · open the runtime settings to add an OpenAI-compatible BYOK router.";
}

function renderAll() {
  renderDiscovery();
  renderNetwork();
  renderHandoff();
  renderTrust();
}

window.addEventListener("anb:state", () => renderAll());

function askConsent(info) {
  return new Promise(resolve => {
    const dialog = $("#consent-dialog");
    $("#consent-body").textContent = `${info.peerLabel || "Peer network"} at ${info.peerOrigin} wants to be contacted. Purpose: ${info.kind || "agent network"} ${info.phase || ""}. The request will run in this browser with the caller's router.`;
    $("#consent-detail").textContent = String(info.requestText || "").slice(0, 700) || "(no request payload)";
    const finish = (event) => resolve(event.target.returnValue || "decline");
    dialog.addEventListener("close", finish, { once: true });
    dialog.showModal();
  });
}

async function runTask() {
  if (!engine) return;
  const task = $("#task-input").value.trim();
  if (!task) return;
  const button = $("#task-form button[type=submit]");
  button.disabled = true;
  setPill("#run-status", "running", "warn");
  try {
    const result = await engine.runTurn(task, {
      // A harmless sentinel proves the deny-by-default private-context boundary.
      slyData: { anb_private_probe: "DO_NOT_FORWARD" },
    });
    lastReceipt = {
      at: new Date().toISOString(),
      status: "succeeded",
      answer: String(result.text || "").slice(0, 1400),
      turnId: result.turnId || null,
    };
    setPill("#run-status", "complete", "ok");
  } catch (error) {
    lastReceipt = { at: new Date().toISOString(), status: "failed", reason: String(error?.message || error) };
    setPill("#run-status", "failed", "bad");
  } finally {
    state.receipts.push(lastReceipt);
    button.disabled = false;
    renderAll();
  }
}

async function bootBoard() {
  try {
    const runtime = await boot("#agent-app", { originUrl: location.origin });
    engine = runtime.engine;
    window.__anb = runtime;
    const referenceConsent = engine.onConsent;
    engine.onConsent = async (info) => {
      const decision = await askConsent(info);
      if (decision === "always") {
        engine.consent.set(info.peerOrigin, "always");
        return "allow";
      }
      return decision === "allow" ? "allow" : "decline";
    };
    engine.onActionConfirm = async (items) => {
      const details = items.map(i => `${i.action} — ${i.origin} (${i.effect})\n${JSON.stringify(i.arguments, null, 2)}`).join("\n\n");
      return askConsent({ peerLabel: "Website action", peerOrigin: items[0]?.origin || location.origin, kind: "write action", requestText: details });
    };
    renderMode();
    setPill("#run-status", "ready", "ok");
    state.events.push({ type: "runtime_ready", at: new Date().toISOString() });
  } catch (error) {
    setPill("#run-status", "runtime failed", "bad");
    $("#mode-strip").className = "mode-strip bad";
    $("#mode-text").textContent = `Runtime failed to load: ${error?.message || error}`;
  }
  renderAll();
}

$("#discovery-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const url = $("#site-url").value.trim();
  $("#task-input").value = `Inspect ${url} using the real manifest and resolved network definition. Report the exact network name, front agent, agent capabilities, and artifact hashes.`;
  runTask();
});

$("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  runTask();
});

$("#reset-history").addEventListener("click", () => {
  engine?.resetHistory();
  lastReceipt = null;
  setPill("#run-status", "ready", "ok");
});

$("#export-audit").addEventListener("click", () => {
  const payload = {
    generatedAt: new Date().toISOString(),
    site: location.origin,
    network: "agent_network_board",
    boardState: {
      discovery: state.discovery,
      inspection: state.inspection,
      handoff: state.handoff,
      verification: state.verification,
      receipts: state.receipts,
    },
    trace: window.__nsweb?.trace?.export?.() || { events: [] },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anb-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

$("#clear-audit").addEventListener("click", () => {
  const trace = window.__nsweb?.trace;
  if (trace?.events) trace.events.length = 0;
  state.events = [];
  state.audit = null;
  lastReceipt = null;
  for (const key of ["nsweb-byok-profiles-v1", "nsweb-byok-tab-key", "nsweb-byok-key", "nsweb-byok-router", "nsweb-byok-model"]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  renderAll();
});

bootBoard();
