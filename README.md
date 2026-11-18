# Agent Network Board

A verifiable control room for the Open Agentic Web. It discovers real published agent networks, displays their declared capabilities, routes work through browser-executed agents, and audits every cross-origin contact with evidence instead of reputation scores.

- Live site: <https://roshameow.github.io/agent-network-board/>
- Independent peer network URL: <https://roshameow.github.io./agent-network-board-peer/receipt_notary>
- Peer site: <https://roshameow.github.io./agent-network-board-peer/>
- Spec: [MVP Profile 0.2](https://github.com/cognizant-ai-labs/agentic-web/blob/fd872b9221aeb8ff762b75a5badbf84b23c133cc/docs/worldwide_agentic_web_mvp_spec.md)

> The trailing dot in the peer URL is intentional. `roshameow.github.io.` and `roshameow.github.io` are distinct browser origins, so CORS, consent, and router isolation are exercised across a real security boundary while both sites remain on the same free HTTPS host.

## What it does

1. **Discovery** — fetches a published `agent-manifest.json` from a URL derived by the MVP convention, records HTTP status, content type, byte count, SHA-256, and CORS reachability.
2. **Network board** — resolves the exact named network from `hocon`, then renders its real agents, input schemas, declared tools, and peer links.
3. **Task handoff** — a browser runtime runs the published front agent and its internal specialists. Cross-origin peer contact is blocked until the visitor approves a card naming the origin, purpose, and request.
4. **Trust and audit** — emits PASS / FAIL / UNKNOWN evidence from actual artifacts and runtime trace events. There is no invented reputation score. The audit JSON can be exported.

The default router is an explicitly labelled deterministic inference adapter running in the browser. It makes real tool calls against real site actions and peer networks, but it is not a large language model. Adding an OpenAI-compatible BYOK profile in the runtime settings switches the same graph to a real LLM; the key stays in the caller's browser and is never sent to a peer site.

## Public artifacts

| File | Purpose |
| --- | --- |
| [`agent-manifest.json`](./agent-manifest.json) | Network index, router metadata, peer policy, action module |
| [`agent_network_board.network.json`](./agent_network_board.network.json) | Resolved, data-only four-agent network |
| [`links.json`](./links.json) | Symbolic peer link binding to the independent peer network |
| [`site-actions.js`](./site-actions.js) | Real browser-implemented read capabilities |
| [`site.js`](./site.js) | Board UI, consent card, audit export |
| `vendor/nsdeploy/runtime/` | Apache-2.0 browser runtime from the official nsDeploy reference implementation, with a documented extension that exposes read-only site actions as callable tools |

The peer repository publishes the same artifact pattern for `receipt_notary`.

## Architecture

```text
Visitor → index.html / site.js
        → vendor/nsdeploy/runtime (browser-only)
        → agent_network_board.network.json
        → site-actions.js (discovery, inspection, handoff card, audit)
        → consent gate → peer manifest + network from roshameow.github.io.
```

Agents in the local network:

- `board_front` — routes a task, aggregates child results, enforces deny-by-default private context.
- `capability_scout` — fetches and hashes real public artifacts.
- `handoff_planner` — writes a reviewable handoff proposal with exact origin and policy.
- `evidence_auditor` — reads a redacted view of real runtime trace events.

The peer network has `receipt_notary` and `digest_checker`. Its own read action checks SHA-256 digest syntax when the peer site is opened directly; cross-origin composition uses only the declarative peer graph, as required by the MVP boundary.

## Run locally

```sh
node tools/serve-local.mjs . 8091        # caller site
node tools/serve-local.mjs peer 8092     # peer site, separate origin
```

Open <http://127.0.0.1:8091/>. For the local peer demo, set `links.json` to `http://127.0.0.1:8092/receipt_notary` temporarily; the committed file uses the production URL.

Validate static artifacts with:

```sh
node --test tests/*.test.mjs
```

## Conformance notes

See [`docs/CONFORMANCE.md`](./docs/CONFORMANCE.md) for the seven MVP interoperability checks, evidence locations, and explicit limitations.

## Privacy and security

- No API key, token, private context, or analytics script is included.
- BYOK profiles stay in origin-scoped browser storage; the settings panel and “Clear local audit” button delete them.
- Peer networks inherit the caller's router. Peer manifests cannot replace it.
- `sly_data` is denied by default in every network. A sentinel in the caller's private context is used to prove it is not forwarded.
- Third-party contact requires an interactive consent decision; declining stops the fetch and is recorded in the trace.
- Public artifacts are static JSON with CORS. No server-side agent runtime is used.

## Provenance

The browser runtime is copied from [cognizant-ai-lab/nsdeploy](https://github.com/cognizant-ai-lab/nsdeploy) (Apache-2.0). The local fork changes `runner.js` so registered `read` site actions are also exposed as function tools, allowing both the deterministic adapter and real LLM routers to call grounded capabilities. All project-specific agents, artifacts, UI, actions, and peer network are new work for this challenge. See [`NOTICE.md`](./NOTICE.md).

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
