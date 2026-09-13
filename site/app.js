/* MCP Boundary static website. No network calls, analytics, or persistent storage. */
(() => {
  'use strict';

  const identity = window.BOUNDARY_IDENTITY;
  if (!identity) return;

  const state = { case: 'host', prompt: 'inspect' };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);

  function glyph(label = '', size = 64) {
    const accessibility = label
      ? `role="img" aria-label="${escapeXml(label)}"`
      : 'aria-hidden="true"';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" ${accessibility}>${identity.mark.geometry}</svg>`;
  }

  function applyIdentity() {
    const names = { strongLine: 'strong-line', onNight: 'on-night', nightMuted: 'night-muted' };
    for (const [key, value] of Object.entries(identity.tokens.palette)) {
      if (typeof value === 'string' && value.startsWith('#')) {
        document.documentElement.style.setProperty(`--${names[key] || key}`, value);
      }
    }
    document.documentElement.dataset.mark = identity.mark.id;
    document.documentElement.dataset.palette = identity.tokens.palette.id;
    $$('.mark[data-mark]').forEach(element => { element.innerHTML = glyph(); });
  }

  function notice(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => toast.classList.remove('visible'), 2400);
  }

  function openDialog(dialog) {
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  }

  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    const rectangle = dialog.getBoundingClientRect();
    if (event.target === dialog && (
      event.clientX < rectangle.left || event.clientX > rectangle.right ||
      event.clientY < rectangle.top || event.clientY > rectangle.bottom
    )) dialog.close();
  }));

  async function copyText(value) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      notice('Copied.');
    } catch (_) {
      const field = $('#copy-fallback');
      if (!field) return notice('Clipboard is unavailable. Select the visible text to copy.');
      field.value = value;
      openDialog($('#copy-dialog'));
      field.focus();
      field.select();
    }
  }

  const cases = {
    host: {
      file: 'specimen/host-observation.txt',
      code: 'claim:  "Ready in the target host"\nsource: self-contained HTML resource\nlocal:  renders in Playwright\nhost:   no recorded observation',
      note: 'A browser surrogate exercises local behavior. It cannot record what a different host admitted or rejected.',
      status: 'NOT VERIFIED',
      title: 'A local render leaves the host question open.',
      body: 'The local rendering observation is useful. There is no host-side observation for this exact resource, so target-host compatibility remains unverified. That does not establish a host failure.',
      action: 'Exercise the exact resource in the named host and record its observed disposition.'
    },
    stdio: {
      file: 'specimen/transport-contract.txt',
      code: 'transport:   parent-owned stdio\nlisteners:   none\nhttp_routes: none\nsuggestion:  "Require CORS and Origin checks"',
      note: 'This specimen has no reachable HTTP surface. The parent process owns the pipes; stdout carries the protocol.',
      status: 'NOT APPLICABLE',
      title: 'An HTTP checklist has no boundary to protect here.',
      body: 'CORS and HTTP Origin checks do not apply to this stdio-only specimen. Keep the review on process ownership, framing, stdout purity and the capability actually exposed.',
      action: 'Reject the inapplicable requirement. Check the real stdio and tool boundaries without adding a web server.'
    },
    migration: {
      file: 'specimen/retirement-probe.txt',
      code: 'claim: "Legacy mutation route removed"\nnew_adapter:  enabled\nlegacy_route: still mounted\nprobe_effect_count: 1',
      note: 'The specimen explicitly claims retirement, not dual-version support. Its probe still reaches the legacy effect.',
      status: 'CONTRADICTED',
      title: 'The new path works. The retired path still executes.',
      body: 'A passing check on the new adapter does not establish removal of an old route. Here the legacy probe records an effect, contradicting the stated retirement claim.',
      action: 'Retire the old executable route and check its absence. Preserve compatibility only when the accepted contract requires it.'
    },
    clean: {
      file: 'specimen/input-boundary.txt',
      code: 'claim: "Invalid input cannot execute"\nmalformed_arguments: rejected\neffect_counter:      0\nvalid_control:       expected result',
      note: 'The negative probe and valid control exercise the stated input boundary. Other boundaries are outside this specimen.',
      status: 'VERIFIED IN FIXTURE',
      title: 'This boundary holds. Do not invent a defect.',
      body: 'The tested malformed input is rejected before execution and the valid control succeeds. That supports this fixture’s input-boundary claim; it is not a whole-system security verdict.',
      action: 'Keep the established result. Broaden verification only when another relevant claim or changed behavior needs it.'
    }
  };

  function selectCase(id, focus = false) {
    if (!cases[id] || !$('#case-panel')) return;
    state.case = id;
    const selected = cases[id];
    for (const key of ['file', 'code', 'note', 'status', 'title', 'body']) {
      $(`#case-${key}`).textContent = selected[key];
    }
    const action = $('#case-action');
    action.replaceChildren();
    const label = document.createElement('b');
    label.textContent = 'Next useful check';
    action.append(label, document.createElement('br'), document.createTextNode(selected.action));
    $$('.case-tab').forEach(button => {
      const chosen = button.dataset.case === id;
      button.setAttribute('aria-selected', String(chosen));
      button.tabIndex = chosen ? 0 : -1;
      if (chosen && focus) button.focus();
    });
    $('#case-panel').setAttribute('aria-labelledby', `tab-${id}`);
    $('#case-status').style.color = id === 'migration' ? '#AC413C' : id === 'clean' ? 'var(--accent)' : 'var(--muted)';
  }

  $$('.case-tab').forEach(button => {
    button.addEventListener('click', () => selectCase(button.dataset.case));
    button.addEventListener('keydown', event => {
      const keys = Object.keys(cases);
      const current = keys.indexOf(button.dataset.case);
      let target;
      if (event.key === 'ArrowRight') target = keys[(current + 1) % keys.length];
      if (event.key === 'ArrowLeft') target = keys[(current - 1 + keys.length) % keys.length];
      if (event.key === 'Home') target = keys[0];
      if (event.key === 'End') target = keys.at(-1);
      if (target) {
        event.preventDefault();
        selectCase(target, true);
      }
    });
  });

  $('#copy-case')?.addEventListener('click', () => {
    const selected = cases[state.case];
    copyText(`MCP Boundary / synthetic teaching example\n\n${selected.file}\n${selected.code}\n\n${selected.status}\n${selected.title}\n${selected.body}\n\nNext useful check: ${selected.action}\n\nThis is an authored specimen, not an executed audit or evaluation result.`);
  });

  const prompts = {
    inspect: 'Use $mcp-boundary to inspect this MCP implementation against its declared protocol, actual transport and intended deployment. Trace the relevant behavior. Report actionable findings, valid results and any material verification gaps. Do not edit the repository.',
    build: 'Use $mcp-boundary to implement the MCP capability described in this repository’s accepted specification. Reuse the existing domain core, select the appropriate protocol and transport, complete the requested behavior, and verify the boundaries it actually exposes. Do not deploy or publish.',
    migrate: 'Use $mcp-boundary to migrate this MCP implementation to the agreed protocol or SDK target. First verify the source and target contracts, then implement and test the change. Track required compatibility and retired behavior separately. Do not replace the migration with a report.',
    host: 'Use $mcp-boundary to investigate why this MCP App works locally but fails in its named host. Trace the exact resource, bridge, capabilities, CSP, authentication and route. Separate missing evidence from observed failure. Fix what is authorized and keep unavailable host checks explicit.'
  };

  $$('.prompt-tab').forEach(button => button.addEventListener('click', () => {
    state.prompt = button.dataset.prompt;
    $('#prompt-text').textContent = prompts[state.prompt];
    $$('.prompt-tab').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  $('#copy-prompt')?.addEventListener('click', () => copyText(prompts[state.prompt]));

  applyIdentity();
  selectCase('host');
})();
