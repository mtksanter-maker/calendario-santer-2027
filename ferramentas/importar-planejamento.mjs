// Importa a base de conhecimento do planejamento (pasta endo-2027) para os dados do app.
// Fontes: 03-biblia-anual.md, 04-orcamento.csv, meses/*.md, estruturado/meses/*.json,
//         estruturado/programas.json, estruturado/pesquisa.json, linkedin/*.csv.
// Saída: dados/endo/plano.json, linkedin.json, pesquisa.json e mes-01..12.json.
//
// Segurança dos dados: por padrão NÃO sobrescreve arquivos que já existem (eles podem ter edições feitas no app).
// Use --substituir para regravar; antes disso, a versão atual é copiada para dados/backups/endo/.
// Use --so=pesquisa,linkedin para importar só alguns conjuntos. Use --dados=<pasta> para gravar em outra pasta (testes).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const APP = join(AQUI, '..');
const ENDO = join(APP, '..', 'endo-2027');
const arg = n => (process.argv.find(a => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=');
const DADOS = arg('dados') ? arg('dados') : join(APP, 'dados');
const SUBST = process.argv.includes('--substituir');
const SO = arg('so') ? arg('so').split(',') : null;
const OUT = join(DADOS, 'endo');
const BK = join(DADOS, 'backups', 'endo');
const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad = n => String(n).padStart(2, '0');
const ler = p => readFileSync(join(ENDO, p), 'utf8').replace(/^﻿/, '');
const lerJson = p => existsSync(join(ENDO, p)) ? JSON.parse(ler(p)) : null;
const agora = new Date().toISOString();
const avisos = [];

/* ---------- utilidades ---------- */
function csv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(x => x !== '')) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}
const tira = s => String(s || '').replace(/\*\*/g, '').replace(/`/g, '').trim();
function tabela(md, aposTitulo) {
  const i = md.indexOf(aposTitulo);
  if (i < 0) return [];
  const linhas = md.slice(i).split('\n');
  const out = []; let head = null, started = false;
  for (const l of linhas.slice(1)) {
    if (/^\s*\|/.test(l)) {
      started = true;
      const cells = l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
      if (!head) head = cells.map(tira); else out.push(Object.fromEntries(head.map((h, k) => [h, cells[k] || ''])));
    } else if (started) break;
  }
  return out;
}
const dataBR = s => { const m = String(s || '').match(/(\d\d)\/(\d\d)\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
const num = s => { const v = parseFloat(String(s || '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
let seq = 0; const uid = p => `${p}-${(++seq).toString(36)}`;

function gravar(nome, obj) {
  if (SO && !SO.includes(nome.replace(/-\d\d$/, '')) && !SO.includes(nome)) return;
  mkdirSync(OUT, { recursive: true });
  const f = join(OUT, nome + '.json');
  if (existsSync(f)) {
    if (!SUBST) { console.log(`  mantido (já existe): ${nome}.json — use --substituir para regravar`); return; }
    mkdirSync(BK, { recursive: true });
    copyFileSync(f, join(BK, `${nome}_antes-importacao_${agora.replace(/[:.]/g, '-')}.json`));
  }
  writeFileSync(f, JSON.stringify(obj));
  console.log(`  gravado: ${nome}.json (${(JSON.stringify(obj).length / 1024).toFixed(1)} KB)`);
}

/* ---------- bíblia anual ---------- */
const biblia = ler('03-biblia-anual.md');
const versaoBiblia = (biblia.match(/Versão ([\d.]+)/) || [])[1] || '';
const mapa = tabela(biblia, '## 7. Mapa dos 12 meses');
const atosT = tabela(biblia, '**Três atos');
const publicosT = tabela(biblia, '## 3. Públicos');
const cenariosT = tabela(biblia, '## 8. Orçamento em cenários');
const indicadoresT = tabela(biblia, '## 9. Indicadores do ano');
const aprovacoes = (biblia.split('## 12. Aprovações necessárias antes de executar')[1] || '').split('\n').find(l => l.trim()) || '';
const riscos = ((biblia.split('## 11. Riscos principais')[1] || '').split('## 12')[0] || '').split('\n').filter(l => /^\d+\./.test(l)).map(l => tira(l.replace(/^\d+\.\s*/, '')));
const instrumentos = [
  { nome: 'Caminho da ideia', descricao: 'Fluxo único para sugestões: recebida → dono avalia → testar, adotar ou "não agora, e por quê", com prazo de resposta. Só abre com donos e prazo definidos.', status: 'nome de trabalho · aguardando validação' },
  { nome: 'Acervo do ano', descricao: 'Espaço único na intranet, com versão impressa e em áudio para as obras, onde cada mês deposita seu legado reutilizável. Substitui o papel útil do Learning.Rocks.', status: 'nome de trabalho · aguardando validação' }
];
const cargaDe = s => { const t = tira(s).toLowerCase(); const p = (t.match(/\((\d+)\)/) || [])[1]; return { nivel: t.startsWith('alta') ? 'alta' : t.startsWith('média') || t.startsWith('media') ? 'media' : 'baixa', pontos: p ? +p : null }; };
const frentesDe = s => { const m = tira(s).match(/([A-Z]{2}|Todas)\s*(?:\(([^)]*)\))?\s*\/\s*([A-Z]{2}|—)?/); return m ? { p: m[1], s: m[3] && m[3] !== '—' ? m[3] : null } : { p: tira(s), s: null }; };
if (mapa.length !== 12) avisos.push(`Bíblia §7: ${mapa.length} linhas (esperado 12)`);

/* ---------- orçamento consolidado (CSV) ---------- */
const orcCsv = csv(ler('04-orcamento.csv'));

/* ---------- fichas estruturadas e markdown ---------- */
const est = MESES.map((_, i) => lerJson(`estruturado/meses/${pad(i + 1)}.json`));
est.forEach((e, i) => { if (!e) avisos.push(`Sem dados estruturados de ${NOMES[i]} (estruturado/meses/${pad(i + 1)}.json)`); });
const progs = lerJson('estruturado/programas.json') || { programas: [], experiencias: [] };
if (!progs.programas.length) avisos.push('Sem estruturado/programas.json (ginástica laboral e ação esportiva)');

function secoes(md) {
  const partes = md.split(/\n(?=## )/);
  const cab = partes.shift();
  return {
    cabecalho: cab,
    secoes: partes.map(p => {
      const linha = p.split('\n')[0].replace(/^##\s+/, '');
      const m = linha.match(/^(\d+)\.\s*(.*)$/);
      return { id: m ? m[1] : slug(linha), titulo: tira(m ? m[2] : linha), md: p.split('\n').slice(1).join('\n').replace(/\n---\s*$/, '').trim() };
    })
  };
}
const statusDe = txt => {
  const t = String(txt || '').toLowerCase();
  if (/execut/.test(t)) return 'executado';
  if (/aprovado pelo master|aguardando valida|aguarda/.test(t)) return 'aguardando-validacao';
  return 'planejado';
};

/* ---------- plano.json ---------- */
const meses = mapa.map((r, i) => {
  const e = est[i] || {};
  const a = e.acao || {};
  const fr = frentesDe(r['Frente P / S']);
  const orc = e.orcamento || {};
  const imp = e.impacto || {};
  const nomeBiblia = (tira(r['Direção da ação principal (nome de trabalho)']).match(/^([^:]+?)(?::|\(| \+|$)/) || [])[1] || '';
  return {
    m: i + 1,
    carga: e.carga && e.carga.nivel ? e.carga : cargaDe(r['Carga']),
    diasUteis: e.diasUteis ?? null,
    intensidade: tira(r['Intensidade / teto']),
    ato: i < 4 ? 'Nossa gente' : i < 8 ? 'Nossa força' : 'Nosso futuro',
    direcao: tira(r['Direção da ação principal (nome de trabalho)']),
    janela: tira(r['Anfitrião / janela']),
    recebe: tira(r['Recebe de…']),
    entrega: tira(r['Entrega para… (legado)']),
    contexto: e.contexto || '',
    acao: {
      id: `acao-${pad(i + 1)}`,
      nome: a.nome || nomeBiblia,
      resumo: a.resumo || '',
      objetivo: a.objetivo || '',
      objetivoHumano: a.objetivoHumano || '',
      frenteP: a.frentePrimaria || fr.p,
      frenteS: a.frenteSecundaria || fr.s,
      intensidadeFicha: a.intensidade || '',
      alternativa: a.alternativaEscolhida || '',
      funcionamento: a.funcionamento || [],
      status: statusDe(e.statusFicha),
      statusFicha: e.statusFicha || '',
      notaMaster: e.notaMaster ?? null,
      responsavel: 'Marketing / endo',
      publico: e.publico || '',
      datas: (e.datas || []).map(d => ({ id: uid('d'), data: d.data, fim: d.fim || '', rotulo: d.rotulo, tipo: d.tipo || 'execucao' })),
      resultadoEsperado: e.resultadoEsperado || ''
    },
    eventosCitados: e.eventosCitados || [],
    orcamento: {
      itens: (orc.itens || []).map(x => ({ id: uid('i'), grupo: x.grupo || 'sede', item: x.item, qtd: x.qtd ?? 1, unitario: x.unitario ?? (x.total === 0 ? 0 : x.total != null && (x.qtd ?? 1) === 1 ? x.total : null), tipo: x.tipo || '', fonte: x.fonte || '', incluir: x.grupo !== 'outro' })),
      contingenciaPct: orc.contingenciaPct ?? 10,
      beneficiariosSede: orc.beneficiariosSede ?? 98,
      elegiveisExtensao: orc.elegiveisExtensao ?? null,
      teto: orc.teto ?? (/grande/i.test(r['Intensidade / teto']) ? 90 : 15),
      fichaTotalSede: orc.totalSede ?? null,
      fichaTotalExtensao: orc.totalExtensao ?? null,
      fichaTotalAcao: orc.totalAcao ?? null,
      naoIncremental: orc.naoIncremental || '',
      menorCusto: orc.menorCusto || null,
      observacoes: orc.observacoes || '',
      aprovado: false,
      realizado: []
    },
    linhasConsolidadas: orcCsv.filter(l => +l.mes === i + 1).map(l => ({
      acao: l.acao, status: l.status, tipo: l.tipo, pessoasSede: num(l.pessoas_sede), pessoasExtensao: num(l.pessoas_extensao), elegiveis: num(l.pessoas_elegiveis),
      total: num(l.total), custoPorPessoa: num(l.custo_por_pessoa), teto: num(l.teto_por_pessoa), horasEquipe: num(l.horas_equipe), fonte: l.fonte, observacoes: l.observacoes,
      recomendada: !/alternativa|menor custo|condicionad|cenário com/i.test(l.acao + ' ' + l.status)
    })),
    impacto: {
      minutosPorPessoa: imp.minutosPorPessoa ?? null,
      minutosPorPessoaTexto: imp.minutosPorPessoaTexto || '',
      participantes: imp.participantesPrevistos ?? null,
      deslocamentoMin: imp.deslocamentoMinPorPessoa ?? null,
      maxSimultaneos: imp.maxSimultaneos ?? null,
      maxSimultaneosTexto: imp.maxSimultaneosTexto || '',
      horasColaboradoresFicha: imp.horasColaboradores ?? null,
      horasEquipe: (imp.horasEquipe || []).map(h => ({ id: uid('h'), quem: h.quem, horas: h.horas ?? 0, emQue: h.emQue || '', grupo: h.grupo || 'sede' })),
      noExpediente: imp.noExpediente ?? true,
      observacao: imp.observacao || ''
    },
    indicadores: e.indicadores || [],
    pendencias: (e.pendencias || []).map(p => ({ id: uid('p'), item: p.item, quem: p.quem || '', critica: !!p.critica, feita: false })),
    referencias: e.referencias || [],
    aprovacoes: e.aprovacoes || [],
    observacoes: '',
    resultados: { participantes: null, realizadoEm: '', registro: '', utilidade: '' },
    vinculos: []
  };
});

const programas = (progs.programas || []).map(p => ({ ...p, sessoesRealizadas: [], vinculos: [], observacoesOperacionais: '' }));
const experiencias = (progs.experiencias || []).map(x => ({
  ...x,
  orcamento: x.orcamento ? { ...x.orcamento, itens: (x.orcamento.itens || []).map(it => ({ id: uid('i'), grupo: 'sede', tipo: '', fonte: '', ...it, qtd: it.qtd ?? 1, unitario: it.unitario ?? null })), realizado: [], aprovado: false } : { itens: [], realizado: [], teto: 90, contingenciaPct: 10, aprovado: false },
  horasEquipe: (x.horasEquipe || []).map(h => ({ id: uid('h'), ...h })),
  vinculos: [], observacoes: '', resultados: { participantes: null, realizadoEm: '', registro: '' }
}));

const plano = {
  v: 1,
  updated: agora,
  importadoEm: agora,
  fontes: { biblia: `03-biblia-anual.md v${versaoBiblia}`, orcamento: '04-orcamento.csv', fichas: 'meses/*.md', programas: 'estruturado/programas.json · 07-acoes-obrigatorias.md' },
  campanha: {
    tema: 'Jeito Santer de Ser',
    assinatura: 'Nossa gente. Nossa força. Nosso futuro.',
    conceito: 'Cada colaborador mantém vivo o Jeito Santer de Ser. Em 2027, a campanha coloca em evidência pessoas que constroem o próprio futuro, encontram caminhos diante dos desafios e fazem a diferença nos detalhes de cada entrega. Junto a essa força está o cuidado da Santer com o colaborador, com incentivos à saúde mental, física, financeira e espiritual.',
    tensao: 'Em ano puxado, pedir eficiência sem que soe como cobrança: eficiência como tirar o que atrapalha quem faz bem, com a gestão assumindo a sua parte.',
    objetivos: ['Melhoria da rotina profissional', 'Integração entre departamentos', 'Desenvolvimento das pessoas', 'Qualidade dos processos', 'Eficiência', 'Conhecimento institucional', 'Bem-estar', 'Orgulho de pertencer', 'Fortalecimento da marca empregadora', 'Relacionamento entre colaboradores e empresa'],
    frentes: [
      { id: 'SA', nome: 'Saúde e acolhimento', descricao: 'Prevenção, saúde física e mental, ergonomia, ginástica laboral e caminhos para encontrar apoio profissional.' },
      { id: 'VF', nome: 'Vida financeira', descricao: 'Organização financeira pessoal com materiais consultáveis, ferramentas simples e prevenção de fraudes, sem expor dados pessoais.' },
      { id: 'FM', nome: 'Incentivo a fazer melhor', descricao: 'Simplificação de processos, redução de retrabalho, comunicação entre áreas e melhoria contínua com dono definido.' },
      { id: 'RC', nome: 'Rotina e conveniência', descricao: 'Facilidades concretas no cotidiano: informação organizada, acesso a serviços internos e experiências pontuais de convivência.' }
    ],
    publicos: publicosT.map(p => ({ publico: tira(p['Público']), papel: tira(p['Papel']), participa: tira(p['Como participa']) })),
    atos: atosT.map(a => ({ nome: tira(a['Ato']), meses: tira(a['Meses']), enfase: tira(a['Ênfase']), pergunta: tira(a['Pergunta do ato']).replace(/^"|"$/g, '') })),
    instrumentos,
    indicadoresAno: indicadoresT.map(r => ({ dimensao: tira(r['Dimensão']), indicador: tira(r['Indicador']), fonte: tira(r['Fonte / dono']), janela: tira(r['Janela']) })),
    riscos,
    aprovacoes: tira(aprovacoes)
  },
  parametros: {
    sede: 98, alcance: 200, tetoPequena: 15, tetoGrande: 90, contingenciaPct: 10,
    orcamentoAnualAprovado: false, valorAprovado: null, cenarioEscolhido: '',
    cenarios: cenariosT.map(c => ({ id: tira(c['Cenário']).slice(0, 1), nome: tira(c['Cenário']), composicao: tira(c['Composição']), teto: num(tira(c['Teto máximo (sede, 98)']).replace(/[^\d,]/g, '').replace(',', '.')) })),
    nota: 'Não existe orçamento anual aprovado. Os tetos são limites, não metas de gasto. Pessoas: base de planejamento, não headcount confirmado [PENDENTE: RH].'
  },
  meses,
  programas,
  experiencias
};
/* Ao regravar, preserva o que só existe no app: vínculos com eventos oficiais, status, sessões realizadas,
   observações, resultados, realizado e pendências resolvidas (para não deixar eventos oficiais órfãos). */
const planoAtual = existsSync(join(OUT, 'plano.json')) ? JSON.parse(readFileSync(join(OUT, 'plano.json'), 'utf8')) : null;
if (planoAtual && SUBST) {
  plano.meses.forEach(mo => {
    const old = (planoAtual.meses || []).find(x => x.m === mo.m); if (!old) return;
    mo.vinculos = old.vinculos || []; mo.observacoes = old.observacoes || ''; mo.resultados = old.resultados || mo.resultados;
    mo.acao.status = old.acao && old.acao.status || mo.acao.status;
    mo.orcamento.realizado = (old.orcamento && old.orcamento.realizado) || [];
    const feitas = new Set((old.pendencias || []).filter(p => p.feita).map(p => p.item));
    mo.pendencias.forEach(p => { if (feitas.has(p.item)) p.feita = true; });
    const datasVinc = new Set((old.vinculos || []).map(v => v.dataId).filter(Boolean));
    if (datasVinc.size) {
      const keep = (old.acao.datas || []).filter(d => datasVinc.has(d.id));
      mo.acao.datas = keep.concat(mo.acao.datas.filter(n => !keep.some(o => o.data === n.data && o.rotulo === n.rotulo)));
    }
  });
  ['programas', 'experiencias'].forEach(k => plano[k].forEach(x => {
    const old = (planoAtual[k] || []).find(y => y.id === x.id); if (!old) return;
    x.vinculos = old.vinculos || []; x.status = old.status || x.status;
    if (old.sessoesRealizadas) x.sessoesRealizadas = old.sessoesRealizadas;
    if (old.observacoesOperacionais) x.observacoesOperacionais = old.observacoesOperacionais;
    if (old.observacoes && typeof old.observacoes === 'string') x.observacoes = old.observacoes;
    if (old.orcamento && old.orcamento.realizado) x.orcamento.realizado = old.orcamento.realizado;
  }));
  console.log('  plano: vínculos, status, resultados e realizado preservados da versão atual');
}
gravar('plano', plano);

/* ---------- fichas completas (sob demanda) ---------- */
MESES.forEach((nome, i) => {
  const arq = `meses/${pad(i + 1)}-${nome}.md`;
  if (!existsSync(join(ENDO, arq))) { avisos.push('Ficha não encontrada: ' + arq); return; }
  const md = ler(arq);
  const s = secoes(md);
  const e = est[i] || {};
  gravar(`mes-${pad(i + 1)}`, {
    v: 1, updated: agora, m: i + 1, fonteArquivo: arq,
    titulo: tira(s.cabecalho.split('\n')[0].replace(/^#\s+/, '')),
    cabecalho: s.cabecalho.split('\n').slice(1).join('\n').trim(),
    secoes: s.secoes,
    estrutura: {
      etapas: e.etapas || [], decisoes: e.decisoes || [], responsaveis: e.responsaveis || [], materiais: e.materiais || [],
      obras: e.obras || '', comunicacao: e.comunicacao || [], riscos: e.riscos || [], legado: e.legado || []
    }
  });
});

/* ---------- LinkedIn ---------- */
const ed = csv(ler('linkedin/calendario-editorial.csv'));
const cob = csv(ler('linkedin/coberturas.csv'));
const stLi = s => /publicad/i.test(s) ? 'publicado' : /agendad/i.test(s) ? 'agendado' : /aprovad/i.test(s) && !/aguarda/i.test(s) ? 'aprovado' : /produ/i.test(s) ? 'em-producao' : 'proposta';
gravar('linkedin', {
  v: 1, updated: agora,
  fontes: ['linkedin/calendario-editorial.csv', 'linkedin/coberturas.csv', 'linkedin/guia-execucao.md'],
  posts: ed.map(r => ({
    id: 'li-' + r.semana.toLowerCase(), tipo: 'editorial', semana: r.semana, data: dataBR(r.data), mes: MESES.indexOf(slug(r.mes).replace('marco', 'marco')) + 1 || null,
    pilar: r.pilar, tema: r.tema, objetivo: r.objetivo, abordagem: r.gancho, formato: r.formato, texto: r.resumo_copy,
    materiais: r.ativo_necessario, conexao: r.conexao_anual, referencias: r.alternativa ? 'Alternativa: ' + r.alternativa : '',
    responsavel: r.responsavel_sugerido, consentimento: r.consentimento, aprovacao: r.aprovacao, status: stLi(r.status), statusOriginal: r.status, notas: ''
  })).concat(cob.map((r, k) => {
    const d = dataBR(r.data);
    return {
      id: 'cob-' + (k + 1), tipo: 'cobertura', semana: '', data: d, mes: d ? +d.slice(5, 7) : null, pilar: 'Cobertura de ação/evento', tema: r.evento_acao,
      objetivo: r.necessidade_publicacao, abordagem: r.janela, formato: r.formato, texto: '', materiais: r.captura_autorizada, conexao: '', referencias: '',
      responsavel: r.responsavel, consentimento: r.captura_autorizada, aprovacao: '', status: stLi(r.status), statusOriginal: r.status, notas: ''
    };
  }))
});

/* ---------- Pesquisa ---------- */
const pesq = lerJson('estruturado/pesquisa.json');
if (pesq) gravar('pesquisa', { ...pesq, v: 1, updated: agora });
else avisos.push('Sem estruturado/pesquisa.json');

console.log(avisos.length ? '\nAvisos:\n - ' + avisos.join('\n - ') : '\nSem avisos.');
