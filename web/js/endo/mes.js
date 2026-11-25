/* Planejamento detalhado do mês: #/endo/mes/MM?aba=… */
(() => {
  const E = window.Endo, { esc, brl, brl0, n1, MESES, pill, frente, carga, pad, f, I, fd, fdl, md } = E;
  const D = window.SanterDados;
  const root = document.getElementById('mod-endo');
  const ABAS = [['resumo', 'Resumo'], ['execucao', 'Execução'], ['comunicacao', 'Comunicação'], ['orcamento', 'Orçamento'], ['impacto', 'Impacto operacional'], ['indicadores', 'Indicadores e riscos'], ['referencias', 'Referências'], ['ficha', 'Ficha completa']];
  const TIPOS = [['preparacao', 'Preparação'], ['lancamento', 'Lançamento'], ['execucao', 'Execução'], ['comunicacao', 'Comunicação'], ['prazo', 'Prazo'], ['devolutiva', 'Devolutiva']];
  const MARCOS = new Set(['lancamento', 'execucao', 'devolutiva']);
  let editing = null; // { ds, sec, sub }
  let busy = false;

  const secById = (fx, id) => (fx.secoes || []).find(s => s.id === id);
  const subs = mdText => { const parts = String(mdText || '').split(/\n(?=### )/); return parts.map(p => ({ titulo: (p.match(/^###\s+(.*)/) || [])[1] || '', md: p.replace(/^###\s+.*\n?/, '') , raw: p })); };
  function secBlock(ds, fx, id, opts) {
    opts = opts || {};
    const s = secById(fx, id);
    if (!s) return '';
    const isEd = editing && editing.ds === ds && editing.sec === id && editing.sub == null;
    if (isEd) return `<div class="sec-ed"><div class="sec-ed-h"><b>§${esc(s.id)} ${esc(s.titulo)}</b><span class="mini">Markdown: **negrito**, listas com “-”, tabelas com “|”.</span></div>
      <textarea class="in mono" id="sec-txt" rows="${Math.min(40, Math.max(10, s.md.split('\n').length + 2))}">${esc(editing.txt != null ? editing.txt : s.md)}</textarea>
      <div class="row-btns"><button type="button" class="btn sm" data-sec-cancel>Cancelar</button><button type="button" class="btn sm primary" data-sec-save>Salvar seção</button></div></div>`;
    return `<details class="sec"${opts.open ? ' open' : ''}><summary><span>§${esc(s.id)} · ${esc(s.titulo)}</span><button type="button" class="btn xs ghost" data-sec-edit="${ds}|${id}">${I.edit}Editar</button></summary><div class="md">${md(s.md)}</div></details>`;
  }

  /* ---------- Abas ---------- */
  function resumo(ctx) {
    const { mo, ix, fx } = ctx, a = mo.acao, P = `meses.${ix}`;
    const cal = E.cal(), evs = ctx.evs;
    const aprov = E.APROVADO.has(a.status);
    const vinc = mo.vinculos || [];
    const linkOf = d => vinc.find(v => v.dataId === d.id);
    const evInfo = v => cal && v ? cal.event(v.eventId) : null;
    const dataRow = (d, k) => {
      const v = linkOf(d), ev = evInfo(v);
      const tituloProp = `${a.nome}: ${d.rotulo}`;
      const fimN = d.fim && d.fim > d.data ? d.fim : '';
      const diff = ev && (ev.d !== d.data || (ev.e || '') !== fimN || ev.t !== tituloProp);
      const state = !v ? `<span class="pill line">Só no planejamento</span>`
        : !ev ? `<span class="pill danger">Evento removido do calendário</span>`
        : diff ? `<span class="pill warn" title="O evento oficial ficou como estava. Atualize se a mudança foi aprovada.">Proposta difere do evento oficial</span>`
        : `<span class="pill ok">${I.check}No calendário oficial</span>`;
      const act = !v ? `<button type="button" class="btn xs" data-pub="${ix}|${d.id}" ${aprov ? '' : 'disabled'} title="${aprov ? 'Criar evento oficial no calendário' : 'Disponível quando a ação estiver aprovada'}">${I.cal}Publicar</button>`
        : !ev ? `<button type="button" class="btn xs ghost" data-unlink="${ix}|${v.eventId}">Desvincular</button>`
        : `${diff ? `<button type="button" class="btn xs" data-sync="${ix}|${d.id}">Atualizar evento oficial</button>` : ''}<a class="btn xs ghost" href="#/calendario?data=${ev.d}">${I.cal}Ver</a>`;
      return `<tr><td>${f('plano', `${P}.acao.datas.${k}.data`, { t: 'date', label: 'Data' })}</td><td>${f('plano', `${P}.acao.datas.${k}.fim`, { t: 'date', label: 'Até' })}</td>
        <td>${f('plano', `${P}.acao.datas.${k}.rotulo`, { label: 'Descrição' })}</td><td>${f('plano', `${P}.acao.datas.${k}.tipo`, { t: 'select', options: TIPOS, label: 'Tipo' })}</td>
        <td class="nowrap">${state}</td><td class="nowrap r">${act}<button type="button" class="btn xs ghost icon" data-del="plano:${P}.acao.datas.${k}" aria-label="Remover data">${I.trash}</button></td></tr>`;
    };
    const linkedOther = vinc.filter(v => !v.dataId);
    const opts = evs.filter(e => !vinc.some(v => v.eventId === e.id));
    return `<div class="split">
      <div class="col-main">
        <section class="blk"><h3>Contexto do mês</h3><p>${esc(mo.contexto || '')}</p>${mo.diasUteis ? `<p class="note">${mo.diasUteis} dias úteis · janela: ${esc(mo.janela)}</p>` : ''}</section>
        <section class="blk"><h3>Objetivo estratégico</h3>${f('plano', `${P}.acao.objetivo`, { t: 'area', rows: 2, label: 'Objetivo estratégico' })}
          ${a.objetivoHumano ? `<p class="note"><b>Objetivo humano:</b> ${esc(a.objetivoHumano)}</p>` : ''}</section>
        <section class="blk"><h3>Ação principal</h3>
          <div class="fgrid"><label>Nome de trabalho${f('plano', `${P}.acao.nome`, { label: 'Nome da ação' })}</label><label>Responsável${f('plano', `${P}.acao.responsavel`, { label: 'Responsável' })}</label></div>
          <label class="lbl">Descrição da iniciativa${f('plano', `${P}.acao.resumo`, { t: 'area', rows: 3, label: 'Descrição' })}</label>
          ${a.funcionamento && a.funcionamento.length ? `<span class="lbl">Como funciona</span><ol class="steps">${a.funcionamento.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
          <p class="note">Alternativa escolhida: ${esc(a.alternativa || '—')}${a.notaMaster != null ? ` · nota do Master ${a.notaMaster}/100` : ''}</p>
        </section>
        <section class="blk"><h3>Público</h3>${f('plano', `${P}.acao.publico`, { t: 'area', rows: 2, label: 'Público' })}</section>
        <section class="blk"><h3>Resultado esperado</h3>${f('plano', `${P}.acao.resultadoEsperado`, { t: 'area', rows: 2, label: 'Resultado esperado' })}
          ${mo.entrega ? `<p class="note"><b>Legado para o mês seguinte:</b> ${esc(mo.entrega)}</p>` : ''}</section>
        <section class="blk"><div class="blk-h"><h3>Datas propostas e calendário oficial</h3>
            <div class="row-btns"><button type="button" class="btn sm" data-pub-marcos="${ix}" ${aprov ? '' : 'disabled'}>${I.cal}Publicar marcos principais</button><button type="button" class="btn sm ghost" data-add="plano:${P}.acao.datas" data-tpl="data" data-m="${mo.m}">${I.plus}Data</button></div></div>
          <p class="note">${aprov ? 'A ação está aprovada: publique no calendário as datas que devem virar eventos oficiais. Mudanças posteriores na proposta não alteram o evento oficial sozinhas.' : 'Enquanto a ação não estiver aprovada, as datas aparecem no calendário só como camada “Em planejamento”, sem virar eventos oficiais.'}</p>
          <div class="tw"><table class="t edit"><thead><tr><th>Data</th><th>Até</th><th>Descrição</th><th>Tipo</th><th>Calendário</th><th></th></tr></thead><tbody>${(a.datas || []).map(dataRow).join('') || '<tr><td colspan="6" class="empty">Nenhuma data proposta.</td></tr>'}</tbody></table></div>
          <div class="link-ev"><span class="lbl">Vincular a um evento que já existe no calendário</span>
            <div class="row-btns"><select class="in" id="link-sel" aria-label="Evento do calendário"><option value="">Escolha um evento de ${MESES[mo.m - 1].toLowerCase()}…</option>${opts.map(e => `<option value="${e.id}">${fd(e.d)} · ${esc(e.t)} (${esc(e.cat)})</option>`).join('')}</select>
            <button type="button" class="btn sm" data-link="${ix}">${I.link}Vincular</button></div>
            ${linkedOther.length ? `<ul class="rows dense">${linkedOther.map(v => { const ev = evInfo(v); return `<li><div><b>${ev ? esc(ev.t) : 'Evento removido do calendário'}</b><span>${ev ? fdl(ev.d) + ' · ' + esc(ev.cat) : ''}</span></div><span class="row-btns">${ev ? `<a class="btn xs ghost" href="#/calendario?data=${ev.d}">Ver</a>` : ''}<button type="button" class="btn xs ghost" data-unlink="${ix}|${v.eventId}">Desvincular</button></span></li>`; }).join('')}</ul>` : ''}
          </div>
        </section>
      </div>
      <aside class="col-side">
        <section class="blk"><h3>Eventos existentes no mês</h3>
          ${cal ? (evs.length ? `<ul class="evl">${evs.map(e => `<li class="${vinc.some(v => v.eventId === e.id) ? 'lk' : ''}"><span class="num-t">${fd(e.d).slice(0, 5)}</span><div><b>${esc(e.t)}</b><span>${esc(e.cat)}${vinc.some(v => v.eventId === e.id) ? ' · ◆ vinculado' : ''}</span></div></li>`).join('')}</ul>` : '<p class="note">Nenhum evento no calendário neste mês.</p>') : '<p class="note">Calendário indisponível.</p>'}
          <a class="link" href="#/calendario?data=2027-${pad(mo.m)}-01">Abrir ${MESES[mo.m - 1].toLowerCase()} no calendário${I.chev}</a></section>
        <section class="blk"><div class="blk-h"><h3>Pendências</h3><button type="button" class="btn xs ghost" data-add="plano:${P}.pendencias" data-tpl="pendencia">${I.plus}Pendência</button></div>
          <ul class="checks">${(mo.pendencias || []).map((p, k) => `<li class="${p.feita ? 'done' : ''}">${f('plano', `${P}.pendencias.${k}.feita`, { t: 'check', label: 'Resolvida' })}<div class="ck-b">${f('plano', `${P}.pendencias.${k}.item`, { t: 'area', rows: 1, label: 'Pendência', cls: 'bare' })}<span class="ck-m">${f('plano', `${P}.pendencias.${k}.quem`, { ph: 'Quem confirma', label: 'Quem confirma', cls: 'bare sm' })}${p.critica ? '<span class="pill danger">crítica</span>' : ''}</span></div><button type="button" class="btn xs ghost icon" data-del="plano:${P}.pendencias.${k}" aria-label="Remover pendência">${I.trash}</button></li>`).join('') || '<li class="empty">Sem pendências.</li>'}</ul></section>
        <section class="blk"><h3>Observações</h3>${f('plano', `${P}.observacoes`, { t: 'area', rows: 4, ph: 'Registros de acompanhamento, decisões, contatos…', label: 'Observações' })}</section>
        <section class="blk"><h3>Resultados registrados</h3>
          <div class="fgrid"><label>Realizado em${f('plano', `${P}.resultados.realizadoEm`, { t: 'date', label: 'Realizado em' })}</label><label>Participantes únicos${f('plano', `${P}.resultados.participantes`, { t: 'num', min: 0, label: 'Participantes' })}</label></div>
          <label class="lbl">Utilidade percebida (agregado)${f('plano', `${P}.resultados.utilidade`, { ph: 'Ex.: 62% de 48 respostas acharam útil', label: 'Utilidade percebida' })}</label>
          <label class="lbl">Registro do resultado${f('plano', `${P}.resultados.registro`, { t: 'area', rows: 3, ph: 'O que aconteceu, o que mudou, aprendizados', label: 'Registro do resultado' })}</label>
          <p class="note">Registre só dados reais e agregados. Nada de metas inventadas ou dados individuais.</p></section>
      </aside></div>`;
  }

  function execucao(ctx) {
    const { mo, fx } = ctx, ds = ctx.ds, es = fx.estrutura || {};
    return `<div class="split">
      <div class="col-main">
        <section class="blk"><h3>Etapas e cronograma</h3>
          <ol class="timeline">${(es.etapas || []).map((s, k) => `<li><div class="tl-when"><b>${esc(s.quando || '')}</b>${s.inicio ? `<span>${fdl(s.inicio)}${s.fim && s.fim !== s.inicio ? ' → ' + fdl(s.fim) : ''}</span>` : ''}</div>
            <div class="tl-what">${f(ds, `estrutura.etapas.${k}.oQue`, { t: 'area', rows: 2, cls: 'bare', label: 'Etapa' })}${s.quem ? `<span class="mini">${esc(s.quem)}</span>` : ''}</div></li>`).join('') || '<li class="empty">Sem etapas estruturadas; veja a ficha completa.</li>'}</ol></section>
        <section class="blk"><h3>Decisões que dependem de aprovação</h3>
          <div class="tw"><table class="t edit"><thead><tr><th>#</th><th>Decisão</th><th>Quem decide</th><th>Prazo</th></tr></thead><tbody>${(es.decisoes || []).map((d, k) => `<tr><td class="nowrap"><b>${esc(d.id || '')}</b></td><td>${f(ds, `estrutura.decisoes.${k}.decisao`, { t: 'area', rows: 2, label: 'Decisão' })}</td><td>${f(ds, `estrutura.decisoes.${k}.quem`, { label: 'Quem decide' })}</td><td>${f(ds, `estrutura.decisoes.${k}.prazo`, { t: 'date', label: 'Prazo' })}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">Nenhuma.</td></tr>'}</tbody></table></div></section>
        ${secBlock(ds, fx, '5')}
      </div>
      <aside class="col-side">
        <section class="blk"><h3>Responsáveis</h3><ul class="resp">${(es.responsaveis || []).map((r, k) => `<li><b>${esc(r.quem)}</b>${f(ds, `estrutura.responsaveis.${k}.faz`, { t: 'area', rows: 2, cls: 'bare', label: 'Faz' })}${r.naoFaz ? `<span class="mini">Não faz: ${esc(r.naoFaz)}</span>` : ''}</li>`).join('')}</ul></section>
        <section class="blk"><h3>Materiais necessários</h3><ul class="mat">${(es.materiais || []).map((m, k) => `<li>${f(ds, `estrutura.materiais.${k}`, { cls: 'bare', label: 'Material' })}</li>`).join('')}</ul></section>
        <section class="blk"><h3>Extensão para as obras</h3>${f(ds, 'estrutura.obras', { t: 'area', rows: 5, label: 'Extensão às obras' })}
          <p class="note">As obras recebem extensões adequadas; não reproduzem a ação da sede nem comprometem cronograma ou segurança.</p></section>
      </aside></div>`;
  }

  function comunicacao(ctx) {
    const { fx, ds } = ctx, es = fx.estrutura || {};
    const s6 = secById(fx, '6');
    const parts = s6 ? subs(s6.md) : [];
    const sub = (p, k) => {
      if (!p.titulo) return p.md.trim() ? `<div class="md intro">${md(p.md)}</div>` : '';
      const isEd = editing && editing.ds === ds && editing.sec === '6' && editing.sub === k;
      if (isEd) return `<article class="cm cm-ed"><h4>${esc(p.titulo)}</h4><textarea class="in mono" id="sec-txt" rows="${Math.min(30, Math.max(8, p.md.split('\n').length + 2))}">${esc(editing.txt != null ? editing.txt : p.md)}</textarea><div class="row-btns"><button type="button" class="btn sm" data-sec-cancel>Cancelar</button><button type="button" class="btn sm primary" data-sec-save>Salvar texto</button></div></article>`;
      return `<article class="cm" data-copy-src data-copy-text="${esc(E.plain(p.md).trim())}"><header><h4>${esc(p.titulo)}</h4><span class="row-btns"><button type="button" class="btn xs" data-copy>${I.copy}Copiar</button><button type="button" class="btn xs ghost" data-sub-edit="${k}">${I.edit}Editar</button></span></header><div class="md">${md(p.md)}</div></article>`;
    };
    return `<section class="blk"><h3>Plano de comunicação interna</h3>
      <div class="tw"><table class="t"><thead><tr><th>Canal</th><th>Quando</th><th>Público</th><th>Mensagem</th></tr></thead><tbody>${(es.comunicacao || []).map(c => `<tr><td class="nowrap"><b>${esc(c.canal)}</b></td><td>${esc(c.quando || '')}${c.data ? `<span class="mini block">${fdl(c.data)}</span>` : ''}</td><td>${esc(c.publico || '')}</td><td>${esc(c.resumo || '')}</td></tr>`).join('')}</tbody></table></div>
      <p class="note">Todos os textos são minutas. Nada é enviado ou publicado pelo sistema.</p></section>
      <section class="blk"><h3>Textos prontos (§6)</h3><div class="cms">${parts.map(sub).join('')}</div></section>
      ${secBlock(ds, fx, '7')}`;
  }

  function orcamento(ctx) {
    const { mo, ix } = ctx, o = mo.orcamento, P = `meses.${ix}.orcamento`, R = E.orc(o);
    const PAR = E.st.plano.parametros;
    const GR = [['sede', 'Sede'], ['extensao', 'Extensão obras'], ['outro', 'Opcional/outro']];
    const linha = (it, k) => {
      const tot = E.isNum(it.qtd) && E.isNum(it.unitario) ? it.qtd * it.unitario : null;
      return `<tr class="${it.incluir === false ? 'off' : ''}"><td>${f('plano', `${P}.itens.${k}.incluir`, { t: 'check', label: 'Considerar no total' })}</td>
        <td>${f('plano', `${P}.itens.${k}.grupo`, { t: 'select', options: GR, label: 'Grupo' })}</td>
        <td class="wide">${f('plano', `${P}.itens.${k}.item`, { label: 'Item' })}<span class="mini">${esc(it.fonte || '')}</span></td>
        <td>${f('plano', `${P}.itens.${k}.qtd`, { t: 'num', min: 0, label: 'Quantidade', cls: 'w5' })}</td>
        <td>${f('plano', `${P}.itens.${k}.unitario`, { t: 'money', min: 0, label: 'Custo unitário', ph: 'a cotar', cls: 'w7' })}</td>
        <td class="r num-t nowrap">${tot == null ? '<span class="mk-tag p">a cotar</span>' : brl(tot)}</td>
        <td><button type="button" class="btn xs ghost icon" data-del="plano:${P}.itens.${k}" aria-label="Remover item">${I.trash}</button></td></tr>`;
    };
    const dif = R.realizado - R.total;
    return `<div class="kpis">
        <div><span>Previsto (estimativa)</span><b>${brl(R.total)}</b><em>${R.pendentes ? `${R.pendentes} item(ns) a cotar` : 'todos os itens com valor'}</em></div>
        <div><span>Realizado</span><b>${brl(R.realizado)}</b><em>${o.realizado.length} lançamento(s)</em></div>
        <div><span>Diferença</span><b class="${dif > 0 ? 'neg' : ''}">${R.realizado ? brl(dif) : '—'}</b><em>realizado − previsto</em></div>
        <div><span>Por pessoa (sede)</span><b>${R.porPessoa == null ? '—' : brl(R.porPessoa)}</b><em>teto ${brl(o.teto)} ${R.dentroDoTeto ? '✓' : '<span class="mk-tag p">acima do teto</span>'}</em></div>
        <div><span>Classificação</span><b class="sm">${esc(E.CLASSE[R.classe])}</b><em>${R.porElegivel != null ? `obras: ${brl(R.porElegivel)} por elegível` : ''}</em></div>
      </div>
      <section class="blk"><div class="blk-h"><h3>Itens de custo</h3><button type="button" class="btn sm ghost" data-add="plano:${P}.itens" data-tpl="item">${I.plus}Item</button></div>
        <div class="tw"><table class="t edit budget"><thead><tr><th title="Considerar no total">Incl.</th><th>Grupo</th><th>Item e fonte</th><th>Qtd.</th><th>Unitário (R$)</th><th class="r">Total</th><th></th></tr></thead>
        <tbody>${o.itens.map(linha).join('')}</tbody>
        <tfoot><tr><td colspan="5">Subtotal</td><td class="r num-t">${brl(R.subtotal)}</td><td></td></tr>
          <tr><td colspan="5"><span class="inl">Contingência ${f('plano', `${P}.contingenciaPct`, { t: 'num', min: 0, label: 'Contingência (%)', cls: 'w4' })} %</span></td><td class="r num-t">${brl(R.total - R.subtotal)}</td><td></td></tr>
          <tr><td colspan="5">Sede</td><td class="r num-t">${brl(R.sede)}</td><td></td></tr>
          <tr><td colspan="5">Extensão às obras</td><td class="r num-t">${brl(R.extensao)}</td><td></td></tr>
          <tr class="tot"><td colspan="5">Total da ação</td><td class="r num-t">${brl(R.total)}</td><td></td></tr></tfoot></table></div>
        <div class="fgrid four"><label>Beneficiários na sede${f('plano', `${P}.beneficiariosSede`, { t: 'num', min: 0, label: 'Beneficiários' })}</label><label>Elegíveis nas obras${f('plano', `${P}.elegiveisExtensao`, { t: 'num', min: 0, label: 'Elegíveis' })}</label>
          <label>Teto por pessoa (R$)${f('plano', `${P}.teto`, { t: 'select', options: [[0, 'Sem desembolso'], [PAR.tetoPequena, `Pequena · até R$ ${PAR.tetoPequena}`], [PAR.tetoGrande, `Maior · até R$ ${PAR.tetoGrande}`]].map(x => [x[0], x[1]]), label: 'Teto', num: true })}</label>
          <label class="ckl">${f('plano', `${P}.aprovado`, { t: 'check', label: 'Orçamento aprovado' })} Orçamento desta ação aprovado formalmente</label></div>
        ${o.naoIncremental ? `<p class="note"><b>Não incremental:</b> ${esc(o.naoIncremental)}</p>` : ''}${o.observacoes ? `<p class="note">${esc(o.observacoes)}</p>` : ''}
        <p class="note">Custos <b>[ESTIMATIVA]</b> de mercado regional, a substituir por 3 orçamentos. Os tetos são limites, não metas de gasto. Pessoas: base de planejamento, não headcount confirmado.</p>
      </section>
      <div class="cols">
        <section class="blk"><div class="blk-h"><h3>Investimento realizado</h3><button type="button" class="btn sm ghost" data-add="plano:${P}.realizado" data-tpl="realizado">${I.plus}Lançamento</button></div>
          <div class="tw"><table class="t edit"><thead><tr><th>Data</th><th>Descrição</th><th>Valor (R$)</th><th></th></tr></thead><tbody>${o.realizado.map((r, k) => `<tr><td>${f('plano', `${P}.realizado.${k}.data`, { t: 'date', label: 'Data' })}</td><td class="wide">${f('plano', `${P}.realizado.${k}.descricao`, { label: 'Descrição', ph: 'Nota fiscal, fornecedor…' })}</td><td>${f('plano', `${P}.realizado.${k}.valor`, { t: 'money', min: 0, label: 'Valor', cls: 'w7' })}</td><td><button type="button" class="btn xs ghost icon" data-del="plano:${P}.realizado.${k}" aria-label="Remover lançamento">${I.trash}</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">Nenhum gasto registrado.</td></tr>'}</tbody></table></div></section>
        <section class="blk"><h3>Versão de menor custo</h3>${o.menorCusto ? `<p><b>${brl(o.menorCusto.total)}</b> · ${esc(o.menorCusto.descricao || '')}</p>${o.menorCusto.perde ? `<p class="note"><b>Perde:</b> ${esc(o.menorCusto.perde)}</p>` : ''}` : '<p class="note">Não informada na ficha.</p>'}
          <h3 class="mt">Linhas consolidadas (04-orcamento.csv)</h3>
          <div class="tw"><table class="t"><thead><tr><th>Linha</th><th>Status</th><th class="r">Total</th><th class="r">Por pessoa</th></tr></thead><tbody>${(mo.linhasConsolidadas || []).map(l => `<tr class="${l.recomendada ? '' : 'muted'}"><td>${esc(l.acao)}</td><td>${esc(l.status)}</td><td class="r num-t">${brl(l.total)}</td><td class="r num-t">${brl(l.custoPorPessoa)}</td></tr>`).join('')}</tbody></table></div></section>
      </div>`;
  }

  function impacto(ctx) {
    const { mo, ix } = ctx, P = `meses.${ix}.impacto`, i = mo.impacto, R = E.imp(mo);
    const prog = E.ano().progs[0];
    const ps = prog ? prog.c.porMes[mo.m - 1] : 0;
    return `<div class="kpis">
        <div><span>Participação dos colaboradores</span><b>${R.colab == null ? '—' : n1(R.colab) + ' h'}</b><em>${R.colabFonte === 'calculado' ? `${i.participantes} pessoas × ${R.minutos} min ÷ 60` : R.colabFonte === 'ficha' ? 'valor informado na ficha' : 'pendente'}</em></div>
        <div><span>Organização e execução (equipe)</span><b>${n1(R.equipe)} h</b><em>${(i.horasEquipe || []).length} responsáveis</em></div>
        <div><span>Total da ação</span><b>${n1(R.total)} h</b><em>sem contar programas recorrentes</em></div>
        <div><span>Ginástica laboral no mês</span><b>${prog ? n1(prog.c.hMes[mo.m - 1]) + ' h' : '—'}</b><em>${ps} sessões · ${prog ? prog.c.pessoas + ' pessoas (' + prog.c.base + ')' : ''}</em></div>
        <div><span>Máximo fora do posto ao mesmo tempo</span><b>${R.max == null ? '—' : R.max}</b><em>${R.max == null ? 'a definir' : 'pessoas'}</em></div>
      </div>
      <div class="split">
        <div class="col-main">
          <section class="blk"><h3>Tempo de participação</h3>
            <div class="fgrid four"><label>Minutos por pessoa${f('plano', `${P}.minutosPorPessoa`, { t: 'num', min: 0, label: 'Minutos por pessoa' })}</label><label>Deslocamento (min)${f('plano', `${P}.deslocamentoMin`, { t: 'num', min: 0, label: 'Deslocamento' })}</label>
              <label>Participantes${f('plano', `${P}.participantes`, { t: 'num', min: 0, label: 'Participantes' })}</label><label>Máx. simultâneos${f('plano', `${P}.maxSimultaneos`, { t: 'num', min: 0, label: 'Máximo simultâneo' })}</label></div>
            ${i.minutosPorPessoaTexto ? `<p class="note"><b>Na ficha:</b> ${esc(i.minutosPorPessoaTexto)}</p>` : ''}${i.maxSimultaneosTexto ? `<p class="note"><b>Simultaneidade:</b> ${esc(i.maxSimultaneosTexto)}</p>` : ''}
            <label class="ckl">${f('plano', `${P}.noExpediente`, { t: 'check', label: 'No expediente' })} Participação dentro do expediente</label>
            <p class="note">Horas = participantes × (minutos + deslocamento) ÷ 60. Quando os campos estão vazios, vale o total informado pela ficha${i.horasColaboradoresFicha != null ? ` (${n1(i.horasColaboradoresFicha)} h)` : ''}.</p></section>
          <section class="blk"><div class="blk-h"><h3>Horas da equipe</h3><button type="button" class="btn sm ghost" data-add="plano:${P}.horasEquipe" data-tpl="hora">${I.plus}Responsável</button></div>
            <div class="tw"><table class="t edit"><thead><tr><th>Quem</th><th>Horas</th><th>Em quê</th><th>Grupo</th><th></th></tr></thead><tbody>
            ${(i.horasEquipe || []).map((h, k) => `<tr><td>${f('plano', `${P}.horasEquipe.${k}.quem`, { label: 'Quem' })}</td><td>${f('plano', `${P}.horasEquipe.${k}.horas`, { t: 'num', min: 0, label: 'Horas', cls: 'w5' })}</td><td class="wide">${f('plano', `${P}.horasEquipe.${k}.emQue`, { t: 'area', rows: 1, label: 'Em quê' })}</td><td>${f('plano', `${P}.horasEquipe.${k}.grupo`, { t: 'select', options: [['sede', 'Sede'], ['extensao', 'Obras']], label: 'Grupo' })}</td><td><button type="button" class="btn xs ghost icon" data-del="plano:${P}.horasEquipe.${k}" aria-label="Remover">${I.trash}</button></td></tr>`).join('')}</tbody>
            <tfoot><tr class="tot"><td>Total</td><td class="num-t">${n1(R.equipe)} h</td><td colspan="3"></td></tr></tfoot></table></div></section>
        </div>
        <aside class="col-side"><section class="blk"><h3>Como a ação preserva a produtividade</h3>${f('plano', `${P}.observacao`, { t: 'area', rows: 5, label: 'Preservação da produtividade' })}
          <p class="note">Regra central: nenhuma interrupção coletiva adicional do expediente nas ações comuns. Quando há participação no expediente, a ficha precisa justificar por que não pode ser assíncrona e como a operação continua.</p></section></aside>
      </div>`;
  }

  function indicadores(ctx) {
    const { mo, ix, fx, ds } = ctx, es = fx.estrutura || {}, P = `meses.${ix}`;
    return `<section class="blk"><h3>Indicadores</h3><p class="note">Sem baseline inventada: denominadores explícitos, registro real ao longo do ano.</p>
      <div class="tw"><table class="t edit"><thead><tr><th>Indicador</th><th>Métrica e denominador</th><th>Janela</th><th>Fonte</th></tr></thead><tbody>${(mo.indicadores || []).map((x, k) => `<tr><td>${f('plano', `${P}.indicadores.${k}.indicador`, { t: 'area', rows: 2, label: 'Indicador' })}</td><td>${f('plano', `${P}.indicadores.${k}.metrica`, { t: 'area', rows: 2, label: 'Métrica' })}</td><td>${f('plano', `${P}.indicadores.${k}.janela`, { label: 'Janela' })}</td><td>${f('plano', `${P}.indicadores.${k}.fonte`, { label: 'Fonte' })}</td></tr>`).join('')}</tbody></table></div></section>
      <div class="cols"><section class="blk"><h3>Riscos e plano B</h3><ul class="risks">${(es.riscos || []).map((r, k) => `<li><b>${esc(r.risco)}</b>${f(ds, `estrutura.riscos.${k}.planoB`, { t: 'area', rows: 2, cls: 'bare', label: 'Plano B' })}</li>`).join('') || '<li class="empty">—</li>'}</ul></section>
      <section class="blk"><h3>Legado para o mês seguinte</h3><ul class="ticks">${(es.legado || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3 class="mt">Aprovações</h3><ul class="ticks">${(mo.aprovacoes || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></section></div>
      ${secBlock(ds, fx, '9')}${secBlock(ds, fx, '10')}`;
  }

  async function referencias(ctx) {
    const { mo, fx } = ctx;
    let pq = null;
    try { pq = await D.get('pesquisa'); } catch (e) { pq = null; }
    const ids = mo.referencias || [];
    const cases = pq ? pq.cases.filter(c => (c.mesesQueCitam || []).includes(mo.m) || ids.includes(c.id)) : [];
    return `<section class="blk"><h3>Referências que inspiraram este mês</h3>
      ${pq ? `<p class="note">${cases.length} registros da base de pesquisa citados na ficha. Evidência pública, relato institucional e hipótese aparecem separados em cada caso.</p>
      <ul class="cases">${cases.map(c => `<li><a href="#/endo/pesquisa?id=${c.id}"><span class="tag">${esc(c.id)}</span><div><b>${esc(c.titulo)}</b><span>${esc(c.empresa)} · confiança ${esc(c.confianca || '—')} · ${esc(c.tipoFonte || '')}</span></div>${I.chev}</a></li>`).join('')}</ul>` : '<p class="note">Base de pesquisa indisponível.</p>'}</section>
      <details class="sec"><summary><span>Fontes lidas e pesquisa feita na ficha</span></summary><div class="md">${md(fx.cabecalho || '')}</div></details>`;
  }

  function ficha(ctx) {
    const { fx, ds } = ctx;
    return `<p class="note">Fonte: <code>endo-2027/${esc(fx.fonteArquivo)}</code> · ${esc(fx.titulo)}. As edições ficam no sistema (a ficha original em Markdown é preservada como referência).</p>
      <div class="md head">${md(fx.cabecalho || '')}</div>
      ${(fx.secoes || []).map(s => secBlock(ds, fx, s.id, { open: false })).join('')}`;
  }

  /* ---------- Ações: publicar, vincular, editar seções ---------- */
  async function publicar(ix, ids) {
    if (busy) return;
    const mo = E.st.plano.meses[ix], a = mo.acao, cal = E.cal();
    if (!E.APROVADO.has(a.status)) { E.toast('Aprove a ação antes de publicar no calendário oficial.'); return; }
    if (!cal) { E.toast('Calendário indisponível.'); return; }
    await cal.ready;
    const datas = a.datas.filter(d => ids.includes(d.id) && !(mo.vinculos || []).some(v => v.dataId === d.id && cal.event(v.eventId)) && /^2027-\d\d-\d\d$/.test(d.data || ''));
    if (!datas.length) { E.toast('Não há datas válidas de 2027 para publicar. Confira o campo Data.'); return; }
    if (E.st.conflitos.size) { E.toast('Resolva o conflito de versão do planejamento antes de publicar.'); return; }
    busy = true;
    const r = await cal.addEvents(datas.map(d => ({ d: d.data, e: d.fim, t: `${a.nome}: ${d.rotulo}`, n: `Endomarketing 2027 · ${MESES[mo.m - 1]} · ${a.resumo || ''}`.trim() })));
    busy = false;
    if (!r.ok) { E.toast(r.erro); return; }
    const gravou = await E.commit('plano', p => {
      const m = p.meses[ix]; m.vinculos = (m.vinculos || []).filter(v => !datas.some(d => d.id === v.dataId));
      r.ids.forEach((id, k) => m.vinculos.push({ id: E.uid('v'), eventId: id, dataId: datas[k].id, publicadoEm: new Date().toISOString() }));
    });
    E.toast(!gravou ? 'Evento criado no calendário, mas o vínculo ainda não foi gravado. Não feche a página e use “Tentar agora” no aviso.' : datas.length === 1 ? 'Evento criado no calendário oficial.' : `${datas.length} eventos criados no calendário oficial.`);
  }
  async function sincronizar(ix, dataId) {
    const mo = E.st.plano.meses[ix], a = mo.acao, d = a.datas.find(x => x.id === dataId), v = (mo.vinculos || []).find(x => x.dataId === dataId), cal = E.cal();
    if (!d || !v || !cal) return;
    if (!E.APROVADO.has(a.status)) { E.toast('A proposta alterada precisa estar aprovada para mudar o evento oficial.'); return; }
    if (!/^2027-\d\d-\d\d$/.test(d.data || '')) { E.toast('Informe uma data válida de 2027 antes de atualizar o evento oficial.'); return; }
    const r = await cal.updateEvent(v.eventId, { d: d.data, e: d.fim && d.fim > d.data ? d.fim : '', t: `${a.nome}: ${d.rotulo}` });
    if (!r.ok) { E.toast(r.erro); return; }
    E.toast('Evento oficial atualizado.'); E.render();
  }
  root.addEventListener('click', async e => {
    if (!E.views.mes.active) return;
    const t = e.target;
    let b;
    if ((b = t.closest('[data-pub]'))) { const [ix, id] = b.dataset.pub.split('|'); publicar(+ix, [id]); return; }
    if ((b = t.closest('[data-pub-marcos]'))) { const ix = +b.dataset.pubMarcos; publicar(ix, E.st.plano.meses[ix].acao.datas.filter(d => MARCOS.has(d.tipo)).map(d => d.id)); return; }
    if ((b = t.closest('[data-sync]'))) { const [ix, id] = b.dataset.sync.split('|'); sincronizar(+ix, id); return; }
    if ((b = t.closest('[data-unlink]'))) { const [ix, ev] = b.dataset.unlink.split('|'); E.commit('plano', p => { p.meses[+ix].vinculos = p.meses[+ix].vinculos.filter(v => v.eventId !== ev); }); E.toast('Vínculo removido. O evento oficial continua no calendário.'); return; }
    if ((b = t.closest('[data-link]'))) {
      const sel = document.getElementById('link-sel'); if (!sel || !sel.value) { E.toast('Escolha um evento para vincular.'); return; }
      const ix = +b.dataset.link; E.commit('plano', p => { (p.meses[ix].vinculos = p.meses[ix].vinculos || []).push({ id: E.uid('v'), eventId: sel.value, dataId: null, vinculadoEm: new Date().toISOString() }); });
      E.toast('Evento vinculado à ação do mês.'); return;
    }
    if ((b = t.closest('[data-sec-edit]'))) { e.preventDefault(); const [ds, sec] = b.dataset.secEdit.split('|'); editing = { ds, sec, sub: null }; await E.render(); focusEd(); return; }
    if ((b = t.closest('[data-sub-edit]'))) { editing = { ds: E.views.mes.ds, sec: '6', sub: +b.dataset.subEdit }; await E.render(); focusEd(); return; }
    if (t.closest('[data-sec-cancel]')) { editing = null; E.render(); return; }
    if (t.closest('[data-sec-save]')) {
      const txt = document.getElementById('sec-txt').value, ed = editing; editing = null;
      E.change(ed.ds, fx => {
        const s = fx.secoes.find(x => x.id === ed.sec);
        if (ed.sub == null) s.md = txt;
        else { const ps = subs(s.md); ps[ed.sub].raw = `### ${ps[ed.sub].titulo}\n${txt.replace(/\s+$/, '')}\n`; s.md = ps.map(p => p.raw.replace(/\s+$/, '')).join('\n\n'); }
      });
      E.toast('Texto salvo.');
    }
  });
  root.addEventListener('input', e => { if (e.target.id === 'sec-txt' && editing) editing.txt = e.target.value; });
  function focusEd() { const n = document.getElementById('sec-txt'); if (n) { n.focus(); n.scrollIntoView({ block: 'center' }); } }

  E.views.mes = {
    active: false, ds: '',
    title: c => { const m = +(c.parts[1] || 1); return `${MESES[m - 1]} · ${E.mes(m) ? E.mes(m).acao.nome : ''}`; },
    async render(c, opts) {
      const m = Math.min(12, Math.max(1, +(c.parts[1] || 1)));
      const ds = `mes-${pad(m)}`;
      if (opts && opts.fresh && this.ds !== ds) editing = null;
      this.active = true; this.ds = ds;
      const aba = ABAS.some(x => x[0] === c.params.aba) ? c.params.aba : 'resumo';
      const ix = E.idx(m), mo = E.st.plano.meses[ix];
      const [fx] = await Promise.all([D.get(ds), (E.cal() ? E.cal().ready : null)]);
      const cal = E.cal();
      const evs = cal ? cal.events().filter(e => +e.d.slice(5, 7) === m || (e.e && +e.e.slice(5, 7) === m)).sort((a, b) => a.d.localeCompare(b.d)) : [];
      const ctx = { mo, ix, fx, ds, evs, m };
      const R = E.orc(mo.orcamento), H = E.imp(mo);
      const view = { resumo, execucao, comunicacao, orcamento, impacto, indicadores, referencias, ficha }[aba];
      const inner = await view(ctx);
      return `<div class="mhead-bar">
          <a class="btn sm ghost" href="#/endo/jornada">${I.left}Jornada</a>
          <div class="mnav glass" role="group" aria-label="Trocar de mês"><a class="btn sm ghost icon" ${m > 1 ? `href="#/endo/mes/${pad(m - 1)}?aba=${aba}"` : 'aria-disabled="true"'} aria-label="Mês anterior">${I.left}</a><span class="num-t">${pad(m)}/12</span><a class="btn sm ghost icon" ${m < 12 ? `href="#/endo/mes/${pad(m + 1)}?aba=${aba}"` : 'aria-disabled="true"'} aria-label="Próximo mês">${I.right}</a></div>
        </div>
        <header class="mtitle">
          <div><span class="eyebrow">${MESES[m - 1]} de 2027 · ${esc(mo.ato)}</span><h2>${esc(mo.acao.nome)}</h2></div>
          <div class="mtitle-st"><label class="lbl">Status${E.stSelect('plano', `meses.${ix}.acao.status`)}</label></div>
        </header>
        <dl class="facts">
          <div><dt>Frentes</dt><dd>${frente(mo.acao.frenteP)}${mo.acao.frenteS ? frente(mo.acao.frenteS) : ''}<span class="mini">${esc(E.FRENTES[mo.acao.frenteP] || '')}</span></dd></div>
          <div><dt>Carga do mês</dt><dd>${carga(mo.carga)}${mo.carga.pontos != null ? `<span class="mini">${mo.carga.pontos} pontos</span>` : ''}</dd></div>
          <div><dt>Intensidade</dt><dd>${esc(mo.intensidade)}</dd></div>
          <div><dt>Investimento previsto</dt><dd class="num-t">${brl0(R.total)}${R.pendentes ? ` <span class="mk-tag p">${R.pendentes} a cotar</span>` : ''}<span class="mini">${esc(E.CLASSE[R.classe])}</span></dd></div>
          <div><dt>Horas envolvidas</dt><dd class="num-t">${n1(H.total)} h<span class="mini">equipe ${n1(H.equipe)} · participação ${H.colab == null ? '—' : n1(H.colab)}</span></dd></div>
          <div><dt>Calendário</dt><dd>${evs.length} eventos<span class="mini">${(mo.vinculos || []).length} vinculado(s)</span></dd></div>
        </dl>
        <nav class="tabs glass" aria-label="Seções do mês">${ABAS.map(([k, l]) => `<a href="#/endo/mes/${pad(m)}?aba=${k}"${k === aba ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
        <div class="tabpanel">${inner}</div>`;
    },
    after() { },
  };
  /* Marca a tela como inativa ao sair dela (os cliques globais só valem aqui) */
  addEventListener('hashchange', () => { if (!/^#\/endo\/mes\//.test(location.hash)) E.views.mes.active = false; });
})();
