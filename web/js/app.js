/* Calendário de Endomarketing 2027 — Santer Empreendimentos
   Um único script, sem dependências. Funciona em três lugares:
   - app local (servidor.ps1): lê e grava dados/calendario-2027.json pela API /api/calendario;
   - artifact no Claude: a página se republica com os dados embutidos;
   - arquivo .html avulso: grava no navegador (localStorage). */
(() => {
'use strict';

/* ---------- Constantes ---------- */
const Y = 2027;
const TITLE = 'Calendário de Endomarketing 2027';
const LINKS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap">';
const RESET_FALLBACK = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
const API = 'api/calendario';
const K_LOCAL = 'santer-endo-2027:estado';
const K_FILTERS = 'santer-endo-2027:filtros';
const K_DRAFT = 'santer-endo-2027:rascunho';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WD_LONG = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const WD_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WD_1 = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const GROUPS = [{ id: 'cal', label: 'Calendário Brasil' }, { id: 'endo', label: 'Endomarketing Santer' }, { id: 'op', label: 'Compromissos operacionais' }];
const DEFAULT_CATS = [
  {
    "id": "feriado",
    "label": "Feriado",
    "group": "cal",
    "color": "#93A69B",
    "dark": "#84998D"
  },
  {
    "id": "comemorativa",
    "label": "Data comemorativa",
    "group": "cal",
    "color": "#CDB395",
    "dark": "#C2A784"
  },
  {
    "id": "profissao",
    "label": "Dia da profissão",
    "group": "cal",
    "color": "#E5BD58",
    "dark": "#D9B04C"
  },
  {
    "id": "jeitosanter",
    "label": "Jeito Santer de Ser",
    "group": "endo",
    "color": "#00B4D8",
    "dark": "#009DBD"
  },
  {
    "id": "acao",
    "label": "Ação endomarketing",
    "group": "endo",
    "color": "#A9C8EC",
    "dark": "#92B5E0"
  },
  {
    "id": "comunica",
    "label": "Comunica Santer",
    "group": "endo",
    "color": "#F0907A",
    "dark": "#E68068"
  },
  {
    "id": "learning",
    "label": "Learning.Rocks",
    "group": "endo",
    "color": "#BC7EA8",
    "dark": "#B07198"
  }
];
const PRESETS = ['#93A69B', '#CDB395', '#E5BD58', '#A9C8EC', '#F0907A', '#C9B5EE', '#BC7EA8', '#7CC6B8', '#EFA3B8', '#B9C48A', '#F5B98C', '#A7B4C6', '#8FD0E0', '#D7A6E6'];
const CAMP_COLORS = {
  branco: ['Branco', '#FFFFFF'], roxo: ['Roxo', '#7E57C2'], laranja: ['Laranja', '#F28C28'], lilas: ['Lilás', '#B39DDB'],
  verde: ['Verde', '#43A047'], azul: ['Azul', '#1E88E5'], amarelo: ['Amarelo', '#FBC02D'], vermelho: ['Vermelho', '#E53935'],
  dourado: ['Dourado', '#C9A227'], rosa: ['Rosa', '#EC6FA0'], cinza: ['Cinza', '#9E9E9E']
};
const campHex = k => (CAMP_COLORS[k] || CAMP_COLORS.cinza)[1];

const svg = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  pencil: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  left: svg('<path d="m15 5-7 7 7 7"/>'),
  right: svg('<path d="m9 5 7 7-7 7"/>'),
  up: svg('<path d="M12 19V5m0 0-6 6m6-6 6 6"/>'),
  down: svg('<path d="M12 5v14m0 0-6-6m6 6 6-6"/>'),
  chev: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:14px;height:14px"><path d="m9 6 6 6-6 6"/></svg>',
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  download: svg('<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>'),
  print: svg('<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7z"/><path d="M16 11h1"/>'),
  undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  tag: svg('<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7L21 12.3 12.3 21z"/><circle cx="8" cy="8" r="1.4"/>'),
  swap: svg('<path d="M7 7h12m0 0-4-4m4 4-4 4M17 17H5m0 0 4-4m-4 4 4 4"/>')
};

/* ---------- Utilidades ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = n => String(n).padStart(2, '0');
const key = (m, d) => `${Y}-${pad(m + 1)}-${pad(d)}`;
const parts = s => { const a = s.split('-').map(Number); return { y: a[0], m: a[1] - 1, d: a[2] }; };
const dowOf = s => { const p = parts(s); return new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay(); };
const daysIn = m => new Date(Date.UTC(Y, m + 1, 0)).getUTCDate();
const firstDow = m => new Date(Date.UTC(Y, m, 1)).getUTCDay();
const addDays = (s, n) => { const p = parts(s); const t = new Date(Date.UTC(p.y, p.m, p.d + n)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
const fmtShort = s => { const p = parts(s); return `${pad(p.d)}/${pad(p.m + 1)}`; };
const fmtLong = s => { const p = parts(s); return `${p.d} de ${MONTHS[p.m].toLowerCase()}`; };
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clone = o => JSON.parse(JSON.stringify(o));
const clamp01 = v => Math.max(0, Math.min(1, v));
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const store = area => ({
  get(k) { try { return window[area].getItem(k); } catch (e) { return null; } },
  set(k, v) { try { window[area].setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { window[area].removeItem(k); } catch (e) { /* sem armazenamento */ } }
});
const local = store('localStorage');
const sess = store('sessionStorage');
const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const NOW = new Date();
const TODAY = NOW.getFullYear() === Y ? key(NOW.getMonth(), NOW.getDate()) : '';

/* Cores: tinta legível sobre cada cor e versão para o tema escuro */
const hexOk = h => /^#[0-9a-f]{6}$/i.test(h || '');
const rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = h => rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const INK_DARK = '#1E1C38', INK_LIGHT = '#FFFFFF';
const inkFor = h => { const L = lum(h); return (L + 0.05) / (lum(INK_DARK) + 0.05) >= 1.05 / (L + 0.05) ? INK_DARK : INK_LIGHT; };
const shade = (h, k) => '#' + rgb(h).map(v => Math.round(v * (1 - k)).toString(16).padStart(2, '0')).join('');

/* Fonte da própria página: usada para gerar a cópia .html e para o artifact se republicar */
const SRC = (() => {
  const cssEl = document.getElementById('app-css'), jsEl = document.getElementById('app-js');
  let reset = RESET_FALLBACK;
  try {
    const s = Array.from(document.head ? document.head.querySelectorAll('style') : []).find(x => /safe-area-inset/.test(x.textContent));
    if (s) reset = s.textContent;
  } catch (e) { /* usa o padrão */ }
  return {
    css: cssEl && cssEl.tagName === 'STYLE' ? cssEl.textContent : '',
    js: jsEl && !jsEl.src ? jsEl.textContent : '',
    cssUrls: Array.from(document.querySelectorAll('link[data-app-css]')).map(l => l.href),
    jsUrl: jsEl && jsEl.src ? jsEl.src : '',
    reset
  };
})();
async function sources() {
  if (!SRC.css && SRC.cssUrls.length) SRC.css = (await Promise.all(SRC.cssUrls.map(u => fetch(u, { cache: 'no-store' }).then(r => r.text())))).join('\n');
  if (!SRC.js && SRC.jsUrl) SRC.js = await fetch(SRC.jsUrl, { cache: 'no-store' }).then(r => r.text());
  return SRC;
}

/* ---------- Mola (amortecimento + resposta, como no iOS) ----------
   Sempre parte do valor atual e herda a velocidade: pode ser interrompida e redirecionada a qualquer momento. */
class Spring {
  constructor(x, o) {
    o = o || {};
    this.x = x; this.v = 0; this.target = x;
    this.response = o.response || 0.35; this.damping = o.damping == null ? 1 : o.damping;
    this.r = this.response; this.z = this.damping;
    this.precision = o.precision || 0.001;
    this.onUpdate = o.onUpdate || (() => {});
    this.onRest = null; this.raf = 0; this.last = 0;
  }
  get moving() { return this.raf !== 0; }
  set(target, o) {
    o = o || {};
    this.target = target;
    if (o.velocity != null) this.v = o.velocity;
    this.r = o.response || this.response;
    this.z = o.damping == null ? this.damping : o.damping;
    this.onRest = o.onRest || null;
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(t => this.tick(t)); }
  }
  jump(x) { this.stop(); this.x = this.target = x; this.v = 0; this.onUpdate(x); }
  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; this.onRest = null; }
  tick(now) {
    const dt = Math.min(0.064, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const k = Math.pow(2 * Math.PI / this.r, 2), c = 4 * Math.PI * this.z / this.r;
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { const a = -k * (this.x - this.target) - c * this.v; this.v += a * h; this.x += this.v * h; }
    if (Math.abs(this.x - this.target) < this.precision && Math.abs(this.v) < this.precision * 10) {
      this.x = this.target; this.v = 0; this.raf = 0; this.onUpdate(this.x);
      const cb = this.onRest; this.onRest = null; if (cb) cb();
      return;
    }
    this.onUpdate(this.x);
    this.raf = requestAnimationFrame(t => this.tick(t));
  }
}
const project = (v, d) => (v / 1000) * (d || 0.998) / (1 - (d || 0.998));
const rubber = (over, dim, c) => { c = c || 0.55; return (over * dim * c) / (dim + c * Math.abs(over)); };

/* ---------- Dados ---------- */
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'categoria';
const sortStored = list => list.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || a.t.localeCompare(b.t, 'pt') || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
function normalize(raw) {
  raw = raw || {};
  const out = { v: 2, year: Y, updated: raw.updated || '', categories: [], months: [], fontes: Array.isArray(raw.fontes) ? raw.fontes : [], events: [] };
  const seen = new Set();
  const addCat = c => {
    if (!c || !/^[a-z0-9][a-z0-9-]*$/.test(c.id || '') || seen.has(c.id)) return;
    seen.add(c.id);
    out.categories.push({ id: c.id, label: String(c.label || c.id), group: GROUPS.some(g => g.id === c.group) ? c.group : 'endo', color: hexOk(c.color) ? c.color.toUpperCase() : '#A7B4C6', dark: hexOk(c.dark) ? c.dark.toUpperCase() : '' });
  };
  (Array.isArray(raw.categories) && raw.categories.length ? raw.categories : DEFAULT_CATS).forEach(addCat);
  for (let m = 0; m < 12; m++) {
    const r = (raw.months || [])[m] || {};
    out.months.push({ camp: r.camp || '', tema: r.tema || '', cor: r.cor || '' });
  }
  (raw.events || []).forEach((r, i) => {
    const ev = Array.isArray(r)
      ? { d: r[0], e: r[1] || '', c: r[2], t: r[3] || '', n: r[4] || '', o: r[5] || '', inc: Array.isArray(r[6]) ? r[6].slice() : [], id: r[7] || ('e' + (i + 1)) }
      : { d: r.d, e: r.e || '', c: r.c, t: r.t || '', n: r.n || '', o: r.o || '', inc: Array.isArray(r.inc) ? r.inc.slice() : [], id: r.id || ('e' + (i + 1)) };
    if (!/^\d{4}-\d\d-\d\d$/.test(ev.d || '') || !/^[a-z0-9][a-z0-9-]*$/.test(ev.c || '')) return;
    if (!seen.has(ev.c)) {
      const def = DEFAULT_CATS.find(c => c.id === ev.c);
      addCat(def || { id: ev.c, label: 'Sem categoria', group: 'endo', color: '#A7B4C6' });
    }
    if (ev.e && ev.e <= ev.d) ev.e = '';
    out.events.push(ev);
  });
  sortStored(out.events);
  return out;
}
function serialize(s) {
  return {
    v: 2, year: Y, updated: s.updated,
    categories: s.categories.map(c => c.dark ? { id: c.id, label: c.label, group: c.group, color: c.color, dark: c.dark } : { id: c.id, label: c.label, group: c.group, color: c.color }),
    months: s.months, fontes: s.fontes,
    events: sortStored(s.events.slice()).map(ev => [ev.d, ev.e || '', ev.c, ev.t, ev.n || '', ev.o || '', ev.inc || [], ev.id])
  };
}
const sig = s => JSON.stringify(serialize(Object.assign({}, s, { updated: '' })));
function readEmbedded() {
  const n = document.getElementById('cal-data');
  if (!n) return null;
  try { return JSON.parse(n.textContent); } catch (e) { return null; }
}

let SEED = readEmbedded();
let saved = normalize(SEED || {});
let work = clone(saved);
let history = [];
let editing = false;
let mode = (window.claude && typeof window.claude.use === 'function') ? 'pending' : 'local';
let artifactNS = null, downloadsNS = null;
let capsReady = Promise.resolve();
let pendingToast = '';
const ui = { hidden: new Set(), onlyNew: false, month: 0, popDate: '' };
try {
  const f = JSON.parse(local.get(K_FILTERS) || '[]');
  if (Array.isArray(f)) f.forEach(c => ui.hidden.add(c));
} catch (e) { /* filtros padrão */ }

/* Categorias: mapa, ordem e cores (variáveis CSS geradas a partir dos dados) */
let CM = new Map(), CO = new Map();
const catStyle = document.createElement('style');
catStyle.id = 'cat-colors';
(document.head || document.body).appendChild(catStyle);
function syncCats() {
  CM = new Map(work.categories.map(c => [c.id, c]));
  CO = new Map(work.categories.map((c, i) => [c.id, i]));
  Array.from(ui.hidden).forEach(id => { if (!CM.has(id) && !/^lyr-/.test(id)) ui.hidden.delete(id); });
  const L = [], D = [];
  work.categories.forEach(c => {
    const dk = hexOk(c.dark) ? c.dark : shade(c.color, 0.1);
    L.push(`--c-${c.id}:${c.color};--on-${c.id}:${inkFor(c.color)}`);
    D.push(`--c-${c.id}:${dk};--on-${c.id}:${inkFor(dk)}`);
  });
  catStyle.textContent = `:root{${L.join(';')}}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${D.join(';')}}}:root[data-theme="dark"]{${D.join(';')}}`;
}
const catOf = id => CM.get(id) || (/^lyr-/.test(id) && LM.get(id) ? { id, label: LM.get(id).label, group: 'lyr', color: '#4A57A8' } : { id, label: 'Sem categoria', group: 'endo', color: '#A7B4C6' });
const orderOf = id => (CO.has(id) ? CO.get(id) : 999);
const groupLabel = g => (GROUPS.find(x => x.id === g) || GROUPS[1]).label;
const countByCat = () => { const n = {}; work.events.forEach(e => { n[e.c] = (n[e.c] || 0) + 1; }); VIRT.forEach(e => { n[e.c] = (n[e.c] || 0) + 1; }); return n; };
const sortEvents = list => list.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0) || (orderOf(a.c) - orderOf(b.c)) || a.t.localeCompare(b.t, 'pt'));
function freeColor() {
  const used = new Set(work.categories.map(c => c.color.toUpperCase()));
  return PRESETS.find(h => !used.has(h.toUpperCase())) || PRESETS[7];
}
function makeCat(spec, w) {
  const base = slug(spec.label).replace(/^lyr-/, 'cat-lyr-');
  let id = base, i = 2;
  while (w.categories.some(c => c.id === id)) id = `${base}-${i++}`;
  return { id, label: spec.label, group: GROUPS.some(g => g.id === spec.group) ? spec.group : 'endo', color: hexOk(spec.color) ? spec.color.toUpperCase() : freeColor(), dark: '' };
}

