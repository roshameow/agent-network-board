import { CDP } from './cdp.mjs';
const tab = await CDP.newTab(9236, 'about:blank');
const c = await new CDP(tab.webSocketDebuggerUrl, {timeout:60000}).connect();
await c.send('Page.enable');
await c.send('Network.enable');
await c.send('Network.setCacheDisabled', { cacheDisabled: true });
await c.send('Page.navigate', { url: 'https://roshameow.github.io/agent-network-board/?v=3' });
const errors = [];
c.on(m => { if (m.method==='Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
await c.send('Runtime.enable');
await c.waitFor('!!window.__anb || document.querySelector("#mode-text")?.textContent.includes("failed")', {timeout:45000});
console.log('mode', await c.evaluate(`document.querySelector('#mode-text').textContent`));
await c.evaluate(`document.querySelector('#task-form button[type=submit]').click()`);
for (let i=0;i<360;i++) {
  const s = await c.evaluate(`({status:document.querySelector('#run-status').textContent, consent:document.querySelector('#consent-dialog').open})`);
  if (s.consent) { console.log('consent shown'); await c.evaluate(`document.querySelector('#consent-dialog button[value="allow"]').click()`); }
  if (s.status !== 'running') break;
  await new Promise(r=>setTimeout(r,500));
}
console.log('run', await c.evaluate(`document.querySelector('#run-status').textContent`));
console.log('discovery', await c.evaluate(`window.ANB_STATE.discovery?.status + ' ' + window.ANB_STATE.discovery?.sha256`));
console.log('inspection', await c.evaluate(`window.ANB_STATE.inspection?.status + ' ' + window.ANB_STATE.inspection?.networkName`));
console.log('peer origin trace', await c.evaluate(`JSON.stringify([...new Set(window.__nsweb.trace.events.flatMap(e=>[e.peerOrigin,e.origin].filter(Boolean)))])`));
console.log('reasons', await c.evaluate(`JSON.stringify({d:window.ANB_STATE.discovery,i:window.ANB_STATE.inspection})`));
console.log('verification', await c.evaluate(`JSON.stringify(window.ANB_STATE.verification)`));
console.log('action catalog', await c.evaluate(`JSON.stringify(window.__nsweb.trace.events.filter(e=>e.kind==='action_catalog'))`));
console.log('consent events', await c.evaluate(`JSON.stringify(window.__nsweb.trace.events.filter(e=>e.kind==='consent'||e.decision||e.peerOrigin))`));
console.log('evidence', await c.evaluate(`JSON.stringify([...document.querySelectorAll('.evidence-row')].map(r=>r.textContent.replace(/\\s+/g,' ').trim()))`));
console.log('errors', JSON.stringify(errors));
await c.close();
