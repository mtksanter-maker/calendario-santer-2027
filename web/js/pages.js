/* Adaptador exclusivo da versão estática. O servidor local continua usando a API original. */
(() => {
  'use strict';
  window.SANTER_PAGES = true;
  const originalFetch = window.fetch.bind(window);
  const prefix = 'santer-pages-2027:' + new URL('.', location.href).pathname + ':';
  const names = ['calendario', 'plano', 'linkedin', 'pesquisa', ...Array.from({ length: 12 }, (_, i) => 'mes-' + String(i + 1).padStart(2, '0'))];
  const file = name => name === 'calendario' ? 'dados/calendario-2027.json' : 'dados/endo/' + name + '.json';
  const read = async name => {
    const raw = localStorage.getItem(prefix + name);
    if (raw) return JSON.parse(raw);
    const r = await originalFetch(file(name));
    if (!r.ok) throw new Error('Falha ao carregar ' + name);
    return r.json();
  };
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    const base = new URL('.', location.href);
    const path = url.pathname.slice(base.pathname.length);
    const name = path === 'api/calendario' ? 'calendario' : path.startsWith('api/endo/') ? path.slice(9) : null;
    if (url.origin !== base.origin || name === null) return originalFetch(input, options);
    if (!names.includes(name)) return response({ erro: 'Conjunto não encontrado' }, 404);
    try {
      if ((options.method || 'GET').toUpperCase() === 'GET') return response(await read(name));
      if (options.method.toUpperCase() !== 'PUT') return response({ erro: 'Método não permitido' }, 405);
      const headers = new Headers(options.headers);
      const current = await read(name);
      if (headers.get('X-Sobrescrever') !== '1' && (current.updated || '') !== (headers.get('X-Versao') || '')) return response({ conflito: true }, 409);
      const data = JSON.parse(options.body);
      localStorage.setItem(prefix + name + ':anterior', JSON.stringify(current));
      localStorage.setItem(prefix + name, JSON.stringify(data));
      return response({ ok: true });
    } catch (e) { return response({ erro: e.message }, 500); }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.style.cssText = 'padding:8px 16px;background:#e9efeb;color:#243c30;font:12px system-ui;display:flex;gap:12px;flex-wrap:wrap;align-items:center';
    bar.innerHTML = '<span>Versão online · alterações salvas somente neste navegador.</span><button type="button" data-backup>Exportar backup completo</button><button type="button" data-restore>Importar backup completo</button><input type="file" accept=".json,application/json" hidden>';
    document.getElementById('view').prepend(bar);
    bar.querySelector('[data-backup]').onclick = async () => {
      try {
        const data = Object.fromEntries(await Promise.all(names.map(async n => [n, await read(n)])));
        const url = URL.createObjectURL(new Blob([JSON.stringify({ formato: 'santer-central-2027', conjuntos: data }, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = 'santer-central-2027-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) { alert('Não foi possível exportar: ' + e.message); }
    };
    const input = bar.querySelector('input');
    bar.querySelector('[data-restore]').onclick = () => input.click();
    input.onchange = async () => {
      try {
        const backup = JSON.parse(await input.files[0].text());
        if (backup.formato !== 'santer-central-2027' || !names.every(n => backup.conjuntos?.[n] && typeof backup.conjuntos[n] === 'object')) throw new Error('Backup completo inválido');
        if (!confirm('Substituir os dados deste navegador pelo backup selecionado?')) return;
        const previous = names.map(n => localStorage.getItem(prefix + n));
        try { names.forEach(n => localStorage.setItem(prefix + n, JSON.stringify(backup.conjuntos[n]))); }
        catch (e) { names.forEach((n, i) => previous[i] === null ? localStorage.removeItem(prefix + n) : localStorage.setItem(prefix + n, previous[i])); throw e; }
        location.reload();
      } catch (e) { alert('Não foi possível importar: ' + e.message); }
      input.value = '';
    };
  });
})();
