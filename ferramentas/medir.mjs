// Mede o desempenho real do app num Edge headless.
// Uso: node ferramentas/medir.mjs http://localhost:8030/ saida.json [rodadas]
import { launch, sleep } from './cdp.mjs';
import { writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:8030/';
const out = process.argv[3] || 'medicao.json';
const rounds = Number(process.argv[4] || 5);
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const b = await launch();
await b.send('Network.setCacheDisabled', { cacheDisabled: false });
const runs = [];
for (let i = 0; i < rounds; i++) {
  await b.goto('about:blank', 50);
  const t0 = Date.now();
  await b.goto(url, 50);
  await b.waitFor(`document.querySelectorAll('.mcard').length===12`, 15000);
  const ready = Date.now() - t0;
  await sleep(300);
  const nav = await b.eval(`(()=>{const n=performance.getEntriesByType('navigation')[0];const r=performance.getEntriesByType('resource');
    const fcp=(performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0;
    return {dcl:n.domContentLoadedEventEnd,load:n.loadEventEnd,fcp,bytes:r.reduce((a,x)=>a+(x.transferSize||0),0)+(n.transferSize||0),
    decoded:r.reduce((a,x)=>a+(x.decodedBodySize||0),0)+(n.decodedBodySize||0),requests:r.length+1,nodes:document.getElementsByTagName('*').length}})()`);
  // Abrir um mês, trocar de mês e fechar
  const openMs = await b.eval(`(async()=>{const t=performance.now();document.querySelector('.mcard[data-month="3"] .mhead').click();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-t})()`);
  await sleep(700);
  const navMs = await b.eval(`(async()=>{const t=performance.now();document.querySelector('[data-nav="1"]').click();
    await new Promise(r=>setTimeout(r,0));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-t})()`);
  await sleep(700);
  await b.eval(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
  await sleep(700);
  // Filtro de categoria (re-render do ano)
  const filterMs = await b.eval(`(async()=>{const c=document.querySelector('[data-cat]');const t=performance.now();c.click();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const d=performance.now()-t;c.click();return d})()`);
  const m = await b.metrics();
  runs.push({ ready, ...nav, openMs, navMs, filterMs, heapMB: m.JSHeapUsedSize / 1048576, layouts: m.LayoutCount, styleRecalcs: m.RecalcStyleCount, scriptMs: m.ScriptDuration * 1000 });
}
const keys = Object.keys(runs[0]);
const summary = Object.fromEntries(keys.map(k => [k, Math.round(med(runs.map(r => r[k])) * 10) / 10]));
writeFileSync(out, JSON.stringify({ url, rounds, quando: new Date().toISOString(), mediana: summary, rodadas: runs }, null, 1));
console.log(JSON.stringify(summary, null, 1));
if (b.errors.length) console.log('Erros no console:', b.errors.slice(0, 10));
await b.close();
