/* Programas recorrentes (ginástica laboral) e experiências presenciais específicas */
(() => {
  const E = window.Endo, { esc, brl, n1, MESES, MES3, pill, frente, pad, f, I, fd, fdl } = E;
  const root = document.getElementById('mod-endo');
  const WDN = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  function minutas(list) {
    return `<div class="cms">${(list || []).map(c => `<article class="cm" data-copy-src data-copy-text="${esc(c.texto)}"><header><h4>${esc(c.canal)}<span class="mini">${esc(/^\d{4}-/.test(c.quando || '') ? fdl(c.quando) : c.quando || '')}${c.publico ? ' · ' + esc(c.publico) : ''}</span></h4><button type="button" class="btn xs" data-copy>${I.copy}Copiar</button></header><p>${esc(c.texto)}</p></article>`).join('')}</div>`;
  }
  function vincBlock(kind, ix, item, cal, sugerido) {
    const vs = item.vinculos || [];
    const aprov = E.APROVADO.has(item.status);
    const rows = vs.map(v => { const ev = cal && cal.event(v.eventId); return `<li><div><b>${ev ? esc(ev.t) : 'Evento removido do calendário'}</b><span>${ev ? fdl(ev.d) + ' · ' + esc(ev.cat) : ''}</span></div><span class="row-btns">${ev ? `<a class="btn xs ghost" href="#/calendario?data=${ev.d}">Ver</a>` : ''}<button type="button" class="btn xs ghost" data-p-unlink="${kind}|${ix}|${v.eventId}">Desvincular</button></span></li>`; }).join('');
    const sug = sugerido && !vs.some(v => v.eventId === sugerido.id) ? `<p class="note">Já existe no calendário: <b>${esc(sugerido.t)}</b> (${fdl(sugerido.d)}). <button type="button" class="btn xs" data-p-link="${kind}|${ix}|${sugerido.id}">${I.link}Vincular a este evento</button></p>` : '';
    return `<section class="blk"><h3>Calendário oficial</h3>${rows ? `<ul class="rows dense">${rows}</ul>` : '<p class="note">Sem evento oficial vinculado. As datas aparecem no calendário só como camada de planejamento.</p>'}${sug}
      ${!vs.length ? `<button type="button" class="btn sm" data-p-pub="${kind}|${ix}" ${aprov ? '' : 'disabled'} title="${aprov ? '' : 'Disponível quando estiver aprovado'}">${I.cal}${kind === 'prog' ? 'Publicar o lançamento no calendário' : 'Publicar a data no calendário'}</button>` : ''}</section>`;
  }

  function programa(p, k, cal) {
    const c = E.prog(p), P = `programas.${k}`;
    const feitas = new Set(p.sessoesRealizadas || []);
    const sem = new Map((p.semanasSemSessaoDetalhe || []).map(s => [s.dataSemSessao, s]));
    const aj = new Map((p.ajustesHorario || []).map(a => [a.data, a]));
    const months = Array.from({ length: 12 }, (_, m) => {
      const ds = (p.sessoes || []).filter(d => +d.slice(5, 7) === m + 1);
      const ss = Array.from(sem.values()).filter(s => +s.dataSemSessao.slice(5, 7) === m + 1);
      return `<div class="sess-m"><b>${MES3[m]}</b><div class="sess-d">${ds.map(d => `<button type="button" class="sess${feitas.has(d) ? ' done' : ''}${aj.has(d) ? ' adj' : ''}" data-sess="${k}|${d}" aria-pressed="${feitas.has(d)}" title="${fdl(d)}${aj.has(d) ? ' · horário ' + esc(aj.get(d).horario) + ': ' + esc(aj.get(d).motivo) : ''}${feitas.has(d) ? ' · realizada' : ' · clique para registrar como realizada'}">${+d.slice(8)}</button>`).join('')}${ss.map(s => `<span class="sess off" title="${esc(s.motivo)}">${+s.dataSemSessao.slice(8)}</span>`).join('')}</div></div>`;
    }).join('');
    return `<article class="prog" id="p-${p.id}">
      <header class="prog-h"><div><span class="eyebrow">Programa recorrente · ${esc(E.FRENTES[p.frente] || p.frente)}</span><h2>${esc(p.nome)}</h2>
        <p class="lead">${esc(p.frequencia)}, às ${WDN[p.diaSemana] || ''}s, de ${fdl(p.lancamento)} a ${fdl(p.fim)}. Cinco minutos de exercícios por participante, em turmas escalonadas por setor. Não é uma campanha mensal.</p></div>
        <label class="lbl">Status${E.stSelect('plano', `${P}.status`)}</label></header>
      <div class="kpis">
        <div><span>Sessões previstas</span><b>${c.sessoes}</b><em>${c.realizadas} realizadas · ${(p.semanasSemSessaoDetalhe || []).length} semanas sem sessão</em></div>
        <div><span>Tempo por participante</span><b>${c.min} min</b><em>${p.minutosExercicio} de exercício + deslocamento e espera</em></div>
        <div><span>Máximo fora do posto</span><b>${p.maxSimultaneos}</b><em>pessoas por turma · ${p.turmas.length} turmas</em></div>
        <div><span>Horas no ano</span><b>${n1(Math.round(c.hAno))} h</b><em>${c.pessoas} pessoas (${c.base}) · ${n1(c.hSessao)} h por sessão</em></div>
        <div><span>Custo anual</span><b>${c.custoAno == null ? 'A cotar' : brl(c.custoAno)}</b><em>${c.custoAno == null ? 'sem valor por sessão' : `${brl(p.custoPorSessao)} por sessão · ${c.custoPessoa == null ? '' : brl(c.custoPessoa) + ' por participante'}`}</em></div>
      </div>
      <div class="split">
        <div class="col-main">
          <section class="blk"><h3>Cronograma de sessões</h3><p class="note">Clique numa sessão para registrar que ela aconteceu. Laranja: horário ajustado. Riscado: semana sem sessão (feriado ou ponte).</p><div class="sess-grid">${months}</div>
            ${p.pilotoAjuste ? `<p class="note"><b>Ajuste inicial:</b> ${fd(p.pilotoAjuste.de)} a ${fd(p.pilotoAjuste.ate)}, revisão em ${fd(p.pilotoAjuste.revisao)}. ${esc(p.pilotoAjuste.obs || '')}</p>` : ''}
            <p class="note">${esc(p.foraDoPeriodo || '')}</p></section>
          <section class="blk"><div class="blk-h"><h3>Turmas, dias e horários</h3><button type="button" class="btn sm ghost" data-add="plano:${P}.turmas" data-tpl="turma">${I.plus}Turma</button></div>
            <div class="tw"><table class="t edit"><thead><tr><th>Grupo</th><th>Horário</th><th>Setores</th><th>Pessoas</th><th></th></tr></thead><tbody>${p.turmas.map((t, j) => `<tr><td>${f('plano', `${P}.turmas.${j}.grupo`, { label: 'Grupo' })}</td><td>${f('plano', `${P}.turmas.${j}.horario`, { label: 'Horário', cls: 'w5' })}</td><td class="wide">${f('plano', `${P}.turmas.${j}.setores`, { label: 'Setores' })}</td><td>${f('plano', `${P}.turmas.${j}.pessoas`, { t: 'num', min: 0, label: 'Pessoas', cls: 'w4' })}</td><td><button type="button" class="btn xs ghost icon" data-del="plano:${P}.turmas.${j}" aria-label="Remover turma">${I.trash}</button></td></tr>`).join('')}</tbody></table></div>
            <p class="note"><b>Rodízio:</b> ${esc(p.rodizio || '')}</p><p class="note"><b>Atendimento:</b> ${esc(p.regraAtendimento || '')}</p></section>
          <section class="blk"><h3>Custos</h3>
            <div class="fgrid four"><label>Custo por sessão (R$)${f('plano', `${P}.custoPorSessao`, { t: 'money', min: 0, ph: 'a cotar', label: 'Custo por sessão' })}</label><label>Adesão prevista (pessoas)${f('plano', `${P}.adesaoPrevista`, { t: 'num', min: 0, ph: 'a medir', label: 'Adesão prevista' })}</label>
              <label>Minutos por participante${f('plano', `${P}.minutosPorParticipante`, { t: 'num', min: 0, label: 'Minutos por participante' })}</label><label>Organização (h/mês)${f('plano', `${P}.horasOrganizacaoMes`, { t: 'num', min: 0, label: 'Horas de organização por mês' })}</label></div>
            <div class="tw"><table class="t"><thead><tr><th>Mês</th>${MES3.map(m => `<th class="r">${m}</th>`).join('')}<th class="r">Ano</th></tr></thead><tbody>
              <tr><td>Sessões</td>${c.porMes.map(n => `<td class="r num-t">${n || '—'}</td>`).join('')}<td class="r num-t"><b>${c.sessoes}</b></td></tr>
              <tr><td>Horas</td>${c.hMes.map(h => `<td class="r num-t">${h ? n1(Math.round(h)) : '—'}</td>`).join('')}<td class="r num-t"><b>${n1(Math.round(c.hAno))}</b></td></tr>
              <tr><td>Custo</td>${c.porMes.map((n, m) => `<td class="r num-t">${c.custoMes ? (c.custoMes[m] ? E.brl0(c.custoMes[m]) : '—') : (n ? '?' : '—')}</td>`).join('')}<td class="r num-t"><b>${c.custoAno == null ? 'a cotar' : E.brl0(c.custoAno)}</b></td></tr></tbody></table></div>
            <p class="note">${esc(p.custoObs || '')} ${p.custoReferenciaPorSessao ? `Referência (não é preço): até ${brl(p.custoReferenciaPorSessao.equivalePequena98)} por sessão o ano equivale a uma ação pequena para 98 pessoas; até ${brl(p.custoReferenciaPorSessao.equivaleGrande98)}, a uma ação maior.` : ''}</p></section>
          <section class="blk"><h3>Comunicação</h3>${minutas(p.comunicacao)}</section>
        </div>
        <aside class="col-side">
          ${vincBlock('prog', k, p, cal)}
          <section class="blk"><h3>Responsáveis</h3><ul class="resp">${(p.responsaveis || []).map(r => `<li><b>${esc(r.quem)}</b><span>${esc(r.faz)}</span></li>`).join('')}</ul></section>
          <section class="blk"><h3>Espaço</h3><p>${esc(p.espaco || '')}</p><h3 class="mt">Extensão às obras</h3><p>${esc(p.extensaoObras || '')}</p></section>
          <section class="blk"><h3>Observações operacionais</h3><ul class="ticks">${(p.observacoes || []).map(o => `<li>${esc(o)}</li>`).join('')}</ul>${f('plano', `${P}.observacoesOperacionais`, { t: 'area', rows: 3, ph: 'Registros do dia a dia: espaço, turmas, ajustes…', label: 'Observações operacionais' })}</section>
          <section class="blk"><h3>Pendências</h3><ul class="rows dense">${(p.pendencias || []).map(x => `<li><div><b>${esc(x.item)}</b><span>${esc(x.quem || '')}${x.prazo ? ' · até ' + fd(x.prazo) : ''}</span></div></li>`).join('')}</ul></section>
          <section class="blk"><h3>Indicadores</h3><ul class="ticks">${(p.indicadores || []).map(o => `<li>${esc(o)}</li>`).join('')}</ul></section>
        </aside>
      </div></article>`;
  }

  function experiencia(x, k, cal) {
    const P = `experiencias.${k}`, R = E.expCalc(x), o = x.orcamento || { itens: [], realizado: [] };
    const sug = cal ? cal.events().find(e => e.d === x.dataProvisoria && /esport/i.test(e.t)) : null;
    return `<article class="prog" id="p-${x.id}">
      <header class="prog-h"><div><span class="eyebrow">Experiência presencial · ${MESES[(x.m || 1) - 1]} · ${esc(E.FRENTES[x.frente] || x.frente)}</span><h2>${esc(x.nome)}</h2><p class="lead">${esc(x.resumo || '')}</p></div>
        <label class="lbl">Status${E.stSelect('plano', `${P}.status`)}</label></header>
      <div class="kpis">
        <div><span>Data provisória</span><b class="sm">${fdl(x.dataProvisoria)}</b><em>reserva ${fd(x.dataReserva)}${x.dataReservaFinal ? ' · última ' + fd(x.dataReservaFinal) : ''}</em></div>
        <div><span>Inscrições (base)</span><b>${x.inscricoesBase ?? '—'}</b><em>${esc((x.inscricoesObs || '').replace(/\[ESTIMATIVA\]\s*/, ''))}</em></div>
        <div><span>No expediente</span><b>${x.horasParticipantes ? x.horasParticipantes.noExpediente : '—'} h</b><em>participação voluntária</em></div>
        <div><span>Previsto</span><b>${brl(R.total)}</b><em>${R.pendentes} item(ns) a cotar · ${R.porPessoa == null ? '' : brl(R.porPessoa) + ' por inscrito'}</em></div>
        <div><span>Realizado</span><b>${brl(R.realizado)}</b><em>teto ${brl(o.teto)} por pessoa</em></div>
      </div>
      <div class="split"><div class="col-main">
        <section class="blk"><h3>Data e janela</h3><div class="fgrid four"><label>Data provisória${f('plano', `${P}.dataProvisoria`, { t: 'date', label: 'Data provisória' })}</label><label>Data reserva${f('plano', `${P}.dataReserva`, { t: 'date', label: 'Data reserva' })}</label></div>
          <p>${esc(x.janela || '')}</p><p class="note">${esc(x.ancoraNoApp || '')}</p></section>
        <section class="blk"><h3>Funcionamento</h3><ol class="steps">${(x.funcionamento || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
        <section class="blk"><div class="blk-h"><h3>Orçamento</h3><button type="button" class="btn sm ghost" data-add="plano:${P}.orcamento.itens" data-tpl="item">${I.plus}Item</button></div>
          <div class="tw"><table class="t edit budget"><thead><tr><th>Incl.</th><th>Item e fonte</th><th>Qtd.</th><th>Unitário (R$)</th><th class="r">Total</th><th></th></tr></thead><tbody>
          ${o.itens.map((it, j) => { const tot = E.isNum(it.qtd) && E.isNum(it.unitario) ? it.qtd * it.unitario : null; return `<tr class="${it.incluir === false ? 'off' : ''}"><td>${f('plano', `${P}.orcamento.itens.${j}.incluir`, { t: 'check', label: 'Considerar' })}</td><td class="wide">${f('plano', `${P}.orcamento.itens.${j}.item`, { label: 'Item' })}<span class="mini">${esc(it.fonte || '')}</span></td><td>${f('plano', `${P}.orcamento.itens.${j}.qtd`, { t: 'num', min: 0, label: 'Quantidade', cls: 'w5' })}</td><td>${f('plano', `${P}.orcamento.itens.${j}.unitario`, { t: 'money', min: 0, ph: 'a cotar', label: 'Unitário', cls: 'w7' })}</td><td class="r num-t">${tot == null ? '<span class="mk-tag p">a cotar</span>' : brl(tot)}</td><td><button type="button" class="btn xs ghost icon" data-del="plano:${P}.orcamento.itens.${j}" aria-label="Remover item">${I.trash}</button></td></tr>`; }).join('')}</tbody>
          <tfoot><tr><td colspan="4">Contingência ${f('plano', `${P}.orcamento.contingenciaPct`, { t: 'num', min: 0, label: 'Contingência', cls: 'w4' })} %</td><td class="r num-t">${brl(R.total - R.subtotal)}</td><td></td></tr><tr class="tot"><td colspan="4">Total previsto</td><td class="r num-t">${brl(R.total)}</td><td></td></tr></tfoot></table></div>
          <div class="blk-h"><span class="lbl">Realizado</span><button type="button" class="btn xs ghost" data-add="plano:${P}.orcamento.realizado" data-tpl="realizado">${I.plus}Lançamento</button></div>
          <ul class="rows dense">${(o.realizado || []).map((r, j) => `<li class="row">${f('plano', `${P}.orcamento.realizado.${j}.data`, { t: 'date', label: 'Data' })}${f('plano', `${P}.orcamento.realizado.${j}.descricao`, { label: 'Descrição', ph: 'Descrição' })}${f('plano', `${P}.orcamento.realizado.${j}.valor`, { t: 'money', label: 'Valor', cls: 'w7' })}<button type="button" class="btn xs ghost icon" data-del="plano:${P}.orcamento.realizado.${j}" aria-label="Remover">${I.trash}</button></li>`).join('')}</ul></section>
        <section class="blk"><h3>Comunicação</h3>${minutas(x.comunicacao)}</section>
      </div><aside class="col-side">
        ${vincBlock('exp', k, x, cal, sug)}
        <section class="blk"><h3>Convivência com a ação do mês</h3><p>${esc(x.convivenciaComAcaoDoMes || '')}</p></section>
        <section class="blk"><h3>Impacto operacional</h3><p class="note">${esc(x.maxSimultaneosObs || '')}</p><p class="note">${esc(x.deslocamentoObs || '')}</p>
          <ul class="resp">${(x.horasEquipe || []).map(h => `<li><b>${esc(h.quem)} · ${n1(h.horas)} h</b><span>${esc(h.emQue || '')}</span></li>`).join('')}</ul></section>
        <section class="blk"><h3>Riscos e plano B</h3><ul class="risks">${(x.riscos || []).map(r => `<li><b>${esc(r.risco)}</b><span>${esc(r.planoB)}</span></li>`).join('')}</ul></section>
        <section class="blk"><h3>Para quem não for</h3><p>${esc(x.extensao || '')}</p></section>
        <section class="blk"><h3>Pendências</h3><ul class="rows dense">${(x.pendencias || []).map(p => `<li><div><b>${esc(p.item)}</b><span>${esc(p.quem || '')}${p.prazo ? ' · até ' + fd(p.prazo) : ''}</span></div></li>`).join('')}</ul></section>
        <section class="blk"><h3>Observações</h3>${f('plano', `${P}.observacoes`, { t: 'area', rows: 3, label: 'Observações' })}</section>
      </aside></div></article>`;
  }

  root.addEventListener('click', async e => {
    if (!/^#\/endo\/programas/.test(location.hash)) return;
    let b;
    if ((b = e.target.closest('[data-sess]'))) {
      const [k, d] = b.dataset.sess.split('|');
      E.change('plano', p => { const s = new Set(p.programas[+k].sessoesRealizadas || []); if (s.has(d)) s.delete(d); else s.add(d); p.programas[+k].sessoesRealizadas = Array.from(s).sort(); });
      return;
    }
    const list = kind => kind === 'prog' ? 'programas' : 'experiencias';
    if ((b = e.target.closest('[data-p-unlink]'))) { const [kind, k, ev] = b.dataset.pUnlink.split('|'); E.commit('plano', p => { const it = p[list(kind)][+k]; it.vinculos = it.vinculos.filter(v => v.eventId !== ev); }); E.toast('Vínculo removido. O evento oficial continua no calendário.'); return; }
    if ((b = e.target.closest('[data-p-link]'))) { const [kind, k, ev] = b.dataset.pLink.split('|'); E.commit('plano', p => { const it = p[list(kind)][+k]; (it.vinculos = it.vinculos || []).push({ id: E.uid('v'), eventId: ev, vinculadoEm: new Date().toISOString() }); }); E.toast('Vinculado ao evento existente.'); return; }
    if ((b = e.target.closest('[data-p-pub]'))) {
      const [kind, k] = b.dataset.pPub.split('|'), it = E.st.plano[list(kind)][+k], cal = E.cal();
      if (!E.APROVADO.has(it.status)) { E.toast('Aprove antes de publicar no calendário oficial.'); return; }
      const dataPub = kind === 'prog' ? it.lancamento : it.dataProvisoria;
      if (!/^2027-\d\d-\d\d$/.test(dataPub || '')) { E.toast('Informe uma data válida de 2027 antes de publicar.'); return; }
      if (E.st.conflitos.size) { E.toast('Resolva o conflito de versão do planejamento antes de publicar.'); return; }
      await cal.ready;
      const spec = kind === 'prog' ? { d: it.lancamento, t: `Lançamento: ${it.nome}`, n: `${it.frequencia}, às ${WDN[it.diaSemana]}s, até ${fd(it.fim)}. Programa recorrente do Endomarketing 2027; as sessões semanais ficam na camada “Programas recorrentes”.` }
        : { d: it.dataProvisoria, t: it.nome, n: `${it.janela || ''} Participação voluntária.`.trim() };
      const r = await cal.addEvents([spec]);
      if (!r.ok) { E.toast(r.erro); return; }
      const gravou = await E.commit('plano', p => { const x = p[list(kind)][+k]; (x.vinculos = x.vinculos || []).push({ id: E.uid('v'), eventId: r.ids[0], publicadoEm: new Date().toISOString() }); });
      E.toast(gravou ? 'Evento criado no calendário oficial.' : 'Evento criado no calendário, mas o vínculo ainda não foi gravado. Não feche a página e use “Tentar agora” no aviso.');
    }
  });

  E.views.programas = {
    title: () => 'Programas recorrentes e experiências',
    async render() {
      const P = E.st.plano, cal = E.cal();
      if (cal) await cal.ready;
      return `<p class="lead narrow">Programas que acontecem ao longo do ano não são ações mensais: têm cronograma, custo e impacto próprios, somados ao planejamento anual. As experiências presenciais são exceções autorizadas, cada uma com modelo operacional e aprovação.</p>
        <nav class="anchors">${P.programas.concat(P.experiencias).map(x => `<a href="#/endo/programas?id=${x.id}">${esc(x.nome)}</a>`).join('')}</nav>
        ${P.programas.map((p, k) => programa(p, k, cal)).join('')}
        ${P.experiencias.map((x, k) => experiencia(x, k, cal)).join('')}`;
    },
    after(c) { if (c.params.id) { const el = document.getElementById('p-' + c.params.id); if (el && !this._done) { el.scrollIntoView({ block: 'start' }); } } }
  };
})();
