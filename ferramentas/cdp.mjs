// Navegador de teste (Edge headless) controlado pelo Chrome DevTools Protocol.
// Sem dependências: usa o WebSocket nativo do Node 26.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function launch({ port = 9333, width = 1440, height = 900 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'edge-teste-'));
  const proc = spawn(EDGE, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', `--window-size=${width},${height}`, 'about:blank'
  ], { stdio: 'ignore' });
  let info = null;
  for (let i = 0; i < 60 && !info; i++) {
    await sleep(250);
    try { info = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); } catch { /* aguardando */ }
  }
  if (!info) throw new Error('Edge não abriu a porta de depuração');
  const page = info.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result); }
    else if (msg.method) listeners.forEach(l => l(msg));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const errors = [];
  listeners.push(m => {
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) errors.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Performance.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const api = {
    send, errors,
    async viewport(w, h, mobile = false) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile }); },
    async goto(url, waitMs = 600) {
      const loaded = new Promise(r => { const l = m => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(l), 1); r(); } }; listeners.push(l); });
      await send('Page.navigate', { url }); await loaded; await sleep(waitMs);
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async waitFor(expr, timeout = 8000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) { if (await api.eval(`!!(${expr})`)) return true; await sleep(80); }
      throw new Error('Tempo esgotado esperando: ' + expr);
    },
    async click(sel) { const ok = await api.eval(`(()=>{const n=document.querySelector(${JSON.stringify(sel)});if(!n)return false;n.scrollIntoView({block:'center'});n.click();return true})()`); if (!ok) throw new Error('Não achei ' + sel); await sleep(120); },
    async screenshot(file, full = false) {
      const p = { format: 'png', captureBeyondViewport: full };
      const r = await send('Page.captureScreenshot', p); writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async metrics() { const r = await send('Performance.getMetrics'); return Object.fromEntries(r.metrics.map(m => [m.name, m.value])); },
    async close() { try { ws.close(); } catch { } proc.kill(); await sleep(400); try { rmSync(dir, { recursive: true, force: true }); } catch { } }
  };
  return api;
}
export { sleep };
