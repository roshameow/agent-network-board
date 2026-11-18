# Open Agentic Web Challenge — Technical Spec Notes

Research snapshot: **2026-11-18 16:55 CST**. Read-only research; no platform state changed and no money spent.

## 0. Authority and sources

| Authority | Exact revision | Use |
| --- | --- | --- |
| Normative technical spec: [Minimum Viable Specification for a Worldwide Agentic Web, MVP Profile 0.2, 6 Nov 2026](https://github.com/cognizant-ai-labs/agentic-web/blob/fd872b9221aeb8ff762b75a5badbf84b23c133cc/docs/worldwide_agentic_web_mvp_spec.md) | **`fd872b9221aeb8ff762b75a5badbf84b23c133cc`** | Requirements below. Section numbers refer to this commit. |
| Current official [cognizant-ai-labs/agentic-web](https://github.com/cognizant-ai-labs/agentic-web) | HEAD **`a39df2b7376ccf4a0dbe1c7dc411d04189838979`** (2026-11-17T22:18:08-08:00) | Current README, examples, templates, and reference runtime conventions. |

Current examples clarify one viable implementation but do **not** override the pinned spec. The official repo README still says the site is actively evolving and its Testing section is `TODO`.

Representative official files fetched at HEAD `a39df2b…`:

- [pizza `agent-manifest.json`](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/examples/pizza_restaurant_agentified/agent-manifest.json)
- [pizza `.network.json`](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/examples/pizza_restaurant_agentified/pizza_restaurant_website_assistant.network.json)
- [pizza site actions](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/examples/pizza_restaurant_agentified/restaurant-actions.js)
- [harbor-tours manifest with a peer](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/examples/harbor_tours_agentified/agent-manifest.json)
- [harbor-tours network with a peer URL in `tools`](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/examples/harbor_tours_agentified/marrow_point_harbor_tours.network.json)
- [harbor-tours `links.json`](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/examples/harbor_tours_agentified/links.json)
- [manifest template](https://github.com/cognizant-ai-labs/agentic-web/blob/a39df2b7376ccf4a0dbe1c7dc411d04189838979/skills/agentify-website/templates/agent-manifest.json)

Canonical data model reference linked by the spec: [Neuro SAN agent HOCON reference](https://github.com/cognizant-ai-lab/neuro-san/blob/7965afb19371e891fc50c7957c6d1f540eb54539/docs/agent_hocon_reference.md) (snapshot commit `7965afb19371e891fc50c7957c6d1f540eb54539`).

## 1. Mandatory public artifacts

Spec §3.3 requires:

| Artifact | Required semantics |
| --- | --- |
| `agent-manifest.json` | Public GET from the derived site base; CORS enabled for cross-origin callers. One or more networks with `name`, `front_man`, `hocon`; top-site LLM router metadata; peer policy. |
| Network definition | Resolved, data-only Neuro SAN artifact serialized as JSON for browser loading; location declared by `hocon`; public GET; CORS if cross-origin. |
| `links.json` | Publisher-owned default bindings from symbolic external-network references to concrete peer URLs; public GET. Browser-local user overrides are stored separately by the caller origin. |
| Coded-tool bundle | Optional. If used: self-contained JS module, optional SRI digest in the manifest; public GET; isolated Web Worker with CSP/capability restrictions. |

`*.network.json` is only a reference convention. The manifest's `hocon` is authoritative. Optional discovery files under `.well-known/nsdeploy/` and an optional A2A Agent Card are **not** execution paths; the nsDeploy loader does not consume an Agent Card (§3.3).

### 1.1 Manifest — exact field names

Required by spec: `networks`, `networks[].name`, `front_man`, `hocon`, top-site router metadata, peer policy. The current official examples use these exact names:

```json
{
  "brand": "Marrow Point Harbor Tours Assistant",
  "networks": [
    {
      "name": "marrow_point_harbor_tours",
      "front_man": "harbor_tours_assistant",
      "hocon": "./marrow_point_harbor_tours.network.json",
      "description": "Ask about our boat trips and sea wall walk.",
      "tags": ["agentified-website"],
      "sample_queries": ["Which trips welcome dogs?"]
    }
  ],
  "llm_router": {
    "base_url": "https://api.otari.ai/api/v1",
    "mock": false,
    "byok_router": "https://api.otari.ai/api/v1"
  },
  "allowed_peers": ["https://peer.example"],
  "peer_policy": {
    "mode": "closed",
    "deny_origins": [],
    "note": "Calls only allowed_peers after the visitor agrees."
  }
}
```

Additional fields present in current official examples/templates: `agent_mcp` (`protocol`, `network`, `front_man`, `available`, `reason`), `theme.primary`, `linking` (`protocol`, `exports[]` with `network`/`front_man`/`aliases`/`url`, `imports`, `link_updates.mode`), `deployment` (`mode`, `self_contained_runtime`, `browser_mock`, `direct_byok`, `direct_mcp_requires_cors`, `public_mcp_facade`), and `actions`. The current official README says that unless `peer_policy.mode` is `"open"`, the runtime refuses every origin not listed in `allowed_peers`; the examples use `"closed"`.

Optional coded-tool declaration in the reference runtime: `coded_tools.bundle` and `coded_tools.integrity` (SRI, e.g. `sha384-…`).

Site-action registration in the current official runtime (registration fields are exact; effect values shown are from the official example):

```js
actions.register({
  name: "checkout_demo_order",
  description: "Place a simulated order for the reviewed cart.",
  effect: "irreversible",            // "read" | "write" | "irreversible"
  inputSchema: { type: "object", properties: { /* JSON Schema */ }, required: [...] },
  execute: async (args) => { /* site-owned handler */ }
});
```

The manifest exposes these through `actions.version`, `actions.module`, optional `actions.bridge`, and `actions.agentTools[]`.

### 1.2 Network definition — exact field names

Spec §2.1–2.2 requires a resolved graph. Current official shape:

```json
{
  "metadata": {
    "description": "Help customers with the Little Oven Pizza menu."
  },
  "llm_config": { "model_name": "alibaba/qwen3.8-flash" },
  "max_steps": 12,
  "tools": [
    {
      "name": "front_desk_coordinator",
      "function": {
        "description": "Answer menu questions by consulting the menu specialist.",
        "parameters": {
          "type": "object",
          "properties": { "inquiry": { "type": "string" } },
          "required": ["inquiry"]
        }
      },
      "instructions": "Delegate menu questions to menu_specialist. Never invent prices.",
      "tools": ["menu_specialist"]
    },
    {
      "name": "lodging",
      "function": { "description": "Answers lodging questions" },
      "instructions": "Use only grounded lodging information.",
      "tools": [
        { "url": "https://tools.example/mcp", "tools": ["search"] },
        "https://peer.example/agents/transit"
      ]
    }
  ]
}
```

Rules:

- `tools` is the top-level agent list. Every agent needs a unique `name`, `function.description`, `instructions` when it uses an LLM, and a `tools` list. An empty `tools: []` explicitly declares no downstream references (§2.1; current README).
- `function.parameters` is JSON Schema for inputs. A front agent intended for external calls should declare at least one parameter, e.g. required `inquiry`; otherwise callers cannot pass a request except through a synthesized default (Neuro SAN reference). Structured outputs SHOULD declare schemas (§2.1); the pinned spec does not name a universal output-schema field.
- Agent `tools` entries may be local agent names, exact peer-network URLs, or MCP descriptors `{ "url": …, "tools": […] }`; the descriptor may restrict exposed tool names (§2.2).
- Model names/generation settings are **hints**; the caller's active router/model policy wins for peer networks (§2.1).
- Published instructions and schemas are public and must not be treated as confidential. No local includes, environment substitutions, publisher-only paths, or executable code in the minimum data profile (§2.2).
- Current official examples also use `commondefs.replacement_strings`, `link_labels`, `link_slots`, `cruse.version`, `max_execution_seconds`, `aaosa_call`, `aaosa_command`, `aaosa_instructions`, and `instructions_prefix`; these are implementation extras, not the pinned minimum.

### 1.3 `links.json` — exact shape and semantics

Spec §3.3 example, verbatim shape:

```json
{
  "version": 1,
  "networks": {
    "local_services": {
      "transit": "https://peer.example/agents/transit"
    }
  }
}
```

- Outer `networks` key = **local network name**; inner keys = symbolic peer references; values = concrete peer-network URLs.
- The publisher owns this file. Browser-local bindings for unresolved references are caller-owned and must not rewrite the published file; a static deployment does not mutate it (§3.3).
- Current official examples publish an empty map, e.g. `{"version":1,"networks":{"marrow_point_harbor_tours":{}}}`, because they put direct peer URLs in the front agent's `tools` and human labels in top-level network `link_labels` keyed by the exact URL. Direct URLs and symbolic link slots are alternative reference styles; the pinned spec still lists `links.json` as a minimum public artifact.
- In the official reference runtime, `link_slots` keys mark symbolic references; `links.json` values (or caller-local overrides) resolve them. Unresolved slots trigger a caller-side binding prompt before use.

## 2. URL conventions and peer loading

The peer protocol is §3.2:

| Component | Rule / example |
| --- | --- |
| Peer-network URL | `https://peer.example/agents/transit`; **final path component is the exact published network name** `transit`. |
| Derived site base | Preceding path: `https://peer.example/agents`. |
| Manifest | `<site-base>/agent-manifest.json` → `https://peer.example/agents/agent-manifest.json`. |
| Exact-name lookup | Find `manifest.networks[]` entry whose `name === "transit"`. No exact match ⇒ fail; never fall back to another network or `networks[0]`. |
| Definition | Resolve `entry.hocon` against the site base if relative, or use an absolute `http(s)` URL; fetch and validate before execution. Redirects follow normal browser fetch, but CORS is still enforced and the final URL need not remain on the manifest origin. |
| Link map | `<site-base>/links.json`. |
| Named/same-site links | MAY use the same URL convention. |
| Scheme | HTTPS required in production; loopback HTTP allowed only for local development. |

GitHub Pages project-site example: if the network URL is `https://USER.github.io/REPO/agents/board`, the base is `https://USER.github.io/REPO/agents`; the public files are under that base, not necessarily the domain root.

Origin = scheme + host + port. `https://USER.github.io/a` and `https://USER.github.io/b` are the **same origin**; they cannot demonstrate a second-origin peer. Use another `github.io` hostname, custom domains, or another CORS-enabled static host.

## 3. CORS and HTTPS

- Production deployments **MUST** use HTTPS; loopback HTTP is acceptable for local development (§3.3).
- When a browser retrieves a public agent artifact from another origin, the publishing origin **MUST** permit that retrieval through standard browser CORS (§3.3, §3.4). For uncredentialed public GETs, `Access-Control-Allow-Origin: *` or the caller origin is sufficient.
- Public artifact requests **MUST NOT** include the caller's private credentials (§3.4).
- Direct browser access to a cross-origin MCP server requires that server or an authorized proxy to allow the required origins, methods, and headers (§3.4).
- Only public artifacts need cross-origin access. Action modules, authentication endpoints, and business operations remain on their owning origin with normal browser security; cross-site action transport is outside the MVP (§3.3–3.4).
- Never bypass browser controls with a proxy that hides a non-CORS peer; fail closed and report the capability unavailable (§2.1).

Verify deployed GitHub Pages files from a different origin rather than assuming headers:

```sh
curl -sSI -H 'Origin: https://caller.example' \
  https://USER.github.io/REPO/agent-manifest.json | grep -i '^access-control-allow-origin'
```

Repeat for the network JSON and `links.json`. GitHub's REST-API CORS documentation does **not** prove that a Pages deployment sends the header. GitHub docs do state that all Pages sites support HTTPS/HTTPS enforcement and that `github.io` sites created after 2016-06-15 are HTTPS by default ([Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)).

## 4. Browser runtime requirements (§3.1, §3.2, §5)

A conforming runtime:

- Runs the published graph in JavaScript from a normal web page; tab-scoped lifetime (no scheduled/durable background tasks in the MVP).
- Parses and validates before any model call: reject malformed networks, duplicate or missing agent references, invalid front agent, and unsupported executable definitions.
- Supports streaming, tool calls, agent-to-agent delegation, error propagation, and bounded chat history.
- Supports MCP as the baseline grounded-capability interface; asks approval before discovering or calling a third-party MCP service.
- Supports same-site registered actions described by name, purpose, JSON Schema, effect, and handler; validates arguments and shows destination plus arguments before writes/irreversible operations.
- Distinguishes an HTTP/tool response from a verified business outcome. Timeout/disconnect after a write begins ⇒ **unknown outcome**; the browser runtime must not independently retry an unknown write. Service-internal retries under its own idempotency policy are allowed.
- Enforces finite limits on composition depth, agent invocations, remote calls, concurrency, and elapsed time. Cycles may be stopped, but repeated invocation of one agent is not by itself a cycle.
- Treats peer instructions as untrusted model input; schema validation/sandboxing is not trust.
- If coded tools are supported: never execute undeclared peer code; run only in an isolated Web Worker with runtime-enforced CSP and capability restrictions; verify a supplied SRI digest and reject on mismatch.
- Exposes selected router, contacted origins, agent/tool calls, consent decisions, errors, and action receipts without exposing secrets (SHOULD).
- Fails closed on unsafe validation/resolution/authorization or limit breaches; reports the failure to the invoking network and never claims success.

## 5. Pluggable inference, BYOK, and `sly_data`

### Inference / BYOK (§4)

- Default inference is optional: a site may publish a default router/model it funds or authenticates.
- BYOK is optional unless needed as the only inference path. When offered, the user must be able to select/enter the permitted router base URL, model, and credential.
- The key stays in the caller's browser and is attached **only** to model requests sent to the selected router. It MUST NOT appear in URLs, `agent-manifest.json`, network JSON/spec, prompts, action arguments, traces, analytics, or peer-site requests.
- A loaded peer inherits the caller's active router, model policy, and limits. Peer manifest router metadata is informational and MUST NOT override the caller or receive the key.
- Static BYOK may call a runtime-supported (e.g. OpenAI-compatible) router directly when that router permits browser CORS. Missing required key ⇒ stop with a clear setup error.
- Optional same-origin caller BYOK proxy: forwards the visitor's authorization header when direct CORS is unavailable; must not substitute a publisher key; peers are never contacted for inference.
- Reference runtime stores BYOK profiles in origin-scoped `localStorage` (loopback-only cookie mirror is optional); the user must be able to delete profiles. Minimize third-party scripts and use a restrictive CSP.

### Private context / `sly_data` (§1.2, §2.1, §3.2, §5)

- `sly_data` is structured data carried outside chat text; it may contain credentials/session/sensitive values.
- Cross-network forwarding is **deny-by-default**. Only explicitly named fields may pass under an applicable allow rule; bind permissions to a specific destination **network identity**, not merely the whole site origin.
- Delegated request text is ordinary input, not filtered as `sly_data`.
- Peer answers must not return private context through the normal tool-result path except fields explicitly allowed by the caller.
- MCP authentication/OAuth credentials are separate from the LLM key and are not transferred automatically.
- Exact allow fields in the canonical Neuro SAN model / official runtime: `allow.to_downstream.sly_data`, `allow.from_downstream.sly_data`, `allow.to_upstream.sly_data`, and `allow.to_tracing.sly_data`. Values may be lists of key names or boolean/key-translation maps; `to_downstream` controls external-agent egress. Traces should keep only key names, never values.

## 6. Consent and user-owned writes

- An interactive runtime MUST provide consent for contacts with third-party origins. By default it MUST identify the external origin and purpose and obtain approval **before each contact**; any relaxation must be an explicit user choice (§3.2).
- Consent precedes third-party manifest fetches, MCP discovery, and MCP calls. A remembered approval is scoped to the destination origin for the current session. Every additional peer/MCP hop repeats origin-policy and consent checks (§5).
- A redirect to another origin is a new destination and must be re-evaluated under the same consent policy (§5).
- Consent records a user decision; it is not evidence that peer instructions or model-generated descriptions are safe (§5).
- For local site actions, the runtime—not the model—owns confirmation. Show destination and arguments before a write or irreversible operation; bind the executed action, origin, arguments, request identifier, and receipt to the reviewed proposal (§3.1, §5).
- Declines and unknown write outcomes must be visibly reported; do not silently retry or claim success.

## 7. The seven MVP interoperability checks (§6, verbatim intent)

1. Publish a two-agent HOCON network and a manifest from an ordinary HTTPS web host.
2. Load and run it in a browser with the site's published default router and model; **if BYOK is offered**, also demonstrate the user-selected path.
3. Call an internal agent and at least one grounded capability through MCP or a registered local site action.
4. After user approval, load an exact named network from a second origin and run it locally in the caller's browser.
5. With a user key active, show that the second site never receives it and cannot change the caller's router.
6. Show that private context is absent at the peer unless a named field is explicitly allowed.
7. Stop an invalid network, a composition cycle, an over-budget request, and a denied origin with visible errors.

## 8. Static GitHub Pages compliance checklist

- [ ] Pin `fd872b9221aeb8ff762b75a5badbf84b23c133cc` and current repo HEAD `a39df2b…` in project docs; recheck before submission.
- [ ] Publish all public files under one explicit site base: `agent-manifest.json`, resolved `<network>.network.json`, `links.json`, `index.html`, and JS runtime. If using GitHub Pages project paths, include the `/REPO/` prefix in every manifest URL and peer URL.
- [ ] Generate the network JSON at build time from HOCON; commit the fully resolved data. Verify no unresolved includes, env substitutions, local paths, secrets, or executable code.
- [ ] Validate exact fields: `networks[].name`, `front_man`, `hocon`; `metadata.description`; unique `tools[].name`; `function.description`; `function.parameters`; `instructions`; every `tools` reference resolvable; at least two agents.
- [ ] Enforce HTTPS in Pages settings; use HTTPS URLs everywhere; loopback HTTP only while developing.
- [ ] From an external origin, confirm HTTP 200 plus CORS on manifest, network JSON, and `links.json`. Do not add private credentials to these fetches.
- [ ] Run the network entirely in browser JS. Keep all actions and state on the same origin unless using an explicitly supported peer/bridge; no server-side agent runtime is required.
- [ ] Register at least one grounded local site action with `name`, `description`, `inputSchema`, `effect`, and `execute`; list it in `actions.agentTools` and load it from `actions.module`.
- [ ] For every `write`/`irreversible` action, show the origin, arguments, and reviewed proposal before execution; bind request id and receipt; report unknown outcomes honestly.
- [ ] Configure BYOK settings UI with router base URL, model, and key. Choose a router that allows browser CORS from the Pages origin. Never commit a key or put it in URLs, manifest, network, prompts, traces, analytics, action args, or peer requests. Provide “delete profile”. Skip paid/default inference and Otari signup/credits for this work.
- [ ] Keep `sly_data` empty across peers by default; if any field must cross, name it explicitly in the destination-scoped `allow` rule and prove absence in the peer request/trace.
- [ ] Publish a second agent network on a genuinely different origin. Put its exact URL in the caller's `tools`, its origin (with port) in `allowed_peers`, keep `peer_policy.mode: "closed"`, and add a `link_labels` entry (or a `links.json` symbolic binding) if using that style.
- [ ] Verify consent appears before any third-party fetch; decline sends nothing; allow sends only the reviewed request. Check every extra hop.
- [ ] Prove exact-name matching by requesting a wrong network name and showing a visible failure, not fallback.
- [ ] Demonstrate all four failure cases: invalid network, composition cycle, over-budget request, denied origin. Include a CORS failure as a distinct observed case if applicable.
- [ ] Record browser evidence (Network panel/DevTools, runtime trace, screenshots) for the seven interoperability checks; unknown remains unknown, never “pass”.
- [ ] Do not rely on same-origin `github.io` project subpaths for the peer demo, and do not assume GitHub REST API CORS rules apply to Pages content.
