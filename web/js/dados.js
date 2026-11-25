/* Serviço de dados compartilhado (Calendário + Endomarketing 2027).
   Uma fonte única por conjunto: cada conjunto é baixado uma vez, fica em memória e é gravado
   com controle de versão (cabeçalho X-Versao). Se outra pessoa salvou antes, a gravação devolve conflito
   e nada é sobrescrito sem confirmação. Conjuntos: plano, linkedin, pesquisa, mes-01 … mes-12. */
(() => {
  'use strict';
  const BASE = 'api/endo/';
  const cache = new Map();     // nome -> { data, promise }
  const subs = new Map();      // nome -> Set(fn)
  const servidor = /^https?:$/.test(location.protocol);

  function emit(nome, origem) { (subs.get(nome) || new Set()).forEach(fn => { try { fn(cache.get(nome).data, origem); } catch (e) { console.error(e); } }); }

  const SanterDados = {
    disponivel: servidor,
    /** Baixa (uma vez) e devolve o conjunto. */
    get(nome) {
      const c = cache.get(nome);
      if (c && (c.data || c.promise)) return c.data ? Promise.resolve(c.data) : c.promise;
      const promise = fetch(BASE + nome, { cache: 'no-store' }).then(r => {
        if (!r.ok) throw Object.assign(new Error('HTTP ' + r.status), { status: r.status });
        return r.json();
      }).then(data => { cache.set(nome, { data }); emit(nome, 'carga'); return data; })
        .catch(err => { cache.delete(nome); throw err; });
      cache.set(nome, { promise });
      return promise;
    },
    /** Devolve o conjunto se já estiver em memória (sem baixar). */
    peek(nome) { const c = cache.get(nome); return c && c.data ? c.data : null; },
    /** Baixa de novo, descartando a cópia em memória. */
    async recarregar(nome) { cache.delete(nome); const d = await SanterDados.get(nome); emit(nome, 'recarga'); return d; },
    /** Grava. Resolve { ok } ou { conflito: true }. */
    async salvar(nome, data, opts) {
      opts = opts || {};
      const base = data.updated || '';
      const corpo = Object.assign({}, data, { updated: new Date().toISOString() });
      const headers = { 'Content-Type': 'application/json; charset=utf-8', 'X-Versao': base };
      if (opts.forcar) headers['X-Sobrescrever'] = '1';
      let r;
      try { r = await fetch(BASE + nome, { method: 'PUT', headers, body: JSON.stringify(corpo) }); }
      catch (e) { return { ok: false, erro: 'rede' }; }
      if (r.status === 409) return { ok: false, conflito: true };
      if (!r.ok) return { ok: false, erro: 'http-' + r.status };
      data.updated = corpo.updated;
      cache.set(nome, { data });
      emit(nome, opts.origem || 'gravacao');
      return { ok: true, updated: corpo.updated };
    },
    /** Avisa quando o conjunto muda (carga, gravação, edição local). Devolve a função para cancelar. */
    on(nome, fn) { if (!subs.has(nome)) subs.set(nome, new Set()); subs.get(nome).add(fn); return () => subs.get(nome).delete(fn); },
    /** Notifica mudança local (ainda não gravada) para outros módulos redesenharem. */
    tocar(nome, origem) { if (cache.get(nome) && cache.get(nome).data) emit(nome, origem || 'edicao'); }
  };
  window.SanterDados = SanterDados;
})();
