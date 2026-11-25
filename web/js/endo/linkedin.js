/* Calendário editorial do LinkedIn: pautas semanais + coberturas. Nada é publicado pelo sistema. */
(() => {
  const E = window.Endo, { esc, MESES, MES3, pill, pad, f, I, fd, fdl, norm } = E;
  const D = window.SanterDados;
  const root = document.getElementById('mod-endo');
  const st = { view: (() => { try { return localStorage.getItem('santer:li-vista') || 'calendario'; } catch (e) { return 'calendario'; } })(), mes: 1, f: { mes: '', pilar: '', formato: '', status: '', tipo: '', resp: '', q: '' }, open: null };
  const VIEWS = [['calendario', 'Calendário', I.cal], ['lista', 'Lista', I.list], ['cards', 'Cards', I.grid]];
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt'));
  const TIPO = { editorial: 'Pauta editorial', cobertura: 'Cobertura de ação/evento' };
  const filtrar = posts => posts.filter(p => (!st.f.mes || String(p.mes) === st.f.mes) && (!st.f.pilar || p.pilar === st.f.pilar) && (!st.f.formato || p.formato === st.f.formato)
    && (!st.f.status || p.status === st.f.status) && (!st.f.tipo || p.tipo === st.f.tipo) && (!st.f.resp || p.responsavel === st.f.resp)
    && (!st.f.q || norm(`${p.tema} ${p.texto} ${p.objetivo} ${p.pilar}`).includes(norm(st.f.q))));
  const ix = id => D.peek('linkedin').posts.findIndex(p => p.id === id);
  const tipoTag = p => `<span class="li-k ${p.tipo}">${p.tipo === 'cobertura' ? 'Cobertura' : 'Editorial'}</span>`;

  function drawerHTML(p) {
    const k = ix(p.id), P = `posts.${k}`;
    return `<header class="dr-h"><div><span class="eyebrow">${esc(TIPO[p.tipo] || p.tipo)}${p.semana ? ' · ' + esc(p.semana) : ''}</span><h2>${esc(p.tema || 'Nova publicação')}</h2></div><button type="button" class="btn sm ghost icon" data-close-drawer aria-label="Fechar">${I.x}</button></header>
      <div class="dr-b">
        <div class="fgrid"><label>Data de publicação${f('linkedin', `${P}.data`, { t: 'date', label: 'Data' })}</label><label>Status${E.stSelect('linkedin', `${P}.status`, E.ST_LI)}</label></div>
        <label class="lbl">Tema${f('linkedin', `${P}.tema`, { label: 'Tema' })}</label>
        <div class="fgrid"><label>Linha editorial${f('linkedin', `${P}.pilar`, { label: 'Linha editorial' })}</label><label>Formato${f('linkedin', `${P}.formato`, { label: 'Formato' })}</label></div>
        <div class="fgrid"><label>Tipo${f('linkedin', `${P}.tipo`, { t: 'select', options: [['editorial', 'Pauta editorial'], ['cobertura', 'Cobertura de ação/evento']], label: 'Tipo' })}</label><label>Responsável${f('linkedin', `${P}.responsavel`, { label: 'Responsável' })}</label></div>
        <label class="lbl">Objetivo${f('linkedin', `${P}.objetivo`, { t: 'area', rows: 2, label: 'Objetivo' })}</label>
        <label class="lbl">Abordagem / gancho${f('linkedin', `${P}.abordagem`, { t: 'area', rows: 2, label: 'Abordagem' })}</label>
        <div class="lbl-row"><span class="lbl">Texto sugerido</span><button type="button" class="btn xs" data-copy="li-txt">${I.copy}Copiar texto</button></div>
        ${f('linkedin', `${P}.texto`, { t: 'area', rows: 8, label: 'Texto sugerido' }).replace('<textarea', '<textarea id="li-txt"')}
        <label class="lbl">Materiais necessários${f('linkedin', `${P}.materiais`, { t: 'area', rows: 2, label: 'Materiais' })}</label>
        <label class="lbl">Conexão com a campanha${f('linkedin', `${P}.conexao`, { t: 'area', rows: 2, label: 'Conexão' })}</label>
        <label class="lbl">Referências e alternativa${f('linkedin', `${P}.referencias`, { label: 'Referências' })}</label>
        <div class="fgrid"><label>Consentimento${f('linkedin', `${P}.consentimento`, { t: 'area', rows: 2, label: 'Consentimento' })}</label><label>Aprovação${f('linkedin', `${P}.aprovacao`, { t: 'area', rows: 2, label: 'Aprovação' })}</label></div>
        <label class="lbl">Notas${f('linkedin', `${P}.notas`, { t: 'area', rows: 2, ph: 'Ajustes, links do post publicado, métricas orgânicas…', label: 'Notas' })}</label>
        <p class="note">A publicação é manual, feita pelo Marketing no LinkedIn. Mudar o status para “Publicado” só registra o que já aconteceu.</p>
      </div>`;
  }
  function openPost(id) {
    const p = D.peek('linkedin').posts.find(x => x.id === id);
    if (!p) return;
    st.open = id;
    E.openDrawer(drawerHTML(p), () => { st.open = null; delete E.cur.params.post; if (/post=/.test(location.hash)) history.replaceState(null, '', '#/endo/linkedin'); });
  }
  /* Mantém o painel aberto atualizado quando os dados mudam */
  D.on('linkedin', (d, origem) => { if (st.open && origem === 'edicao') { const dr = document.querySelector('.e-drawer'); const act = document.activeElement; if (dr && !(act && dr.contains(act) && /INPUT|TEXTAREA|SELECT/.test(act.tagName))) { const p = d.posts.find(x => x.id === st.open); if (p) dr.innerHTML = drawerHTML(p); } } });

  function calendario(list) {
    const m = st.f.mes ? +st.f.mes : st.mes;
    const first = new Date(Date.UTC(2027, m - 1, 1)).getUTCDay(), dim = new Date(Date.UTC(2027, m, 0)).getUTCDate();
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<div class="lc out"></div>';
    for (let d = 1; d <= dim; d++) {
      const key = `2027-${pad(m)}-${pad(d)}`, ps = list.filter(p => p.data === key), w = (first + d - 1) % 7;
      cells += `<div class="lc${w === 0 || w === 6 ? ' we' : ''}"><span class="lc-n">${d}</span>${ps.map(p => `<button type="button" class="lc-p ${p.tipo}" data-post="${p.id}" title="${esc(p.tema)}"><span>${esc(p.tema)}</span><em>${esc(E.stInfo(p.status, E.ST_LI)[1])}</em></button>`).join('')}</div>`;
    }
    return `<div class="lc-head"><button type="button" class="btn sm ghost icon" data-li-m="-1" ${m <= 1 || st.f.mes ? 'disabled' : ''} aria-label="Mês anterior">${I.left}</button><h3>${MESES[m - 1]} <span>2027</span></h3><button type="button" class="btn sm ghost icon" data-li-m="1" ${m >= 12 || st.f.mes ? 'disabled' : ''} aria-label="Próximo mês">${I.right}</button></div>
      <div class="lc-grid">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(x => `<div class="lc-wd">${x}</div>`).join('')}${cells}</div>`;
  }
  const lista = list => `<div class="tw"><table class="t li-t"><thead><tr><th>Data</th><th>Tipo</th><th>Tema</th><th>Linha editorial</th><th>Formato</th><th>Responsável</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.map(p => `<tr data-post="${p.id}" class="clk"><td class="nowrap num-t">${p.data ? fdl(p.data) : '—'}</td><td>${tipoTag(p)}</td><td><b>${esc(p.tema)}</b><span class="mini block">${esc((p.objetivo || '').slice(0, 120))}${(p.objetivo || '').length > 120 ? '…' : ''}</span></td><td>${esc(p.pilar)}</td><td>${esc(p.formato)}</td><td>${esc(p.responsavel)}</td><td>${pill(p.status, E.ST_LI)}</td>
      <td>${p.texto ? `<button type="button" class="btn xs ghost icon" data-copy-post="${p.id}" aria-label="Copiar texto">${I.copy}</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">Nenhuma publicação com esses filtros.</td></tr>'}</tbody></table></div>`;
  const cards = list => `<div class="li-cards">${list.map(p => `<article class="li-card ${p.tipo}" data-post="${p.id}" tabindex="0"><header>${tipoTag(p)}<span class="num-t">${p.data ? fdl(p.data) : 'sem data'}</span></header><h4>${esc(p.tema)}</h4><p>${esc((p.texto || p.objetivo || '').slice(0, 220))}${(p.texto || p.objetivo || '').length > 220 ? '…' : ''}</p><footer><span class="mini">${esc(p.pilar)} · ${esc(p.formato)}</span>${pill(p.status, E.ST_LI)}</footer></article>`).join('') || '<p class="empty">Nenhuma publicação com esses filtros.</p>'}</div>`;

  root.addEventListener('click', e => {
    if (!/^#\/endo\/linkedin/.test(location.hash)) return;
    let b;
    if ((b = e.target.closest('[data-copy-post]'))) { e.stopPropagation(); const p = D.peek('linkedin').posts.find(x => x.id === b.dataset.copyPost); if (p) E.copy(p.texto); return; }
    if ((b = e.target.closest('[data-li-view]'))) { st.view = b.dataset.liView; try { localStorage.setItem('santer:li-vista', st.view); } catch (er) { /* ok */ } E.render(); return; }
    if ((b = e.target.closest('[data-li-m]'))) { st.mes = Math.min(12, Math.max(1, st.mes + +b.dataset.liM)); E.render(); return; }
    if ((b = e.target.closest('[data-li-clear]'))) { Object.keys(st.f).forEach(k => { st.f[k] = ''; }); E.render(); return; }
    if ((b = e.target.closest('[data-li-new]'))) {
      const id = E.uid('li');
      E.change('linkedin', d => { d.posts.push({ id, tipo: 'editorial', semana: '', data: `2027-${pad(st.f.mes ? +st.f.mes : st.mes)}-01`, mes: st.f.mes ? +st.f.mes : st.mes, pilar: '', tema: 'Nova publicação', objetivo: '', abordagem: '', formato: '', texto: '', materiais: '', conexao: '', referencias: '', responsavel: 'Marketing', consentimento: '', aprovacao: '', status: 'proposta', statusOriginal: '', notas: '' }); });
      openPost(id); return;
    }
    if ((b = e.target.closest('[data-post]')) && !e.target.closest('.e-drawer')) { openPost(b.dataset.post); }
  });
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('.li-card[data-post]')) openPost(e.target.dataset.post); });
  root.addEventListener('input', e => { if (e.target.id === 'li-q') { st.f.q = e.target.value; clearTimeout(st.qt); st.qt = setTimeout(() => E.render(), 220); } });
  root.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.liF; if (k) { st.f[k] = e.target.value; if (k === 'mes' && e.target.value) st.mes = +e.target.value; E.render(); } });
  /* Mantém a data e o mês coerentes quando a data é editada */
  D.on('linkedin', (d, origem) => { if (origem !== 'edicao') return; d.posts.forEach(p => { if (/^2027-\d\d/.test(p.data || '')) p.mes = +p.data.slice(5, 7); }); });

  E.views.linkedin = {
    title: () => 'Calendário editorial do LinkedIn',
    async render(c) {
      const d = await D.get('linkedin');
      if (c.params.post && st.open !== c.params.post) { const p0 = d.posts.find(x => x.id === c.params.post); if (p0 && p0.data) { st.mes = +p0.data.slice(5, 7); st.f.mes = ''; } }
      // Ordena uma cópia: os índices de d.posts são os endereços de edição e não podem mudar
      const all = d.posts.slice().sort((a, b) => (a.data || '9').localeCompare(b.data || '9')), list = filtrar(all);
      const ed = all.filter(p => p.tipo === 'editorial'), semanas = new Set(ed.map(p => p.semana).filter(Boolean));
      const sel = (k, label, opts) => `<label class="fsel"><span>${label}</span><select data-li-f="${k}"><option value="">Todos</option>${opts.map(o => `<option value="${esc(o[0])}"${st.f[k] === String(o[0]) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
      const counts = E.ST_LI.map(s => [s, all.filter(p => p.status === s[0]).length]).filter(x => x[1]);
      return `<section class="stats compact">
          <div class="stat"><span class="s-l">Pautas editoriais</span><b class="s-v">${ed.length}</b><span class="s-s">${semanas.size} semanas cobertas · 1 por semana</span></div>
          <div class="stat"><span class="s-l">Coberturas</span><b class="s-v">${all.length - ed.length}</b><span class="s-s">ações e eventos</span></div>
          ${counts.map(([s, n]) => `<div class="stat"><span class="s-l">${esc(s[1])}</span><b class="s-v">${n}</b><span class="s-s">${Math.round(n / all.length * 100)}% do total</span></div>`).join('')}
        </section>
        <div class="filterbar glass glass-live" role="search">
          <label class="fq">${I.search}<input id="li-q" type="search" placeholder="Buscar tema ou texto" value="${esc(st.f.q)}" aria-label="Buscar publicação"></label>
          ${sel('mes', 'Mês', MESES.map((n, k) => [k + 1, n]))}${sel('pilar', 'Linha editorial', uniq(all.map(p => p.pilar)).map(x => [x, x]))}${sel('formato', 'Formato', uniq(all.map(p => p.formato)).map(x => [x, x]))}
          ${sel('status', 'Status', E.ST_LI.map(s => [s[0], s[1]]))}${sel('tipo', 'Tipo', [['editorial', 'Editorial'], ['cobertura', 'Cobertura']])}${sel('resp', 'Responsável', uniq(all.map(p => p.responsavel)).map(x => [x, x]))}
          ${Object.values(st.f).some(Boolean) ? '<button type="button" class="btn sm ghost" data-li-clear>Limpar</button>' : ''}
          <span class="fb-sp"></span>
          <div class="vsw" role="group" aria-label="Visualização">${VIEWS.map(([k, l, ic]) => `<button type="button" class="btn sm ${st.view === k ? 'on-soft' : 'ghost'}" data-li-view="${k}" aria-pressed="${st.view === k}">${ic}<span>${l}</span></button>`).join('')}</div>
          <button type="button" class="btn sm primary" data-li-new>${I.plus}Nova</button>
        </div>
        <p class="note">${list.length} de ${all.length} publicações · <span class="li-k editorial">Editorial</span> pauta semanal · <span class="li-k cobertura">Cobertura</span> registro de ação ou evento. Nada é publicado automaticamente.</p>
        <div class="li-view">${st.view === 'lista' ? lista(list) : st.view === 'cards' ? cards(list) : calendario(list)}</div>`;
    },
    after(c) { if (c.params.post && st.open !== c.params.post) openPost(c.params.post); }
  };
})();