/* ---------- Camadas do Endomarketing 2027 (integração com o módulo de planejamento) ----------
   Fonte única: dados/endo/plano.json e linkedin.json. Nada disso é gravado no calendário oficial:
   são camadas de leitura, com aparência própria. Só vira evento oficial quando alguém publica uma ação
   aprovada a partir do módulo Endomarketing (e o vínculo fica registrado no plano). */
const LAYERS = [
  { id: 'lyr-plan', label: 'Em planejamento', kind: 'plan', tag: 'Em planejamento' },
  { id: 'lyr-prog', label: 'Programas recorrentes', kind: 'prog', tag: 'Programa recorrente' },
  { id: 'lyr-li', label: 'Publicações do LinkedIn', kind: 'li', tag: 'LinkedIn' }
];
const LM = new Map(LAYERS.map(l => [l.id, l]));
const K_LAYERS = 'santer-endo-2027:camadas-v1';
const ST_LABEL = { planejado: 'Planejado', 'aguardando-validacao': 'Aguardando validação', aprovado: 'Aprovado', 'em-execucao': 'Em execução', executado: 'Executado', avaliado: 'Avaliado', cancelado: 'Cancelado', proposta: 'Proposta', 'em-producao': 'Em produção', agendado: 'Agendado', publicado: 'Publicado' };
const hasEndo = !!(window.SanterDados && window.SanterDados.disponivel);
const PLAN_MARCOS = new Set(['lancamento', 'execucao', 'devolutiva']);
let PLAN = null, LI = null, liLoading = false, VIRT = [], LINKED = new Map();
if (!local.get(K_LAYERS)) { ui.hidden.add('lyr-li'); local.set(K_LAYERS, '1'); local.set(K_FILTERS, JSON.stringify(Array.from(ui.hidden))); }
const endoHref = m => `#/endo/mes/${pad(m)}`;
function rebuildVirtual() {
  const out = []; LINKED = new Map();
  if (PLAN) {
    const linkOf = (vs, href, label) => (vs || []).forEach(v => { if (v.eventId) LINKED.set(v.eventId, { href, label }); });
    (PLAN.meses || []).forEach(mo => {
      const a = mo.acao || {}, href = endoHref(mo.m);
      linkOf(mo.vinculos, href, a.nome);
      const pub = new Set((mo.vinculos || []).filter(v => v.dataId && work.events.some(e => e.id === v.eventId)).map(v => v.dataId));
      (a.datas || []).forEach(d => {
        if (!/^2027-\d\d-\d\d$/.test(d.data || '') || pub.has(d.id) || a.status === 'cancelado' || !PLAN_MARCOS.has(d.tipo)) return;
        out.push({ d: d.data, e: '', c: 'lyr-plan', t: `${a.nome}: ${d.rotulo}`, n: `${d.fim && d.fim > d.data ? 'Até ' + fmtShort(d.fim) + '. ' : ''}Proposta do Endomarketing 2027 · ${ST_LABEL[a.status] || a.status}. Não é um evento oficial do calendário.`, o: '', inc: [], id: 'v-' + d.id, v: 'plan', href });
      });
    });
    (PLAN.experiencias || []).forEach(x => {
      const href = '#/endo/programas?id=' + x.id;
      linkOf(x.vinculos, href, x.nome);
      const pub = (x.vinculos || []).some(v => work.events.some(e => e.id === v.eventId));
      if (!pub && /^2027-\d\d-\d\d$/.test(x.dataProvisoria || '') && x.status !== 'cancelado') out.push({ d: x.dataProvisoria, e: '', c: 'lyr-plan', t: `${x.nome} (data provisória)`, n: `Experiência presencial proposta · ${ST_LABEL[x.status] || x.status}. ${x.janela || ''}`.trim(), o: '', inc: [], id: 'v-' + x.id, v: 'plan', href });
    });
    (PLAN.programas || []).forEach(p => {
      const href = '#/endo/programas?id=' + p.id;
      linkOf(p.vinculos, href, p.nome);
      if (p.status === 'cancelado') return;
      const feitas = new Set(p.sessoesRealizadas || []);
      (p.sessoes || []).forEach(d => {
        if (!/^2027-\d\d-\d\d$/.test(d)) return;
        out.push({ d, e: '', c: 'lyr-prog', t: p.nome, n: `${p.frequencia || 'Recorrente'} · ${(p.turmas || []).length} turmas escalonadas · ${p.minutosExercicio || 5} min de exercício por participante${feitas.has(d) ? ' · sessão registrada como realizada' : ''}. Programa permanente, não é uma campanha nova.`, o: '', inc: [], id: `v-${p.id}-${d}`, v: 'prog', href });
      });
    });
  }
  if (LI) (LI.posts || []).forEach(p => {
    if (!/^2027-\d\d-\d\d$/.test(p.data || '') || p.status === 'cancelado') return;
    out.push({ d: p.data, e: '', c: 'lyr-li', t: `${p.tipo === 'cobertura' ? 'Cobertura' : 'LinkedIn'}: ${p.tema}`, n: `${p.formato || ''} · ${ST_LABEL[p.status] || p.status}${p.responsavel ? ' · ' + p.responsavel : ''}. Publicação manual; nada é publicado automaticamente.`, o: '', inc: [], id: 'v-' + p.id, v: 'li', href: '#/endo/linkedin?post=' + p.id });
  });
  VIRT = out;
}
function redrawLayers() {
  renderLegend(); renderYear(); refreshPopover(); markSel();
  if (!sheet.hidden) { $('#sh-head').innerHTML = sheetHeadHTML(ui.month); renderPanes(); trackSpring.jump(0); renderList(true); }
}
function loadLinkedIn() {
  if (LI || liLoading || !hasEndo) return;
  liLoading = true;
  window.SanterDados.get('linkedin').then(d => { LI = d; rebuildVirtual(); redrawLayers(); }).catch(() => toast('Não foi possível carregar o calendário editorial do LinkedIn.')).finally(() => { liLoading = false; });
}
function initLayers() {
  if (!hasEndo) return;
  window.SanterDados.on('plano', d => { PLAN = d; rebuildVirtual(); redrawLayers(); });
  window.SanterDados.on('linkedin', d => { LI = d; rebuildVirtual(); redrawLayers(); });
  window.SanterDados.get('plano').then(d => { if (PLAN !== d) { PLAN = d; rebuildVirtual(); redrawLayers(); } }).catch(() => { /* módulo sem dados: o calendário segue sem as camadas */ });
  if (!ui.hidden.has('lyr-li')) loadLinkedIn();
}
const planMonth = m => PLAN && (PLAN.meses || []).find(x => x.m === m + 1);

const visible = ev => !ui.hidden.has(ev.c);
let IDX = new Map();
function buildIndex() {
  const map = new Map();
  for (const ev of work.events.concat(VIRT)) {
    if (!visible(ev)) continue;
    const end = ev.e && ev.e > ev.d ? ev.e : ev.d;
    let d = ev.d, guard = 0;
    while (d <= end && guard++ < 400) {
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(ev);
      d = addDays(d, 1);
    }
  }
  map.forEach(list => sortEvents(list));
  return map;
}
function eventsInMonth(m) {
  const a = key(m, 1), b = key(m, daysIn(m));
  return work.events.concat(VIRT).filter(ev => visible(ev) && ev.d <= b && (ev.e || ev.d) >= a);
}

/* ---------- Estrutura da página ---------- */
const app = document.getElementById('app');
app.innerHTML = `
<header class="top glass glass-live" id="top"><div class="top-in">
  <div class="brand"><span class="eyebrow">Santer Empreendimentos · Calendário operacional</span><h1 class="title">Calendário <b>2027</b></h1></div>
  <div class="actions">
    <div class="search" id="search">${I.search}<input id="q" type="search" placeholder="Buscar data ou profissão" autocomplete="off" aria-label="Buscar no calendário" aria-controls="results"><div class="results glass-strong" id="results" hidden></div></div>
    <button type="button" class="btn" id="btn-export" aria-haspopup="true" aria-expanded="false">${I.download}<span>Arquivo</span></button>
    <button type="button" class="btn" id="btn-print">${I.print}<span>Imprimir</span></button>
    <button type="button" class="btn primary" id="btn-edit" aria-pressed="false">${I.pencil}<span>Editar</span></button>
  </div>
</div></header>
<main class="wrap">
  <div id="notice"></div>
  <section class="legend" id="legend" aria-label="Legenda e filtros"></section>
  <section class="year" id="year" aria-label="Meses de 2027"></section>
</main>
<p class="sr" id="live" aria-live="polite"></p>`;

const el = (tag, cls, attrs) => { const n = document.createElement(tag); if (cls) n.className = cls; if (attrs) Object.keys(attrs).forEach(k => n.setAttribute(k, attrs[k])); return n; };
const pop = el('div', 'pop glass-strong', { role: 'dialog', 'aria-modal': 'false' }); pop.hidden = true;
const scrim = el('div', 'scrim'); scrim.hidden = true;
const sheet = el('div', 'sheet', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sh-title' }); sheet.hidden = true;
sheet.innerHTML = `<div class="sh-head" id="sh-head"></div>
<div class="sh-body">
  <div class="mv"><div class="mv-viewport" id="mv-vp"><div class="mv-track" id="mv-track"></div></div>
  <p class="mv-hint">Arraste para o lado ou use as setas ← → para trocar de mês.</p></div>
  <div class="mv-list" id="mv-list"></div>
</div>`;
const mScrim = el('div', 'm-scrim'); mScrim.hidden = true;
const modal = el('div', 'modal glass-strong', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'm-title' }); modal.hidden = true;
const ebWrap = el('div', 'eb-wrap'); ebWrap.hidden = true;
ebWrap.innerHTML = `<div class="editbar glass-strong glass-live" role="region" aria-label="Modo de edição">
  <span class="eb-dot"></span><span class="eb-t"><b>Modo de edição</b><span id="eb-status">Tudo salvo</span></span>
  <button type="button" class="btn sm ghost" id="eb-add">${I.plus}<span>Nova data</span></button>
  <button type="button" class="btn sm ghost" id="eb-cats">${I.tag}<span>Categorias</span></button>
  <button type="button" class="btn sm ghost" id="eb-undo">${I.undo}<span>Desfazer</span></button>
  <button type="button" class="btn sm ghost" id="eb-discard">Descartar</button>
  <button type="button" class="btn sm primary" id="eb-save">Salvar</button>
</div>`;
const toastWrap = el('div', 'toast-wrap'); toastWrap.hidden = true;
const toastEl = el('div', 'toast', { role: 'status', 'aria-live': 'polite' });
toastWrap.appendChild(toastEl);
const menu = el('div', 'menu glass-strong', { role: 'menu' }); menu.hidden = true;
const fileInput = el('input', '', { type: 'file', accept: '.json,.html,.htm,application/json,text/html', 'aria-hidden': 'true', tabindex: '-1' });
fileInput.hidden = true;
[pop, scrim, sheet, mScrim, modal, menu, ebWrap, toastWrap, fileInput].forEach(n => document.body.appendChild(n));

const top = $('#top'), yearEl = $('#year'), btnEdit = $('#btn-edit'), btnExport = $('#btn-export');
const qInput = $('#q'), results = $('#results'), track = $('#mv-track'), vp = $('#mv-vp'), listEl = $('#mv-list');
const announce = t => { $('#live').textContent = t; };

/* ---------- Legenda ---------- */
function renderLegend() {
  const counts = countByCat();
  const nNew = work.events.filter(ev => ev.o === 'novo').length;
  const chip = c => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${!ui.hidden.has(c.id)}" style="--c:var(--c-${c.id})"><span class="sw"></span>${esc(c.label)}<span class="n">${counts[c.id] || 0}</span></button>`;
  const groups = GROUPS.map(g => {
    const list = work.categories.filter(c => c.group === g.id);
    return list.length ? `<div class="lg-group"><span class="lg-label">${g.label}</span><div class="chips">${list.map(chip).join('')}</div></div>` : '';
  }).join('');
  const lchip = l => `<button type="button" class="chip lyr" data-cat="${l.id}" aria-pressed="${!ui.hidden.has(l.id)}" style="--c:var(--c-${l.id})" title="${l.id === 'lyr-plan' ? 'Datas propostas no Endomarketing 2027 que ainda não são eventos oficiais' : l.id === 'lyr-prog' ? 'Sessões de programas permanentes, como a ginástica laboral' : 'Pautas editoriais e coberturas planejadas para o LinkedIn'}"><span class="sw"></span>${esc(l.label)}<span class="n">${l.id === 'lyr-li' && !LI ? '' : (counts[l.id] || 0)}</span></button>`;
  const layers = hasEndo && PLAN ? `<div class="lg-group"><span class="lg-label">Endomarketing 2027 · camadas não oficiais</span><div class="chips">${LAYERS.map(lchip).join('')}</div></div>` : '';
  $('#legend').innerHTML = `${groups}${layers}
    <div class="lg-group"><span class="lg-label">Destaque</span><div class="chips"><button type="button" class="chip nw" data-only-new aria-pressed="${ui.onlyNew}"><span class="badge-new">Novo</span>Só o que é novo em 2027<span class="n">${nNew}</span></button>
    ${editing ? `<button type="button" class="chip manage" data-open-cats>${I.tag}Gerenciar categorias</button>` : ''}</div></div>`;
}

