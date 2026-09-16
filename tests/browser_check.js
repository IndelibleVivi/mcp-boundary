async (page) => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  const currentUrl = page.url();
  const siteMarker = '/site/';
  const siteOffset = currentUrl.indexOf(siteMarker);
  const servedRoot = siteOffset >= 0
    ? currentUrl.slice(0, siteOffset + 1)
    : currentUrl.slice(0, currentUrl.lastIndexOf('/') + 1);
  const root = `${servedRoot}site/`;
  const results = [];
  const record = (check, detail = '') => results.push({ check, detail });
  const pageErrors = [];
  const consoleErrors = [];
  const requests = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', request => requests.push(request.url()));

  const routes = [
    ['index.html', 'MCP engineering.\nOn the real path.'],
    ['library.html', 'The engineering\nbehind the skill.'],
    ['zh/index.html', '把 MCP 工程，\n做到真实路径上。'],
    ['zh/library.html', '技能背后的\n工程方法。'],
  ];
  for (const [route, heading] of routes) {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`${root}${route}?mark=unapproved&palette=unapproved`);
    await page.waitForLoadState('networkidle');
    assert(await page.locator('h1').innerText() === heading, `${route}: heading changed`);
    assert(await page.locator('html').getAttribute('data-mark') === 'offset', `${route}: approved mark changed`);
    assert(await page.locator('html').getAttribute('data-palette') === 'porcelain', `${route}: approved palette changed`);
    assert(await page.locator('[data-open-studio]').count() === 0, `${route}: appearance control returned`);
    for (const [width, height] of [[320, 900], [390, 844], [768, 1024], [1440, 1100]]) {
      await page.setViewportSize({ width, height });
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route}: overflow at ${width}`,
      );
    }
  }
  record('four routes and fixed identity', 'English/Chinese home and library routes render at 320–1440px without document overflow.');

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${root}index.html?task=migrate&stage=after`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('#task-migrate').getAttribute('aria-selected') === 'true', 'task deep link');
  assert(await page.locator('#panel-migrate').isVisible(), 'task deep-link panel');
  assert(await page.locator('#node-grid').getAttribute('data-state') === 'after', 'stage deep link');
  const languageHref = await page.locator('.language').getAttribute('href');
  assert(languageHref.includes('task=migrate') && languageHref.includes('stage=after'), 'language query preservation');
  record('deep links and language handoff', '?task and ?stage initialize the UI and survive the language switch.');

  for (const id of ['build', 'repair', 'migrate', 'inspect', 'verify']) {
    await page.locator(`[data-workflow="${id}"]`).click();
    assert(await page.locator(`#panel-${id}`).isVisible(), `workflow ${id}`);
    assert(await page.locator('[role="tabpanel"]:visible').count() === 1, `workflow ${id}: visible panel count`);
  }
  await page.locator('#task-verify').focus();
  await page.keyboard.press('Home');
  assert(await page.locator('#task-build').getAttribute('aria-selected') === 'true', 'workflow Home key');
  await page.keyboard.press('ArrowRight');
  assert(await page.locator('#task-repair').getAttribute('aria-selected') === 'true', 'workflow arrow key');
  await page.keyboard.press('End');
  assert(await page.locator('#task-verify').getAttribute('aria-selected') === 'true', 'workflow End key');
  record('five workflow tabs', 'Click and roving-keyboard selection keep one visible panel.');

  await page.locator('[data-stage="before"]').click();
  assert(await page.locator('#node-grid').getAttribute('data-state') === 'before', 'before specimen state');
  await page.locator('[data-stage="after"]').click();
  assert(await page.locator('#node-grid').getAttribute('data-state') === 'after', 'after specimen state');
  assert((await page.locator('#node-detail-2').innerText()).includes('revision B'), 'after specimen copy');
  assert(await page.locator('.status-open').isVisible(), 'named-host limit remains visible');
  record('authored specimen transition', 'Before/after changes the local teaching state without removing the named-host limit.');

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async text => { window.__copied = text; } },
    configurable: true,
  }));
  await page.locator('[data-copy="prompt-verify"]').click();
  assert(
    await page.evaluate(() => window.__copied) === (await page.locator('#prompt-verify').innerText()).trim(),
    'clipboard success value',
  );
  assert((await page.locator('#toast').getAttribute('class')).includes('show'), 'clipboard success toast');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async () => { throw new Error('denied'); } },
    configurable: true,
  }));
  await page.locator('[data-copy="install-command"]').click();
  assert(await page.locator('#copy-dialog').evaluate(element => element.open), 'clipboard fallback dialog');
  assert(
    await page.locator('#copy-fallback').inputValue() === (await page.locator('#install-command').innerText()).trim(),
    'clipboard fallback value',
  );
  await page.keyboard.press('Escape');
  assert(await page.locator('[data-copy="install-command"]').evaluate(element => element === document.activeElement), 'fallback focus return');
  record('clipboard success and denial', 'The selected prompt copies exactly; denial exposes the same text and restores focus.');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menu-button').click();
  assert(await page.locator('#primary-nav').isVisible(), 'mobile menu opens');
  await page.keyboard.press('Escape');
  assert(await page.locator('#menu-button').getAttribute('aria-expanded') === 'false', 'mobile menu closes');
  assert(await page.locator('#menu-button').evaluate(element => element === document.activeElement), 'mobile menu focus return');
  record('mobile navigation', 'Menu opens, closes with Escape, and returns focus.');

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${root}library.html?surface=lab&q=loopback`);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('[data-filter="lab"]').getAttribute('aria-pressed') === 'true', 'library surface deep link');
  assert(await page.locator('#library-search').inputValue() === 'loopback', 'library query deep link');
  assert(await page.locator('[data-resource]:visible').count() === 1, 'library filtered result count');
  const libraryLanguageHref = await page.locator('.language').getAttribute('href');
  assert(libraryLanguageHref.includes('surface=lab') && libraryLanguageHref.includes('q=loopback'), 'library language query preservation');
  await page.locator('#library-search').fill('no-such-topic-zzzz');
  assert(await page.locator('#empty-state').isVisible(), 'library empty state');
  await page.locator('#library-search').fill('');
  await page.locator('[data-filter="all"]').click();
  await page.locator('#library-search').fill('控制');
  assert(await page.locator('[data-resource]:visible').count() > 0, 'multilingual library search');
  await page.locator('#library-search').fill('');
  assert(await page.locator('[data-resource]:visible').count() === 10, 'library reset');
  record('library search and filters', 'Query deep links, bilingual search, empty state, reset, and language handoff work.');

  const browser = page.context().browser();
  const noJavaScriptContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJavaScriptPage = await noJavaScriptContext.newPage();
  await noJavaScriptPage.goto(`${root}zh/index.html`);
  assert(await noJavaScriptPage.locator('#hero-title').isVisible(), 'no-JavaScript heading');
  assert(await noJavaScriptPage.locator('#install-command').isVisible(), 'no-JavaScript install');
  assert(await noJavaScriptPage.locator('[role="tabpanel"]:visible').count() === 5, 'no-JavaScript workflows');
  assert(await noJavaScriptPage.locator('#primary-nav').isVisible(), 'no-JavaScript navigation');
  assert(await noJavaScriptPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no-JavaScript overflow');
  await noJavaScriptContext.close();
  record('readable without JavaScript', 'Chinese navigation, all workflows, and installation remain readable.');

  const reducedContext = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${root}index.html`);
  assert(await reducedPage.locator('html').evaluate(element => getComputedStyle(element).scrollBehavior) === 'auto', 'reduced motion scroll');
  assert(await reducedPage.locator('.cta').first().evaluate(element => getComputedStyle(element).transitionDuration) === '0s', 'reduced motion transition');
  await reducedContext.close();
  record('reduced-motion style');

  const standaloneUrl = `${root.replace(/site\/$/, '')}mcp-boundary-demo.html?task=verify&stage=after`;
  await page.goto(standaloneUrl);
  await page.waitForLoadState('networkidle');
  assert(await page.locator('#task-verify').getAttribute('aria-selected') === 'true', 'standalone task deep link');
  assert(await page.locator('#node-grid').getAttribute('data-state') === 'after', 'standalone stage deep link');
  assert(await page.locator('html').getAttribute('data-mark') === 'offset', 'standalone mark');
  record('portable standalone interactions', 'Inlined CSS, scripts, favicon, and social image retain the homepage interaction model.');

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${root}index.html`);
  await page.screenshot({ path: 'previews/home-desktop.png', fullPage: true });
  await page.screenshot({ path: 'previews/home-first-screen.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${root}index.html`);
  await page.screenshot({ path: 'previews/home-mobile.png', fullPage: true });
  await page.screenshot({ path: 'previews/home-mobile-first.png' });
  record('current screenshots', 'Homepage desktop/mobile full-page and reference-viewport captures refreshed.');

  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(' | ')}`);
  const unexpectedRequests = requests.filter(url => !url.startsWith(root) && !url.startsWith(servedRoot));
  assert(unexpectedRequests.length === 0, `external request: ${unexpectedRequests.join(', ')}`);
  record('runtime errors and requests', 'No page/console errors or external runtime requests were observed.');

  return { passed: results.length, checks: results };
}
