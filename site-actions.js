// Site-owned capabilities for Agent Network Board.
// Every action is a real JavaScript function executed by the browser runtime.
// No action returns fabricated network data: fetches, hashes, and trace reads are real.

const encoder = new TextEncoder();

function getState() {
  if (!window.ANB_STATE) window.ANB_STATE = {
    discovery: null,
    inspection: null,
    handoff: null,
    verification: null,
    audit: null,
    events: [],
    receipts: [],
  };
  return window.ANB_STATE;
}

function publish(type, detail) {
  const state = getState();
  state.events.push({ type, at: new Date().toISOString(), ...detail });
  if (state.events.length > 300) state.events = state.events.slice(-300);
  try {
    window.dispatchEvent(new CustomEvent("anb:state", { detail: { type, ...detail } }));
  } catch { /* UI may not be mounted yet */ }
}

function siteBaseUrl() {
  const basePath = location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "");
  return `${location.origin}${basePath}`;
}

function extractUrl(request) {
  const text = String(request || "");
  const match = text.match(/https?:\/\/[^\s"'<>}\]]+/i);
  return match ? match[0].replace(/[.,;:]+$/, "") : "";
}

function deriveSiteBase(input) {
  const url = new URL(input);
  let pathname = url.pathname;
  if (/agent-manifest\.json$/i.test(pathname)) {
    pathname = pathname.slice(0, pathname.lastIndexOf("/") + 1);
  } else if (/\.network\.json$/i.test(pathname) || /\.hocon$/i.test(pathname)) {
    pathname = pathname.slice(0, pathname.lastIndexOf("/") + 1);
  } else if (!pathname.endsWith("/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length) parts.pop();
    pathname = "/" + parts.join("/") + (parts.length ? "/" : "");
  }
  const base = `${url.origin}${pathname === "/" ? "/" : pathname}`;
  const requested = (() => {
    try {
      const parsed = new URL(input);
      if (parsed.pathname.endsWith("/")) return "";
      if (/agent-manifest\.json$|\.network\.json$|\.hocon$/i.test(parsed.pathname)) return "";
      return parsed.pathname.split("/").filter(Boolean).pop() || "";
    } catch { return ""; }
  })();
  return { base: base.replace(/\/$/, ""), requested };
}

async function sha256(text) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return "sha256-" + [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function fetchArtifact(url) {
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "unknown";
  const isCrossOrigin = new URL(url).origin !== location.origin;
  return {
    url,
    status: response.status,
    ok: response.ok,
    contentType,
    bytes: encoder.encode(text).length,
    sha256: await sha256(text),
    text,
    durationMs: Math.round(performance.now() - started),
    cors: isCrossOrigin ? (response.ok ? "PASS" : "FAIL") : "SAME_ORIGIN",
  };
}

function safeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function brief(value, max = 900) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function redact(value) {
  let text = typeof value === "string" ? value : JSON.stringify(value);
  text = text.replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]");
  text = text.replace(/\bsk-[A-Za-z0-9_-]{8,}/g, "sk-[redacted]");
  text = text.replace(/(api[_-]?key|authorization|token)\s*[:=]\s*["']?[^\s,;"'}]+/gi, "$1=[redacted]");
  return text;
}

function actionResult(payload) {
  return JSON.stringify(payload, null, 2);
}

export function registerActions(actions) {
  actions.register({
    name: "discover_agent_site",
    description: "Fetch and hash a real published agent-manifest.json from a URL derived by the MVP network URL convention. Reports HTTP status, CORS reachability, SHA-256, network names, and front agents.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        request: { type: "string", title: "Site, manifest, or network URL", description: "The public URL to discover." },
      },
      required: ["request"],
    },
    effect: "read",
    availability: "local-only",
    async execute({ request }) {
      try {
        const input = extractUrl(request);
        if (!input) throw new Error("No http(s) URL found in the request.");
        const { base, requested } = deriveSiteBase(input);
        const manifestUrl = `${base}/agent-manifest.json`;
        const artifact = await fetchArtifact(manifestUrl);
        if (!artifact.ok) throw new Error(`manifest fetch ${artifact.status} for ${manifestUrl}`);
        let manifest;
        try { manifest = JSON.parse(artifact.text); }
        catch { throw new Error("Manifest is not valid JSON."); }
        const networks = Array.isArray(manifest.networks) ? manifest.networks : [];
        const summary = {
          status: "succeeded",
          input,
          siteBase: base,
          requestedNetwork: requested || null,
          manifestUrl,
          httpStatus: artifact.status,
          contentType: artifact.contentType,
          sha256: artifact.sha256,
          bytes: artifact.bytes,
          durationMs: artifact.durationMs,
          cors: artifact.cors,
          networkCount: networks.length,
          networks: networks.map(n => ({
            name: n.name || null,
            front_man: n.front_man || null,
            hocon: n.hocon || null,
            description: (n.description || "").slice(0, 240),
          })),
          peerPolicy: safeObject(manifest.peer_policy),
          llmRouterFields: Object.keys(safeObject(manifest.llm_router)),
          raw: artifact.text,
        };
        const state = getState();
        state.discovery = summary;
        publish("discovery", summary);
        return actionResult({ ...summary, raw: brief(artifact.text, 1200) });
      } catch (error) {
        const summary = { status: "failed", reason: String(error?.message || error), input: extractUrl(request) };
        getState().discovery = summary;
        publish("discovery", summary);
        return actionResult(summary);
      }
    },
  });

  actions.register({
    name: "inspect_network",
    description: "Resolve one exact named network from a published manifest, fetch its data-only definition, and verify front agent, schemas, declared tools, and absence of local includes or environment substitutions.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        request: { type: "string", title: "Network URL and question", description: "A network URL, manifest URL, or site URL; the exact last-path network name is preferred." },
      },
      required: ["request"],
    },
    effect: "read",
    availability: "local-only",
    async execute({ request }) {
      try {
        const input = extractUrl(request) || getState().discovery?.siteBase || `${siteBaseUrl()}/`;
        const { base, requested } = deriveSiteBase(input);
        const manifestArtifact = await fetchArtifact(`${base}/agent-manifest.json`);
        if (!manifestArtifact.ok) throw new Error(`manifest fetch ${manifestArtifact.status}`);
        const manifest = JSON.parse(manifestArtifact.text);
        const networks = Array.isArray(manifest.networks) ? manifest.networks : [];
        const byName = requested && networks.find(n => n.name === requested);
        if (requested && !byName) throw new Error(`No network named '${requested}' is published at ${base}; refusing to select another network.`);
        const entry = byName || (networks.length === 1 ? networks[0] : null);
        if (!entry) throw new Error("The manifest does not publish exactly one selectable network.");
        if (!entry.hocon || !entry.front_man) throw new Error("Manifest entry is missing hocon or front_man.");
        const networkUrl = new URL(entry.hocon, `${base}/`).href;
        const networkArtifact = await fetchArtifact(networkUrl);
        if (!networkArtifact.ok) throw new Error(`network fetch ${networkArtifact.status} for ${networkUrl}`);
        let network;
        try { network = JSON.parse(networkArtifact.text); }
        catch { throw new Error("Published network definition is not valid JSON."); }
        const agents = Array.isArray(network.tools) ? network.tools : [];
        const names = agents.map(a => a.name);
        const frontFound = names.includes(entry.front_man);
        const duplicateNames = names.filter((n, i) => names.indexOf(n) !== i);
        const invalidSchemas = agents.filter(a => {
          const fn = safeObject(a.function);
          const params = safeObject(fn.parameters);
          return !fn.description || params.type !== "object" || !safeObject(params.properties);
        }).map(a => a.name);
        const unresolved = [];
        for (const agent of agents) {
          for (const ref of agent.tools || []) {
            const value = typeof ref === "string" ? ref : ref?.url || "";
            if (!value) continue;
            const isExternal = /^https?:\/\//i.test(value) || /^[A-Za-z][A-Za-z0-9_-]*$/.test(value) && !names.includes(value);
            if (isExternal && !names.includes(value) && !/^https?:\/\//i.test(value)) unresolved.push(`${agent.name}->${value}`);
          }
        }
        const forbiddenTokens = ["${", "include \"", "include \"'", "ENV[", "os.environ", "$HOME", "publisher-only"];
        const forbiddenFound = forbiddenTokens.filter(token => networkArtifact.text.includes(token));
        const result = {
          status: "succeeded",
          input,
          siteBase: base,
          networkName: entry.name,
          frontMan: entry.front_man,
          frontManFound: frontFound,
          manifestUrl: `${base}/agent-manifest.json`,
          networkUrl,
          manifestSha256: manifestArtifact.sha256,
          networkSha256: networkArtifact.sha256,
          contentType: networkArtifact.contentType,
          cors: networkArtifact.cors === "SAME_ORIGIN" ? "SAME_ORIGIN" : networkArtifact.cors,
          agentCount: agents.length,
          agents: agents.map(a => ({
            name: a.name || null,
            description: (safeObject(a.function).description || "").slice(0, 200),
            tools: (a.tools || []).map(t => typeof t === "string" ? t : t?.url || JSON.stringify(t)),
            inputProperties: Object.keys(safeObject(safeObject(a.function).parameters).properties || {}),
            xAnmActions: a.x_anb_actions || [],
          })),
          duplicateNames,
          invalidSchemas,
          unresolved,
          forbiddenTokensFound: forbiddenFound,
          networkRaw: networkArtifact.text,
        };
        getState().inspection = result;
        publish("inspection", result);
        return actionResult({ ...result, networkRaw: brief(networkArtifact.text, 1200) });
      } catch (error) {
        const summary = { status: "failed", reason: String(error?.message || error), input: extractUrl(request) };
        getState().inspection = summary;
        publish("inspection", summary);
        return actionResult(summary);
      }
    },
  });

  actions.register({
    name: "verify_local_artifact",
    description: "Hash this site's currently published manifest, network definition, and links map, and check that the manifest's front agent exists in the network.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        request: { type: "string", title: "Verification request", description: "Any text; the action always verifies this site's own public artifacts." },
      },
      required: ["request"],
    },
    effect: "read",
    availability: "local-only",
    async execute() {
      try {
        const base = siteBaseUrl();
        const files = {};
        for (const path of ["agent-manifest.json", "agent_network_board.network.json", "links.json"]) {
          const artifact = await fetchArtifact(`${base}/${path}`);
          files[path] = { status: artifact.status, sha256: artifact.sha256, contentType: artifact.contentType };
        }
        const manifest = JSON.parse((await fetchArtifact(`${base}/agent-manifest.json`)).text);
        const network = JSON.parse((await fetchArtifact(`${base}/agent_network_board.network.json`)).text);
        const entry = manifest.networks?.[0] || {};
        const frontFound = (network.tools || []).some(a => a.name === entry.front_man);
        const result = {
          status: "succeeded",
          siteBase: base,
          files,
          exactNetworkName: entry.name === "agent_network_board" ? "PASS" : "FAIL",
          frontMan: entry.front_man || null,
          frontManFound: frontFound ? "PASS" : "FAIL",
          dataOnly: "${" in JSON.stringify(network) || /include\s+"/.test(JSON.stringify(network)) ? "FAIL" : "PASS",
          keyFieldsInPublicFiles: /api[_-]?key|authorization|bearer\s+[A-Za-z0-9]/i.test(JSON.stringify({ manifest, network })) ? "FAIL" : "PASS",
        };
        getState().verification = result;
        publish("verification", result);
        return actionResult(result);
      } catch (error) {
        const result = { status: "failed", reason: String(error?.message || error) };
        getState().verification = result;
        publish("verification", result);
        return actionResult(result);
      }
    },
  });

  actions.register({
    name: "prepare_handoff",
    description: "Write a real, reviewable handoff proposal to the board UI containing destination origin, exact network name, task, router policy, and private-context policy. The proposal is not executed by this action.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        request: { type: "string", title: "Handoff request", description: "The peer URL and the task to delegate." },
      },
      required: ["request"],
    },
    effect: "read",
    availability: "local-only",
    async execute({ request }) {
      const input = extractUrl(request);
      let base = "";
      let networkName = "";
      if (input) {
        try { ({ base } = deriveSiteBase(input)); networkName = new URL(input).pathname.split("/").filter(Boolean).pop() || ""; }
        catch { /* reported below */ }
      }
      const task = String(request || "").replace(input, "").trim() || "Inspect the peer and report its declared capabilities.";
      const card = {
        status: input && base ? "proposed" : "failed",
        reason: input && base ? null : "No valid http(s) peer URL found.",
        destinationOrigin: base ? new URL(base).origin : null,
        siteBase: base || null,
        networkName,
        task,
        routerPolicy: "inherits caller's active router; visitor key is never sent to the peer",
        privateContext: "deny-all; no sly_data fields forwarded",
        consent: "pending visitor approval",
        createdAt: new Date().toISOString(),
      };
      getState().handoff = card;
      publish("handoff", card);
      return actionResult(card);
    },
  });

  actions.register({
    name: "get_board_state",
    description: "Read the live board's actual discovery, inspection, handoff, and run counters so answers match what the page really shows.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        request: { type: "string", title: "State request", description: "Any text." },
      },
      required: ["request"],
    },
    effect: "read",
    availability: "local-only",
    async execute() {
      const state = getState();
      return actionResult({
        status: "succeeded",
        discoveredNetworks: state.discovery?.networks?.map(n => n.name) || [],
        inspectedNetwork: state.inspection?.networkName || null,
        handoffStatus: state.handoff?.status || "none",
        traceEvents: state.events.length,
        receipts: state.receipts.length,
      });
    },
  });

  actions.register({
    name: "get_audit_view",
    description: "Return a redacted view of real runtime trace events and site-action receipts. Secrets, prompts containing keys, and private context are omitted.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        request: { type: "string", title: "Audit request", description: "Any text; the full allowed event view is returned." },
      },
      required: ["request"],
    },
    effect: "read",
    availability: "local-only",
    async execute() {
      const state = getState();
      const raw = window.__nsweb?.trace?.export?.()?.events || [];
      const allowed = [
        "seq", "phase", "kind", "origin", "peerOrigin", "peerLabel", "network", "tool", "toolKind",
        "agent", "status", "error", "durationMs", "model", "mock", "verifiedReal", "routeKind",
        "decision", "contentChars", "toolCalls", "finishReason", "resultPreview", "requestText",
        "fetchedUrls", "action", "effect", "remoteCalls", "reason", "callId",
      ];
      const events = raw.slice(-120).map(event => {
        const out = {};
        for (const key of allowed) if (event[key] !== undefined) out[key] = redact(event[key]);
        return out;
      });
      const origins = [...new Set(events.flatMap(e => {
        const values = [e.origin, e.peerOrigin, ...(Array.isArray(e.fetchedUrls) ? e.fetchedUrls : [])];
        return values.map(v => { try { return new URL(v).origin; } catch { return null; } }).filter(Boolean);
      }))];
      const consent = events.filter(e => e.kind === "consent" || e.decision)
        .concat((state.events || []).filter(e => e.type === "consent").map(e => ({ peerOrigin: e.peerOrigin, decision: e.decision, kind: "board-consent" })));
      const keyLeakSignals = events.filter(e => /sk-|bearer|api[_-]?key/i.test(redact(e)) && !/\[redacted\]|not shown/i.test(redact(e)));
      const result = {
        status: "succeeded",
        eventCount: raw.length,
        returnedEvents: events.length,
        contactedOrigins: origins,
        consentEvents: consent.map(e => ({ peerOrigin: e.peerOrigin || null, decision: e.decision || null, kind: e.kind })),
        keyLeakSignals: keyLeakSignals.length,
        receipts: state.receipts.slice(-30),
        events,
      };
      state.audit = result;
      publish("audit", result);
      return actionResult(result);
    },
  });
}
