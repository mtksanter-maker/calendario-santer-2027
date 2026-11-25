/* Central de pesquisa e benchmarking: base de cases e evidências (somente leitura; carregada sob demanda) */
(() => {
  const E = window.Endo, { esc, MESES, MES3, pad, I, norm } = E;
  const D = window.SanterDados;
  const root = document.getElementById('mod-endo');
  const st = { f: { q: '', empresa: '', cat: '', obj: '', tipo: '', grupo: '', porte: '', citado: '', baixo: '' }, open: null, lim: 40 };
  const OBJ = { integracao: 'Integração', reconhecimento: 'Reconhecimento', 'saude-bem-estar': 'Saúde e bem-estar', financeiro: 'Vida financeira', desenvolvimento: 'Desenvolvimento', 'eficiencia-melhoria': 'Eficiência e melhoria', comunicacao: 'Comunicação', 'marca-empregadora': 'Marca empregadora', advocacy: 'Employee advocacy', cultura: 'Cultura', lideranca: 'Liderança', 'conhecimento-produto': 'Conhecimento de produto' };
  const TIPO = { 'programa-continuo': 'Programa contínuo', campanha: 'Campanha', 'ritual-rotina': 'Ritual de rotina', 'canal-ferramenta': 'Canal ou ferramenta', evento: 'Evento', 'politica-beneficio': 'Política ou benefício', 'estudo-evidencia': 'Estudo ou evidência', 'premio-certificacao': 'Prêmio ou certificação' };
  const PORTE = { grande: 'Grande empresa', medio: 'Média empresa', familiar: 'Empresa familiar', 'construcao-industria': 'Construção e indústria', 'academico-regulatorio': 'Acadêmico e regulatório' };
  const REG = { case: 'Case', evidencia: 'Evidência', 'presenca-santer': 'Presença pública da Santer' };
  const conf = c => { const t = norm(c || ''); return t.startsWith('alta') ? 'ok' : t.startsWith('med') ? 'info' : t.startsWith('baixa') ? 'warn' : ''; };

  function filtrar(cases) {
    const f = st.f, q = norm(f.q);
    return cases.filter(c => (!f.empresa || c.empresa === f.empresa) && (!f.cat || (c.categorias || []).includes(f.cat)) && (!f.obj || c.objetivo === f.obj)
      && (!f.tipo || c.tipoIniciativa === f.tipo) && (!f.grupo || c.grupo === f.grupo) && (!f.porte || c.porte === f.porte)
      && (!f.citado || (f.citado === 'sim' ? (c.mesesQueCitam || []).length : f.citado === String(+f.citado) && (c.mesesQueCitam || []).includes(+f.citado)))
      && (!f.baixo || (f.baixo === 'custo' ? c.baixoCusto : c.semInterrupcao))
      && (!q || norm(`${c.id} ${c.empresa} ${c.titulo} ${c.resumo} ${c.funcionamento} ${c.aprendizados} ${c.aplicacaoSanter}`).includes(q)));
  }
  function caseHTML(c, cats) {
    const P = E.st.plano;
    const block = (t, v, cls) => v ? `<section class="cs-b ${cls || ''}"><h4>${t}</h4><p>${E.inline(v)}</p></section>` : '';
    return `<header class="dr-h"><div><span class="eyebrow">${esc(c.id)} · ${esc(REG[c.tipoRegistro] || 'Case')} · ${esc(PORTE[c.porte] || '')}</span><h2>${esc(c.titulo)}</h2><p class="dr-sub">${esc(c.empresa)}</p></div><button type="button" class="btn sm ghost icon" data-close-drawer aria-label="Fechar">${I.x}</button></header>
      <div class="dr-b">
        <div class="cs-tags">${(c.categorias || []).map(id => `<span class="pill line">${esc((cats.find(x => x.id === id) || {}).nome || id)}</span>`).join('')}${c.confianca ? `<span class="pill ${conf(c.confianca)}">Confiança ${esc(c.confianca)}</span>` : ''}${c.tipoFonte ? `<span class="pill line">${esc(c.tipoFonte)}</span>` : ''}${c.baixoCusto ? '<span class="pill ok">baixo custo</span>' : ''}${c.semInterrupcao ? '<span class="pill ok">sem interromper a rotina</span>' : ''}</div>
        <p class="lead">${esc(c.resumo)}</p>
        <dl class="cs-dl"><div><dt>Objetivo</dt><dd>${esc(OBJ[c.objetivo] || c.objetivo || '—')}</dd></div><div><dt>Tipo de iniciativa</dt><dd>${esc(TIPO[c.tipoIniciativa] || c.tipoIniciativa || '—')}</dd></div><div><dt>Publicação</dt><dd>${esc(c.publicacao || '—')}</dd></div><div><dt>Consulta</dt><dd>${E.fd(c.consulta)}</dd></div></dl>
        ${block('Contexto', c.contexto)}${block('Como funciona', c.funcionamento)}${block('Resultados divulgados', c.resultados)}${block('Método de medição', c.metodoMedicao)}
        ${block('Aprendizado (mecanismo)', c.aprendizados)}${block('Possível aplicação na Santer', c.aplicacaoSanter, 'apl')}${block('Limitações', c.limitacoes, 'lim')}
        ${(c.mesesQueCitam || []).length ? `<section class="cs-b"><h4>Inspirou o planejamento de</h4><div class="cs-tags">${c.mesesQueCitam.map(m => `<a class="mchip" href="#/endo/mes/${pad(m)}?aba=referencias">${MESES[m - 1]} · ${esc((P.meses.find(x => x.m === m) || { acao: {} }).acao.nome || '')}</a>`).join('')}</div></section>` : ''}
        <section class="cs-b"><h4>Fonte original</h4>${(c.urls && c.urls.length ? c.urls : c.url ? [c.url] : []).filter(u => /^https?:\/\//i.test(u)).map(u => `<a class="src" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${I.ext}<span>${esc(u)}</span></a>`).join('') || `<p class="note">${c.doi ? 'DOI ' + esc(c.doi) : 'Sem URL pública registrada na pesquisa.'}</p>`}
          <p class="note">Evidência pública registrada pela pesquisa de 24/11/2026. A coluna de aplicação é hipótese ou recomendação, não fato interno da Santer.</p></section>
      </div>`;
  }
  function openCase(id) {
    const d = D.peek('pesquisa'); const c = d && d.cases.find(x => x.id === id);
    if (!c) return;
    st.open = id;
    E.openDrawer(caseHTML(c, d.categorias), () => { st.open = null; delete E.cur.params.id; if (/id=/.test(location.hash)) history.replaceState(null, '', '#/endo/pesquisa'); });
  }
  root.addEventListener('click', e => {
    if (!/^#\/endo\/pesquisa/.test(location.hash)) return;
    let b;
    if ((b = e.target.closest('[data-case]'))) { openCase(b.dataset.case); return; }
    if ((b = e.target.closest('[data-pq-cat]'))) { st.f.cat = st.f.cat === b.dataset.pqCat ? '' : b.dataset.pqCat; st.lim = 40; E.render(); return; }
    if (e.target.closest('[data-pq-clear]')) { Object.keys(st.f).forEach(k => { st.f[k] = ''; }); st.lim = 40; E.render(); return; }
    if (e.target.closest('[data-pq-more]')) { st.lim += 60; E.render(); }
  });
  root.addEventListener('input', e => { if (e.target.id === 'pq-q') { st.f.q = e.target.value; st.lim = 40; clearTimeout(st.t); st.t = setTimeout(() => E.render(), 200); } });
  root.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.pqF; if (k) { st.f[k] = e.target.value; st.lim = 40; E.render(); } });

  E.views.pesquisa = {
    title: () => 'Pesquisa e benchmarking',
    async render() {
      const d = await D.get('pesquisa');
      const cases = d.cases, list = filtrar(cases), cats = d.categorias;
      const empresas = Array.from(new Set(cases.map(c => c.empresa))).sort((a, b) => a.localeCompare(b, 'pt'));
      const sel = (k, label, opts) => `<label class="fsel"><span>${label}</span><select data-pq-f="${k}"><option value="">Todos</option>${opts.map(o => `<option value="${esc(o[0])}"${st.f[k] === String(o[0]) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`;
      const nCat = id => cases.filter(c => (c.categorias || []).includes(id)).length;
      const citados = cases.filter(c => (c.mesesQueCitam || []).length).length;
      return `<p class="lead narrow">${cases.length} registros pesquisados em ${d.fontes.length} frentes (grandes empresas, médias e familiares, construção e indústria, evidência científica e regulatória), consultados em ${E.fd(d.fontes[0].consulta)}. ${citados} deles fundamentam ações do planejamento. Cada caso separa o que foi publicado, o mecanismo que fez funcionar, a possível aplicação na Santer e as limitações.</p>
        <section class="stats compact">${d.fontes.map(fn => `<div class="stat"><span class="s-l">${esc(fn.id)}</span><b class="s-v">${fn.registros}</b><span class="s-s">${esc(fn.titulo)}</span></div>`).join('')}</section>
        <div class="catchips" role="group" aria-label="Categorias">${cats.map(c => `<button type="button" class="chip" data-pq-cat="${c.id}" aria-pressed="${st.f.cat === c.id}">${esc(c.nome)}<span class="n">${nCat(c.id)}</span></button>`).join('')}</div>
        <div class="filterbar glass glass-live" role="search">
          <label class="fq">${I.search}<input id="pq-q" type="search" placeholder="Buscar empresa, mecanismo, aplicação" value="${esc(st.f.q)}" aria-label="Buscar na pesquisa"></label>
          ${sel('empresa', 'Empresa', empresas.map(x => [x, x]))}${sel('obj', 'Objetivo', Object.entries(OBJ))}${sel('tipo', 'Tipo de iniciativa', Object.entries(TIPO))}${sel('porte', 'Porte', Object.entries(PORTE))}
          ${sel('citado', 'Uso no plano', [['sim', 'Citado em alguma ficha'], ...MESES.map((n, k) => [String(k + 1), 'Inspirou ' + n.toLowerCase()])])}${sel('baixo', 'Execução', [['custo', 'Baixo custo'], ['rotina', 'Sem interromper a rotina']])}
          ${Object.values(st.f).some(Boolean) ? '<button type="button" class="btn sm ghost" data-pq-clear>Limpar</button>' : ''}
        </div>
        <p class="note">${list.length} de ${cases.length} registros</p>
        <ul class="pq-list">${list.slice(0, st.lim).map(c => `<li><button type="button" class="pq" data-case="${c.id}">
          <span class="tag">${esc(c.id)}</span>
          <span class="pq-m"><b>${esc(c.titulo)}</b><span>${esc(c.empresa)} · ${esc(PORTE[c.porte] || '')}${(c.mesesQueCitam || []).length ? ` · inspirou ${c.mesesQueCitam.map(m => MES3[m - 1]).join(', ')}` : ''}</span></span>
          <span class="pq-r">${(c.categorias || []).slice(0, 2).map(id => `<span class="pill line">${esc(((cats.find(x => x.id === id) || {}).nome || id).split(' (')[0])}</span>`).join('')}${c.confianca ? `<span class="pill ${conf(c.confianca)}">${esc(c.confianca)}</span>` : ''}</span>
          ${I.chev}</button></li>`).join('') || '<li class="empty">Nenhum registro com esses filtros.</li>'}</ul>
        ${list.length > st.lim ? `<p class="more"><button type="button" class="btn" data-pq-more>Mostrar mais ${Math.min(60, list.length - st.lim)}</button></p>` : ''}`;
    },
    after(c) { if (c.params.id && st.open !== c.params.id) openCase(c.params.id); }
  };
})();
