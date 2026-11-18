# MVP Profile 0.2 conformance record

Specification pinned to commit `fd872b9221aeb8ff762b75a5badbf84b23c133cc` (MVP Profile 0.2, 6 November 2026). Record updated 2026-11-18.

## Artifacts

| Check | Evidence |
| --- | --- |
| Two or more agents, unique names, descriptions, instructions, JSON Schema inputs | `agent_network_board.network.json` and `peer/receipt_notary.network.json`; validated by `tests/artifacts.test.mjs` |
| Manifest with exact `name`, `front_man`, `hocon` | `agent-manifest.json`, `peer/agent-manifest.json` |
| Resolved data-only network | Network JSON contains no `include`, `${...}`, environment substitution, publisher-only path, or executable code |
| `links.json` | Maps `receipt_notary_peer` to the exact peer network URL |
| HTTPS + CORS | GitHub Pages serves both repositories over HTTPS with `Access-Control-Allow-Origin: *` on public JSON files; verify with curl using an `Origin` header before submission |
| Browser runtime | `vendor/nsdeploy/runtime/` runs entirely in the page; no server-side agent runtime |

## Seven interoperability checks

1. **Publish a two-agent network and manifest from HTTPS** — main network has four agents; peer network has two. Both repositories are published with GitHub Pages.
2. **Load and run with published default router; BYOK also offered** — manifest publishes `browser://mock`, an explicitly labelled deterministic inference adapter. The runtime settings panel accepts an OpenAI-compatible router, model, and key. The same graph and tools run in both paths. A real-LLM BYOK run is required for the final video when a visitor key is available; otherwise the keyless path is the demonstrated default.
3. **Internal agent plus grounded capability** — the front agent delegates to `capability_scout`, `handoff_planner`, and `evidence_auditor`; these call registered read site actions (`discover_agent_site`, `inspect_network`, `verify_local_artifact`, `prepare_handoff`, `get_audit_view`). The runtime fork is marked in `NOTICE.md`.
4. **Second origin after approval** — `receipt_notary` is hosted on `roshameow.github.io.`, a distinct browser origin from `roshameow.github.io`. The caller's manifest policy is open, but the runtime still shows the consent card before fetching the peer manifest. The peer network is compiled and executed in the caller's browser.
5. **Key isolation and router inheritance** — `selectPeerRouter` in the upstream runtime gives peers the caller's router and model policy. The peer manifest's router fields are informational. The audit view checks that no key markers appear in trace events or peer requests.
6. **Private context deny-by-default** — every agent declares `allow.to_downstream.sly_data: []` and `allow.to_upstream.sly_data: []`; the board passes a `DO_NOT_FORWARD` sentinel as private context and the evidence panel checks that it is absent from `remote_call.requestPayload`.
7. **Visible failures** — invalid artifacts are reported by the discovery/inspection actions and runtime validation; a declined consent card produces a visible declined decision; cycle, depth, budget, and deny-origin failures are emitted by the upstream runtime as trace notes/errors and are visible in the audit timeline.

## Honest limitations

- The keyless default router is deterministic, not a large language model. It exercises real tools and real peer execution, but it does not generate novel language. This is disclosed on the live page, in the manifest note, and in the submission copy.
- A real BYOK run requires a visitor-supplied key and a router that allows browser CORS from the Pages origin. Without such a key, the site remains fully demonstrable in the deterministic path.
- The peer uses the trailing-dot origin of the same GitHub Pages account. It is a genuine distinct browser origin and CORS boundary, but not a different publisher.
- The audit log is an application event log, not tamper-proof evidence. SHA-256 digests bind the exact public artifacts fetched in a run.
- No Otari account or credits were used. No paid service was required.
