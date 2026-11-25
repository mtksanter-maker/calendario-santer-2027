/* Controle financeiro e controle de produtividade (impacto operacional) */
(() => {
  const E = window.Endo, { esc, brl, brl0, n1, MESES, MES3, pill, carga, pad, f, I } = E;
  const C1 = 'var(--d1)', C2 = 'var(--d2)', C3 = 'var(--d3)';
  const CLS_ORD = ['sem-desembolso', 'pequena', 'grande', 'acima-do-teto', 'a-cotar'];

  E.views.orcamento = {
    title: () => 'Orçamento',
    render() {
      const P = E.st.plano, A = E.ano(), PAR = P.parametros;
      const sedeAno = A.porMes.reduce((a, r) => a + r.o.sede, 0) + A.exps.reduce((a, r) => a + r.o.sede, 0);
      const extAno = A.porMes.reduce((a, r) => a + r.o.extensao, 0) + A.exps.reduce((a, r) => a + r.o.extensao, 0);
      const prev = Array(12).fill(0), real = Array(12).fill(0);
      A.porMes.forEach(r => { prev[r.mo.m - 1] += r.o.total; real[r.mo.m - 1] += r.o.realizado; });
      A.exps.forEach(r => { if (r.m) { prev[r.m - 1] += r.o.total; real[r.m - 1] += r.o.realizado; } });
      const dist = {}; CLS_ORD.forEach(k => { dist[k] = { n: 0, v: 0 }; });
      A.porMes.forEach(r => { dist[r.o.classe].n++; dist[r.o.classe].v += r.o.total; });
      A.exps.forEach(r => { dist[r.o.classe].n++; dist[r.o.classe].v += r.o.total; });
      const distTot = Object.values(dist).reduce((a, x) => a + x.n, 0);
      const DC = { 'sem-desembolso': 'var(--d-track)', pequena: C2, grande: C1, 'acima-do-teto': 'var(--danger)', 'a-cotar': 'var(--warn)' };
      const pendMes = Array(12).fill(0);
      A.porMes.forEach(r => { pendMes[r.mo.m - 1] += r.o.pendentes; }); A.exps.forEach(r => { if (r.m) pendMes[r.m - 1] += r.o.pendentes; });
      const eleg = A.elegiveis;
      const dif = A.realizado - A.previsto;
      const prog = A.progs[0];
      return `
      <div class="notice soft">${I.alert}<p><b>Não há orçamento anual aprovado.</b> Os valores são estimativas das fichas, sem cotação. Os tetos (até R$ ${PAR.tetoPequena} por pessoa nas ações pequenas e até R$ ${PAR.tetoGrande} nas maiores) são limites, não metas de gasto. Ações digitais que usam só recursos existentes ficam sem desembolso adicional.</p></div>
      <section class="stats" aria-label="Resumo financeiro">
        <div class="stat"><span class="s-l">Previsto no ano</span><b class="s-v">${brl0(A.previsto)}</b><span class="s-s"><span class="mk-tag e">estimativa</span> ${A.pendentesItens} itens a cotar</span></div>
        <div class="stat"><span class="s-l">Realizado</span><b class="s-v">${brl0(A.realizado)}</b><span class="s-s">diferença ${A.realizado ? brl0(dif) : '—'}</span></div>
        <div class="stat"><span class="s-l">Custo por colaborador</span><b class="s-v">${brl(sedeAno / PAR.sede)}</b><span class="s-s">sede (÷ ${PAR.sede}) · obras ${eleg ? brl(extAno / eleg) + ' por elegível (÷ ' + eleg + ')' : 'sem base de elegíveis'}</span></div>
        <div class="stat"><span class="s-l">Custos recorrentes</span><b class="s-v">${A.recorrentePend ? 'A cotar' : brl0(A.recorrente)}</b><span class="s-s">${prog ? `${esc(prog.p.nome)}: ${prog.c.sessoes} sessões` : ''}</span></div>
        <div class="stat"><span class="s-l">Orçamento anual</span><b class="s-v sm">${PAR.orcamentoAnualAprovado ? 'Aprovado' : 'Não aprovado'}</b><span class="s-s">${PAR.valorAprovado ? 'valor ' + brl0(PAR.valorAprovado) : 'sem definição formal'}</span></div>
      </section>
      <div class="cols wide-l">
        <section class="panel"><div class="band-h"><h3>Investimento previsto e realizado por mês</h3></div>
          ${E.bars([{ id: 'p', label: 'Previsto (estimativa)', color: C1, values: prev }, { id: 'r', label: 'Realizado', color: C2, values: real }], { fmt: v => brl0(v), aria: 'Investimento previsto e realizado por mês', extra: pendMes.map(n => n ? `+ ${n} item(ns) a cotar, fora do valor` : ''), link: i => `#/endo/mes/${pad(i + 1)}?aba=orcamento` })}
          <p class="note">Toque num mês para abrir o orçamento detalhado. Inclui a experiência presencial no mês da data provisória; a ginástica laboral fica à parte até haver cotação.</p></section>
        <section class="panel"><h3>Distribuição por porte</h3>
          <div class="segbar" role="img" aria-label="Distribuição das ações por porte">${CLS_ORD.filter(k => dist[k] && dist[k].n).map(k => `<span style="flex:${dist[k].n};background:${DC[k]}" data-tt="<b>${esc(E.CLASSE[k])}</b><span>${dist[k].n} ações · ${esc(brl0(dist[k].v))}</span>"></span>`).join('')}</div>
          <ul class="dl-list">${CLS_ORD.map(k => `<li><i style="background:${DC[k]}"></i><span>${esc(E.CLASSE[k])}</span><b>${dist[k].n}</b><em>${brl0(dist[k].v)}</em></li>`).join('')}</ul>
          <p class="note">${distTot} iniciativas classificadas pelo custo por pessoa calculado (sede e obras), não pelo rótulo.</p>
          <h3 class="mt">Cenários (sede, ${PAR.sede} pessoas)</h3>
          <div class="tw"><table class="t"><thead><tr><th>Cenário</th><th class="r">Teto</th><th class="r">Previsto sede</th><th></th></tr></thead><tbody>${PAR.cenarios.map(c => `<tr${PAR.cenarioEscolhido === c.id ? ' class="sel"' : ''}><td><b>${esc(c.nome)}</b><span class="mini block">${esc(c.composicao)}</span></td><td class="r num-t">${brl0(c.teto)}</td><td class="r num-t">${brl0(sedeAno)}</td><td>${sedeAno <= c.teto ? '<span class="pill ok">cabe</span>' : '<span class="pill warn">excede</span>'}</td></tr>`).join('')}</tbody></table></div>
        </section>
      </div>
      <section class="panel"><div class="band-h"><h3>Por mês e iniciativa</h3></div>
        <div class="tw"><table class="t fin"><thead><tr><th>Mês</th><th>Ação</th><th>Porte</th><th class="r">Sede</th><th class="r">Obras</th><th class="r">Previsto</th><th class="r">Por pessoa</th><th class="r">Realizado</th><th class="r">Diferença</th><th>Aprovação</th></tr></thead><tbody>
        ${A.porMes.map(({ mo, o }) => `<tr><td class="nowrap"><a href="#/endo/mes/${pad(mo.m)}?aba=orcamento">${MES3[mo.m - 1]}</a></td><td><a href="#/endo/mes/${pad(mo.m)}?aba=orcamento">${esc(mo.acao.nome)}</a>${o.pendentes ? ` <span class="mk-tag p">${o.pendentes} a cotar</span>` : ''}</td><td class="nowrap">${esc(E.CLASSE[o.classe].split(' (')[0])}</td>
          <td class="r num-t">${brl(o.sede)}</td><td class="r num-t">${brl(o.extensao)}</td><td class="r num-t"><b>${brl(o.total)}</b></td><td class="r num-t">${o.porPessoa == null ? '—' : brl(o.porPessoa)}${o.dentroDoTeto ? '' : ' <span class="mk-tag p">teto</span>'}</td>
          <td class="r num-t">${o.realizado ? brl(o.realizado) : '—'}</td><td class="r num-t">${o.realizado ? brl(o.realizado - o.total) : '—'}</td><td>${mo.orcamento.aprovado ? '<span class="pill ok">aprovado</span>' : '<span class="pill line">não aprovado</span>'}</td></tr>`).join('')}
        ${A.exps.map(({ x, o, m }) => `<tr><td class="nowrap">${m ? MES3[m - 1] : '—'}</td><td><a href="#/endo/programas?id=${x.id}">${esc(x.nome)}</a>${o.pendentes ? ` <span class="mk-tag p">${o.pendentes} a cotar</span>` : ''}</td><td>${esc(E.CLASSE[o.classe].split(' (')[0])}</td><td class="r num-t">${brl(o.sede)}</td><td class="r num-t">${brl(o.extensao)}</td><td class="r num-t"><b>${brl(o.total)}</b></td><td class="r num-t">${o.porPessoa == null ? '—' : brl(o.porPessoa)}</td><td class="r num-t">${o.realizado ? brl(o.realizado) : '—'}</td><td class="r num-t">${o.realizado ? brl(o.realizado - o.total) : '—'}</td><td>${(x.orcamento || {}).aprovado ? '<span class="pill ok">aprovado</span>' : '<span class="pill line">não aprovado</span>'}</td></tr>`).join('')}
        ${A.progs.map(({ p, c }) => `<tr><td class="nowrap">fev–dez</td><td><a href="#/endo/programas?id=${p.id}">${esc(p.nome)}</a> <span class="mini">recorrente · ${c.sessoes} sessões</span></td><td>Recorrente</td><td class="r num-t" colspan="2">${p.custoPorSessao == null ? '<span class="mk-tag p">custo por sessão a cotar</span>' : brl(p.custoPorSessao) + ' por sessão'}</td><td class="r num-t"><b>${c.custoAno == null ? '—' : brl(c.custoAno)}</b></td><td class="r num-t">${c.custoPessoa == null ? '—' : brl(c.custoPessoa)}</td><td class="r">—</td><td class="r">—</td><td><span class="pill line">não aprovado</span></td></tr>`).join('')}
        </tbody><tfoot><tr class="tot"><td colspan="3">Total (sem recorrentes)</td><td class="r num-t">${brl(sedeAno)}</td><td class="r num-t">${brl(extAno)}</td><td class="r num-t">${brl(A.previsto)}</td><td></td><td class="r num-t">${brl(A.realizado)}</td><td class="r num-t">${A.realizado ? brl(dif) : '—'}</td><td></td></tr></tfoot></table></div>
        <p class="note">Valores, quantidades e custos unitários são editados na aba Orçamento de cada mês; os totais são recalculados na hora.</p></section>
      <section class="panel"><h3>Definição formal do orçamento anual</h3>
        <div class="fgrid four"><label class="ckl">${f('plano', 'parametros.orcamentoAnualAprovado', { t: 'check', label: 'Orçamento anual aprovado' })} Orçamento anual aprovado formalmente</label>
          <label>Valor aprovado (R$)${f('plano', 'parametros.valorAprovado', { t: 'money', min: 0, ph: 'sem definição', label: 'Valor aprovado' })}</label>
          <label>Cenário escolhido${f('plano', 'parametros.cenarioEscolhido', { t: 'select', options: [['', 'Nenhum'], ...PAR.cenarios.map(c => [c.id, c.nome])], label: 'Cenário escolhido' })}</label>
          <label>Registro da aprovação${f('plano', 'parametros.registroAprovacao', { ph: 'Quem aprovou, quando, documento', label: 'Registro da aprovação' })}</label></div>
        <p class="note">${esc(PAR.nota)}</p></section>`;
    }
  };

  E.views.produtividade = {
    title: () => 'Produtividade e impacto operacional',
    render() {
      const P = E.st.plano, A = E.ano();
      const prog = A.progs[0];
      const colab = Array(12).fill(0), equipe = Array(12).fill(0), recorr = Array(12).fill(0);
      A.porMes.forEach(r => { colab[r.mo.m - 1] += r.i.colab || 0; equipe[r.mo.m - 1] += r.i.equipe; });
      A.exps.forEach(r => { if (r.m) equipe[r.m - 1] += (r.x.horasEquipe || []).reduce((a, h) => a + (E.isNum(h.horas) ? h.horas : 0), 0); });
      A.progs.forEach(r => r.c.hMes.forEach((h, m) => { recorr[m] += h + (r.c.orgMes && r.c.porMes[m] ? r.c.orgMes : 0); }));
      const tot = colab.map((c, m) => c + equipe[m] + recorr[m]);
      // Total do ano igual ao da Visão geral (inclui a organização do programa recorrente)
      const sorted = tot.slice().sort((a, b) => a - b), med = (sorted[5] + sorted[6]) / 2;
      const atencao = A.porMes.map(({ mo }, m) => (mo.carga.nivel === 'alta' && tot[m] >= med) || tot[m] >= sorted[9]);
      const maxSim = Math.max(0, ...A.porMes.map(r => r.i.max || 0), prog ? prog.p.maxSimultaneos || 0 : 0);
      const hTot = tot.reduce((a, b) => a + b, 0);
      return `
      <p class="lead narrow">O tempo de trabalho é tratado como orçamento. Horas = participantes × minutos (com deslocamento) ÷ 60, mais as horas de quem organiza e executa. Um comunicado simples não pesa como um evento presencial, e uma atividade curta repetida soma no ano.</p>
      <section class="stats" aria-label="Resumo de impacto">
        <div class="stat"><span class="s-l">Horas no ano</span><b class="s-v">${n1(Math.round(hTot))} h</b><span class="s-s">ações, experiência e programa recorrente</span></div>
        <div class="stat"><span class="s-l">Participação dos colaboradores</span><b class="s-v">${n1(Math.round(A.hColab))} h</b><span class="s-s">no expediente, nas ações mensais</span></div>
        <div class="stat"><span class="s-l">Organização e execução</span><b class="s-v">${n1(Math.round(A.hEquipe))} h</b><span class="s-s">equipe de endo, RH, gestores, diretoria</span></div>
        <div class="stat"><span class="s-l">Ginástica laboral</span><b class="s-v">${prog ? n1(Math.round(prog.c.hAno)) + ' h' : '—'}</b><span class="s-s">${prog ? `${prog.c.pessoas} pessoas (${prog.c.base}) · ${prog.c.min} min por sessão` : ''}</span></div>
        <div class="stat"><span class="s-l">Máximo fora do posto</span><b class="s-v">${maxSim || '—'}</b><span class="s-s">pessoas ao mesmo tempo (maior registro)</span></div>
        <div class="stat"><span class="s-l">Meses de atenção</span><b class="s-v">${atencao.filter(Boolean).length}</b><span class="s-s">${atencao.map((a, m) => a ? MES3[m] : '').filter(Boolean).join(' · ') || 'nenhum'}</span></div>
      </section>
      <section class="panel"><div class="band-h"><h3>Horas envolvidas por mês</h3></div>
        ${E.bars([{ id: 'c', label: 'Participação (colaboradores)', color: C1, values: colab }, { id: 'e', label: 'Organização e execução', color: C2, values: equipe }, { id: 'r', label: 'Programa recorrente', color: C3, values: recorr }], { stacked: true, h: 300, fmt: (v, ax) => ax ? n1(Math.round(v)) : n1(Math.round(v * 10) / 10) + ' h', aria: 'Horas por mês', flags: atencao.map(a => a ? '!' : ''), extra: A.porMes.map(({ mo }, m) => `Carga do mês: ${({ baixa: 'baixa', media: 'média', alta: 'alta' })[mo.carga.nivel] || '—'}${atencao[m] ? ' · atenção: carga alta e muitas horas' : ''}`), link: i => `#/endo/mes/${pad(i + 1)}?aba=impacto` })}
        <p class="note">“!” marca mês de atenção: carga do calendário alta com horas acima da mediana do ano, ou entre os três meses com mais horas. A ginástica usa o teto de participantes até a adesão real ser registrada.</p></section>
      <section class="panel"><h3>Detalhe por mês</h3>
        <div class="tw"><table class="t fin"><thead><tr><th>Mês</th><th>Ação</th><th>Carga</th><th class="r">Min/pessoa</th><th class="r">Participantes</th><th class="r">Participação</th><th class="r">Equipe</th><th class="r">Recorrente</th><th class="r">Total</th><th class="r">Máx. simult.</th></tr></thead><tbody>
        ${A.porMes.map(({ mo, i }, m) => `<tr class="${atencao[m] ? 'flag' : ''}"><td class="nowrap"><a href="#/endo/mes/${pad(mo.m)}?aba=impacto">${MES3[m]}</a>${atencao[m] ? ' <span class="pill warn">atenção</span>' : ''}</td><td>${esc(mo.acao.nome)}</td><td>${carga(mo.carga)}</td>
          <td class="r num-t">${i.minutos == null ? '—' : n1(i.minutos)}</td><td class="r num-t">${mo.impacto.participantes ?? '—'}</td><td class="r num-t">${i.colab == null ? '<span class="mk-tag p">pendente</span>' : n1(i.colab) + ' h'}${i.colabFonte === 'ficha' ? '<span class="mini block">da ficha</span>' : ''}</td>
          <td class="r num-t">${n1(i.equipe)} h</td><td class="r num-t">${recorr[m] ? n1(Math.round(recorr[m])) + ' h' : '—'}</td><td class="r num-t"><b>${n1(Math.round(tot[m]))} h</b></td><td class="r num-t">${i.max ?? '—'}</td></tr>`).join('')}
        </tbody><tfoot><tr class="tot"><td colspan="5">Ano</td><td class="r num-t">${n1(Math.round(A.hColab))} h</td><td class="r num-t">${n1(Math.round(equipe.reduce((a, b) => a + b, 0)))} h</td><td class="r num-t">${n1(Math.round(recorr.reduce((a, b) => a + b, 0)))} h</td><td class="r num-t">${n1(Math.round(hTot))} h</td><td></td></tr></tfoot></table></div>
        ${A.exps.map(({ x }) => `<p class="note"><b>${esc(x.nome)}:</b> ${x.horasParticipantes ? `${x.horasParticipantes.noExpediente} h no expediente; ${esc(x.horasParticipantes.voluntariasForaDoExpediente || '')}` : ''} Equipe: ${n1((x.horasEquipe || []).reduce((a, h) => a + (h.horas || 0), 0))} h (somadas ao mês da data).</p>`).join('')}
        <p class="note">Campos vazios nas fichas (simultaneidade, deslocamento) estão marcados como pendentes; preencha na aba Impacto operacional de cada mês quando houver o dado.</p></section>`;
    }
  };
})();
