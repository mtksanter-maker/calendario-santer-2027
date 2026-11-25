/* Endomarketing 2027 — núcleo do módulo.
   Dados: SanterDados (fonte única, gravação versionada). Edição: campos com data-b="conjunto:caminho"
   gravam sozinhos (salvamento automático com controle de conflito) e podem ser desfeitos.
   As telas ficam em arquivos próprios (js/endo/*.js) e só são baixadas quando abertas. */
(() => {
  'use strict';
  const D = window.SanterDados;
  const root = document.getElementById('mod-endo');
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const pad = n => String(n).padStart(2, '0');
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const brl = (v, dec) => v == null || !isFinite(v) ? '—' : 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec == null ? 2 : dec, maximumFractionDigits: dec == null ? 2 : dec });
  const brl0 = v => brl(v, 0);
  const n1 = v => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const fd = iso => { if (!/^\d{4}-\d\d-\d\d/.test(iso || '')) return iso || ''; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}${y !== '2027' ? '/' + y : ''}`; };
  const fdl = iso => { if (!/^\d{4}-\d\d-\d\d/.test(iso || '')) return iso || ''; const [y, m, d] = iso.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return `${WD[w]}, ${d} ${MES3[m - 1]}${y !== 2027 ? ' ' + y : ''}`; };
  const uid = p => (p || 'x') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const svg = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    left: svg('<path d="m15 5-7 7 7 7"/>'), right: svg('<path d="m9 5 7 7-7 7"/>'), x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'), trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
    copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>'),
    edit: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'), undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    cal: svg('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'), link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    ext: svg('<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>'), check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'), alert: svg('<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4.5M12 17.5v.01"/>'),
    grid: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    list: svg('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'), chev: svg('<path d="m9 6 6 6-6 6"/>'), down: svg('<path d="m6 9 6 6 6-6"/>')
  };

  /* ---------- Vocabulário ---------- */
  const STATUS = [
    ['planejado', 'Planejado', ''], ['aguardando-validacao', 'Aguardando validação', 'warn'], ['aprovado', 'Aprovado', 'info'],
    ['em-execucao', 'Em execução', 'accent'], ['executado', 'Executado', 'ok'], ['avaliado', 'Avaliado', 'ok'], ['cancelado', 'Cancelado', 'danger']
  ];
  const ST_LI = [['proposta', 'Proposta', ''], ['em-producao', 'Em produção', 'warn'], ['aprovado', 'Aprovado', 'info'], ['agendado', 'Agendado', 'accent'], ['publicado', 'Publicado', 'ok'], ['cancelado', 'Cancelado', 'danger']];
  const stInfo = (s, list) => (list || STATUS).find(x => x[0] === s) || [s, s || '—', ''];
  const CURTO = { 'aguardando-validacao': 'Em validação', 'em-execucao': 'Em execução', 'em-producao': 'Produção' };
  const pill = (s, list, curto) => { const x = stInfo(s, list); return `<span class="pill ${x[2]}" title="${esc(x[1])}"><i class="dot"></i>${esc(curto && CURTO[s] ? CURTO[s] : x[1])}</span>`; };
  const APROVADO = new Set(['aprovado', 'em-execucao', 'executado', 'avaliado']);
  const REALIZADO = new Set(['executado', 'avaliado']);
  const FRENTES = { SA: 'Saúde e acolhimento', VF: 'Vida financeira', FM: 'Incentivo a fazer melhor', RC: 'Rotina e conveniência', Todas: 'Todas as frentes' };
  const frente = id => id ? `<span class="tag" title="${esc(FRENTES[id] || id)}">${esc(id)}</span>` : '';
  const CARGA = { baixa: ['Baixa', 1], media: ['Média', 2], alta: ['Alta', 3] };
  const carga = c => { const k = (c && c.nivel) || ''; const x = CARGA[k] || ['—', 0]; return `<span class="load l${x[1]}" title="Carga operacional do mês${c && c.pontos != null ? ': ' + c.pontos + ' pontos' : ''}"><i></i><i></i><i></i><b>${x[0]}</b></span>`; };

  /* ---------- Cálculos (sempre a partir dos dados editáveis) ---------- */
  const isNum = v => typeof v === 'number' && isFinite(v);
  function orc(o, P) {
    P = P || (st.plano && st.plano.parametros) || { tetoPequena: 15, tetoGrande: 90 };
    const r = { sede: 0, extensao: 0, pendentes: 0, itens: 0, subtotal: 0, total: 0, realizado: 0, porPessoa: null, porElegivel: null, classe: 'sem-desembolso' };
    if (!o) return r;
    (o.itens || []).forEach(it => {
      if (it.incluir === false) return;
      r.itens++;
      if (!isNum(it.unitario) || !isNum(it.qtd)) { r.pendentes++; return; }
      const v = it.qtd * it.unitario;
      if (it.grupo === 'extensao') r.extensao += v; else r.sede += v;
    });
    const k = 1 + (isNum(o.contingenciaPct) ? o.contingenciaPct : 0) / 100;
    r.subtotal = r.sede + r.extensao;
    r.sede *= k; r.extensao *= k; r.total = r.sede + r.extensao;
    r.realizado = (o.realizado || []).reduce((a, x) => a + (isNum(x.valor) ? x.valor : 0), 0);
    if (o.beneficiariosSede) r.porPessoa = r.sede / o.beneficiariosSede;
    if (o.elegiveisExtensao) r.porElegivel = r.extensao / o.elegiveisExtensao;
    const pp = Math.max(r.porPessoa || 0, r.porElegivel || 0);
    const semDenominador = (r.sede > 0 && !o.beneficiariosSede) || (r.extensao > 0 && !o.elegiveisExtensao);
    // Itens a cotar ou sem denominador: não se classifica nem se confere teto (pendente não vira zero)
    if (r.pendentes || semDenominador) { r.classe = 'a-cotar'; r.dentroDoTeto = null; return r; }
    r.classe = r.total === 0 ? 'sem-desembolso' : pp <= P.tetoPequena ? 'pequena' : pp <= P.tetoGrande ? 'grande' : 'acima-do-teto';
    r.dentroDoTeto = !o.teto || pp <= o.teto + 1e-9;
    return r;
  }
  const CLASSE = { 'sem-desembolso': 'Sem desembolso adicional', pequena: 'Pequena (até R$ 15/pessoa)', grande: 'Maior (até R$ 90/pessoa)', 'acima-do-teto': 'Acima do teto', 'a-cotar': 'A cotar (classificação pendente)' };
  function imp(mo) {
    const i = mo.impacto || {};
    const minutos = isNum(i.minutosPorPessoa) ? i.minutosPorPessoa + (isNum(i.deslocamentoMin) ? i.deslocamentoMin : 0) : null;
    const calc = minutos != null && isNum(i.participantes) ? i.participantes * minutos / 60 : null;
    const colab = calc != null ? calc : (isNum(i.horasColaboradoresFicha) ? i.horasColaboradoresFicha : null);
    const equipe = (i.horasEquipe || []).reduce((a, h) => a + (isNum(h.horas) ? h.horas : 0), 0);
    return { minutos, colab, colabFonte: calc != null ? 'calculado' : colab != null ? 'ficha' : 'pendente', equipe, total: (colab || 0) + equipe, max: isNum(i.maxSimultaneos) ? i.maxSimultaneos : null };
  }
  function prog(p) {
    const ativas = (p.sessoes || []);
    const porMes = Array(12).fill(0);
    ativas.forEach(d => { const m = +d.slice(5, 7) - 1; if (m >= 0) porMes[m]++; });
    const pessoas = isNum(p.adesaoPrevista) ? p.adesaoPrevista : (p.participantesTeto || 0);
    const min = isNum(p.minutosPorParticipante) ? p.minutosPorParticipante : ((p.minutosExercicio || 0) + (p.minutosDeslocamento || 0) + (p.minutosEspera || 0));
    const hSessao = pessoas * min / 60;
    const custoSessao = isNum(p.custoPorSessao) ? p.custoPorSessao : null;
    return {
      sessoes: ativas.length, porMes, pessoas, base: isNum(p.adesaoPrevista) ? 'adesão prevista' : 'teto de participantes', min, hSessao,
      hMes: porMes.map(n => n * hSessao), hAno: ativas.length * hSessao,
      orgMes: isNum(p.horasOrganizacaoMes) ? p.horasOrganizacaoMes : null,
      custoMes: custoSessao == null ? null : porMes.map(n => n * custoSessao), custoAno: custoSessao == null ? null : ativas.length * custoSessao,
      custoPessoa: custoSessao == null || !pessoas ? null : (ativas.length * custoSessao) / pessoas,
      realizadas: (p.sessoesRealizadas || []).length
    };
  }
  function expCalc(x) {
    const o = x.orcamento || {};
    return orc(Object.assign({ beneficiariosSede: x.inscricoesBase || x.participantesTeto || null }, o));
  }

  /* ---------- Estado e gravação ---------- */
  /* Estado por conjunto: versão local (cada edição soma 1), versão já gravada, conflitos e erros separados.
     Uma gravação só é considerada concluída se nada mudou enquanto ela estava a caminho. */
  const st = { plano: null, saving: {}, status: 'ok', when: null, conflitos: new Set(), erros: new Set() };
  const undo = [];
  const timers = {};
  const pend = new Set();
  const ver = {}, gravada = {};
  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, v) { const ks = path.split('.'); const last = ks.pop(); const o = ks.reduce((a, k) => a[k], obj); o[last] = v; }
  function data(name) { return D.peek(name); }
  function change(name, mutate, opts) {
    opts = opts || {};
    const d = data(name);
    if (!d) return;
    if (opts.undo !== false) { undo.push({ name, snap: JSON.stringify(d), label: opts.label || '' }); if (undo.length > 80) undo.shift(); }
    mutate(d);
    ver[name] = (ver[name] || 0) + 1;
    D.tocar(name, 'edicao');
    schedule(name);
    if (opts.render !== false) requestRender();
    updateSave();
  }
  function refreshStatus() {
    st.status = Object.values(st.saving).some(Boolean) ? 'salvando' : st.conflitos.size ? 'conflito' : st.erros.size ? 'erro' : pend.size ? 'pendente' : 'ok';
  }
  function schedule(name) {
    pend.add(name); refreshStatus();
    clearTimeout(timers[name]);
    timers[name] = setTimeout(() => flush(name), 650);
  }
  /** Grava agora. Resolve true se a versão atual ficou gravada. */
  async function flush(name, forcar) {
    clearTimeout(timers[name]);
    const d = data(name);
    if (!d) return false;
    if (st.saving[name]) { await st.saving[name]; return flush(name, forcar); }
    if (st.conflitos.has(name) && !forcar) { refreshStatus(); updateSave(); return false; }
    const v = ver[name] || 0;
    let done;
    st.saving[name] = new Promise(r => { done = r; }); refreshStatus(); updateSave();
    const r = await D.salvar(name, d, { forcar, origem: 'gravacao-endo' });
    st.saving[name] = null; done();
    if (r.ok) {
      gravada[name] = v; st.conflitos.delete(name); st.erros.delete(name); st.when = new Date();
      if ((ver[name] || 0) === v) pend.delete(name); else schedule(name);
    } else if (r.conflito) st.conflitos.add(name);
    else st.erros.add(name);
    refreshStatus(); updateSave();
    return !!r.ok && (ver[name] || 0) === v;
  }
  function doUndo() {
    const u = undo.pop();
    if (!u) { toast('Nada para desfazer.'); return; }
    const d = data(u.name), snap = JSON.parse(u.snap), cv = d.updated;
    Object.keys(d).forEach(k => delete d[k]);
    Object.assign(d, snap, { updated: cv });
    ver[u.name] = (ver[u.name] || 0) + 1;
    D.tocar(u.name, 'edicao'); schedule(u.name); requestRender(); updateSave();
    toast('Alteração desfeita.');
  }
  addEventListener('beforeunload', e => { if (pend.size || Object.values(st.saving).some(Boolean)) { e.preventDefault(); e.returnValue = ''; } });

  /* Redesenho depois da edição: espera o foco chegar ao próximo campo e o clique em andamento terminar,
     para não destruir o elemento que o usuário está tocando nem perder o foco do teclado. */
  let ptr = false, rq = false, rqT = 0;
  document.addEventListener('pointerdown', () => { ptr = true; }, true);
  document.addEventListener('pointerup', () => { ptr = false; if (rq) { rq = false; clearTimeout(rqT); rqT = setTimeout(() => render(), 0); } }, true);
  document.addEventListener('pointercancel', () => { ptr = false; }, true);
  function requestRender() {
    if (ptr) { rq = true; return; }
    clearTimeout(rqT); rqT = setTimeout(() => render(), 0);
  }

  /* ---------- Avisos ---------- */
  let toastEl = null, toastT = 0;
  function toast(msg, action) {
    if (!toastEl) { const w = document.createElement('div'); w.className = 'toast-wrap e-toast'; w.innerHTML = '<div class="toast" role="status" aria-live="polite"></div>'; document.body.appendChild(w); toastEl = w; }
    const t = $('.toast', toastEl);
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" class="btn sm" data-toast-act>${esc(action.label)}</button>` : ''}`;
    t.onclick = e => { if (e.target.closest('[data-toast-act]')) { action.fn(); hide(); } };
    toastEl.hidden = false; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(hide, action ? 6500 : 3800);
    function hide() { toastEl.classList.remove('show'); setTimeout(() => { if (!toastEl.classList.contains('show')) toastEl.hidden = true; }, 220); }
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Texto copiado.'); return; } catch (e) { /* alternativa abaixo */ }
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Texto copiado.'); } catch (e) { toast('Não foi possível copiar. Selecione o texto e use Ctrl+C.'); }
    ta.remove();
  }

  /* ---------- Markdown (fichas) ---------- */
  function inline(s) {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');
    t = t.replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>');
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    t = t.replace(/(^|[\s(;])(https?:\/\/[^\s<)"]+[^\s<)".,;:])/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    t = t.replace(/\[(FATO INTERNO|EVIDÊNCIA PÚBLICA[^\]]*|HIPÓTESE|RECOMENDAÇÃO|ESTIMATIVA|PENDENTE[^\]]*|validado[^\]]*)\]/g, (m, x) => `<span class="mk-tag ${/^PEND/.test(x) ? 'p' : /^ESTIM|^HIP/.test(x) ? 'e' : /^FATO|^EVID|^valid/.test(x) ? 'f' : 'r'}">${x}</span>`);
    return t;
  }
  function md(src) {
    const L = String(src || '').replace(/\r/g, '').split('\n');
    let html = '', i = 0;
    const isTable = l => /^\s*\|.*\|\s*$/.test(l);
    while (i < L.length) {
      let l = L[i];
      if (!l.trim()) { i++; continue; }
      if (/^```/.test(l)) { const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); i++; html += `<pre><code>${esc(b.join('\n'))}</code></pre>`; continue; }
      if (/^#{1,6}\s/.test(l)) { const n = l.match(/^#+/)[0].length; html += `<h${Math.min(6, n + 1)} class="md-h">${inline(l.replace(/^#+\s*/, ''))}</h${Math.min(6, n + 1)}>`; i++; continue; }
      if (/^\s*(---|\*\*\*)\s*$/.test(l)) { html += '<hr>'; i++; continue; }
      if (isTable(l)) {
        const rows = []; while (i < L.length && isTable(L[i])) rows.push(L[i++]);
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const body = rows.filter(r => !cells(r).every(c => /^:?-{2,}:?$/.test(c)));
        if (!body.length) continue;
        const al = (rows[1] && cells(rows[1]).every(c => /^:?-{2,}:?$/.test(c))) ? cells(rows[1]).map(c => /-:$/.test(c) ? 'r' : '') : [];
        html += `<div class="md-tw"><table class="md-t"><thead><tr>${cells(body[0]).map((c, k) => `<th class="${al[k] || ''}">${inline(c)}</th>`).join('')}</tr></thead><tbody>${body.slice(1).map(r => `<tr>${cells(r).map((c, k) => `<td class="${al[k] || ''}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        continue;
      }
      if (/^\s*>/.test(l)) { const b = []; while (i < L.length && /^\s*>/.test(L[i])) b.push(L[i++].replace(/^\s*>\s?/, '')); html += `<blockquote>${md(b.join('\n'))}</blockquote>`; continue; }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
        const ordered = /^\s*\d+[.)]/.test(l);
        const items = [];
        while (i < L.length && (/^\s*([-*+]|\d+[.)])\s+/.test(L[i]) || (/^\s{2,}\S/.test(L[i]) && items.length))) {
          const cur = L[i];
          if (/^\s{2,}([-*+]|\d+[.)])\s+/.test(cur) && items.length) { items[items.length - 1].sub.push(cur.replace(/^\s{2,}/, '')); }
          else if (/^\s{2,}\S/.test(cur) && !/^\s*([-*+]|\d+[.)])\s+/.test(cur) && items.length) { items[items.length - 1].t += ' ' + cur.trim(); }
          else items.push({ t: cur.replace(/^\s*([-*+]|\d+[.)])\s+/, ''), sub: [] });
          i++;
        }
        html += `<${ordered ? 'ol' : 'ul'} class="md-l">${items.map(x => `<li>${inline(x.t)}${x.sub.length ? md(x.sub.join('\n')) : ''}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
        continue;
      }
      const p = [];
      while (i < L.length && L[i].trim() && !/^(#{1,6}\s|```|\s*>|\s*([-*+]|\d+[.)])\s+|\s*\|)/.test(L[i])) p.push(L[i++]);
      if (!p.length) { p.push(L[i++]); }
      html += `<p>${inline(p.join(' '))}</p>`;
    }
    return html;
  }
  const plain = s => String(s || '').replace(/\*\*/g, '').replace(/`/g, '').replace(/^#+\s*/gm, '');

  /* ---------- Componentes de edição ----------
     f(...) gera um campo ligado ao dado. Tipos: text, area, num, money, date, select, check. */
  function f(ds, path, opts) {
    opts = opts || {};
    const d = data(ds); const v = d ? getPath(d, path) : '';
    const b = `data-b="${ds}:${path}"`, lab = opts.label ? `aria-label="${esc(opts.label)}"` : '';
    const ph = opts.ph ? ` placeholder="${esc(opts.ph)}"` : '';
    const cls = 'in ' + (opts.cls || '');
    switch (opts.t) {
      case 'area': return `<textarea class="${cls}" ${b} ${lab}${ph} rows="${opts.rows || 3}">${esc(v)}</textarea>`;
      case 'num': case 'money': return `<input class="${cls} n" type="number" inputmode="decimal" step="${opts.step || (opts.t === 'money' ? '0.01' : 'any')}" ${opts.min != null ? `min="${opts.min}"` : ''} ${b} data-t="n" ${lab}${ph} value="${v == null ? '' : esc(v)}">`;
      case 'date': return `<input class="${cls}" type="date" ${b} ${lab} value="${esc(v || '')}">`;
      case 'select': return `<select class="${cls}" ${b} ${opts.num ? 'data-t="n"' : ''} ${lab}>${opts.options.map(o => `<option value="${esc(o[0])}"${String(v) === String(o[0]) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
      case 'check': return `<input class="ck" type="checkbox" ${b} data-t="b" ${lab}${v ? ' checked' : ''}>`;
      default: return `<input class="${cls}" type="text" ${b} ${lab}${ph} value="${esc(v)}" autocomplete="off">`;
    }
  }
  const stSelect = (ds, path, list) => f(ds, path, { t: 'select', options: (list || STATUS).map(x => [x[0], x[1]]), label: 'Status', cls: 'st-sel' });
  root.addEventListener('change', e => {
    const t = e.target, b = t.dataset && t.dataset.b;
    if (!b) return;
    const [ds, path] = [b.slice(0, b.indexOf(':')), b.slice(b.indexOf(':') + 1)];
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.t === 'n') v = t.value === '' ? null : Number(t.value);
    const cur = getPath(data(ds), path);
    if (cur === v) return;
    change(ds, d => setPath(d, path, v), { label: path });
  });
  const TPL = {
    pendencia: () => ({ id: uid('p'), item: '', quem: '', critica: false, feita: false }),
    item: () => ({ id: uid('i'), grupo: 'sede', item: 'Novo item', qtd: 1, unitario: null, tipo: 'variavel', fonte: '[PENDENTE: cotação]', incluir: true }),
    realizado: () => ({ id: uid('r'), descricao: '', valor: null, data: new Date().toISOString().slice(0, 10) }),
    data: ctx => ({ id: uid('d'), data: ctx && ctx.m ? `2027-${pad(ctx.m)}-01` : '2027-01-01', fim: '', rotulo: 'Nova data', tipo: 'execucao' }),
    hora: () => ({ id: uid('h'), quem: '', horas: 0, emQue: '', grupo: 'sede' }),
    turma: () => ({ grupo: 'Novo grupo', horario: '', setores: '[PENDENTE: RH]', pessoas: null })
  };
  root.addEventListener('click', e => {
    const a = e.target.closest('[data-add],[data-del],[data-undo],[data-copy],[data-reload],[data-force],[data-retry]');
    if (!a) return;
    if (a.dataset.undo != null) { doUndo(); return; }
    if (a.dataset.copy != null) { const src = a.dataset.copy ? document.getElementById(a.dataset.copy) : a.closest('[data-copy-src]'); copy(src ? (src.dataset.copyText || src.innerText) : ''); return; }
    if (a.dataset.reload != null) { reloadAll(); return; }
    if (a.dataset.force != null) { Array.from(st.conflitos).forEach(n => flush(n, true)); return; }
    if (a.dataset.retry != null) { Array.from(st.erros).forEach(n => { st.erros.delete(n); flush(n); }); return; }
    if (a.dataset.add) {
      const [ds, path] = a.dataset.add.split(':');
      const ctx = { m: +a.dataset.m || 0 };
      change(ds, d => { const list = getPath(d, path); list.push(TPL[a.dataset.tpl](ctx)); });
      setTimeout(() => { const ins = $$(`[data-b^="${ds}:${path}."]`, root); if (ins.length) { const last = ins[ins.length - 1].closest('tr,li,.row'); const f0 = last && last.querySelector('input,textarea'); if (f0) f0.focus(); } }, 40);
      return;
    }
    if (a.dataset.del) {
      const [ds, path] = a.dataset.del.split(':');
      const ks = path.split('.'); const idx = +ks.pop(); const lp = ks.join('.');
      change(ds, d => { getPath(d, lp).splice(idx, 1); });
      toast('Item removido.', { label: 'Desfazer', fn: doUndo });
    }
  });
  async function reloadAll() {
    const names = st.conflitos.size ? Array.from(st.conflitos) : ['plano'];
    for (const n of names) { clearTimeout(timers[n]); await D.recarregar(n); st.conflitos.delete(n); pend.delete(n); ver[n] = (ver[n] || 0) + 1; }
    if (names.includes('plano')) st.plano = D.peek('plano');
    for (let k = undo.length - 1; k >= 0; k--) if (names.includes(undo[k].name)) undo.splice(k, 1);
    refreshStatus(); render(); updateSave();
    toast('Versão salva carregada.');
  }

  /* ---------- Painel lateral (Liquid Glass) ---------- */
  let drawer = null, drawerScrim = null, drawerRet = null, drawerClose = null;
  function openDrawer(html, onClose) {
    if (!drawer) {
      drawerScrim = document.createElement('div'); drawerScrim.className = 'e-scrim'; drawerScrim.hidden = true;
      drawer = document.createElement('aside'); drawer.className = 'e-drawer glass-strong'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.hidden = true;
      root.appendChild(drawerScrim); root.appendChild(drawer);
      drawerScrim.addEventListener('click', closeDrawer);
    }
    drawerRet = drawerRet || document.activeElement; drawerClose = onClose || null;
    drawer.innerHTML = html;
    drawer.hidden = false; drawerScrim.hidden = false;
    requestAnimationFrame(() => { drawer.classList.add('open'); drawerScrim.classList.add('open'); const f0 = drawer.querySelector('[data-close-drawer]'); if (f0) f0.focus({ preventScroll: true }); });
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('open'); drawerScrim.classList.remove('open');
    setTimeout(() => { if (!drawer.classList.contains('open')) { drawer.hidden = true; drawerScrim.hidden = true; } }, RM.matches ? 0 : 240);
    if (drawerClose) drawerClose();
    if (drawerRet && document.contains(drawerRet)) drawerRet.focus({ preventScroll: true });
    drawerRet = null;
  }
  const drawerOpen = () => drawer && !drawer.hidden;
  root.addEventListener('click', e => { if (e.target.closest('[data-close-drawer]')) closeDrawer(); });

  /* ---------- Gráfico de barras (SVG, com tooltip) ----------
     series: [{ id, label, color(var), values[12], fmt }]; stacked: soma os segmentos. Um eixo só. */
  function bars(series, opts) {
    opts = opts || {};
    const W = 1080, H = opts.h || 260, padL = 64, padB = 26, padT = 10, n = 12;
    const vals = i => series.map(s => (isNum(s.values[i]) ? s.values[i] : 0));
    const max = Math.max(1, ...Array.from({ length: n }, (_, i) => opts.stacked ? vals(i).reduce((a, b) => a + b, 0) : Math.max(...vals(i))));
    const nice = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };
    const top = nice(max), plotW = W - padL - 8, plotH = H - padT - padB, cw = plotW / n;
    const y = v => padT + plotH - (v / top) * plotH;
    const fmt = opts.fmt || (v => n1(v));
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = top * k / 4, yy = y(v); g += `<line x1="${padL}" x2="${W - 8}" y1="${yy}" y2="${yy}" class="gl${k ? '' : ' base'}"/><text x="${padL - 8}" y="${yy + 4}" class="ax r">${esc(fmt(v, true))}</text>`; }
    const bw = opts.stacked ? Math.min(40, cw * .5) : Math.min(22, (cw * .62) / series.length);
    const round = (x, y0, w, h) => { if (h <= 0) return ''; const r = Math.min(4, w / 2, h); return `M${x},${y0 + h}V${y0 + r}Q${x},${y0} ${x + r},${y0}H${x + w - r}Q${x + w},${y0} ${x + w},${y0 + r}V${y0 + h}Z`; };
    let marks = '', hits = '';
    for (let i = 0; i < n; i++) {
      const cx = padL + cw * i + cw / 2;
      const v = vals(i);
      let tt = `<b>${MESES[i]}</b>`;
      series.forEach((s, k) => { tt += `<span><i style="background:${s.color}"></i>${esc(s.label)}: ${esc(s.values[i] == null ? '—' : (s.fmt || fmt)(s.values[i]))}</span>`; });
      if (opts.extra && opts.extra[i]) tt += `<em>${esc(opts.extra[i])}</em>`;
      if (opts.stacked) {
        let acc = 0;
        const segs = series.map((s, k) => ({ s, v: v[k] })).filter(x => x.v > 0);
        segs.forEach((x, k) => {
          const y1 = y(acc + x.v), y0 = y(acc), h = y0 - y1 - (k < segs.length - 1 ? 2 : 0);
          marks += k === segs.length - 1 ? `<path d="${round(cx - bw / 2, y1, bw, Math.max(0, y0 - y1))}" fill="${x.s.color}"/>` : `<rect x="${cx - bw / 2}" y="${y1 + 0}" width="${bw}" height="${Math.max(0, h)}" fill="${x.s.color}"/>`;
          acc += x.v;
        });
      } else {
        const gw = bw * series.length + 2 * (series.length - 1);
        series.forEach((s, k) => { const x = cx - gw / 2 + k * (bw + 2); const vv = v[k]; marks += `<path d="${round(x, y(vv), bw, plotH + padT - y(vv))}" fill="${s.color}"/>`; });
      }
      if (opts.flags && opts.flags[i]) marks += `<text x="${cx}" y="${padT + 8}" class="flag" text-anchor="middle">${esc(opts.flags[i])}</text>`;
      hits += `<rect class="hit" x="${padL + cw * i}" y="${padT}" width="${cw}" height="${plotH}" data-tt="${esc(tt)}"${opts.link ? ` data-href="${opts.link(i)}"` : ''}/>`;
      g += `<text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${MES3[i]}</text>`;
    }
    const legend = series.length > 1 || opts.legend ? `<div class="ch-leg">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>` : '';
    return `<figure class="chart">${legend}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || '')}" class="ch-svg" style="aspect-ratio:${W}/${H}">${g}${marks}${hits}</svg></figure>`;
  }
  const tipEl = document.createElement('div'); tipEl.className = 'ch-tip glass-strong'; tipEl.hidden = true; document.body.appendChild(tipEl);
  root.addEventListener('pointermove', e => {
    const h = e.target.closest && e.target.closest('[data-tt]');
    if (!h) { tipEl.hidden = true; return; }
    tipEl.innerHTML = h.dataset.tt; tipEl.hidden = false;
    const w = tipEl.offsetWidth, x = Math.min(innerWidth - w - 12, e.clientX + 14), yy = Math.max(12, e.clientY - tipEl.offsetHeight - 12);
    tipEl.style.left = x + 'px'; tipEl.style.top = yy + 'px';
    $$('.hit.on', root).forEach(n => n !== h && n.classList.remove('on')); h.classList.add('on');
  }, { passive: true });
  root.addEventListener('pointerleave', () => { tipEl.hidden = true; }, true);
  root.addEventListener('click', e => { const h = e.target.closest('[data-href]'); if (h && !e.target.closest('a,button,input,select,textarea')) location.hash = h.dataset.href; });

  /* ---------- Estrutura do módulo ---------- */
  const TABS = [['visao', 'Visão geral'], ['jornada', 'Jornada'], ['programas', 'Programas'], ['orcamento', 'Orçamento'], ['produtividade', 'Produtividade'], ['linkedin', 'LinkedIn'], ['pesquisa', 'Pesquisa']];
  root.innerHTML = `<div class="endo">
    <header class="etop glass glass-live" id="etop">
      <div class="et-brand"><span class="eyebrow">Endomarketing 2027 · Jeito Santer de Ser</span><h1 class="et-title" id="et-title">Visão geral</h1></div>
      <nav class="seg" id="seg" aria-label="Seções do Endomarketing 2027"><span class="seg-ind" aria-hidden="true"></span>${TABS.map(([k, l]) => `<a href="#/endo/${k}" data-tab="${k}">${l}</a>`).join('')}</nav>
      <div class="et-save" id="et-save" role="status" aria-live="polite"></div>
    </header>
    <div class="e-banner" id="e-banner"></div>
    <main class="ebody" id="ebody" tabindex="-1"></main>
  </div>`;
  const body = $('#ebody', root), seg = $('#seg', root), segInd = $('.seg-ind', seg);
  function moveSeg() {
    const a = $('[aria-current="page"]', seg);
    if (!a) { segInd.style.opacity = 0; return; }
    segInd.style.opacity = 1; segInd.style.width = a.offsetWidth + 'px'; segInd.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  addEventListener('resize', () => requestAnimationFrame(moveSeg));
  function updateSave() {
    const el = $('#et-save', root);
    const s = st.status;
    const when = st.when ? st.when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
    const label = s === 'salvando' ? '<span class="spinner sm"></span>Salvando…' : s === 'pendente' ? '<i class="sd warn"></i>Alterações a salvar' : s === 'erro' ? '<i class="sd err"></i>Não foi possível salvar' : s === 'conflito' ? '<i class="sd err"></i>Conflito de versão' : `<i class="sd ok"></i>${when ? 'Salvo às ' + when : 'Tudo salvo'}`;
    el.innerHTML = `<span class="sv">${label}</span><button type="button" class="btn sm ghost icon" data-undo aria-label="Desfazer a última alteração" title="Desfazer (Ctrl+Z)" ${undo.length ? '' : 'disabled'}>${I.undo}</button>`;
    const bn = $('#e-banner', root);
    if (s === 'conflito') bn.innerHTML = `<div class="notice">${I.alert}<p>Outra pessoa salvou uma versão mais nova do planejamento depois que você abriu a página. Suas últimas alterações ainda não foram gravadas.</p><button type="button" class="btn sm" data-reload>Carregar a versão salva</button><button type="button" class="btn sm primary" data-force>Gravar a minha por cima</button></div>`;
    else if (s === 'erro') bn.innerHTML = `<div class="notice">${I.alert}<p>Não foi possível falar com o servidor. Verifique se a janela do “Iniciar calendario” continua aberta; as alterações continuam guardadas nesta página. Não feche a aba antes de gravar.</p><button type="button" class="btn sm primary" data-retry>Tentar agora</button></div>`;
    else bn.innerHTML = '';
  }
  document.addEventListener('keydown', e => {
    if (root.hidden) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '');
    if (e.key === 'Escape' && drawerOpen()) { e.preventDefault(); closeDrawer(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); doUndo(); }
  });

  /* ---------- Rotas e telas sob demanda ---------- */
  const VIEW_FILES = { visao: 'visao', jornada: 'jornada', mes: 'mes', programas: 'programas', orcamento: 'financas', produtividade: 'financas', linkedin: 'linkedin', pesquisa: 'pesquisa' };
  const loaded = {};
  function loadView(file) {
    if (!loaded[file]) loaded[file] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = `js/endo/${file}.js`; s.onload = res; s.onerror = () => { delete loaded[file]; rej(new Error(file)); }; document.body.appendChild(s); });
    return loaded[file];
  }
  const cur = { view: 'visao', parts: [], params: {} };
  let renderSeq = 0;
  async function route(parts, params) {
    const view = parts[0] && VIEW_FILES[parts[0]] ? parts[0] : 'visao';
    const changed = view !== cur.view || (parts[1] || '') !== (cur.parts[1] || '');
    Object.assign(cur, { view, parts, params: params || {} });
    const tab = view === 'mes' ? 'jornada' : view;
    $$('a', seg).forEach(a => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    requestAnimationFrame(moveSeg);
    if (drawerOpen() && changed) closeDrawer();
    const seq = ++renderSeq;
    if (!st.plano) body.innerHTML = skeleton();
    try {
      await Promise.all([loadView(VIEW_FILES[view]), st.plano ? null : D.get('plano').then(p => { st.plano = p; })]);
    } catch (err) {
      body.innerHTML = `<div class="empty-state">${I.alert}<h2>Não foi possível carregar o planejamento</h2><p>${D.disponivel ? 'Verifique se a janela do “Iniciar calendario” continua aberta e se a pasta dados/endo existe (rode ferramentas/importar-planejamento.mjs).' : 'Este módulo precisa do app local: abra pelo arquivo “Iniciar calendario.bat”.'}</p></div>`;
      return;
    }
    if (seq !== renderSeq) return;
    if (changed) scrollTo(0, 0);
    await render({ fresh: changed });
  }
  async function render(opts) {
    opts = opts || {};
    const v = E.views[cur.view];
    if (!v || !st.plano) return;
    const act = document.activeElement;
    const keep = act && root.contains(act) && act.dataset && act.dataset.b ? '[data-b="' + CSS.escape(act.dataset.b) + '"]' : act && root.contains(act) && act.id ? '#' + CSS.escape(act.id) : null;
    const selS = keep && act.selectionStart != null ? [act.selectionStart, act.selectionEnd] : null;
    const sy = scrollY;
    const seq = renderSeq;
    const out = await v.render(cur, opts);
    if (seq !== renderSeq && opts.fresh) return;
    if (out == null) return;
    $('#et-title', root).textContent = v.title ? v.title(cur) : '';
    body.innerHTML = out;
    if (opts.fresh && !RM.matches) { body.classList.remove('in'); void body.offsetWidth; body.classList.add('in'); }
    autosize(body);
    if (v.after) v.after(cur, body);
    if (!opts.fresh) scrollTo(0, sy);
    if (keep) { const n = root.querySelector(keep); if (n && n !== document.activeElement) { n.focus({ preventScroll: true }); if (selS && n.setSelectionRange && n.type !== 'number') try { n.setSelectionRange(selS[0], selS[1]); } catch (e) { /* ok */ } } }
    updateSave();
  }
  function autosize(scope) { $$('textarea.in', scope).forEach(t => { if (t.id === 'sec-txt') return; t.style.height = 'auto'; t.style.height = Math.min(420, t.scrollHeight + 2) + 'px'; }); }
  root.addEventListener('input', e => { if (e.target.matches && e.target.matches('textarea.in') && e.target.id !== 'sec-txt') { e.target.style.height = 'auto'; e.target.style.height = Math.min(420, e.target.scrollHeight + 2) + 'px'; } });
  function skeleton() { return `<div class="sk-wrap"><div class="skeleton" style="height:28px;width:40%"></div><div class="skeleton" style="height:14px;width:70%;margin-top:14px"></div><div class="sk-row">${'<div class="skeleton" style="height:84px"></div>'.repeat(4)}</div><div class="skeleton" style="height:280px;margin-top:18px"></div></div>`; }

  /* Atualizações vindas de fora (calendário salvo, outra tela) */
  D.on('plano', (d, origem) => { st.plano = d; if (origem === 'recarga') render(); });
  addEventListener('santer:calendario', () => { if (!root.hidden && (cur.view === 'mes' || cur.view === 'jornada' || cur.view === 'visao')) render(); });

  /* Totais do ano, sempre recalculados a partir dos dados editáveis */
  function ano() {
    const P = st.plano, meses = P.meses || [];
    // Iniciativas canceladas aparecem nas listas, mas não somam em investimento nem em horas
    const ZO = { sede: 0, extensao: 0, pendentes: 0, itens: 0, subtotal: 0, total: 0, realizado: 0, porPessoa: null, porElegivel: null, classe: 'sem-desembolso', dentroDoTeto: true };
    const ZI = { minutos: null, colab: 0, colabFonte: 'cancelado', equipe: 0, total: 0, max: null };
    const vivo = s => s !== 'cancelado';
    const porMes = meses.map(mo => { const c = !vivo(mo.acao.status), o = orc(mo.orcamento, P.parametros); return { mo, cancelado: c, o: c ? Object.assign({}, ZO, { realizado: o.realizado }) : o, i: c ? ZI : imp(mo) }; });
    const progs = (P.programas || []).filter(p => vivo(p.status)).map(p => ({ p, c: prog(p) }));
    const exps = (P.experiencias || []).filter(x => vivo(x.status)).map(x => ({ x, o: expCalc(x), m: x.dataProvisoria ? +x.dataProvisoria.slice(5, 7) : x.m }));
    const previsto = porMes.reduce((a, r) => a + r.o.total, 0) + exps.reduce((a, r) => a + r.o.total, 0);
    const realizado = porMes.reduce((a, r) => a + r.o.realizado, 0) + exps.reduce((a, r) => a + r.o.realizado, 0);
    const recorrente = progs.reduce((a, r) => a + (r.c.custoAno || 0), 0);
    const recorrentePend = progs.filter(r => r.c.custoAno == null).length;
    const pendentesItens = porMes.reduce((a, r) => a + r.o.pendentes, 0) + exps.reduce((a, r) => a + r.o.pendentes, 0);
    const hColab = porMes.reduce((a, r) => a + (r.i.colab || 0), 0);
    const hEquipe = porMes.reduce((a, r) => a + r.i.equipe, 0) + exps.reduce((a, r) => a + (r.x.horasEquipe || []).reduce((s, h) => s + (isNum(h.horas) ? h.horas : 0), 0), 0);
    const hProg = progs.reduce((a, r) => a + r.c.hAno, 0);
    const hProgOrg = progs.reduce((a, r) => a + (r.c.orgMes != null ? r.c.orgMes * r.c.porMes.filter(Boolean).length : 0), 0);
    const acoes = meses.length, realizadas = meses.filter(m => REALIZADO.has(m.acao.status)).length, aprovadas = meses.filter(m => APROVADO.has(m.acao.status)).length;
    const elegiveis = Math.max(0, ...meses.map(m => isNum(m.orcamento.elegiveisExtensao) ? m.orcamento.elegiveisExtensao : 0)) || null;
    return { porMes, progs, exps, previsto, realizado, recorrente, recorrentePend, pendentesItens, hColab, hEquipe, hProg, hProgOrg, hTotal: hColab + hEquipe + hProg + hProgOrg, elegiveis, acoes, realizadas, aprovadas };
  }

  const E = window.Endo = {
    ano, cur, flush,
    /** Altera e grava na hora, fora da pilha de desfazer (ex.: vínculo com evento oficial). Resolve true se gravou. */
    commit: (name, mutate) => { change(name, mutate, { undo: false }); return flush(name); },
    views: {}, route, render, change, data, flush, toast, copy, md, inline, plain, f, stSelect, pill, frente, carga, bars, openDrawer, closeDrawer,
    orc, imp, prog, expCalc, getPath, uid,
    st, I, esc, pad, brl, brl0, n1, fd, fdl, norm, MESES, MES3, STATUS, ST_LI, stInfo, APROVADO, REALIZADO, FRENTES, CLASSE, isNum,
    cal: () => window.SanterCal || null,
    mes: m => (st.plano.meses || []).find(x => x.m === m),
    idx: m => (st.plano.meses || []).findIndex(x => x.m === m)
  };
})();
