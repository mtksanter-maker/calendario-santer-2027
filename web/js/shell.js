/* Shell da Central de Endomarketing: sidebar (Liquid Glass), rotas e carregamento sob demanda.
   Rotas: #/calendario · #/endo[/visao|jornada|mes/MM|programas|orcamento|produtividade|linkedin|pesquisa] */
(() => {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } } };
  const ico = d => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    cal: ico('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/>'),
    endo: ico('<rect x="3.5" y="3.5" width="7" height="9" rx="2"/><rect x="13.5" y="3.5" width="7" height="5" rx="2"/><rect x="13.5" y="11.5" width="7" height="9" rx="2"/><rect x="3.5" y="15.5" width="7" height="5" rx="2"/>'),
    side: ico('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/>'),
    sun: ico('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
    moon: ico('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
    auto: ico('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" stroke="none"/>')
  };
  const SUB = [['visao', 'Visão geral'], ['jornada', 'Jornada anual'], ['programas', 'Programas recorrentes'], ['orcamento', 'Orçamento'], ['produtividade', 'Produtividade'], ['linkedin', 'LinkedIn'], ['pesquisa', 'Pesquisa e cases']];
  const THEMES = [['auto', 'Aparência: automática', ICON.auto], ['light', 'Aparência: clara', ICON.sun], ['dark', 'Aparência: escura', ICON.moon]];

  const rail = $('#rail');
  rail.innerHTML = `
    <a class="rail-brand" href="#/calendario" aria-label="Santer Empreendimentos · início"><span class="rail-mark" aria-hidden="true">S</span><span class="rail-word"><b>SANTER</b><span>Central de Endomarketing</span></span></a>
    <div class="rail-nav" role="list">
      <span class="rail-ind" aria-hidden="true"></span>
      <a class="rail-item" role="listitem" href="#/calendario" data-mod="cal" data-tip="Calendário">${ICON.cal}<span class="rail-label">Calendário</span></a>
      <a class="rail-item" role="listitem" href="#/endo" data-mod="endo" data-tip="Endomarketing 2027">${ICON.endo}<span class="rail-label">Endomarketing 2027</span></a>
      <div class="rail-sub" id="rail-sub">${SUB.map(([k, l]) => `<a href="#/endo/${k}" data-sub="${k}">${l}</a>`).join('')}</div>
    </div>
    <span class="rail-sp"></span>
    <button type="button" class="rail-item" data-rail="theme" data-tip="Aparência">${ICON.auto}<span class="rail-label">Aparência</span></button>
    <button type="button" class="rail-item" data-rail="toggle" aria-expanded="false" data-tip="Expandir menu">${ICON.side}<span class="rail-label">Recolher menu</span></button>`;
  const ind = $('.rail-ind', rail), sub = $('#rail-sub', rail);

  /* Tooltip de vidro (só com o menu recolhido) */
  const tip = document.createElement('div');
  tip.className = 'tip glass-strong'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  let tipFor = null;
  function showTip(el) {
    if (rail.classList.contains('open') || matchMedia('(max-width:760px)').matches) return;
    tipFor = el; tip.textContent = el.dataset.tip; tip.hidden = false;
    const r = el.getBoundingClientRect();
    tip.style.left = (r.right + 12) + 'px'; tip.style.top = (r.top + r.height / 2 - tip.offsetHeight / 2) + 'px';
    requestAnimationFrame(() => tip.classList.add('show'));
  }
  function hideTip() { tipFor = null; tip.classList.remove('show'); setTimeout(() => { if (!tipFor) tip.hidden = true; }, 140); }
  rail.addEventListener('pointerover', e => { const el = e.target.closest('[data-tip]'); if (el && el !== tipFor) showTip(el); });
  rail.addEventListener('pointerleave', hideTip);
  rail.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el); });
  rail.addEventListener('focusout', hideTip);

  /* Brilho especular que acompanha o ponteiro nos elementos .glass-live */
  document.addEventListener('pointermove', e => {
    const g = e.target.closest && e.target.closest('.glass-live');
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    g.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* Expandir / recolher */
  function setOpen(open) {
    rail.classList.toggle('open', open);
    const b = $('[data-rail="toggle"]', rail);
    b.setAttribute('aria-expanded', String(open));
    b.dataset.tip = open ? 'Recolher menu' : 'Expandir menu';
    $('.rail-label', b).textContent = open ? 'Recolher menu' : 'Expandir menu';
    store.set('santer:menu', open ? '1' : '0');
    hideTip();
    setTimeout(moveInd, 10);
  }
  /* Tema */
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    const th = THEMES.find(x => x[0] === t) || THEMES[0];
    const b = $('[data-rail="theme"]', rail);
    b.innerHTML = `${th[2]}<span class="rail-label">${th[1]}</span>`;
    b.dataset.tip = th[1];
    store.set('santer:tema', t);
  }
  rail.addEventListener('click', e => {
    const b = e.target.closest('[data-rail]');
    if (!b) return;
    if (b.dataset.rail === 'toggle') setOpen(!rail.classList.contains('open'));
    if (b.dataset.rail === 'theme') {
      const cur = store.get('santer:tema') || 'auto';
      applyTheme(THEMES[(THEMES.findIndex(x => x[0] === cur) + 1) % THEMES.length][0]);
    }
  });

  /* Indicador do módulo ativo: desliza entre os itens */
  function moveInd() {
    const a = $('.rail-item[aria-current="page"]', rail);
    if (!a) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    const nav = $('.rail-nav', rail).getBoundingClientRect(), r = a.getBoundingClientRect();
    if (matchMedia('(max-width:760px)').matches) { ind.style.setProperty('--ind-w', r.width + 'px'); ind.style.transform = `translateX(${r.left - nav.left}px)`; }
    else ind.style.transform = `translateY(${r.top - nav.top}px)`;
  }
  addEventListener('resize', () => requestAnimationFrame(moveInd));

  /* Rotas */
  const mods = { cal: $('#mod-cal'), endo: $('#mod-endo') };
  const scrollPos = { cal: 0, endo: 0 };
  let current = '';
  let endoLoad = null;
  function loadCss(href) { return new Promise((res, rej) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = res; l.onerror = rej; document.head.appendChild(l); }); }
  function loadJs(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); }); }
  function loadEndo() {
    if (!endoLoad) {
      mods.endo.innerHTML = '<div class="mod-loading"><span class="spinner"></span>Carregando o planejamento de 2027…</div>';
      endoLoad = Promise.all([loadCss('css/endo.css'), loadJs('js/endo/nucleo.js')])
        .catch(err => { endoLoad = null; mods.endo.innerHTML = '<div class="mod-loading">Não foi possível carregar o módulo. Verifique se a janela do “Iniciar calendario” continua aberta.</div>'; throw err; });
    }
    return endoLoad;
  }
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, query] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    if (parts[0] === 'endo') return { mod: 'endo', parts: parts.slice(1), params };
    return { mod: 'cal', parts: parts.slice(1), params };
  }
  async function route() {
    const r = parse();
    if (r.mod !== current) {
      if (current) scrollPos[current] = scrollY;
      if (current === 'cal' && window.SanterCal) window.SanterCal.closeOverlays();
      Object.entries(mods).forEach(([k, el]) => { el.hidden = k !== r.mod; el.classList.remove('enter'); });
      const prev = current; current = r.mod;
      document.body.dataset.mod = r.mod;
      if (prev && !RM.matches) { void mods[r.mod].offsetWidth; mods[r.mod].classList.add('enter'); }
      document.title = r.mod === 'endo' ? 'Endomarketing 2027 · Santer' : 'Calendário 2027 · Santer';
      requestAnimationFrame(() => scrollTo(0, scrollPos[r.mod] || 0));
    }
    rail.querySelectorAll('.rail-item[data-mod]').forEach(a => { if (a.dataset.mod === r.mod) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    sub.classList.toggle('on', r.mod === 'endo');
    const sk = r.parts[0] === 'mes' ? 'jornada' : (r.parts[0] || 'visao');
    sub.querySelectorAll('a').forEach(a => a.setAttribute('aria-current', String(r.mod === 'endo' && a.dataset.sub === sk)));
    requestAnimationFrame(moveInd);
    if (r.mod === 'endo') {
      try { await loadEndo(); } catch (e) { return; }
      if (window.Endo) window.Endo.route(r.parts, r.params);
    } else if (window.SanterCal && r.params.data) {
      window.SanterCal.openDate(r.params.data);
    }
  }
  addEventListener('hashchange', route);

  /* Navegação para fora do calendário a partir de links internos */
  window.SanterShell = { go: h => { if (location.hash === h) route(); else location.hash = h; }, current: () => current };

  applyTheme(store.get('santer:tema') || 'auto');
  setOpen(store.get('santer:menu') === '1');
  if (!location.hash) history.replaceState(null, '', '#/calendario');
  route();
  /* Pré-carrega o módulo quando o navegador estiver ocioso, sem disputar a primeira pintura */
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1500));
  idle(() => { if (current !== 'endo') { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = 'js/endo/nucleo.js'; document.head.appendChild(l); } }, { timeout: 4000 });
})();
