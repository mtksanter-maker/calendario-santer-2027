/* Jornada anual: os 12 meses organizados pelos três atos da campanha */
(() => {
  const E = window.Endo, { esc, brl0, MESES, pill, frente, carga, pad } = E;
  const evMes = (evs, m) => evs.filter(e => +e.d.slice(5, 7) === m || (e.e && +e.e.slice(5, 7) === m));
  E.views.jornada = {
    title: () => 'Jornada anual',
    async render() {
      const P = E.st.plano, A = E.ano();
      const cal = E.cal();
      let evs = [];
      if (cal) { await cal.ready; evs = cal.events(); }
      const atos = P.campanha.atos;
      const prog = A.progs[0];
      const tile = ({ mo, o, i }) => {
        const es = evMes(evs, mo.m);
        const destaque = es.filter(e => !/comunica/i.test(e.cat) && e.group !== 'cal').slice(0, 3);
        const fer = es.filter(e => e.c === 'feriado').length;
        const exp = A.exps.filter(x => x.m === mo.m);
        const ps = prog ? prog.c.porMes[mo.m - 1] : 0;
        return `<a class="mtile" href="#/endo/mes/${pad(mo.m)}" aria-label="${esc(MESES[mo.m - 1])}: ${esc(mo.acao.nome)}">
          <div class="mt-h"><b>${MESES[mo.m - 1]}</b>${carga(mo.carga)}</div>
          <p class="mt-foco">${esc(mo.acao.objetivo || mo.direcao)}</p>
          <div class="mt-acao"><span class="mini">Ação principal</span><b>${esc(mo.acao.nome)}</b><span class="mt-fr">${frente(mo.acao.frenteP)}${mo.acao.frenteS ? frente(mo.acao.frenteS) : ''}</span></div>
          <dl class="mt-dl">
            <div><dt>Investimento previsto</dt><dd class="num-t">${o.total ? brl0(o.total) : o.pendentes ? 'A cotar' : 'Sem desembolso'}${o.pendentes ? ` <span class="mk-tag p">${o.pendentes} a cotar</span>` : ''}</dd></div>
            <div><dt>Eventos no calendário</dt><dd>${cal ? `${es.length}${fer ? ` · ${fer} feriado${fer > 1 ? 's' : ''}` : ''}` : '—'}</dd></div>
            <div><dt>Horas envolvidas</dt><dd class="num-t">${E.n1(Math.round(i.total))} h${ps ? ` <span class="mini">+ ${ps} sessões de ginástica</span>` : ''}</dd></div>
          </dl>
          ${destaque.length ? `<ul class="mt-ev">${destaque.map(e => `<li><span class="num-t">${E.fd(e.d).slice(0, 5)}</span>${esc(e.t)}</li>`).join('')}</ul>` : ''}
          ${exp.map(x => `<span class="mt-exp">+ ${esc(x.x.nome)} · ${E.fd(x.x.dataProvisoria)}</span>`).join('')}
          <div class="mt-f">${pill(mo.acao.status, null, true)}<span class="mt-go">Planejamento${E.I.chev}</span></div>
        </a>`;
      };
      return `
      <p class="lead narrow">Uma ação principal por mês, distribuída em três atos. A carga considera os eventos já existentes no calendário (fonte: ${esc(P.fontes.biblia)} e calendário operacional). Os valores são estimativas das fichas, sem orçamento aprovado.</p>
      <div class="legend-row"><span class="mini">Carga operacional</span>${carga({ nivel: 'baixa' })}${carga({ nivel: 'media' })}${carga({ nivel: 'alta' })}<span class="mini sep">Frentes</span>${Object.entries(E.FRENTES).filter(([k]) => k !== 'Todas').map(([k, v]) => `${frente(k)}<span class="mini">${esc(v)}</span>`).join('')}</div>
      ${atos.map((a, k) => `<section class="act-row ato-${k + 1}">
        <header class="ar-h"><span class="eyebrow">Ato ${k + 1} · ${esc(a.meses)}</span><h3>${esc(a.nome)}</h3><q>${esc(a.pergunta)}</q></header>
        <div class="tiles">${A.porMes.slice(k * 4, k * 4 + 4).map(tile).join('')}</div>
      </section>`).join('')}
      ${prog ? `<section class="panel recur"><div><span class="eyebrow">Programa recorrente · o ano todo</span><h3>${esc(prog.p.nome)}</h3><p class="note">${esc(prog.p.frequencia)}, ${esc((prog.p.diaSemanaNome || '').toLowerCase())}, de ${E.fd(prog.p.lancamento)} a ${E.fd(prog.p.fim)}. Não conta como ação mensal.</p></div>
        <div class="weeks" aria-label="Sessões por mês">${prog.c.porMes.map((n, m) => `<div><b>${E.MES3[m]}</b><span>${'<i></i>'.repeat(n)}</span><em>${n || '—'}</em></div>`).join('')}</div>
        <a class="btn sm" href="#/endo/programas?id=${prog.p.id}">Ver programa${E.I.chev}</a></section>` : ''}`;
    }
  };
})();