/* ---------- Ano ---------- */
function fillFor(evs) {
  const cats = [];
  evs.forEach(ev => { if (!ev.v && cats.indexOf(ev.c) < 0) cats.push(ev.c); });
  cats.sort((a, b) => orderOf(a) - orderOf(b));
  if (!cats.length) return { cats, style: '' };
  const fill = cats.length === 1 ? `var(--c-${cats[0]})` : `linear-gradient(135deg,var(--c-${cats[0]}) 0 50%,var(--c-${cats[1]}) 50% 100%)`;
  return { cats, style: `--fill:${fill};--onf:var(--on-${cats[0]})` };
}
function monthCardHTML(m) {
  const mo = work.months[m], f = firstDow(m), dim = daysIn(m);
  let cells = WD_1.map(w => `<span class="wd" aria-hidden="true">${w}</span>`).join('');
  for (let i = 0; i < f; i++) cells += '<span aria-hidden="true"></span>';
  for (let d = 1; d <= dim; d++) {
    const k = key(m, d), evs = IDX.get(k) || [], w = (f + d - 1) % 7, ff = fillFor(evs);
    const cls = ['day'];
    let mk = '';
    if (w === 0 || w === 6) cls.push('we');
    if (ff.cats.length) cls.push('has');
    if (evs.some(e => e.v === 'plan')) { cls.push('vp'); mk += '<span class="mk mk-p"></span>'; }
    if (evs.some(e => e.v === 'prog')) { cls.push('vr'); mk += '<span class="mk mk-r"></span>'; }
    if (evs.some(e => e.v === 'li')) { cls.push('vl'); mk += '<span class="mk mk-l"></span>'; }
    if (ff.cats.length > 2) cls.push('m3');
    if (evs.some(e => e.o === 'novo')) cls.push('nw');
    if (k === TODAY) cls.push('today');
    if (popState.open && k === ui.popDate) cls.push('sel');
    const label = `${d} de ${MONTHS[m].toLowerCase()}, ${WD_LONG[w].toLowerCase()}${evs.length ? ': ' + evs.map(e => e.t).join('; ') : ''}`;
    cells += `<button type="button" class="${cls.join(' ')}" data-date="${k}"${ff.style ? ` style="${ff.style}"` : ''} aria-label="${esc(label)}">${d}${mk}</button>`;
  }
  const n = eventsInMonth(m).filter(e => !e.v).length;
  const pm = planMonth(m);
  const camp = (mo.camp ? `<span class="mcamp"><i class="cdot" style="--cc:${campHex(mo.cor)}"></i>${esc(mo.camp)}</span>` : '')
    + (pm && pm.acao && pm.acao.nome ? `<span class="mplan" title="Ação principal do Endomarketing 2027">${esc(pm.acao.nome)}</span>` : '');
  return `<section class="mcard" data-month="${m}" aria-labelledby="mn-${m}">
    <button type="button" class="mhead" data-open-month="${m}" aria-label="Abrir ${MONTHS[m]}: ${plural(n, 'data', 'datas')}">
      <span class="mh-l"><span class="mname" id="mn-${m}">${MONTHS[m]}</span>${camp}</span>
      <span class="mcount">${plural(n, 'data', 'datas')}${I.chev}</span>
    </button>
    <div class="dgrid">${cells}</div>
  </section>`;
}
function renderYear() {
  IDX = buildIndex();
  yearEl.innerHTML = MONTHS.map((_, m) => monthCardHTML(m)).join('');
  document.body.classList.toggle('only-new', ui.onlyNew);
}

