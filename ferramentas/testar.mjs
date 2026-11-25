// Teste de ponta a ponta no navegador real (Edge headless). Use SEMPRE com um servidor apontando para uma CÓPIA dos dados:
//   powershell -File servidor.ps1 -Porta 8031 -SemNavegador -PastaDados <cópia>
//   node ferramentas/testar.mjs http://localhost:8031/
import { launch, sleep } from './cdp.mjs';
const base = process.argv[2] || 'http://localhost:8031/';
if (/:8027\/?$/.test(base)) { console.error('Recusado: não rode o teste contra o servidor com os dados reais (porta 8027).'); process.exit(2); }
const res = []; let falhas = 0;
const ok = (nome, cond, info) => { res.push(`${cond ? 'OK  ' : 'FALHA'} ${nome}${info != null ? ' — ' + info : ''}`); if (!cond) falhas++; };
const pages = process.argv.includes('--pages');
const api = async (p, o) => {
  if (pages) return b.eval(`(async()=>{const r=await fetch(${JSON.stringify(p)},${JSON.stringify(o || {})});return {status:r.status,json:r.headers.get('content-type')?.includes('json')?await r.json():null}})()`);
  const r = await fetch(base + p, o); return { status: r.status, json: r.headers.get('content-type')?.includes('json') ? await r.json() : null };
};
const b = await launch({ width: 1440, height: 900 });
const ev = s => b.eval(`{${s}}`);
const go = async (h, ms = 700) => { await ev(`location.hash=${JSON.stringify(h)}`); await sleep(ms); };

