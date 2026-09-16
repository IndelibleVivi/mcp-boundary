/* Authored, local interactions only. No fetch, accounts, analytics or runtime execution. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const one = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const parse = (id) => { const el = document.getElementById(id); return el ? JSON.parse(el.textContent) : null; };
  const ui = parse('ui-data');
  const identity = window.BOUNDARY_IDENTITY;

  function applyIdentity() {
    if (!identity) return;
    const tokenNames = { strongLine: 'strong-line', onNight: 'on-night', nightMuted: 'night-muted' };
    Object.entries(identity.tokens.palette).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        document.documentElement.style.setProperty(`--${tokenNames[key] || key}`, value);
      }
    });
    document.documentElement.dataset.mark = identity.mark.id;
    document.documentElement.dataset.palette = identity.tokens.palette.id;
    all('svg[data-mark]').forEach(mark => { mark.innerHTML = identity.mark.geometry; });
  }

  applyIdentity();
  const params = () => new URLSearchParams(location.search);
  function syncLanguage() {
    const link = one('.language');
    if (!link) return;
    const target = new URL(link.getAttribute('href'), document.baseURI);
    target.search = location.search;
    link.setAttribute('href', target.href);
  }
  function writeParams(changes) {
    const url = new URL(location.href);
    Object.entries(changes).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
    try { history.replaceState(null, '', url); } catch { /* file/sandbox history may be unavailable */ }
    syncLanguage();
  }
  syncLanguage();

  // Accessible small-screen navigation. Escape closes and returns focus.
  const menu = one('#menu-button');
  const nav = one('#primary-nav');
  function closeMenu(returnFocus = false) {
    nav?.classList.remove('open');
    menu?.setAttribute('aria-expanded', 'false');
    if (returnFocus) menu?.focus();
  }
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    nav.classList.toggle('open', expanded);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  const mobile = matchMedia('(max-width:800px)');
  mobile.addEventListener('change', () => { if (!mobile.matches) closeMenu(); });

  // Exactly two authored observations. This never executes a scan or an MCP call.
  const study = parse('study-data');
  function selectStage(key, write = true) {
    if (!study || !Object.hasOwn(study, key)) return;
    const state = study[key];
    one('#node-grid').dataset.state = key;
    for (let i = 0; i < 3; i++) {
      one(`#node-file-${i}`).textContent = state.files[i];
      one(`#node-detail-${i}`).textContent = state.details[i];
      one(`#node-status-${i}`).textContent = state.states[i];
    }
    // Only checked-in author copy is rendered as HTML; never URL or input content.
    one('#study-summary').innerHTML = state.summary;
    all('[data-stage]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stage === key)));
    if (write) writeParams({ stage: key === 'before' ? null : key });
  }
  all('[data-stage]').forEach(button => button.addEventListener('click', () => selectStage(button.dataset.stage)));
  if (study) selectStage(params().get('stage') === 'after' ? 'after' : 'before', false);

  const tabs = all('[data-workflow]');
  const tablist = one('.workflow-tabs');
  function setOrientation() { tablist?.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical'); }
  setOrientation();
  mobile.addEventListener('change', setOrientation);
  function selectWorkflow(key, {focus = false, write = true} = {}) {
    const selected = tabs.find(tab => tab.dataset.workflow === key);
    if (!selected) return;
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) selected.focus({ preventScroll: true });
    if (write) writeParams({ task: key === 'repair' ? null : key });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectWorkflow(tab.dataset.workflow));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectWorkflow(tabs[next].dataset.workflow, { focus: true });
    });
  });
  all('[data-select-workflow]').forEach(link => link.addEventListener('click', () => selectWorkflow(link.dataset.selectWorkflow)));
  if (tabs.length) {
    const requested = params().get('task');
    selectWorkflow(tabs.some(tab => tab.dataset.workflow === requested) ? requested : 'repair', { write: false });
  }

  // Clipboard permission failure is a normal state, not a false success toast.
  let toastTimer;
  function toast(text) {
    const el = one('#toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  let previousFocus = null;
  async function copyText(text, trigger) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      toast(ui.copied);
    } catch {
      const dialog = one('#copy-dialog');
      const field = one('#copy-fallback');
      previousFocus = trigger;
      field.value = text;
      if (!dialog.open) dialog.showModal();
      field.focus();
      field.select();
    }
  }
  all('[data-copy]').forEach(button => button.addEventListener('click', () => {
    const source = document.getElementById(button.dataset.copy);
    if (source) copyText(source.textContent.trim(), button);
  }));
  one('#close-dialog')?.addEventListener('click', () => one('#copy-dialog').close());
  one('#copy-dialog')?.addEventListener('close', () => { previousFocus?.focus(); });

  // Search only this small authored index; links remain ordinary repository URLs.
  const search = one('#library-search');
  const resources = all('[data-resource]');
  let surface = ['guide', 'lab'].includes(params().get('surface')) ? params().get('surface') : 'all';
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase().trim();
  function filterLibrary(write = true) {
    if (!search) return;
    const query = normalize(search.value);
    const terms = query.split(/\s+/).filter(Boolean);
    let count = 0;
    resources.forEach(resource => {
      const haystack = normalize(resource.dataset.search);
      const matches = (surface === 'all' || resource.dataset.surface === surface) && terms.every(term => haystack.includes(term));
      resource.hidden = !matches;
      if (matches) count++;
    });
    all('[data-resource-group]').forEach(group => { group.hidden = ![...group.querySelectorAll('[data-resource]')].some(resource => !resource.hidden); });
    all('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === surface)));
    one('#search-count').textContent = `${count} ${ui.countSuffix}`;
    one('#empty-state').hidden = count !== 0;
    if (write) writeParams({ surface: surface === 'all' ? null : surface, q: search.value.trim() || null });
  }
  if (search) {
    search.value = params().get('q') || '';
    filterLibrary(false);
    search.addEventListener('input', () => filterLibrary());
    all('[data-filter]').forEach(button => button.addEventListener('click', () => { surface = button.dataset.filter; filterLibrary(); }));
  }
})();