/* ---------- Item de data ---------- */
function evHTML(ev) {
  const cat = catOf(ev.c);
  if (ev.v) {
    const l = LM.get(ev.c) || {};
    return `<li class="ev virt k-${ev.v}" style="--c:var(--c-${ev.c})">
      <span class="bar" aria-hidden="true"></span>
      <div class="ev-b"><div class="ev-t">${esc(ev.t)}</div>
        <div class="ev-m"><span class="kind">${esc(l.tag || '')}</span>${ev.e ? `<span>${fmtShort(ev.d)} a ${fmtShort(ev.e)}</span>` : ''}</div>
        ${ev.n ? `<div class="ev-n">${esc(ev.n)}</div>` : ''}
        <a class="ev-link" href="${esc(ev.href)}">Abrir no Endomarketing 2027${I.chev}</a>
      </div><div></div></li>`;
  }
  const lk = LINKED.get(ev.id);
  const pmo = !lk && PLAN && cat.group === 'endo' ? planMonth(parts(ev.d).m) : null;
  const endoLink = lk ? `<a class="ev-link" href="${esc(lk.href)}">Ver iniciativa: ${esc(lk.label)}${I.chev}</a>`
    : pmo ? `<a class="ev-link" href="${endoHref(pmo.m)}">Ver planejamento de ${MONTHS[pmo.m - 1].toLowerCase()}${I.chev}</a>` : '';
  const range = ev.e ? `<span>${fmtShort(ev.d)} a ${fmtShort(ev.e)}</span>` : '';
  const origin = ev.o === 'novo' ? '<span class="badge-new">Novo</span>' : ev.o === '2026' ? '<span class="o26">Base 2026</span>' : '';
  const inc = ev.inc && ev.inc.length ? `<p class="ev-inc-l">Inclui</p><ul class="ev-inc">${ev.inc.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  return `<li class="ev${ev.o === 'novo' ? ' is-new' : ''}" style="--c:var(--c-${ev.c})">
    <span class="bar" aria-hidden="true"></span>
    <div class="ev-b"><div class="ev-t">${esc(ev.t)}</div>
      <div class="ev-m"><span>${esc(cat.label)}</span>${range}${origin}${lk ? '<span class="linked">◆ Ação da campanha</span>' : ''}</div>
      ${ev.n ? `<div class="ev-n">${esc(ev.n)}</div>` : ''}${inc}${endoLink}
    </div>
    <div class="ev-tools">
      <button type="button" class="btn sm icon ghost" data-edit-ev="${ev.id}" aria-label="Editar ${esc(ev.t)}">${I.pencil}</button>
      <button type="button" class="btn sm icon ghost danger" data-del-ev="${ev.id}" aria-label="Excluir ${esc(ev.t)}">${I.trash}</button>
    </div>
  </li>`;
}

/* ---------- Popover do dia ---------- */
const popState = { open: false, anchor: null };
const popSpring = new Spring(0, {
  response: 0.3, precision: 0.002,
  onUpdate: p => { pop.style.opacity = clamp01(p); pop.style.transform = RM.matches ? 'none' : `scale(${0.9 + 0.1 * p})`; }
});
function popHTML(date) {
  const p = parts(date), evs = IDX.get(date) || [];
  return `<div class="pop-h"><div><div class="pop-wd">${WD_LONG[dowOf(date)]}</div><div class="pop-d">${fmtLong(date)}</div></div>
    <button type="button" class="btn sm icon ghost" data-close-pop aria-label="Fechar">${I.x}</button></div>
    ${evs.length ? `<ul class="evs">${evs.map(evHTML).join('')}</ul>` : `<p class="empty">Nenhuma data marcada neste dia${ui.hidden.size ? ' com os filtros atuais' : ''}.</p>`}
    <div class="pop-f"><button type="button" class="link" data-open-month="${p.m}" data-focus="${date}">Abrir ${MONTHS[p.m].toLowerCase()}${I.chev}</button>
    ${editing ? `<button type="button" class="btn sm" data-add-date="${date}">${I.plus}<span>Adicionar</span></button>` : ''}</div>`;
}
function positionPop(anchor) {
  const r = anchor.getBoundingClientRect();
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const prev = pop.style.transform;
  pop.style.transform = 'none'; pop.style.maxHeight = '';
  const pw = pop.offsetWidth; let ph = pop.offsetHeight;
  let topY = r.bottom + 8, originY = 0;
  if (topY + ph > vh - 12) {
    if (r.top - 8 - ph >= 12) { topY = r.top - 8 - ph; originY = ph; }
    else { topY = 12; ph = Math.min(ph, vh - 24); pop.style.maxHeight = (vh - 24) + 'px'; originY = Math.max(0, Math.min(ph, r.top + r.height / 2 - topY)); }
  }
  const left = Math.max(12, Math.min(vw - pw - 12, r.left + r.width / 2 - pw / 2));
  pop.style.left = left + 'px'; pop.style.top = topY + 'px';
  pop.style.transformOrigin = `${r.left + r.width / 2 - left}px ${originY}px`;
  pop.style.transform = prev;
}
function markSel() {
  $$('.day.sel').forEach(n => n.classList.remove('sel'));
  if (popState.open) { const n = $(`.day[data-date="${ui.popDate}"]`); if (n) n.classList.add('sel'); }
}
function openPopover(date, anchor) {
  if (popState.open && ui.popDate === date) { closePopover(true); return; }
  closeMenu(); closeResults();
  ui.popDate = date; popState.open = true; popState.anchor = anchor;
  pop.innerHTML = popHTML(date);
  pop.setAttribute('aria-label', `${WD_LONG[dowOf(date)]}, ${fmtLong(date)}`);
  if (pop.hidden) { pop.hidden = false; popSpring.jump(0); }
  positionPop(anchor);
  popSpring.set(1);
  markSel();
}
function closePopover(restoreFocus) {
  if (!popState.open) return;
  popState.open = false; markSel();
  popSpring.set(0, { onRest: () => { pop.hidden = true; } });
  if (restoreFocus && popState.anchor && document.contains(popState.anchor)) popState.anchor.focus({ preventScroll: true });
}
function refreshPopover() {
  if (!popState.open) return;
  const a = $(`.day[data-date="${ui.popDate}"]`);
  pop.innerHTML = popHTML(ui.popDate);
  if (a) { popState.anchor = a; positionPop(a); }
}

/* ---------- Folha do mês ---------- */
const sheetState = { open: false, flip: { dx: 0, dy: 0, s: 0.3 } };
const sheetSpring = new Spring(0, { response: 0.42, precision: 0.001, onUpdate: applySheet });
function applySheet(p) {
  const q = clamp01(p);
  scrim.style.opacity = q;
  if (RM.matches) { sheet.style.transform = 'none'; sheet.style.opacity = q; yearEl.style.transform = ''; return; }
  const f = sheetState.flip, s = f.s + (1 - f.s) * p;
  sheet.style.transform = `translate(${f.dx * (1 - p)}px,${f.dy * (1 - p)}px) scale(${s})`;
  sheet.style.opacity = Math.min(1, q * 1.7);
  yearEl.style.transform = q > 0.001 ? `scale(${1 - 0.018 * q})` : '';
}
function measureFlip(m) {
  const card = $(`.mcard[data-month="${m}"]`);
  if (!card) return;
  const prev = sheet.style.transform;
  sheet.style.transform = 'none';
  const dst = sheet.getBoundingClientRect();
  sheet.style.transform = prev;
  const src = card.getBoundingClientRect();
  sheetState.flip = { dx: src.left - dst.left, dy: src.top - dst.top, s: Math.max(0.15, Math.min(1, src.width / dst.width)) };
}
function sheetHeadHTML(m) {
  const mo = work.months[m];
  const pm = planMonth(m);
  const camp = (mo.camp ? `<span class="camp-pill"><i class="cdot" style="--cc:${campHex(mo.cor)}"></i><span>${esc(mo.camp)}${mo.tema ? ' · ' + esc(mo.tema) : ''}</span></span>` : '')
    + (pm && pm.acao ? `<a class="plan-pill" href="${endoHref(pm.m)}" title="Abrir o planejamento do mês no Endomarketing 2027"><span>Endomarketing 2027 · <b>${esc(pm.acao.nome)}</b> · ${esc(ST_LABEL[pm.acao.status] || pm.acao.status)}</span></a>` : '');
  return `<button type="button" class="btn sm" data-close-sheet aria-label="Voltar para o ano">${I.left}<span>2027</span></button>
    <h2 class="sh-title" id="sh-title"><b>${MONTHS[m]}</b><span>2027</span></h2>
    ${camp}${editing ? `<button type="button" class="btn sm ghost" data-edit-camp="${m}">${I.pencil}<span>Campanha do mês</span></button>` : ''}
    <div class="sh-nav">
      <button type="button" class="btn sm" data-print-month="${m}">${I.print}<span>Imprimir mês</span></button>
      <button type="button" class="btn icon" data-nav="-1" aria-label="Mês anterior${m > 0 ? ': ' + MONTHS[m - 1] : ''}" ${m === 0 ? 'disabled' : ''}>${I.left}</button>
      <button type="button" class="btn icon" data-nav="1" aria-label="Próximo mês${m < 11 ? ': ' + MONTHS[m + 1] : ''}" ${m === 11 ? 'disabled' : ''}>${I.right}</button>
    </div>`;
}
function paneHTML(m) {
  if (m < 0 || m > 11) return '<div class="mv-pane" aria-hidden="true"></div>';
  const f = firstDow(m), dim = daysIn(m);
  let cells = '';
  for (let i = 0; i < f; i++) cells += '<span class="cell out" aria-hidden="true"></span>';
  for (let d = 1; d <= dim; d++) {
    const k = key(m, d), evs = IDX.get(k) || [], w = (f + d - 1) % 7;
    const cls = ['cell'];
    if (w === 0 || w === 6) cls.push('we');
    if (evs.some(e => e.c === 'feriado')) cls.push('hol');
    if (evs.some(e => e.o === 'novo')) cls.push('nw');
    const chips = evs.slice(0, 3).map(e => `<span class="chipx${e.v ? ' virt k-' + e.v : ''}" style="--c:var(--c-${e.c})">${esc(e.t)}</span>`).join('');
    const more = evs.length > 3 ? `<span class="plus">+${evs.length - 3}</span>` : '';
    const dots = evs.length ? `<span class="dots">${evs.slice(0, 6).map(e => `<i${e.v ? ' class="virt"' : ''} style="--c:var(--c-${e.c})"></i>`).join('')}</span>` : '';
    const label = `${d} de ${MONTHS[m].toLowerCase()}${evs.length ? ': ' + evs.map(e => e.t).join('; ') : ', sem datas'}`;
    cells += `<button type="button" class="${cls.join(' ')}" data-cell="${k}" aria-label="${esc(label)}"><span class="num">${d}</span>${chips}${more}${dots}</button>`;
  }
  const total = f + dim, rows = Math.ceil(total / 7);
  for (let i = total; i < rows * 7; i++) cells += '<span class="cell out" aria-hidden="true"></span>';
  return `<div class="mv-pane" data-m="${m}"${m === ui.month ? '' : ' aria-hidden="true" inert'}><div class="mv-wd" aria-hidden="true">${WD_ABBR.map(w => `<span>${w}</span>`).join('')}</div><div class="mv-grid">${cells}</div></div>`;
}
function renderPanes() { track.innerHTML = paneHTML(ui.month - 1) + paneHTML(ui.month) + paneHTML(ui.month + 1); }
function renderList(keepScroll) {
  const m = ui.month, a = key(m, 1);
  const scroller = sheet.querySelector('.sh-body'), st = listEl.scrollTop, st2 = scroller.scrollTop;
  const evs = eventsInMonth(m);
  const groups = new Map();
  evs.forEach(ev => { const k = ev.d < a ? a : ev.d; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(ev); });
  const keys = Array.from(groups.keys()).sort();
  let html = `<div class="list-h"><span><b>${evs.length}</b> ${evs.length === 1 ? 'data' : 'datas'} em ${MONTHS[m].toLowerCase()}</span>${editing ? `<button type="button" class="btn sm" data-add-date="${a}">${I.plus}<span>Nova data</span></button>` : ''}</div>`;
  if (!keys.length) html += `<p class="empty-big">Nenhuma data neste mês${ui.hidden.size ? ' com os filtros atuais' : ''}.</p>`;
  html += keys.map(k => {
    const w = dowOf(k);
    return `<section class="dg${w === 0 || w === 6 ? ' we' : ''}" id="dg-${k}" data-dg="${k}" aria-label="${esc(WD_LONG[w] + ', ' + fmtLong(k))}">
      <div class="dg-date" aria-hidden="true"><span class="dg-n">${parts(k).d}</span><span class="dg-w">${WD_ABBR[w]}</span></div>
      <ul class="evs">${sortEvents(groups.get(k)).map(evHTML).join('')}</ul></section>`;
  }).join('');
  listEl.innerHTML = html;
  if (keepScroll) { listEl.scrollTop = st; scroller.scrollTop = st2; } else listEl.scrollTop = 0;
}
function renderSheet(keepScroll) {
  $('#sh-head').innerHTML = sheetHeadHTML(ui.month);
  renderPanes();
  trackSpring.jump(0);
  renderList(keepScroll);
}
function lockScroll(on) { document.documentElement.style.overflow = on ? 'hidden' : ''; }
function openMonth(m, opts) {
  opts = opts || {};
  closePopover(); closeResults(); closeMenu();
  const switching = m !== ui.month || sheet.hidden;
  ui.month = m;
  if (switching || !sheetState.open) renderSheet();
  if (!sheetState.open) {
    if (sheet.hidden) { sheet.hidden = false; scrim.hidden = false; measureFlip(m); sheetSpring.jump(0); }
    sheetState.open = true;
    scrim.style.pointerEvents = sheet.style.pointerEvents = 'auto';
    lockScroll(true);
    sheetSpring.set(1);
    requestAnimationFrame(() => { const b = $('[data-close-sheet]', sheet); if (b) b.focus({ preventScroll: true }); });
  }
  announce(`${MONTHS[m]} de ${Y}`);
  if (opts.focusDate) requestAnimationFrame(() => focusDay(opts.focusDate));
}
function closeMonth() {
  if (!sheetState.open) return;
  sheetState.open = false;
  const card = $(`.mcard[data-month="${ui.month}"]`);
  if (card) { card.scrollIntoView({ block: 'nearest' }); measureFlip(ui.month); }
  scrim.style.pointerEvents = sheet.style.pointerEvents = 'none';
  sheetSpring.set(0, { onRest: () => { sheet.hidden = true; scrim.hidden = true; lockScroll(false); yearEl.style.transform = ''; } });
  const h = card && card.querySelector('.mhead');
  if (h) h.focus({ preventScroll: true });
}
function focusDay(k) {
  const sec = document.getElementById('dg-' + k);
  const cell = $(`.mv-pane[data-m="${ui.month}"] [data-cell="${k}"]`);
  if (cell) { cell.classList.add('flash'); setTimeout(() => cell.classList.remove('flash'), 900); }
  if (sec) {
    sec.scrollIntoView({ block: 'start', behavior: RM.matches ? 'auto' : 'smooth' });
    sec.classList.add('flash'); setTimeout(() => sec.classList.remove('flash'), 60);
    return true;
  }
  return false;
}
function onCell(k) {
  if (focusDay(k)) return;
  if (editing) openEditor(null, k);
  else toast(`Nenhuma data em ${fmtLong(k)}.`);
}

/* Troca de mês: arrasto 1:1, projeção de impulso e mola com a velocidade do dedo */
let pendingDir = 0, drag = null, suppressClick = false;
const trackSpring = new Spring(0, {
  response: 0.38, precision: 0.5,
  onUpdate: x => { const W = vp.clientWidth || 1; const c = Math.max(-W, Math.min(W, x)); track.style.transform = `translate3d(calc(-100% / 3 + ${c}px),0,0)`; }
});
function commitMonth(dir, instant) {
  const W = vp.clientWidth || 1;
  const x = trackSpring.x;
  pendingDir = 0;
  ui.month += dir;
  $('#sh-head').innerHTML = sheetHeadHTML(ui.month);
  renderPanes();
  trackSpring.jump(instant ? 0 : x + dir * W);
  renderList();
  if (listEl.animate && !RM.matches) listEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  announce(`${MONTHS[ui.month]} de ${Y}`);
}
function settle(v) {
  const W = vp.clientWidth || 1, x = trackSpring.x, proj = x + project(v);
  let dir = 0;
  if (proj < -W / 2 && ui.month < 11) dir = 1;
  else if (proj > W / 2 && ui.month > 0) dir = -1;
  if (RM.matches) { if (dir) commitMonth(dir, true); else trackSpring.jump(0); return; }
  pendingDir = dir;
  trackSpring.set(dir ? -dir * W : 0, { velocity: v, onRest: dir ? () => commitMonth(dir) : null });
}
function navMonth(dir) {
  if (pendingDir) { const pd = pendingDir; trackSpring.stop(); commitMonth(pd); }
  const t = ui.month + dir;
  if (t < 0 || t > 11) { if (!RM.matches) trackSpring.set(0, { velocity: -dir * 900 }); return; }
  if (RM.matches) { commitMonth(dir, true); return; }
  pendingDir = dir;
  trackSpring.set(-dir * (vp.clientWidth || 1), { onRest: () => commitMonth(dir) });
}
vp.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const wasMoving = trackSpring.moving;
  if (wasMoving) { trackSpring.stop(); pendingDir = 0; }
  drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: e.clientX, start: trackSpring.x, active: false, wasMoving, hist: [{ x: e.clientX, t: performance.now() }] };
});
vp.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.active) {
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      drag.active = true; drag.x0 = e.clientX; drag.start = trackSpring.x;
      try { vp.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      vp.classList.add('dragging');
    } else if (Math.abs(dy) > 10) { const d = drag; drag = null; if (d.wasMoving) settle(0); return; }
    else return;
  }
  const W = vp.clientWidth || 1;
  let x = drag.start + (e.clientX - drag.x0);
  if (ui.month === 0 && x > 0) x = rubber(x, W);
  if (ui.month === 11 && x < 0) x = -rubber(-x, W);
  trackSpring.jump(Math.max(-W, Math.min(W, x)));
  const t = performance.now();
  drag.hist.push({ x: e.clientX, t });
  while (drag.hist.length > 2 && t - drag.hist[0].t > 100) drag.hist.shift();
});
function endDrag(e, cancel) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  vp.classList.remove('dragging');
  if (d.active) {
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
    const now = performance.now(), h = d.hist.filter(p => now - p.t < 100);
    const v = !cancel && h.length > 1 ? (h[h.length - 1].x - h[0].x) / Math.max(0.001, (h[h.length - 1].t - h[0].t) / 1000) : 0;
    settle(v);
  } else if (d.wasMoving) settle(0);
}
vp.addEventListener('pointerup', e => endDrag(e, false));
vp.addEventListener('pointercancel', e => endDrag(e, true));
let wheelAcc = 0, wheelLock = 0;
vp.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelAcc += e.deltaX;
  if (Math.abs(wheelAcc) > 60) { navMonth(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelLock = now + 480; }
}, { passive: false });
let hoverKey = '';
sheet.addEventListener('pointerover', e => {
  const t = e.target.closest('[data-dg],[data-cell]');
  const k = t ? (t.dataset.dg || t.dataset.cell) : '';
  if (k === hoverKey) return;
  hoverKey = k;
  $$('.hl', sheet).forEach(n => n.classList.remove('hl'));
  if (k) $$(`[data-cell="${k}"],[data-dg="${k}"]`, sheet).forEach(n => n.classList.add('hl'));
});

/* ---------- Busca ---------- */
let resultsOpen = false;
function renderResults() {
  const raw = qInput.value.trim(), q = norm(raw);
  if (q.length < 2) { closeResults(); return; }
  const hits = work.events.filter(ev => norm(`${ev.t} ${ev.n} ${(ev.inc || []).join(' ')} ${catOf(ev.c).label}`).indexOf(q) >= 0).slice(0, 40);
  results.innerHTML = hits.length
    ? hits.map(ev => `<button type="button" class="res" data-res="${ev.id}" style="--c:var(--c-${ev.c})"><span class="sw"></span><span class="res-d">${fmtShort(ev.d)}</span><span class="res-t">${esc(ev.t)}</span></button>`).join('')
    : `<p class="res-empty">Nada encontrado para “${esc(raw)}”.</p>`;
  results.hidden = false; resultsOpen = true;
}
function closeResults() { results.hidden = true; resultsOpen = false; }
qInput.addEventListener('input', renderResults);
qInput.addEventListener('focus', () => { if (qInput.value.trim().length >= 2) renderResults(); });
qInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { const f = $('.res', results); if (f) { e.preventDefault(); f.focus(); } }
  else if (e.key === 'Enter') { const f = $('.res', results); if (f) { e.preventDefault(); f.click(); } }
});
results.addEventListener('keydown', e => {
  const items = $$('.res', results), i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' && i < items.length - 1) { e.preventDefault(); items[i + 1].focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) items[i - 1].focus(); else qInput.focus(); }
});

/* ---------- Menu Arquivo ---------- */
let menuOpen = false;
function menuHTML() {
  const canWrite = mode !== 'readonly';
  return `<button type="button" class="mi" role="menuitem" data-export="csv"><b>Exportar planilha (.csv)</b><span>Abre no Excel, com todas as datas e observações</span></button>
    <button type="button" class="mi" role="menuitem" data-export="html"><b>Exportar página (.html)</b><span>Cópia que funciona offline, com as alterações atuais</span></button>
    <button type="button" class="mi" role="menuitem" data-export="json"><b>Exportar dados (.json)</b><span>Para levar os dados para o app local ou outra cópia</span></button>
    ${canWrite ? `<hr><button type="button" class="mi" role="menuitem" data-import><b>Importar dados…</b><span>Carrega um .json ou .html exportado daqui; dá para desfazer</span></button>` : ''}`;
}
function openMenu() {
  closePopover(); closeResults();
  menu.innerHTML = menuHTML();
  menu.hidden = false; menuOpen = true; btnExport.setAttribute('aria-expanded', 'true');
  const r = btnExport.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  menu.style.top = (r.bottom + 6) + 'px';
  menu.style.left = Math.max(12, Math.min(vw - menu.offsetWidth - 12, r.right - menu.offsetWidth)) + 'px';
  const f = $('.mi', menu); if (f) f.focus();
}
function closeMenu() { if (!menuOpen) return; menu.hidden = true; menuOpen = false; btnExport.setAttribute('aria-expanded', 'false'); }

/* ---------- Impressão completa em A4 paisagem ---------- */
const printShell = el('section', 'print-shell', { 'aria-label': 'Prévia de impressão' });
printShell.hidden = true;
printShell.innerHTML = `<div class="print-toolbar">
  <button type="button" class="btn" data-print-close>${I.left}<span>Voltar ao calendário</span></button>
  <label for="print-scope">Imprimir</label>
  <select id="print-scope"><option value="all">Ano completo</option>${MONTHS.map((name, m) => `<option value="${m}">${name}</option>`).join('')}</select>
  <span class="print-summary" id="print-summary" role="status"></span>
  <button type="button" class="btn primary" data-print-now>${I.print}<span>Imprimir / Salvar PDF</span></button>
  <p>A4 horizontal · Filtros da impressão: <span id="print-filters"></span></p>
</div><div class="print-pages" id="print-pages"></div>`;
document.body.appendChild(printShell);
const printPages = $('#print-pages', printShell);
const printState = { open: false, scope: 'all', focus: null, nativeOnly: false };
const printMonthEvents = m => work.events.filter(ev => visible(ev) && (!ui.onlyNew || ev.o === 'novo') && ev.d <= key(m, daysIn(m)) && (ev.e || ev.d) >= key(m, 1))
  .slice().sort((a, b) => a.d.localeCompare(b.d) || a.t.localeCompare(b.t, 'pt') || a.id.localeCompare(b.id));
function printFilterLabel() {
  const active = work.categories.filter(c => !ui.hidden.has(c.id));
  const categories = active.length === work.categories.length ? 'Todas as categorias' : active.map(c => c.label).join(' · ') || 'Nenhuma categoria selecionada';
  return categories + (ui.onlyNew ? ' · Só o que é novo em 2027' : '');
}
const printColor = ev => hexOk(catOf(ev.c).color) ? catOf(ev.c).color : '#A7B4C6';
const printRange = ev => fmtShort(ev.d) + (ev.e ? ' a ' + fmtShort(ev.e) : '');

function printItemHTML(ev, index) {
  return `<article class="p-item" data-print-event="${esc(ev.id)}" style="--event-color:${printColor(ev)}">
    <h3><span class="p-ref">${index + 1}</span><span>${esc(printRange(ev))} · ${esc(ev.t)}</span></h3>
    <p class="p-category">${esc(catOf(ev.c).label)}</p>
    ${ev.n ? `<p class="p-description">${esc(ev.n)}</p>` : ''}
    ${ev.inc && ev.inc.length ? `<ul class="p-includes">${ev.inc.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  </article>`;
}
function printPage(m, evs) {
  const page = el('section', 'p-page', { 'data-print-month': String(m), 'aria-label': `${MONTHS[m]} ${Y}` });
  const first = firstDow(m), dim = daysIn(m), weeks = Math.ceil((first + dim) / 7);
  let days = '<div class="p-day p-out"></div>'.repeat(first);
  for (let d = 1; d <= dim; d++) {
    const date = key(m, d), weekday = (first + d - 1) % 7;
    const hits = evs.map((ev, i) => ({ ev, i })).filter(x => x.ev.d <= date && (x.ev.e || x.ev.d) >= date);
    days += `<div class="p-day${weekday === 0 || weekday === 6 ? ' p-weekend' : ''}${hits.some(x => x.ev.c === 'feriado') ? ' p-holiday' : ''}">
      <b class="p-day-number">${d}</b><div class="p-markers">${hits.map(x => `<span style="--event-color:${printColor(x.ev)}">${x.i + 1}</span>`).join('')}</div></div>`;
  }
  days += '<div class="p-day p-out"></div>'.repeat(weeks * 7 - first - dim);
  const used = work.categories.filter(c => evs.some(ev => ev.c === c.id));
  const mo = work.months[m], hasEndo = evs.some(ev => catOf(ev.c).group === 'endo');
  page.innerHTML = `<header class="p-header"><div><p class="p-brand">SANTER EMPREENDIMENTOS · ENDOMARKETING</p><h1>${MONTHS[m]} <span>${Y}</span></h1></div>
    <div class="p-theme"><strong>${esc(hasEndo ? mo.camp || '' : 'Filtros da impressão')}</strong><span>${esc(hasEndo ? mo.tema || '' : printFilterLabel())}</span></div></header>
    <div class="p-body"><section class="p-calendar" aria-label="Calendário do mês">
      <div class="p-weekdays">${WD_ABBR.map(w => `<b>${w}</b>`).join('')}</div>
      <div class="p-grid" style="--weeks:${weeks}">${days}</div>
      <p class="p-key">Os números nas datas correspondem às descrições ao lado.</p>
      <div class="p-legend">${used.map(c => `<span><i style="background:${hexOk(c.color) ? c.color : '#A7B4C6'}"></i>${esc(c.label)}</span>`).join('')}</div>
    </section><aside class="p-side" aria-label="Descrições de ${MONTHS[m].toLowerCase()}">
      <h2>Datas e descrições <span>${evs.length} ${evs.length === 1 ? 'registro' : 'registros'}</span></h2>
      <div class="p-columns"><div class="p-col">${evs.map(printItemHTML).join('')}</div><div class="p-col"></div></div>
    </aside></div><footer class="p-footer"><span>Filtros: ${esc(printFilterLabel())}</span><span class="p-page-number"></span></footer>`;
  printPages.appendChild(page);
  return page;
}
function printItemHeight(node) {
  return node.getBoundingClientRect().height + parseFloat(getComputedStyle(node).marginBottom || '0');
}
function fitPrintPage(page) {
  const columns = $('.p-columns', page), cols = $$('.p-col', page), items = $$('.p-item', page);
  if (!items.length) { cols[0].innerHTML = '<p>Nenhuma data neste mês com os filtros selecionados.</p>'; return true; }
  for (let size = 9; size >= 7; size -= 0.25) {
    page.style.setProperty('--agenda-size', size + 'pt');
    cols[0].replaceChildren(...items); cols[1].replaceChildren();
    const heights = items.map(printItemHeight), sum = heights.reduce((a, b) => a + b, 0);
    let best = 0, left = 0, score = Infinity;
    for (let i = 0; i <= items.length; i++) {
      const candidate = Math.max(left, sum - left);
      if (candidate < score) { score = candidate; best = i; }
      left += heights[i] || 0;
    }
    cols[0].replaceChildren(...items.slice(0, best)); cols[1].replaceChildren(...items.slice(best));
    if (score <= columns.clientHeight - 2) return true;
  }
  return false;
}
function continuePrintPage(page, m, evs) {
  // Preserve every description when a user adds more content than one sheet holds.
  // Extra sheets repeat the month and references, keeping a readable minimum size.
  let items = $$('.p-item', page), current = page, col = 0, used = 0;
  const columns = $('.p-columns', page), capacity = columns.clientHeight - 3;
  $$('.p-col', page).forEach(n => n.replaceChildren());
  for (const item of items) {
    let dest = $$('.p-col', current)[col];
    dest.appendChild(item);
    const height = printItemHeight(item);
    if (used && used + height > capacity) {
      col++; used = 0;
      if (col === 2) {
        current = printPage(m, evs);
        current.classList.add('p-continuation');
        current.style.setProperty('--agenda-size', '7pt');
        $$('.p-col', current).forEach(n => n.replaceChildren());
        col = 0;
      }
      dest = $$('.p-col', current)[col]; dest.appendChild(item);
    }
    if (height > capacity) {
      // A single very long entry may flow naturally instead of being clipped.
      current.classList.add('p-long-entry');
    }
    used += height;
  }
}
function renderPrintPages() {
  printPages.replaceChildren();
  const selected = printState.scope === 'all' ? MONTHS.map((_, m) => m) : [Number(printState.scope)];
  selected.forEach(m => { const evs = printMonthEvents(m), page = printPage(m, evs); if (!fitPrintPage(page)) continuePrintPage(page, m, evs); });
  const pages = $$('.p-page', printPages);
  pages.forEach((page, i) => { $('.p-page-number', page).textContent = `${i + 1} / ${pages.length}`; });
  const count = new Set(selected.flatMap(m => printMonthEvents(m).map(ev => ev.id))).size;
  $('#print-summary', printShell).textContent = `${pages.length} ${pages.length === 1 ? 'folha' : 'folhas'} · ${plural(count, 'registro', 'registros')}`;
  $('#print-filters', printShell).textContent = printFilterLabel();
}
function openPrintPreview(scope) {
  closeMenu(); closePopover(); closeResults();
  printState.focus = document.activeElement;
  printState.scope = scope == null ? 'all' : String(scope);
  printState.open = true;
  printShell.hidden = false;
  document.body.classList.add('print-mode'); lockScroll(false);
  $('#print-scope', printShell).value = printState.scope;
  renderPrintPages();
  printShell.scrollTop = 0;
  $('[data-print-now]', printShell).focus({ preventScroll: true });
}
function closePrintPreview() {
  printState.open = false; printShell.hidden = true;
  document.body.classList.remove('print-mode'); lockScroll(sheetState.open);
  if (printState.focus && printState.focus.isConnected) printState.focus.focus({ preventScroll: true });
}
const calAtivo = () => { const m = document.getElementById('mod-cal'); return !m || !m.hidden; };
window.addEventListener('beforeprint', () => {
  if (!printState.open && calAtivo()) {
    printState.nativeOnly = true; printState.scope = 'all';
    printShell.hidden = false; document.body.classList.add('print-mode');
    renderPrintPages();
  }
});
window.addEventListener('afterprint', () => {
  if (printState.nativeOnly) { printState.nativeOnly = false; printShell.hidden = true; document.body.classList.remove('print-mode'); }
});

/* ---------- Avisos ---------- */
let toastTimer = 0, toastAction = null;
const toastSpring = new Spring(0, {
  response: 0.3, precision: 0.002,
  onUpdate: p => { toastWrap.style.opacity = clamp01(p); toastWrap.style.transform = RM.matches ? 'none' : `translateY(${(1 - p) * 14}px)`; }
});
function toast(msg, action) {
  clearTimeout(toastTimer);
  toastAction = action || null;
  toastEl.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="btn sm" id="toast-act">${esc(action.label)}</button>` : ''}`;
  if (toastWrap.hidden) { toastWrap.hidden = false; toastSpring.jump(0); }
  toastSpring.set(1);
  toastTimer = setTimeout(hideToast, action ? 6500 : 4200);
}
function hideToast() { clearTimeout(toastTimer); toastSpring.set(0, { onRest: () => { toastWrap.hidden = true; } }); }
let noticeActions = [];
function showNotice(text, actions) {
  noticeActions = actions || [];
  $('#notice').innerHTML = `<div class="notice" role="status"><p>${esc(text)}</p>${noticeActions.map((a, i) => `<button type="button" class="btn sm${i === 0 ? ' primary' : ''}" data-notice="${i}">${esc(a.label)}</button>`).join('')}</div>`;
}
function hideNotice() { $('#notice').innerHTML = ''; noticeActions = []; }

/* ---------- Edição ---------- */
const ebSpring = new Spring(0, {
  response: 0.34, precision: 0.002,
  onUpdate: p => { ebWrap.style.opacity = clamp01(p); ebWrap.style.transform = RM.matches ? 'none' : `translateY(${(1 - p) * 90}px)`; }
});
function dirtyCount() {
  let n = 0;
  const diff = (a, b) => {
    const A = new Map(a.map(x => [x.id, JSON.stringify(x)])), B = new Map(b.map(x => [x.id, JSON.stringify(x)]));
    B.forEach((s, id) => { if (A.get(id) !== s) n++; });
    A.forEach((s, id) => { if (!B.has(id)) n++; });
  };
  diff(saved.events, work.events);
  diff(saved.categories, work.categories);
  if (saved.categories.map(c => c.id).join() !== work.categories.map(c => c.id).join() && saved.categories.length === work.categories.length) n++;
  for (let m = 0; m < 12; m++) if (JSON.stringify(saved.months[m]) !== JSON.stringify(work.months[m])) n++;
  return n;
}
function updateEditbar() {
  const n = dirtyCount();
  $('#eb-status').textContent = n ? `${n} ${n === 1 ? 'alteração não salva' : 'alterações não salvas'}` : 'Tudo salvo';
  $('#eb-save').disabled = !n;
  $('#eb-discard').disabled = !n;
  $('#eb-undo').disabled = !history.length;
}
function setEditing(on) {
  if (!on && dirtyCount()) { toast('Salve ou descarte as alterações antes de sair da edição.'); return; }
  editing = on;
  document.body.classList.toggle('editing', on);
  btnEdit.setAttribute('aria-pressed', String(on));
  btnEdit.classList.toggle('on', on);
  btnEdit.classList.toggle('primary', !on);
  btnEdit.innerHTML = on ? `${I.check}<span>Concluir edição</span>` : `${I.pencil}<span>Editar</span>`;
  if (on) { ebWrap.hidden = false; ebSpring.set(1); } else ebSpring.set(0, { onRest: () => { ebWrap.hidden = true; } });
  updateEditbar();
  renderLegend();
  refreshPopover();
  if (!sheet.hidden) { $('#sh-head').innerHTML = sheetHeadHTML(ui.month); renderList(true); }
}
function afterChange() {
  syncCats();
  renderLegend(); renderYear();
  if (!sheet.hidden) { $('#sh-head').innerHTML = sheetHeadHTML(ui.month); renderPanes(); trackSpring.jump(0); renderList(true); }
  refreshPopover(); markSel(); updateEditbar();
  if (modalState.open && modalState.kind === 'cats') {
    if (mgr.skip) mgr.skip = false;
    else renderManager();
  }
}
function commit(fn) {
  history.push(JSON.stringify(work));
  if (history.length > 120) history.shift();
  fn(work);
  work.updated = new Date().toISOString();
  afterChange();
}
function undo() {
  if (!history.length) { toast('Nada para desfazer.'); return; }
  work = JSON.parse(history.pop());
  afterChange();
  toast('Alteração desfeita.');
}
function discard() {
  if (!dirtyCount()) return;
  history.push(JSON.stringify(work));
  work = clone(saved);
  afterChange();
  toast('Alterações descartadas.', { label: 'Desfazer', fn: undo });
}
function deleteEvent(id) {
  const ev = work.events.find(e => e.id === id);
  if (!ev) return;
  commit(w => { w.events = w.events.filter(e => e.id !== id); });
  if (modalState.kind === 'event') closeModal();
  toast(`“${ev.t}” foi excluída.`, { label: 'Desfazer', fn: undo });
}
const newId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* Janela (datas, campanha do mês e categorias) */
let modalState = { open: false, kind: '', id: null, ret: null };
const modalSpring = new Spring(0, {
  response: 0.3, precision: 0.002,
  onUpdate: p => {
    const q = clamp01(p);
    mScrim.style.opacity = q; modal.style.opacity = q;
    modal.style.transform = RM.matches ? 'translate(-50%,-50%)' : `translate(-50%,-50%) scale(${0.96 + 0.04 * p})`;
  }
});
function showModal(html, kind, id, wide) {
  closeMenu(); closeResults();
  modalState = { open: true, kind, id, ret: modalState.open ? modalState.ret : document.activeElement };
  modal.classList.toggle('wide', !!wide);
  modal.innerHTML = html;
  modal.scrollTop = 0;
  if (modal.hidden) { modal.hidden = false; mScrim.hidden = false; modalSpring.jump(0); }
  modalSpring.set(1);
  requestAnimationFrame(() => {
    const f = kind === 'cats' ? $('[data-close-modal]', modal) : $('input[type=text]', modal);
    if (f) f.focus({ preventScroll: true });
  });
}
function closeModal() {
  if (!modalState.open) return;
  modalState.open = false;
  modalSpring.set(0, { onRest: () => { modal.hidden = true; mScrim.hidden = true; } });
  const r = modalState.ret;
  if (r && document.contains(r)) r.focus({ preventScroll: true });
}
const groupOptions = sel => GROUPS.map(g => `<option value="${g.id}"${sel === g.id ? ' selected' : ''}>${g.label}</option>`).join('');
function swatchesHTML(name, current) {
  const cur = (current || '').toUpperCase();
  return `<div class="swatches" role="group" aria-label="Cor">${PRESETS.map(h => `<button type="button" class="swatch" style="--c:${h}" data-swatch="${name}" data-color="${h}" aria-label="Cor ${h}" aria-pressed="${h.toUpperCase() === cur}"></button>`).join('')}
    <label class="swatch-custom">Outra<input type="color" data-swatch-input="${name}" value="${hexOk(current) ? current.toLowerCase() : '#a7b4c6'}" aria-label="Escolher outra cor"></label></div>`;
}
function newCatFieldsHTML(prefix, color, group) {
  return `<div class="inline-fields">
      <div class="field"><label for="${prefix}-name">Nome da categoria</label><input id="${prefix}-name" type="text" autocomplete="off" placeholder="Ex.: Comunica Obras"><p class="err" id="err-${prefix}" hidden></p></div>
      <div class="field"><label for="${prefix}-group">Grupo</label><select id="${prefix}-group">${groupOptions(group)}</select></div>
    </div>
    <div class="field"><span class="mini-l">Cor</span><input type="hidden" id="${prefix}-color" value="${color}">${swatchesHTML(prefix, color)}</div>`;
}

/* Editor de data */
function openEditor(id, date) {
  const ev = id ? work.events.find(e => e.id === id) : null;
  if (id && !ev) return;
  const isNew = !ev;
  const d = ev || { d: date || key(sheet.hidden ? 0 : ui.month, 1), e: '', c: (work.categories.find(c => c.id === 'acao') || work.categories[0] || {}).id, t: '', n: '', o: 'novo', inc: [] };
  const radios = work.categories.map(c => `<label class="cat-opt" style="--c:var(--c-${c.id})"><input type="radio" name="ed-cat" value="${c.id}"${d.c === c.id ? ' checked' : ''}><span class="sw"></span><span>${esc(c.label)}</span></label>`).join('')
    + `<label class="cat-opt new"><input type="radio" name="ed-cat" value="__nova__"><span class="sw">${I.plus}</span><span>Nova categoria</span></label>`;
  showModal(`<form id="ed-form" novalidate>
    <div class="m-head"><h2 id="m-title">${isNew ? 'Nova data' : 'Editar data'}</h2><button type="button" class="btn sm icon ghost" data-close-modal aria-label="Fechar">${I.x}</button></div>
    <div class="field"><label for="ed-title">Nome</label><input id="ed-title" type="text" value="${esc(d.t)}" placeholder="Ex.: Breeze Endomarketing" autocomplete="off"><p class="err" id="err-title" hidden></p></div>
    <fieldset class="field"><legend>Categoria</legend><div class="cat-grid">${radios}</div>
      <div class="nc-box" id="ed-nc" hidden>${newCatFieldsHTML('nc', freeColor(), 'endo')}</div></fieldset>
    <div class="field-row">
      <div class="field"><label for="ed-date">Data</label><input id="ed-date" type="date" min="${Y}-01-01" max="${Y}-12-31" value="${d.d}"><p class="err" id="err-date" hidden></p></div>
      <div class="field"><label for="ed-end">Até <span class="hint">(opcional, para eventos de vários dias)</span></label><input id="ed-end" type="date" min="${Y}-01-01" max="${Y}-12-31" value="${d.e || ''}"><p class="err" id="err-end" hidden></p></div>
    </div>
    <div class="field"><label for="ed-note">Observação</label><textarea id="ed-note" rows="3" placeholder="Detalhes, responsável, local…">${esc(d.n)}</textarea></div>
    <details class="more"${d.inc && d.inc.length ? ' open' : ''}><summary>Lista de itens incluídos (ex.: profissões)</summary>
      <div class="field"><label for="ed-inc">Um item por linha</label><textarea id="ed-inc" rows="4">${esc((d.inc || []).join('\n'))}</textarea></div></details>
    <label class="check"><input type="checkbox" id="ed-new"${d.o === 'novo' ? ' checked' : ''}><span>Destacar como novidade de 2027</span></label>
    <div class="m-foot">${isNew ? '' : `<button type="button" class="btn danger" data-del-ev="${d.id}">${I.trash}<span>Excluir</span></button>`}<span class="sp"></span>
      <button type="button" class="btn" data-close-modal>Cancelar</button><button type="submit" class="btn primary">${isNew ? 'Adicionar' : 'Aplicar'}</button></div>
  </form>`, 'event', id);
}
function fieldError(id, msg) {
  const p = document.getElementById('err-' + id), inp = document.getElementById(id === 'nc' || id === 'rp' || id === 'cmnew' ? id + '-name' : 'ed-' + id);
  if (p) { p.hidden = !msg; p.textContent = msg || ''; }
  if (inp) inp.classList.toggle('invalid', !!msg);
  return !!msg;
}
function readNewCat(prefix) {
  const name = ($(`#${prefix}-name`, modal) || {}).value;
  const label = (name || '').trim();
  if (!label) { fieldError(prefix, 'Dê um nome para a categoria.'); return null; }
  if (work.categories.some(c => norm(c.label) === norm(label))) { fieldError(prefix, 'Já existe uma categoria com esse nome.'); return null; }
  fieldError(prefix, '');
  return { label, color: $(`#${prefix}-color`, modal).value, group: $(`#${prefix}-group`, modal).value };
}
function submitEditor() {
  const t = $('#ed-title').value.trim(), d = $('#ed-date').value;
  let e = $('#ed-end').value;
  let c = (modal.querySelector('input[name="ed-cat"]:checked') || {}).value || (work.categories[0] || {}).id;
  let bad = false;
  bad = fieldError('title', t ? '' : 'Dê um nome para a data.') || bad;
  bad = fieldError('date', /^2027-\d\d-\d\d$/.test(d) ? '' : 'Escolha um dia de 2027.') || bad;
  bad = fieldError('end', e && /^2027-/.test(d) && e < d ? 'A data final precisa ser igual ou depois do início.' : (e && !/^2027-\d\d-\d\d$/.test(e) ? 'Escolha um dia de 2027.' : '')) || bad;
  let nc = null;
  if (c === '__nova__') { nc = readNewCat('nc'); if (!nc) bad = true; }
  if (bad) { const f = $('.invalid', modal); if (f) f.focus(); return; }
  if (e === d) e = '';
  const n = $('#ed-note').value.trim();
  const inc = $('#ed-inc').value.split('\n').map(s => s.trim()).filter(Boolean);
  const isNew = !modalState.id;
  const prev = isNew ? null : work.events.find(x => x.id === modalState.id);
  const o = $('#ed-new').checked ? 'novo' : (prev && prev.o !== 'novo' ? prev.o : '');
  commit(w => {
    if (nc) { const cat = makeCat(nc, w); w.categories.push(cat); c = cat.id; }
    if (isNew) w.events.push({ d, e, c, t, n, o, inc, id: newId() });
    else { const x = w.events.find(z => z.id === modalState.id); if (x) Object.assign(x, { d, e, c, t, n, o, inc }); }
  });
  closeModal();
  toast(isNew ? `“${t}” adicionada em ${fmtShort(d)}${nc ? `, na nova categoria “${nc.label}”` : ''}.` : 'Alteração aplicada.');
  if (!sheet.hidden && parts(d).m === ui.month) requestAnimationFrame(() => focusDay(d));
}

/* Campanha do mês */
function openCampEditor(m) {
  const mo = work.months[m];
  const opts = Object.keys(CAMP_COLORS).map(k => `<option value="${k}"${mo.cor === k ? ' selected' : ''}>${CAMP_COLORS[k][0]}</option>`).join('');
  showModal(`<form id="camp-form" novalidate>
    <div class="m-head"><h2 id="m-title">Campanha de ${MONTHS[m].toLowerCase()}</h2><button type="button" class="btn sm icon ghost" data-close-modal aria-label="Fechar">${I.x}</button></div>
    <div class="field"><label for="cp-camp">Nome da campanha</label><input id="cp-camp" type="text" value="${esc(mo.camp)}" placeholder="Ex.: Outubro Rosa" autocomplete="off"></div>
    <div class="field"><label for="cp-tema">Tema</label><input id="cp-tema" type="text" value="${esc(mo.tema)}" placeholder="Ex.: Prevenção do câncer de mama" autocomplete="off"></div>
    <div class="field"><label for="cp-cor">Cor</label><select id="cp-cor">${opts}</select></div>
    <div class="m-foot"><span class="sp"></span><button type="button" class="btn" data-close-modal>Cancelar</button><button type="submit" class="btn primary">Aplicar</button></div>
  </form>`, 'camp', m);
}
function submitCamp() {
  const m = modalState.id;
  const v = { camp: $('#cp-camp').value.trim(), tema: $('#cp-tema').value.trim(), cor: $('#cp-cor').value };
  commit(w => { w.months[m] = v; });
  closeModal();
  toast('Campanha atualizada.');
}

/* ---------- Gerenciador de categorias ----------
   Criar, renomear, trocar cor e grupo, reordenar, substituir (move todas as datas para outra categoria, nova ou existente)
   e excluir (com todas as datas). Tudo entra na fila de alterações, com Desfazer, até Salvar. */
const mgr = { open: null, focus: '', skip: false };
function openCatManager() {
  if (mode === 'readonly') return;
  if (!editing) setEditing(true);
  mgr.open = null; mgr.focus = '';
  showModal(managerHTML(), 'cats', null, true);
}
function renderManager() {
  const st = modal.scrollTop;
  modal.innerHTML = managerHTML();
  modal.scrollTop = st;
  const sel = mgr.focus; mgr.focus = '';
  if (sel) { const f = $(sel, modal); if (f) f.focus({ preventScroll: true }); }
}
function managerHTML() {
  const counts = countByCat();
  const groups = GROUPS.map(g => {
    const list = work.categories.filter(c => c.group === g.id);
    return `<section class="cm-group"><h3 class="lg-label">${g.label}</h3>${list.length
      ? `<ul class="cm-list">${list.map((c, i) => catRowHTML(c, counts[c.id] || 0, i === 0, i === list.length - 1)).join('')}</ul>`
      : '<p class="m-sub" style="margin:0">Nenhuma categoria neste grupo.</p>'}</section>`;
  }).join('');
  const isNew = mgr.open && mgr.open.kind === 'new';
  const newBlock = isNew
    ? `<div class="cm-new-box"><div class="cm-panel">${newCatFieldsHTML('cmnew', freeColor(), 'endo')}
        <div class="cm-actions"><button type="button" class="btn primary" data-cm="do-create">Criar categoria</button><button type="button" class="btn ghost" data-cm="cancel">Cancelar</button></div></div></div>`
    : `<p><button type="button" class="btn" data-cm="new-open">${I.plus}<span>Nova categoria</span></button></p>`;
  return `<div class="m-head"><h2 id="m-title">Categorias</h2><button type="button" class="btn sm icon ghost" data-close-modal aria-label="Fechar">${I.x}</button></div>
    <p class="m-sub">Clique na cor para trocar cor e grupo, e no nome para renomear. <b>Substituir</b> leva todas as datas para outra categoria (nova ou existente); <b>Excluir</b> apaga a categoria com as datas. Tudo pode ser desfeito e só vale para todos depois de Salvar.</p>
    ${groups}${newBlock}
    <div class="m-foot"><span class="sp"></span><button type="button" class="btn primary" data-close-modal>Concluir</button></div>`;
}
function catRowHTML(c, n, first, last) {
  const open = mgr.open && mgr.open.id === c.id ? mgr.open.kind : '';
  const panel = open === 'look' ? lookPanel(c) : open === 'replace' ? replacePanel(c, n) : open === 'delete' ? deletePanel(c, n) : '';
  return `<li class="cm-row${open ? ' open' : ''}">
    <div class="cm-main">
      <button type="button" class="cm-sw" style="--c:var(--c-${c.id})" data-cm="look" data-id="${c.id}" aria-expanded="${open === 'look'}" aria-label="Cor e grupo de ${esc(c.label)}"></button>
      <input class="cm-name" type="text" value="${esc(c.label)}" data-cm-name="${c.id}" aria-label="Nome da categoria ${esc(c.label)}" autocomplete="off">
      <span class="cm-n">${plural(n, 'data', 'datas')}</span>
      <div class="cm-tools">
        <button type="button" class="btn sm icon ghost" data-cm="up" data-id="${c.id}" aria-label="Subir ${esc(c.label)}"${first ? ' disabled' : ''}>${I.up}</button>
        <button type="button" class="btn sm icon ghost" data-cm="down" data-id="${c.id}" aria-label="Descer ${esc(c.label)}"${last ? ' disabled' : ''}>${I.down}</button>
        <button type="button" class="btn sm ghost" data-cm="replace" data-id="${c.id}" aria-expanded="${open === 'replace'}">${I.swap}<span>Substituir</span></button>
        <button type="button" class="btn sm ghost danger" data-cm="delete" data-id="${c.id}" aria-expanded="${open === 'delete'}">${I.trash}<span>Excluir</span></button>
      </div>
    </div>${panel}</li>`;
}
function lookPanel(c) {
  return `<div class="cm-panel">
    <div class="field"><span class="mini-l">Cor</span>${swatchesHTML('look:' + c.id, c.color)}</div>
    <div class="field" style="max-width:280px"><label for="cm-group">Grupo</label><select id="cm-group" data-cm-group="${c.id}">${groupOptions(c.group)}</select></div>
  </div>`;
}
function replacePanel(c, n) {
  const others = work.categories.filter(x => x.id !== c.id);
  return `<div class="cm-panel">
    <p>${n ? `Mover as <b>${n}</b> ${n === 1 ? 'data' : 'datas'} de “${esc(c.label)}” para outra categoria e remover “${esc(c.label)}”.` : `“${esc(c.label)}” não tem datas. Escolha a categoria que fica no lugar dela.`}</p>
    <div class="field" style="max-width:360px"><label for="rp-target">Substituir por</label><select id="rp-target">
      <option value="__nova__" selected>Uma nova categoria…</option>${others.map(o => `<option value="${o.id}">${esc(o.label)}</option>`).join('')}</select></div>
    <div id="rp-new">${newCatFieldsHTML('rp', c.color, c.group)}</div>
    <div class="cm-actions"><button type="button" class="btn primary" data-cm="do-replace" data-id="${c.id}">${n ? `Mover ${plural(n, 'data', 'datas')} e remover “${esc(c.label)}”` : `Substituir “${esc(c.label)}”`}</button>
      <button type="button" class="btn ghost" data-cm="cancel">Cancelar</button></div>
  </div>`;
}
function deletePanel(c, n) {
  if (work.categories.length <= 1) return '<div class="cm-panel"><p>Mantenha pelo menos uma categoria.</p></div>';
  return `<div class="cm-panel">
    <p>${n ? `Excluir “${esc(c.label)}” e as <b>${n}</b> ${n === 1 ? 'data' : 'datas'} dela? Para manter as datas, use <b>Substituir</b>.` : `Excluir “${esc(c.label)}”? Ela não tem datas.`}</p>
    <div class="cm-actions"><button type="button" class="btn danger-fill" data-cm="do-delete" data-id="${c.id}">${n ? `Excluir categoria e ${plural(n, 'data', 'datas')}` : 'Excluir categoria'}</button>
      <button type="button" class="btn ghost" data-cm="cancel">Cancelar</button></div>
  </div>`;
}
function onManager(b) {
  const act = b.dataset.cm, id = b.dataset.id;
  const c = id ? work.categories.find(x => x.id === id) : null;
  if (act === 'look' || act === 'replace' || act === 'delete') {
    mgr.open = mgr.open && mgr.open.id === id && mgr.open.kind === act ? null : { id, kind: act };
    mgr.focus = mgr.open ? (act === 'replace' ? '#rp-name' : act === 'delete' ? '[data-cm="do-delete"]' : '.swatch[aria-pressed="true"],.swatch') : `[data-cm="${act}"][data-id="${id}"]`;
    renderManager(); return;
  }
  if (act === 'cancel') { const prev = mgr.open; mgr.open = null; mgr.focus = prev && prev.id ? `[data-cm="${prev.kind}"][data-id="${prev.id}"]` : '[data-cm="new-open"]'; renderManager(); return; }
  if (act === 'new-open') { mgr.open = { id: '__new__', kind: 'new' }; mgr.focus = '#cmnew-name'; renderManager(); return; }
  if ((act === 'up' || act === 'down') && c) {
    mgr.focus = `[data-cm="${act}"][data-id="${id}"]`;
    commit(w => {
      const same = w.categories.filter(x => x.group === c.group);
      const i = same.findIndex(x => x.id === id), j = act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= same.length) return;
      const a = w.categories.findIndex(x => x.id === same[i].id), bIdx = w.categories.findIndex(x => x.id === same[j].id);
      const tmp = w.categories[a]; w.categories[a] = w.categories[bIdx]; w.categories[bIdx] = tmp;
    });
    return;
  }
  if (act === 'do-create') {
    const spec = readNewCat('cmnew');
    if (!spec) { $('#cmnew-name', modal).focus(); return; }
    mgr.open = null; mgr.focus = '[data-cm="new-open"]';
    commit(w => { w.categories.push(makeCat(spec, w)); });
    toast(`Categoria “${spec.label}” criada.`, { label: 'Desfazer', fn: undo });
    return;
  }
  if (act === 'do-delete' && c) {
    if (work.categories.length <= 1) return;
    const n = work.events.filter(e => e.c === id).length;
    mgr.open = null; mgr.focus = '[data-close-modal]';
    commit(w => { w.events = w.events.filter(e => e.c !== id); w.categories = w.categories.filter(x => x.id !== id); });
    toast(n ? `“${c.label}” e ${plural(n, 'data', 'datas')} foram excluídas.` : `“${c.label}” foi excluída.`, { label: 'Desfazer', fn: undo });
    return;
  }
  if (act === 'do-replace' && c) {
    const target = $('#rp-target', modal).value;
    let spec = null, toLabel = '';
    if (target === '__nova__') { spec = readNewCat('rp'); if (!spec) { $('#rp-name', modal).focus(); return; } toLabel = spec.label; }
    else toLabel = catOf(target).label;
    const n = work.events.filter(e => e.c === id).length;
    mgr.open = null; mgr.focus = '[data-close-modal]';
    commit(w => {
      let to = target;
      if (spec) {
        const nc = makeCat(spec, w);
        w.categories.splice(w.categories.findIndex(x => x.id === id), 0, nc);
        to = nc.id;
      }
      w.events.forEach(e => { if (e.c === id) e.c = to; });
      w.categories = w.categories.filter(x => x.id !== id);
      if (ui.hidden.has(id)) ui.hidden.delete(id);
    });
    toast(n ? `${plural(n, 'data foi', 'datas foram')} para “${toLabel}” e “${c.label}” foi removida.` : `“${c.label}” foi substituída por “${toLabel}”.`, { label: 'Desfazer', fn: undo });
  }
}
function renameCat(id, value) {
  const c = work.categories.find(x => x.id === id);
  if (!c) return;
  const label = value.trim();
  if (!label) { toast('Dê um nome para a categoria.'); renderManager(); return; }
  if (label === c.label) return;
  /* O campo já mostra o nome novo: não redesenha a janela, para não engolir o clique que causou o blur */
  mgr.skip = true;
  commit(w => { const x = w.categories.find(z => z.id === id); if (x) x.label = label; });
}
function onSwatch(name, color) {
  if (!hexOk(color)) return;
  if (name.indexOf('look:') === 0) {
    const id = name.slice(5), c = work.categories.find(x => x.id === id);
    if (!c || c.color.toUpperCase() === color.toUpperCase()) return;
    mgr.focus = `.swatch[data-color="${color}"]`;
    commit(w => { const x = w.categories.find(z => z.id === id); if (x) { x.color = color.toUpperCase(); x.dark = ''; } });
    return;
  }
  const hidden = document.getElementById(name + '-color');
  if (hidden) hidden.value = color.toUpperCase();
  $$(`.swatch[data-swatch="${name}"]`, modal).forEach(s => s.setAttribute('aria-pressed', String(s.dataset.color.toUpperCase() === color.toUpperCase())));
}