try {
  if (pages) await b.goto(base + '#/calendario', 1200);
  /* ---------- Calendário: funcionalidades originais ---------- */
  const cal0 = (await api('api/calendario')).json;
  await b.goto(base + '#/calendario', 1000);
  await b.waitFor(`document.querySelectorAll('.mcard').length===12`);
  ok('Calendário mostra 12 meses', true);
  ok('Mesma quantidade de eventos do arquivo', await ev(`SanterCal.events().length`) === cal0.events.length, cal0.events.length);
  await b.click('.mcard[data-month="2"] .mhead'); await sleep(700);
  ok('Abre a folha do mês (março)', await ev(`!document.querySelector('.sheet').hidden && /Março/.test(document.querySelector('.sh-title').textContent)`));
  await b.click('[data-nav="1"]'); await sleep(800);
  ok('Navega para o mês seguinte', await ev(`/Abril/.test(document.querySelector('.sh-title').textContent)`));
  ok('Folha mostra a ação do Endomarketing do mês', await ev(`!!document.querySelector('.sh-head .plan-pill')`));
  await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); await sleep(700);
  ok('Fecha a folha com Esc', await ev(`document.querySelector('.sheet').hidden`));
  await ev(`document.querySelector('.day[data-date="2027-04-17"]').click()`); await sleep(500);
  ok('Popover do dia abre', await ev(`!document.querySelector('.pop').hidden`));
  ok('Evento oficial com link para o planejamento', await ev(`[...document.querySelectorAll('.pop .ev:not(.virt) .ev-link')].length>0`));
  ok('Item da camada de planejamento aparece no popover', await ev(`!!document.querySelector('.pop .ev.virt.k-plan')`));
  await ev(`document.querySelector('[data-close-pop]').click()`); await sleep(300);
  await ev(`const q=document.getElementById('q'); q.value='Tiradentes'; q.dispatchEvent(new Event('input',{bubbles:true}))`); await sleep(200);
  ok('Busca encontra datas', await ev(`document.querySelectorAll('#results .res').length`) > 0);
  await ev(`const q=document.getElementById('q'); q.value=''; q.dispatchEvent(new Event('input',{bubbles:true}))`);
  const nDias = await ev(`document.querySelectorAll('.day.has').length`);
  await ev(`document.querySelector('[data-cat="feriado"]').click()`); await sleep(200);
  ok('Filtro de categoria oculta datas', await ev(`document.querySelectorAll('.day.has').length`) < nDias);
  await ev(`document.querySelector('[data-cat="feriado"]').click()`); await sleep(200);
  await ev(`document.querySelector('[data-cat="lyr-li"]').click()`); await sleep(900);
  ok('Camada do LinkedIn carrega sob demanda', await ev(`document.querySelectorAll('.day.vl').length`) > 0);
  await ev(`document.querySelector('[data-cat="lyr-li"]').click()`); await sleep(200);
  // Edição: adicionar, salvar, excluir, salvar
  await b.click('#btn-edit'); await sleep(400);
  await b.click('#eb-add'); await sleep(400);
  await ev(`document.getElementById('ed-title').value='TESTE AUTOMATIZADO'; document.getElementById('ed-date').value='2027-09-09'; document.getElementById('ed-form').requestSubmit()`); await sleep(400);
  await b.click('#eb-save'); await sleep(1200);
  let cal1 = (await api('api/calendario')).json;
  const teste = cal1.events.find(e => e[3] === 'TESTE AUTOMATIZADO');
  ok('Novo evento persiste no arquivo', !!teste && teste[0] === '2027-09-09');
  await ev(`document.querySelector('.day[data-date="2027-09-09"]').click()`); await sleep(400);
  await ev(`[...document.querySelectorAll('.pop [data-del-ev]')].find(b=>/TESTE AUTOMATIZADO/.test(b.getAttribute('aria-label'))).click()`); await sleep(300);
  await b.click('#eb-save'); await sleep(1200);
  cal1 = (await api('api/calendario')).json;
  ok('Exclusão persiste e volta ao total original', cal1.events.length === cal0.events.length);
  await b.click('#btn-edit'); await sleep(300);
  await b.click('#btn-print'); await sleep(1500);
  ok('Prévia de impressão gera 12+ folhas A4', await ev(`document.querySelectorAll('.p-page').length`) >= 12);
  ok('Impressão não inclui camadas não oficiais', await ev(`!/Proposta do Endomarketing/.test(document.getElementById('print-pages').textContent)`));
  await b.click('[data-print-close]'); await sleep(300);

  /* ---------- Endomarketing: navegação e cálculos ---------- */
  await go('#/endo/visao', 1500);
  await b.waitFor(`document.querySelector('.hero')`);
  ok('Visão geral carrega', true);
  const plano = (await api('api/endo/plano')).json;
  const somaPrev = plano.meses.reduce((a, m) => a + m.orcamento.itens.filter(i => i.incluir !== false && typeof i.unitario === 'number').reduce((s, i) => s + i.qtd * i.unitario, 0) * (1 + m.orcamento.contingenciaPct / 100), 0)
    + plano.experiencias.reduce((a, x) => a + x.orcamento.itens.filter(i => i.incluir !== false && typeof i.unitario === 'number').reduce((s, i) => s + i.qtd * i.unitario, 0) * (1 + x.orcamento.contingenciaPct / 100), 0);
  const prevUI = await ev(`Endo.ano().previsto`);
  ok('Investimento previsto = soma dos itens editáveis', Math.abs(prevUI - somaPrev) < 0.01, prevUI.toFixed(2));
  for (const [h, sel] of [['#/endo/jornada', '.mtile'], ['#/endo/programas', '.sess'], ['#/endo/orcamento', '.ch-svg'], ['#/endo/produtividade', '.ch-svg'], ['#/endo/linkedin', '.lc-grid'], ['#/endo/pesquisa', '.pq']]) {
    await go(h, 1200);
    ok(`Tela ${h} renderiza`, await ev(`!!document.querySelector('#ebody ${sel}')`));
  }
  // Edição com salvamento automático e recálculo
  await go('#/endo/mes/06?aba=orcamento', 1500);
  const tot0 = await ev(`Endo.orc(Endo.mes(6).orcamento).total`);
  await ev(`const i=document.querySelector('[data-b="plano:meses.5.orcamento.itens.0.qtd"]'); i.value='3'; i.dispatchEvent(new Event('change',{bubbles:true}))`);
  await sleep(1800);
  const tot1 = await ev(`Endo.orc(Endo.mes(6).orcamento).total`);
  ok('Alterar quantidade recalcula o total', Math.abs(tot1 - tot0 - 2 * 25 * 1.1) < 0.01, `${tot0.toFixed(2)} → ${tot1.toFixed(2)}`);
  const p1 = (await api('api/endo/plano')).json;
  ok('Alteração gravada automaticamente no servidor', p1.meses[5].orcamento.itens[0].qtd === 3);
  ok('Indicador mostra "Salvo"', await ev(`/Salvo/.test(document.getElementById('et-save').textContent)`));
  await ev(`document.querySelector('[data-undo]').click()`); await sleep(1800);
  ok('Desfazer restaura e grava', (await api('api/endo/plano')).json.meses[5].orcamento.itens[0].qtd === 1);
  // Conflito de versão
  const conf = await api('api/endo/plano', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Versao': 'versao-antiga' }, body: JSON.stringify({ v: 1, updated: 'x' }) });
  ok('Servidor recusa gravação com versão desatualizada (409)', conf.status === 409);
  const inval = await api('api/endo/nada', {});
  ok('Conjunto desconhecido é recusado (404)', inval.status === 404);

  /* ---------- Integração: aprovar, publicar, divergência ---------- */
  await go('#/endo/mes/04?aba=resumo', 1500);
  ok('Publicar desabilitado antes da aprovação', await ev(`document.querySelector('[data-pub]').disabled`));
  await ev(`const s=document.querySelector('[data-b="plano:meses.3.acao.status"]'); s.value='aprovado'; s.dispatchEvent(new Event('change',{bubbles:true}))`); await sleep(1500);
  const dataId = await ev(`Endo.mes(4).acao.datas.find(d=>d.tipo==='execucao'||d.tipo==='lancamento').id`);
  await ev(`document.querySelector('[data-pub$="|${dataId}"]').click()`); await sleep(2500);
  const p2 = (await api('api/endo/plano')).json, v = p2.meses[3].vinculos.find(x => x.dataId === dataId);
  const cal2 = (await api('api/calendario')).json;
  ok('Publicar cria evento oficial no calendário', !!v && cal2.events.some(e => e[7] === v.eventId), cal2.events.length - cal0.events.length + ' evento(s) novo(s)');
  ok('Vínculo registrado no plano (fonte única)', !!v);
  const ix = p2.meses[3].acao.datas.findIndex(d => d.id === dataId);
  await ev(`const i=document.querySelector('[data-b="plano:meses.3.acao.datas.${ix}.rotulo"]'); i.value=i.value+' (revisado)'; i.dispatchEvent(new Event('change',{bubbles:true}))`); await sleep(2000);
  const cal3 = (await api('api/calendario')).json;
  ok('Mudar a proposta NÃO altera o evento oficial', cal3.events.find(e => e[7] === v.eventId)[3] === cal2.events.find(e => e[7] === v.eventId)[3]);
  ok('Tela indica que a proposta difere do evento oficial', await ev(`/difere do evento oficial/.test(document.querySelector('.tabpanel').textContent)`));
  await go('#/calendario', 900);
  const evd = cal2.events.find(e => e[7] === v.eventId)[0];
  await ev(`document.querySelector('.day[data-date="${evd}"]').click()`); await sleep(500);
  ok('No calendário, o evento vinculado abre a iniciativa', await ev(`[...document.querySelectorAll('.pop .ev-link')].some(a=>/Ver iniciativa/.test(a.textContent) && /#\\/endo\\/mes\\/04/.test(a.getAttribute('href')))`));
  ok('Evento vinculado marcado como ação da campanha', await ev(`!!document.querySelector('.pop .linked')`));
  await ev(`document.querySelector('[data-close-pop]').click()`);

  /* ---------- LinkedIn ---------- */
  await go('#/endo/linkedin', 1300);
  await ev(`document.querySelector('[data-li-view="lista"]').click()`); await sleep(500);
  ok('LinkedIn: visualização em lista', await ev(`!!document.querySelector('.li-t')`));
  await ev(`document.querySelector('[data-li-view="cards"]').click()`); await sleep(500);
  ok('LinkedIn: visualização em cards', await ev(`!!document.querySelector('.li-cards .li-card')`));
  await ev(`const s=document.querySelector('[data-li-f="mes"]'); s.value='3'; s.dispatchEvent(new Event('change',{bubbles:true}))`); await sleep(500);
  const nMar = await ev(`document.querySelectorAll('.li-card').length`);
  const realMar = (await api('api/endo/linkedin')).json.posts.filter(p => p.mes === 3).length;
  ok('LinkedIn: filtro por mês', nMar === realMar, `${nMar} publicações em março`);
  await ev(`document.querySelector('.li-card').click()`); await sleep(600);
  ok('LinkedIn: painel de edição abre', await ev(`document.querySelector('.e-drawer.open')!=null`));
  ok('LinkedIn: botão de copiar texto', await ev(`!!document.querySelector('.e-drawer [data-copy]')`));
  const pid = await ev(`document.querySelector('.e-drawer [data-b$=".status"]').dataset.b.split('.')[1]`);
  await ev(`const s=document.querySelector('.e-drawer [data-b$=".status"]'); s.value='em-producao'; s.dispatchEvent(new Event('change',{bubbles:true}))`); await sleep(1800);
  ok('LinkedIn: status persiste', (await api('api/endo/linkedin')).json.posts[+pid].status === 'em-producao');
  await ev(`document.querySelector('.e-drawer [data-close-drawer]').click()`); await sleep(300);
  await ev(`document.querySelector('[data-li-clear]') && document.querySelector('[data-li-clear]').click()`); await sleep(300);
  await ev(`document.querySelector('[data-li-view="calendario"]').click()`); await sleep(300);
  // Nova publicação: o que se digita no painel vai para ela (não para outro post)
  const nPosts = (await api('api/endo/linkedin')).json.posts.length;
  await ev(`document.querySelector('[data-li-new]').click()`); await sleep(700);
  await ev(`const i=document.querySelector('.e-drawer [data-b$=".tema"]'); i.value='TEMA DO TESTE'; i.dispatchEvent(new Event('change',{bubbles:true}))`); await sleep(1800);
  const liAfter = (await api('api/endo/linkedin')).json.posts;
  ok('LinkedIn: "Nova" grava o tema na própria publicação', liAfter.length === nPosts + 1 && liAfter[liAfter.length - 1].tema === 'TEMA DO TESTE' && liAfter.filter(p => p.tema === 'TEMA DO TESTE').length === 1);
  await ev(`document.querySelector('.e-drawer [data-close-drawer]').click()`); await sleep(300);
  // Foco do teclado: Tab depois de editar leva ao campo seguinte
  await ev(`const q=document.getElementById('li-q'); q.focus()`);
  await b.send('Input.insertText', { text: 'gin' }); await sleep(500);
  ok('Busca mantém o foco enquanto se digita', await ev(`document.activeElement && document.activeElement.id==='li-q' && document.activeElement.value==='gin'`));
  await ev(`const q=document.getElementById('li-q'); q.value=''; q.dispatchEvent(new Event('input',{bubbles:true}))`); await sleep(400);
  await go('#/endo/mes/02?aba=resumo', 1300);
  await ev(`document.querySelector('[data-b="plano:meses.1.acao.nome"]').focus()`);
  await b.send('Input.insertText', { text: ' ' }); await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await sleep(600);
  ok('Tab após editar mantém o foco no campo seguinte', await ev(`document.activeElement && document.activeElement.dataset && document.activeElement.dataset.b==='plano:meses.1.acao.responsavel'`), await ev(`document.activeElement.tagName + ' ' + (document.activeElement.dataset.b||'')`));
  await ev(`document.querySelector('[data-undo]').click()`); await sleep(1500);
  // Data inválida não vira evento oficial
  const inv = await ev(`SanterCal.updateEvent('nao-existe', { d: '' })`);
  ok('Calendário recusa data inválida vinda do planejamento', inv && inv.ok === false);
  // Ctrl+P no Endo não liga a impressão do calendário
  await ev(`window.dispatchEvent(new Event('beforeprint'))`);
  ok('Imprimir no Endo não imprime o calendário', await ev(`!document.body.classList.contains('print-mode')`));
  await ev(`window.dispatchEvent(new Event('afterprint'))`);

  /* ---------- Pesquisa ---------- */
  await go('#/endo/pesquisa', 1300);
  const nAll = await ev(`document.querySelectorAll('.pq').length`);
  await ev(`document.querySelector('[data-pq-cat="employee-advocacy"]').click()`); await sleep(500);
  const nAdv = await ev(`document.querySelectorAll('.pq').length`);
  ok('Pesquisa: filtro por categoria', nAdv > 0 && nAdv < nAll, `${nAdv} cases de employee advocacy`);
  await ev(`document.querySelector('.pq').click()`); await sleep(600);
  ok('Pesquisa: case abre com fonte e aplicação', await ev(`!!document.querySelector('.e-drawer.open .cs-b.apl') && !!document.querySelector('.e-drawer.open .src, .e-drawer.open .cs-b .note')`));
  await ev(`document.querySelector('.e-drawer [data-close-drawer]').click()`); await sleep(300);
  await ev(`document.querySelector('[data-pq-cat="employee-advocacy"]').click()`); await sleep(300);

  /* ---------- Programas ---------- */
  await go('#/endo/programas', 1300);
  const d0 = await ev(`document.querySelector('[data-sess]').dataset.sess.split('|')[1]`);
  await ev(`document.querySelector('[data-sess]').click()`); await sleep(1800);
  ok('Ginástica: sessão marcada como realizada persiste', (await api('api/endo/plano')).json.programas[0].sessoesRealizadas.includes(d0));
  ok('Ginástica: custo a cotar não vira zero', await ev(`Endo.prog(Endo.st.plano.programas[0]).custoAno === null`));

  /* ---------- Abrir direto no Endo e depois ir ao calendário ---------- */
  await b.goto('about:blank', 100); await b.goto(base + '#/endo/visao', 1800);
  await go('#/calendario', 1500);
  ok('Abrindo pelo Endo, o calendário mostra as camadas', await ev(`document.querySelectorAll('.chip.lyr').length===3 && document.querySelectorAll('.day.vp').length>0`));

  /* ---------- Acessibilidade e responsividade ---------- */
  const semNome = await ev(`[...document.querySelectorAll('button,a[href],select,input:not([type=hidden]),textarea')].filter(n=>n.offsetParent!==null && !(n.getAttribute('aria-label')||n.textContent.trim()||n.getAttribute('title')||(n.labels&&n.labels.length)||n.placeholder)).length`);
  ok('Controles visíveis com nome acessível (Programas)', semNome === 0, semNome + ' sem nome');
  for (const [w, h] of [[390, 844], [820, 1180]]) {
    await b.viewport(w, h, w < 700);
    for (const r of ['#/calendario', '#/endo/visao', '#/endo/jornada', '#/endo/mes/03', '#/endo/orcamento', '#/endo/linkedin', '#/endo/pesquisa']) {
      await go(r, 900);
      const over = await ev(`document.documentElement.scrollWidth - innerWidth`);
      ok(`Sem rolagem horizontal ${w}px ${r}`, over <= 1, over > 1 ? over + 'px a mais' : null);
    }
  }
  await b.viewport(1440, 900);
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
  await go('#/calendario', 600);
  ok('Vidro desativado com "reduzir transparência"', await ev(`getComputedStyle(document.getElementById('rail')).backdropFilter`) === 'none');
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  ok('Movimento reduzido respeitado', parseFloat(await ev(`getComputedStyle(document.querySelector('.rail-ind')).transitionDuration`)) <= 0.002);
} catch (e) {
  ok('Execução do teste', false, e.message);
}
ok('Sem erros no console', b.errors.length === 0, b.errors.slice(0, 5).join(' | '));
console.log(res.join('\n'));
console.log(`\n${res.length - falhas}/${res.length} verificações passaram.`);
await b.close();
process.exit(falhas ? 1 : 0);
