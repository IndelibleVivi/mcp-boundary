async (page) => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  const currentUrl = page.url();
  const base = currentUrl.slice(0, currentUrl.lastIndexOf('/') + 1);
  const results = [];
  const record = (check, detail = '') => results.push({ check, detail });

  await page.goto(`${base}index.html?mark=unapproved&palette=unapproved`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('h1').innerText() === 'Make your MCP\nhold up.', 'hero heading changed');
  assert(await page.locator('html').getAttribute('data-mark') === 'offset', 'approved mark changed');
  assert(await page.locator('html').getAttribute('data-palette') === 'porcelain', 'approved palette changed');
  assert(await page.locator('[data-open-studio]').count() === 0, 'appearance control returned');
  assert(await page.locator('a[href*="identity"]').count() === 0, 'identity-study link returned');
  record('fixed approved identity', 'Legacy query parameters cannot alter Offset + Porcelain.');

  const cases = {
    stdio: 'NOT APPLICABLE',
    migration: 'CONTRADICTED',
    clean: 'VERIFIED IN FIXTURE',
    host: 'NOT VERIFIED',
  };
  for (const [id, expected] of Object.entries(cases)) {
    await page.locator(`[data-case="${id}"]`).click();
    assert(await page.locator('#case-status').innerText() === expected, `case ${id}`);
  }
  record('four teaching cases', 'Authored UI examples remain distinct from executed audits.');

  await page.locator('#tab-host').focus();
  await page.keyboard.press('ArrowRight');
  assert(await page.locator('#tab-stdio').getAttribute('aria-selected') === 'true', 'keyboard tab selection');
  assert(await page.locator('#tab-stdio').evaluate(element => element === document.activeElement), 'keyboard tab focus');
  await page.keyboard.press('End');
  assert(await page.locator('#tab-clean').getAttribute('aria-selected') === 'true', 'End key selection');
  record('keyboard tabs');

  for (const id of ['inspect', 'build', 'migrate', 'host']) {
    await page.locator(`[data-prompt="${id}"]`).click();
    assert((await page.locator('#prompt-text').innerText()).includes('$mcp-boundary'), `prompt ${id}`);
  }
  record('four workflow prompts');

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.reject(new Error('denied')) },
    configurable: true,
  }));
  await page.locator('#copy-prompt').click();
  assert(await page.locator('#copy-dialog').evaluate(element => element.open), 'clipboard fallback dialog');
  assert((await page.locator('#copy-fallback').inputValue()).includes('$mcp-boundary'), 'clipboard fallback value');
  await page.keyboard.press('Escape');
  record('clipboard-denied fallback');

  for (const [width, height] of [[320, 900], [375, 900], [390, 844], [768, 1024], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}index.html`);
    await page.waitForLoadState('networkidle');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
  }
  record('responsive widths', '320, 375, 390, 768, and 1440 pixels have no document overflow.');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}index.html`);
  await page.screenshot({ path: 'previews/home-desktop.png', fullPage: true });
  await page.screenshot({ path: 'previews/home-first-screen.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}index.html`);
  await page.screenshot({ path: 'previews/home-mobile.png', fullPage: true });
  await page.screenshot({ path: 'previews/home-mobile-first.png' });
  record('current screenshots');

  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  assert(resources.every(url => url.startsWith(base)), `external resource request: ${resources.join(', ')}`);
  record('no external runtime requests');

  const browser = page.context().browser();
  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${base}index.html`);
  assert(await reducedPage.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior) === 'auto', 'reduced motion');
  await reducedContext.close();
  record('reduced-motion style');

  const noJavaScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJavaScriptPage = await noJavaScriptContext.newPage();
  await noJavaScriptPage.goto(`${base}index.html`);
  assert(await noJavaScriptPage.locator('h1').isVisible(), 'no-JavaScript heading');
  assert((await noJavaScriptPage.locator('#case-title').innerText()).toLowerCase().includes('local render'), 'no-JavaScript content');
  await noJavaScriptContext.close();
  record('readable without JavaScript');

  const standaloneUrl = `${base.replace(/site\/$/, '')}mcp-boundary-demo.html`;
  await page.goto(standaloneUrl);
  await page.locator('[data-case="clean"]').click();
  assert(await page.locator('#case-status').innerText() === 'VERIFIED IN FIXTURE', 'standalone interaction');
  assert(await page.locator('html').getAttribute('data-mark') === 'offset', 'standalone mark');
  record('standalone interactions', 'The self-contained file is served for browser execution; static checks establish its inlining contract.');

  return { passed: results.length, checks: results };
}