/* ---------- Gravação ---------- */
function buildDocument(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' + SRC.reset + '</style></head><body>'
    + '<title>' + TITLE + '</title>' + LINKS + '<style id="app-css">' + SRC.css + '</style><div id="app"></div>'
    + '<script type="application/json" id="cal-data">' + json + '<\/script>'
    + '<script id="app-js">' + SRC.js + '<\/script>'
    + '</body></html>';
}
async function publishOnce(html) {
  try { return await artifactNS.publish(html); }
  catch (err) {
    if (err && err.code === 'upstream_error') {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 900));
      return artifactNS.publish(html);
    }
    throw err;
  }
}
async function reloadFromServer() {
  try {
    const r = await fetch(API, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    saved = normalize(await r.json()); work = clone(saved); history = [];
    hideNotice(); afterChange();
    toast('Versão salva carregada.');
  } catch (e) { toast('Não foi possível carregar os dados. Verifique se a janela do “Iniciar calendario” continua aberta.'); }
}
let saving = false;
async function save(force) {
  if (saving || !dirtyCount()) return;
  saving = true;
  const btn = $('#eb-save');
  btn.disabled = true; btn.textContent = 'Salvando…';
  work.updated = new Date().toISOString();
  const data = serialize(work);
  try {
    await capsReady;
    if (mode === 'server') {
      let r = null;
      try {
        const headers = { 'Content-Type': 'application/json; charset=utf-8', 'X-Versao': saved.updated || '' };
        if (force) headers['X-Sobrescrever'] = '1';
        r = await fetch(API, { method: 'PUT', headers, body: JSON.stringify(data) });
      } catch (e) { r = null; }
      if (!r) toast('Não foi possível falar com o servidor. Verifique se a janela do “Iniciar calendario” continua aberta.');
      else if (r.status === 409) {
        showNotice('Outra aba ou outra pessoa salvou uma versão mais nova do calendário depois que você abriu esta página.', [
          { label: 'Salvar a minha por cima', fn: () => { hideNotice(); save(true); } },
          { label: 'Carregar a versão salva', fn: reloadFromServer }
        ]);
      } else if (!r.ok) toast('O servidor recusou a gravação. Tente de novo; se continuar, reinicie o “Iniciar calendario”.');
      else { saved = clone(work); history = []; hideNotice(); rebuildVirtual(); toast(window.SANTER_PAGES ? 'Salvo neste navegador. Use Exportar backup completo para guardar todos os módulos.' : 'Salvo. A versão anterior ficou guardada em dados/backups.'); window.dispatchEvent(new CustomEvent('santer:calendario')); }
    } else if (mode === 'publish') {
      sess.set(K_DRAFT, JSON.stringify(data));
      try {
        await publishOnce(buildDocument(data));
        saved = clone(work); history = [];
        toast('Calendário salvo. Atualizando a página para todos…');
      } catch (err) {
        const code = err && err.code;
        if (code === 'conflict') {
          toast('Outra pessoa salvou uma versão mais nova. A página vai recarregar com ela, e você poderá recuperar suas alterações.');
        } else {
          sess.del(K_DRAFT);
          if (['not_writer', 'not_granted', 'consent_required', 'capability_disabled', 'capability_removed', 'not_declared'].indexOf(code) >= 0) {
            mode = 'readonly'; applyMode();
            toast('Seu acesso a este calendário é só de leitura. Peça acesso de edição a quem compartilhou o link.');
          } else if (code === 'rate_limited') toast('Muitas gravações seguidas. Espere alguns segundos e salve de novo.');
          else if (code === 'too_large') toast('O calendário ficou grande demais para salvar. Encurte algumas observações e tente de novo.');
          else toast('Não foi possível salvar agora. Tente de novo em instantes.');
        }
      }
    } else if (mode === 'local') {
      if (local.set(K_LOCAL, JSON.stringify(data))) {
        saved = clone(work); history = [];
        toast('Salvo neste navegador. Para levar a outro computador, use Arquivo → Exportar página.');
      } else toast('O navegador bloqueou o salvamento. Use Arquivo → Exportar página para não perder as alterações.');
    } else {
      toast('Este calendário está em modo de leitura.');
    }
  } finally {
    saving = false;
    btn.textContent = 'Salvar';
    updateEditbar();
  }
}

/* ---------- Exportar e importar ---------- */
function toCSV(s) {
  const q = v => { const t = String(v == null ? '' : v); return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const head = ['Data', 'Dia da semana', 'Até', 'Categoria', 'Grupo', 'Nome', 'Observação', 'Itens incluídos', 'Origem'];
  const rows = sortEvents(s.events.slice()).map(ev => [
    `${fmtShort(ev.d)}/${Y}`, WD_LONG[dowOf(ev.d)], ev.e ? `${fmtShort(ev.e)}/${Y}` : '', catOf(ev.c).label,
    groupLabel(catOf(ev.c).group), ev.t, ev.n || '', (ev.inc || []).join(' | '),
    ev.o === 'novo' ? 'Novo em 2027' : ev.o === '2026' ? 'Base 2026' : 'Calendário oficial'
  ]);
  return '﻿' + [head].concat(rows).map(r => r.map(q).join(';')).join('\r\n');
}
async function offerFile(filename, content) {
  await capsReady;
  if (downloadsNS) {
    try { await downloadsNS.save({ filename, data: content }); toast('Arquivo pronto.'); }
    catch (err) {
      const code = err && err.code;
      if (code === 'declined') return;
      toast(code === 'rate_limited' ? 'Já existe um download esperando confirmação.' : 'O download não está disponível nesta visualização.');
    }
    return;
  }
  if (mode === 'local' || mode === 'server') {
    try {
      const type = filename.endsWith('.csv') ? 'text/csv;charset=utf-8' : filename.endsWith('.json') ? 'application/json;charset=utf-8' : 'text/html;charset=utf-8';
      const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { toast('Não foi possível gerar o arquivo.'); }
    return;
  }
  toast('O download não está disponível nesta visualização.');
}
async function exportFile(kind) {
  closeMenu();
  if (kind === 'csv') return offerFile('calendario-endomarketing-2027.csv', toCSV(work));
  if (kind === 'json') return offerFile('calendario-endomarketing-2027.json', JSON.stringify(serialize(work), null, 1));
  try { await sources(); } catch (e) { toast('Não foi possível montar a página para exportar.'); return; }
  if (!SRC.css || !SRC.js) { toast('Não foi possível montar a página para exportar.'); return; }
  return offerFile('calendario-endomarketing-2027.html', buildDocument(serialize(work)));
}
function importText(text, name) {
  let raw = null;
  try {
    const s = text.trim();
    if (s[0] === '{') raw = JSON.parse(s);
    else { const m = s.match(/<script[^>]*id="cal-data"[^>]*>([\s\S]*?)<\/script>/i); if (m) raw = JSON.parse(m[1]); }
  } catch (e) { raw = null; }
  if (!raw || !Array.isArray(raw.events)) { toast('Esse arquivo não tem dados do calendário. Use um .json ou .html exportado por este calendário.'); return; }
  const d = normalize(raw);
  if (!editing) setEditing(true);
  commit(w => { Object.assign(w, clone(d)); });
  toast(`${plural(d.events.length, 'data importada', 'datas importadas')} de “${name}”. Revise e salve.`, { label: 'Desfazer', fn: undo });
}
fileInput.addEventListener('change', () => {
  const f = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => importText(String(reader.result || ''), f.name);
  reader.onerror = () => toast('Não foi possível ler o arquivo.');
  reader.readAsText(f, 'utf-8');
});

/* ---------- Modo (servidor local / publicar no Claude / navegador / leitura) ---------- */
function applyMode() {
  btnEdit.hidden = mode === 'readonly';
  btnExport.hidden = !(mode === 'local' || mode === 'server' || downloadsNS);
  if (mode === 'readonly' && editing) {
    editing = false;
    document.body.classList.remove('editing');
    ebSpring.set(0, { onRest: () => { ebWrap.hidden = true; } });
    if (modalState.open) closeModal();
    afterChange();
  }
}
async function initCaps() {
  if (mode !== 'pending') { applyMode(); return; }
  try {
    const got = await Promise.all(['artifact', 'downloads', 'user'].map(n => Promise.resolve().then(() => window.claude.use(n)).catch(() => null)));
    downloadsNS = got[1] || null;
    if (got[0]) {
      artifactNS = got[0]; mode = 'publish';
      if (got[2] && typeof got[2].canEdit === 'function') {
        const ok = await got[2].canEdit().catch(() => null);
        if (ok === false) mode = 'readonly';
      }
    } else mode = 'readonly';
  } catch (e) { mode = 'readonly'; }
  applyMode();
}
function fmtStamp(iso) {
  const t = new Date(iso);
  return isNaN(t) ? 'data desconhecida' : `${pad(t.getDate())}/${pad(t.getMonth() + 1)} às ${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
function checkLocal() {
  if (mode !== 'local') return;
  const raw = local.get(K_LOCAL);
  if (!raw) return;
  let d;
  try { d = normalize(JSON.parse(raw)); } catch (e) { return; }
  if (sig(d) === sig(saved) || (d.updated || '') < (saved.updated || '')) return;
  saved = d; work = clone(d);
  showNotice(`Mostrando as alterações salvas neste navegador em ${fmtStamp(d.updated)}.`, [
    { label: 'Voltar à versão do arquivo', fn: () => { local.del(K_LOCAL); saved = normalize(SEED || {}); work = clone(saved); history = []; hideNotice(); afterChange(); toast('Versão do arquivo restaurada.'); } }
  ]);
}
function checkDraft() {
  if (mode !== 'pending') return;
  const raw = sess.get(K_DRAFT);
  if (!raw) return;
  let d;
  try { d = normalize(JSON.parse(raw)); } catch (e) { sess.del(K_DRAFT); return; }
  if (sig(d) === sig(saved)) { sess.del(K_DRAFT); pendingToast = 'Alterações salvas e publicadas.'; return; }
  showNotice('Suas últimas alterações não foram publicadas porque outra pessoa salvou antes. Ao recuperar, a sua versão substitui a que está publicada.', [
    { label: 'Recuperar minhas alterações', fn: () => { history.push(JSON.stringify(work)); work = d; sess.del(K_DRAFT); hideNotice(); if (!editing) setEditing(true); afterChange(); toast('Alterações recuperadas. Revise e salve.'); } },
    { label: 'Descartar', fn: () => { sess.del(K_DRAFT); hideNotice(); } }
  ]);
}

/* ---------- Eventos ---------- */
function toggleCat(c) {
  if (ui.hidden.has(c)) { ui.hidden.delete(c); if (c === 'lyr-li') loadLinkedIn(); } else ui.hidden.add(c);
  local.set(K_FILTERS, JSON.stringify(Array.from(ui.hidden)));
  renderLegend(); renderYear(); refreshPopover(); markSel();
  if (!sheet.hidden) { renderPanes(); trackSpring.jump(0); renderList(true); }
}
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('#btn-print')) { openPrintPreview('all'); return; }
  if (t.closest('[data-print-now]')) { window.print(); return; }
  if (t.closest('[data-print-close]')) { closePrintPreview(); return; }
  const printMonth = t.closest('[data-print-month]');
  if (printMonth) { openPrintPreview(printMonth.dataset.printMonth); return; }
  if (suppressClick && t.closest('#mv-vp')) { e.preventDefault(); e.stopPropagation(); suppressClick = false; return; }
  let b;
  if (t === scrim) { closeMonth(); return; }
  if (t === mScrim) { closeModal(); return; }
  if ((b = t.closest('#toast-act'))) { const a = toastAction; hideToast(); if (a) a.fn(); return; }
  if ((b = t.closest('[data-notice]'))) { const a = noticeActions[+b.dataset.notice]; if (a) a.fn(); return; }
  if ((b = t.closest('[data-close-modal]'))) { closeModal(); return; }
  if ((b = t.closest('[data-swatch]'))) { onSwatch(b.dataset.swatch, b.dataset.color); return; }
  if ((b = t.closest('[data-cm]'))) { onManager(b); return; }
  if ((b = t.closest('[data-open-cats]'))) { openCatManager(); return; }
  if ((b = t.closest('[data-edit-ev]'))) { openEditor(b.dataset.editEv); return; }
  if ((b = t.closest('[data-del-ev]'))) { deleteEvent(b.dataset.delEv); return; }
  if ((b = t.closest('[data-add-date]'))) { openEditor(null, b.dataset.addDate); return; }
  if ((b = t.closest('[data-edit-camp]'))) { openCampEditor(+b.dataset.editCamp); return; }
  if ((b = t.closest('[data-close-pop]'))) { closePopover(true); return; }
  if ((b = t.closest('[data-close-sheet]'))) { closeMonth(); return; }
  if ((b = t.closest('[data-nav]'))) { navMonth(+b.dataset.nav); return; }
  if ((b = t.closest('[data-cell]'))) { onCell(b.dataset.cell); return; }
  if ((b = t.closest('[data-res]'))) {
    const ev = work.events.find(x => x.id === b.dataset.res);
    closeResults();
    if (ev) openMonth(parts(ev.d).m, { focusDate: ev.d });
    return;
  }
  if ((b = t.closest('[data-open-month]'))) { openMonth(+b.dataset.openMonth, { focusDate: b.dataset.focus }); return; }
  if ((b = t.closest('.day[data-date]'))) { openPopover(b.dataset.date, b); return; }
  if ((b = t.closest('.mcard'))) { openMonth(+b.dataset.month); return; }
  if ((b = t.closest('[data-cat]'))) { toggleCat(b.dataset.cat); return; }
  if ((b = t.closest('[data-only-new]'))) {
    ui.onlyNew = !ui.onlyNew;
    renderLegend(); renderYear(); markSel();
    toast(ui.onlyNew ? 'Destacando o que é novo em 2027.' : 'Mostrando todas as datas.');
    return;
  }
  if ((b = t.closest('[data-export]'))) { exportFile(b.dataset.export); return; }
  if ((b = t.closest('[data-import]'))) { closeMenu(); fileInput.click(); return; }
  if (t.closest('#btn-export')) { if (menuOpen) closeMenu(); else openMenu(); return; }
  if (t.closest('#btn-edit')) { setEditing(!editing); return; }
  if (t.closest('#eb-save')) { save(); return; }
  if (t.closest('#eb-undo')) { undo(); return; }
  if (t.closest('#eb-discard')) { discard(); return; }
  if (t.closest('#eb-cats')) { openCatManager(); return; }
  if (t.closest('#eb-add')) { openEditor(null, popState.open ? ui.popDate : (sheet.hidden ? (TODAY || `${Y}-01-01`) : key(ui.month, 1))); return; }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'ed-form') { e.preventDefault(); submitEditor(); }
  else if (e.target.id === 'camp-form') { e.preventDefault(); submitCamp(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'print-scope') { printState.scope = t.value; renderPrintPages(); printShell.scrollTop = 0; return; }
  if (t.name === 'ed-cat') { const w = $('#ed-nc'); if (w) w.hidden = t.value !== '__nova__'; if (t.value === '__nova__') { const n = $('#nc-name'); if (n) n.focus(); } return; }
  if (t.id === 'rp-target') { const w = $('#rp-new'); if (w) w.hidden = t.value !== '__nova__'; return; }
  if (t.dataset && t.dataset.cmName) { renameCat(t.dataset.cmName, t.value); return; }
  if (t.dataset && t.dataset.cmGroup) {
    const id = t.dataset.cmGroup, g = t.value;
    mgr.focus = '#cm-group';
    commit(w => { const x = w.categories.find(z => z.id === id); if (x) x.group = g; });
    return;
  }
  if (t.dataset && t.dataset.swatchInput) onSwatch(t.dataset.swatchInput, t.value);
});
document.addEventListener('input', e => {
  const t = e.target, id = t.id;
  if (id === 'ed-title' || id === 'ed-date' || id === 'ed-end') fieldError(id.slice(3), '');
  if (id === 'nc-name' || id === 'rp-name' || id === 'cmnew-name') fieldError(id.slice(0, -5), '');
  if (t.dataset && t.dataset.swatchInput && t.dataset.swatchInput.indexOf('look:') !== 0) onSwatch(t.dataset.swatchInput, t.value);
});
document.addEventListener('pointerdown', e => {
  const t = e.target;
  if (popState.open && !pop.contains(t) && !t.closest('.day')) closePopover();
  if (menuOpen && !menu.contains(t) && !t.closest('#btn-export')) closeMenu();
  if (resultsOpen && !t.closest('#search')) closeResults();
}, true);
function trapFocus(e, root) {
  const f = $$('button:not([disabled]),input:not([disabled]):not([type=hidden]),textarea,select,a[href],summary,[tabindex]:not([tabindex="-1"])', root).filter(n => n.offsetParent !== null && !n.closest('[inert]'));
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
const isTyping = n => n && (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT' || n.isContentEditable);
document.addEventListener('keydown', e => {
  if (printState.open) {
    if (e.key === 'Escape') { e.preventDefault(); closePrintPreview(); }
    else if (e.key === 'Tab') trapFocus(e, printShell);
    return;
  }
  if (e.key === 'Enter' && modalState.kind === 'cats' && e.target.tagName === 'INPUT') {
    if (e.target.dataset.cmName) { e.preventDefault(); e.target.blur(); return; }
    if (e.target.id === 'rp-name') { e.preventDefault(); const b = $('[data-cm="do-replace"]', modal); if (b) b.click(); return; }
    if (e.target.id === 'cmnew-name') { e.preventDefault(); const b = $('[data-cm="do-create"]', modal); if (b) b.click(); return; }
  }
  if (e.key === 'Escape') {
    if (modalState.open && modalState.kind === 'cats' && mgr.open) { mgr.open = null; renderManager(); return; }
    if (modalState.open) { closeModal(); return; }
    if (menuOpen) { closeMenu(); btnExport.focus(); return; }
    if (popState.open) { closePopover(true); return; }
    if (resultsOpen) { closeResults(); qInput.focus(); return; }
    if (sheetState.open) { closeMonth(); return; }
  }
  if (e.key === 'Tab') {
    if (modalState.open) trapFocus(e, modal);
    else if (sheetState.open) trapFocus(e, sheet);
  }
  if (sheetState.open && !modalState.open && !isTyping(e.target)) {
    if (e.key === 'ArrowRight') { e.preventDefault(); navMonth(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); navMonth(-1); }
  }
  if (editing && calAtivo() && (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !isTyping(e.target)) { e.preventDefault(); undo(); }
});
window.addEventListener('scroll', () => {
  top.classList.toggle('scrolled', window.scrollY > 4);
  if (popState.open) closePopover();
  if (menuOpen) closeMenu();
}, { passive: true });
window.addEventListener('resize', () => {
  if (popState.open) closePopover();
  if (menuOpen) closeMenu();
  if (!sheet.hidden) trackSpring.jump(0);
});
window.addEventListener('beforeunload', e => { if ((mode === 'local' || mode === 'server') && dirtyCount()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- API para o módulo Endomarketing 2027 ----------
   O módulo lê os eventos oficiais (versão salva) e, quando uma ação está aprovada, pede para publicar
   ou atualizar o evento correspondente. Toda gravação passa pelo mesmo controle de versão do botão Salvar. */
let readyResolve; const calReady = new Promise(r => { readyResolve = r; });
const dataOk = s => /^2027-\d\d-\d\d$/.test(s || '');
async function persistNow(mutate, check) {
  await capsReady;
  if (check && !check()) return { ok: false, erro: 'Data inválida: informe uma data de 2027 (AAAA-MM-DD).' };
  if (mode !== 'server') return { ok: false, erro: 'Publicar no calendário só funciona no app local (Iniciar calendario).' };
  if (dirtyCount()) return { ok: false, erro: 'O calendário tem alterações não salvas. Salve ou descarte no calendário antes de publicar daqui.' };
  const before = clone(work);
  const result = mutate(work);
  work.updated = new Date().toISOString();
  let r = null;
  try { r = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Versao': saved.updated || '' }, body: JSON.stringify(serialize(work)) }); } catch (e) { r = null; }
  if (!r || !r.ok) {
    work = before; afterChange();
    return { ok: false, erro: !r ? 'Não foi possível falar com o servidor.' : r.status === 409 ? 'Outra pessoa salvou o calendário agora há pouco. Recarregue a página e tente de novo.' : 'O servidor recusou a gravação.' };
  }
  saved = clone(work); history = [];
  rebuildVirtual(); afterChange();
  window.dispatchEvent(new CustomEvent('santer:calendario'));
  return Object.assign({ ok: true }, result || {});
}
const pubEvent = ev => ev ? { id: ev.id, d: ev.d, e: ev.e, c: ev.c, t: ev.t, n: ev.n, o: ev.o, cat: catOf(ev.c).label, group: catOf(ev.c).group } : null;
window.SanterCal = {
  ready: calReady,
  /** Eventos oficiais (versão salva no arquivo), sem as camadas de planejamento. */
  events: () => saved.events.map(pubEvent),
  event: id => pubEvent(saved.events.find(e => e.id === id)),
  categories: () => saved.categories.map(c => ({ id: c.id, label: c.label, group: c.group })),
  canPublish: () => mode === 'server' && !dirtyCount(),
  /** Cria eventos oficiais. specs: [{ d, e, t, n, c? }] → { ok, ids } */
  addEvents: specs => persistNow(w => {
    const cat = (w.categories.find(c => c.id === 'acoes-endomarketing') || w.categories.find(c => c.group === 'endo') || w.categories[0]).id;
    const ids = specs.map(s => { const id = newId(); w.events.push({ d: s.d, e: s.e && s.e > s.d ? s.e : '', c: s.c && w.categories.some(c => c.id === s.c) ? s.c : cat, t: s.t, n: s.n || '', o: 'novo', inc: [], id }); return id; });
    return { ids };
  }, () => Array.isArray(specs) && specs.length > 0 && specs.every(s => dataOk(s.d) && (!s.e || dataOk(s.e)))),
  /** Atualiza um evento oficial vinculado (só quando o usuário pede). */
  updateEvent: (id, patch) => persistNow(w => { const x = w.events.find(e => e.id === id); if (x) Object.assign(x, patch); return { found: !!x }; }, () => (!('d' in patch) || dataOk(patch.d)) && (!patch.e || dataOk(patch.e))),
  openDate: date => { if (/^2027-\d\d-\d\d$/.test(date || '')) openMonth(parts(date).m, { focusDate: date }); },
  closeOverlays: () => { closePopover(); closeMenu(); closeResults(); if (modalState.open) closeModal(); if (sheetState.open) closeMonth(); if (printState.open) closePrintPreview(); },
  refreshLayers: () => { rebuildVirtual(); redrawLayers(); }
};

/* ---------- Início ---------- */
function start() {
  syncCats();
  checkLocal();
  checkDraft();
  syncCats();
  rebuildVirtual();
  renderLegend();
  renderYear();
  updateEditbar();
  capsReady = initCaps();
  if (pendingToast) toast(pendingToast);
  (window.requestIdleCallback || (f => setTimeout(f, 200)))(initLayers, { timeout: 700 });
  readyResolve();
}
if (SEED || mode === 'pending' || !/^https?:$/.test(location.protocol)) {
  start();
  if (!SEED && mode === 'local') showNotice('Os dados do calendário não foram encontrados. Abra o app pelo arquivo “Iniciar calendario.bat”.', []);
} else {
  syncCats();
  yearEl.innerHTML = '<p class="loading">Carregando o calendário…</p>';
  fetch(API, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(data => { mode = 'server'; SEED = data; saved = normalize(data); work = clone(saved); start(); })
    .catch(() => { start(); showNotice('Não foi possível carregar os dados do servidor. Abra o app pelo arquivo “Iniciar calendario.bat” e mantenha a janela aberta.', []); });
}
})();
