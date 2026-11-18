// Minimal Chrome DevTools Protocol client using Node's built-in WebSocket.
export class CDP {
  constructor(wsUrl, { timeout = 20000 } = {}) {
    this.wsUrl = wsUrl;
    this.timeout = timeout;
    this.next = 0;
    this.pending = new Map();
    this.listeners = [];
  }

  static async newTab(port, url) {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
    if (!response.ok) throw new Error(`new tab failed: ${response.status}`);
    return response.json();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject, timer } = this.pending.get(msg.id);
        clearTimeout(timer);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
      this.listeners.forEach(fn => fn(msg));
    });
    return this;
  }

  on(fn) { this.listeners.push(fn); return () => { this.listeners = this.listeners.filter(x => x !== fn); }; }

  send(method, params = {}) {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, { awaitPromise = true } = {}) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + " " + JSON.stringify(result.exceptionDetails.exception?.description || ""));
    return result.result.value;
  }

  async waitFor(expression, { timeout = 20000, interval = 250 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await this.evaluate(expression)) return true;
      } catch { /* page may still be loading */ }
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error(`waitFor timeout: ${expression}`);
  }

  close() { try { this.ws.close(); } catch {} }
}
