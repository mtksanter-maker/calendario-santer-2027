/* Visão geral do ano */
(() => {
  const E = window.Endo, { esc, brl0, n1, MES3, MESES, pill, frente, carga } = E;
  E.views.visao = {
    title: () => 'Visão geral',
    async render() {
      const P = E.st.plano, C = P.campanha, A = E.ano();
      let li = null;
      try { li = await window.SanterDados.get('linkedin'); } catch (e) { li = null; }
      const posts = li ? li.posts : [];
      const ed = posts.filter(p => p.tipo === 'editorial').length, cob = posts.length - ed;
      const pub = posts.filter(p => p.status === 'publicado').length;
      const prog = A.progs[0];
      const hTot = A.hTotal;
      const pend = P.meses.flatMap(m => (m.pendencias || []).filter(p => p.critica && !p.feita).map(p => ({ m: m.m, p })));
      const porFrente = id => P.meses.filter(m => m.acao.frenteP === id);
      const porFrenteS = id => P.meses.filter(m => m.acao.frenteS === id);
      return `
      <section class="hero">
        <div class="hero-t">
          <span class="eyebrow">Campanha anual · 2027</span>
          <h2 class="display">Jeito Santer de <b>Ser</b></h2>
          <p class="hero-sig">${esc(C.assinatura)}</p>
          <p class="lead">${esc(C.conceito)}</p>
          <div class="hero-st">
            <span class="pill warn"><i class="dot"></i>Planejamento aguardando validação da diretoria e do RH</span>
            <span class="pill ${P.parametros.orcamentoAnualAprovado ? 'ok' : 'line'}"><i class="dot"></i>Orçamento anual ${P.parametros.orcamentoAnualAprovado ? 'aprovado' : 'não aprovado'}</span>
            <span class="pill line">Fonte: ${esc(P.fontes.biblia)}</span>
          </div>
        </div>
        <aside class="hero-tension"><span class="eyebrow">Tensão central</span><p>${esc(C.tensao)}</p></aside>
      </section>

      <section class="stats" aria-label="Indicadores do ano">
        <div class="stat"><span class="s-l">Ações principais</span><b class="s-v">${A.acoes}</b><span class="s-s">${A.aprovadas} aprovadas · ${A.realizadas} realizadas</span></div>
        <div class="stat"><span class="s-l">Investimento previsto</span><b class="s-v">${brl0(A.previsto)}</b><span class="s-s"><span class="mk-tag e">estimativa</span> realizado ${brl0(A.realizado)}</span></div>
        <div class="stat"><span class="s-l">Programas e experiências</span><b class="s-v">${A.progs.length + A.exps.length}</b><span class="s-s">${prog ? `${prog.c.sessoes} sessões de ${esc(prog.p.nome.toLowerCase())}` : ''}${A.exps.length ? ` · ${A.exps.length} experiência presencial` : ''}</span></div>
        <div class="stat"><span class="s-l">LinkedIn</span><b class="s-v">${li ? posts.length : '—'}</b><span class="s-s">${li ? `${ed} editoriais · ${cob} coberturas · ${pub} publicadas` : 'não carregado'}</span></div>
        <div class="stat"><span class="s-l">Impacto operacional</span><b class="s-v">${n1(Math.round(hTot))} h</b><span class="s-s">equipe ${n1(Math.round(A.hEquipe))} h · participação ${n1(Math.round(A.hColab))} h · ginástica ${n1(Math.round(A.hProg + A.hProgOrg))} h (teto)</span></div>
        <div class="stat"><span class="s-l">Público</span><b class="s-v">${P.parametros.sede}</b><span class="s-s">na sede · alcance ~${P.parametros.alcance} com obras <span class="mk-tag p">a confirmar: RH</span></span></div>
      </section>

      <section class="band">
        <div class="band-h"><h3>O ano em uma linha</h3><a class="link" href="#/endo/jornada">Abrir a jornada${E.I.chev}</a></div>
        <ol class="strip">${A.porMes.map(({ mo, o }) => `<li><a href="#/endo/mes/${E.pad(mo.m)}" class="strip-m ato-${mo.ato === 'Nossa gente' ? 1 : mo.ato === 'Nossa força' ? 2 : 3}">
          <span class="sm-n">${MES3[mo.m - 1]}</span><span class="sm-a">${esc(mo.acao.nome)}</span>
          <span class="sm-f">${frente(mo.acao.frenteP)}${carga(mo.carga)}</span><span class="sm-o num-t">${o.pendentes ? (o.total ? brl0(o.total) + ' + a cotar' : 'a cotar') : o.total ? brl0(o.total) : 'sem desembolso'}</span>${pill(mo.acao.status, null, true)}</a></li>`).join('')}</ol>
      </section>

      <div class="cols">
        <section class="panel">
          <h3>Objetivos do ano</h3>
          <ul class="ticks two">${C.objetivos.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
          <h3 class="mt">Três atos</h3>
          <div class="acts">${C.atos.map((a, k) => `<div class="act ato-${k + 1}"><div><b>${esc(a.nome)}</b><span>${esc(a.meses)}</span></div><p>${esc(a.enfase)}</p><q>${esc(a.pergunta)}</q></div>`).join('')}</div>
        </section>
        <section class="panel">
          <h3>Quatro frentes</h3>
          <div class="fronts">${C.frentes.map(fr => `<div class="front"><div class="fr-h">${frente(fr.id)}<b>${esc(fr.nome)}</b></div><p>${esc(fr.descricao)}</p>
            <div class="fr-m"><span class="mini">Principal</span>${porFrente(fr.id).map(m => `<a class="mchip" href="#/endo/mes/${E.pad(m.m)}">${MES3[m.m - 1]}</a>`).join('') || '<span class="mini">—</span>'}
            <span class="mini">Secundária</span>${porFrenteS(fr.id).map(m => `<a class="mchip ghost" href="#/endo/mes/${E.pad(m.m)}">${MES3[m.m - 1]}</a>`).join('') || '<span class="mini">—</span>'}</div></div>`).join('')}</div>
          <p class="note">Dezembro trabalha todas as frentes (retrospectiva). ${A.progs.map(r => `${esc(r.p.nome)} reforça ${esc(E.FRENTES[r.p.frente] || r.p.frente)} o ano todo.`).join(' ')}</p>
        </section>
      </div>

      <div class="cols">
        <section class="panel">
          <h3>Programas recorrentes e experiências presenciais</h3>
          <ul class="rows">
            ${A.progs.map(({ p, c }) => `<li><a href="#/endo/programas?id=${p.id}"><b>${esc(p.nome)}</b><span>${esc(p.frequencia)} · ${E.fd(p.lancamento)} a ${E.fd(p.fim)} · ${c.sessoes} sessões · ${p.turmas.length} turmas</span></a>${pill(p.status)}</li>`).join('')}
            ${A.exps.map(({ x }) => `<li><a href="#/endo/programas?id=${x.id}"><b>${esc(x.nome)}</b><span>${E.fdl(x.dataProvisoria)} · ${esc(x.janela || '')}</span></a>${pill(x.status)}</li>`).join('')}
            <li><a href="#/endo/mes/10"><b>Tour de obra</b><span>Outubro · ${esc(E.mes(10).acao.nome)}</span></a>${pill(E.mes(10).acao.status)}</li>
            <li><a href="#/endo/mes/01"><b>Quebra-cabeça da volta das férias</b><span>Janeiro · ${esc(E.mes(1).acao.nome)}</span></a>${pill(E.mes(1).acao.status)}</li>
          </ul>
          <h3 class="mt">Instrumentos permanentes</h3>
          <ul class="rows">${C.instrumentos.map(x => `<li><div><b>${esc(x.nome)}</b><span>${esc(x.descricao)}</span></div><span class="pill line">${esc(x.status)}</span></li>`).join('')}</ul>
        </section>
        <section class="panel">
          <div class="band-h"><h3>Pendências críticas em aberto</h3><span class="count">${pend.length}</span></div>
          ${pend.length ? `<ul class="rows dense">${pend.slice(0, 8).map(({ m, p }) => `<li><a href="#/endo/mes/${E.pad(m)}?aba=resumo"><b>${esc(p.item)}</b><span>${MESES[m - 1]}${p.quem ? ' · ' + esc(p.quem) : ''}</span></a></li>`).join('')}</ul>${pend.length > 8 ? `<p class="note">E mais ${pend.length - 8} nos meses. Marque como resolvidas na aba Resumo de cada mês.</p>` : ''}` : '<p class="note">Nenhuma pendência crítica em aberto.</p>'}
          <h3 class="mt">Aprovações necessárias antes de executar</h3>
          <p class="note">${esc(C.aprovacoes)}</p>
        </section>
      </div>

      <section class="panel">
        <h3>Públicos</h3>
        <div class="tw"><table class="t"><thead><tr><th>Público</th><th>Papel</th><th>Como participa</th></tr></thead><tbody>
        ${C.publicos.map(p => `<tr><td><b>${esc(p.publico)}</b></td><td>${esc(p.papel)}</td><td>${esc(p.participa)}</td></tr>`).join('')}</tbody></table></div>
      </section>`;
    }
  };
})();
