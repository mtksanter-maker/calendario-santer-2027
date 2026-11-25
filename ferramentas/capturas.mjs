// Capturas de tela das telas principais (inspeção visual). Uso: node ferramentas/capturas.mjs <url-base> <pasta> [largura] [altura] [tema]
import { launch, sleep } from './cdp.mjs';
import { mkdirSync } from 'node:fs';
const base = process.argv[2] || 'http://localhost:8031/';
const dir = process.argv[3] || 'capturas';
const W = +(process.argv[4] || 1440), H = +(process.argv[5] || 900), tema = process.argv[6] || 'light';
const so = process.argv[7] ? process.argv[7].split(',') : null;
mkdirSync(dir, { recursive: true });
const b = await launch({ width: W, height: H });
await b.viewport(W, H, W < 700);
await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema }] });
const telas = [
  ['01-calendario', '#/calendario'],
  ['02-cal-mes', '#/calendario', `document.querySelector('.mcard[data-month="3"] .mhead').click()`],
  ['03-cal-pop', '#/calendario', `document.querySelector('.day[data-date="2027-04-17"]').click()`],
  ['04-visao', '#/endo/visao'],
  ['05-jornada', '#/endo/jornada'],
  ['06-mes-resumo', '#/endo/mes/04?aba=resumo'],
  ['07-mes-orcamento', '#/endo/mes/06?aba=orcamento'],
  ['08-mes-comunicacao', '#/endo/mes/01?aba=comunicacao'],
  ['09-mes-impacto', '#/endo/mes/10?aba=impacto'],
  ['10-programas', '#/endo/programas'],
  ['11-orcamento', '#/endo/orcamento'],
  ['12-produtividade', '#/endo/produtividade'],
  ['13-linkedin', '#/endo/linkedin'],
  ['14-linkedin-lista', '#/endo/linkedin', `document.querySelector('[data-li-view="lista"]').click()`],
  ['15-pesquisa', '#/endo/pesquisa'],
  ['16-pesquisa-case', '#/endo/pesquisa?id=R040'],
  ['17-mes-ficha', '#/endo/mes/03?aba=ficha']
];
await b.goto(base + '#/calendario', 900);
for (const [nome, hash, acao] of telas) {
  if (so && !so.some(s => nome.startsWith(s))) continue;
  await b.eval(`(document.querySelector('.e-drawer.open [data-close-drawer]')||{click(){}}).click(); window.SanterCal && SanterCal.closeOverlays(); location.hash=${JSON.stringify(hash)}`);
  await sleep(900);
  if (acao) { await b.eval(acao); await sleep(800); }
  await b.eval('scrollTo(0,0)'); await sleep(150);
  await b.screenshot(`${dir}/${nome}.png`);
}
if (b.errors.length) console.log('ERROS:', b.errors); else console.log('Sem erros no console.');
await b.close();
