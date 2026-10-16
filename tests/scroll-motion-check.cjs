/* Titanium motion acceptance checks. Start dev_server.py before running. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.NT_TEST_URL || 'http://127.0.0.1:8001';
const out = process.env.NT_TEST_OUTPUT || '/tmp/nt-scroll-qa';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = [], errors = [];
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); console.log('PASS', name); }
    catch (e) { results.push({ name, pass: false, error: e.stack }); console.log('FAIL', name, e.message); }
    finally { for (const context of browser.contexts()) await context.close(); }
  }
  async function page(options = {}, init) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', ...options });
    p.setDefaultTimeout(10000);
    p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(() => {
      sessionStorage.setItem('nt-motion-choice-v1', 'off');
      window.motionCalls = [];
      const original = Element.prototype.animate;
      Element.prototype.animate = function (frames, options) {
        window.motionCalls.push({ target: this, kind: this.dataset.scrollMotion || '', frames, duration: options?.duration, delay: options?.delay || 0, id: options?.id || '', time: performance.now() });
        return original.call(this, frames, options);
      };
    });
    if (init) await p.addInitScript(init);
    await p.goto(base + '/?intro=off');
    await p.evaluate(() => document.fonts.ready);
    return p;
  }
  async function jump(p, selector, offset = 180) {
    await p.evaluate(({ selector, offset }) => window.scrollTo({ top: document.querySelector(selector).getBoundingClientRect().top + scrollY - offset, behavior: 'instant' }), { selector, offset });
    await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  async function replaySkills(p) {
    await jump(p, '#contact'); await p.waitForTimeout(180);
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.evaluate(() => { window.motionCalls.length = 0; });
    await jump(p, '#skills');
    await p.waitForFunction(() => document.querySelector('#skills .nt-kinetic-layer'));
  }
  async function finish(p) {
    await p.waitForFunction(() => !document.querySelector('.nt-kinetic-layer') && !document.getAnimations().some(a => a.id.startsWith('nt-scroll-') && a.playState === 'running'));
  }
  await test('Kinetic graphemes: correct text/order, 720ms / 24ms, accessible name and selection preserved', async () => {
    const p = await page(); const h = p.locator('#skills h2');
    const before = await h.evaluate(e => ({ html: e.innerHTML, text: e.textContent, rendered: e.innerText, width: e.offsetWidth, height: e.offsetHeight }));
    await replaySkills(p);
    const during = await h.evaluate(e => {
      const layer = e.querySelector('.nt-kinetic-layer');
      const chars = [...layer.children].map(c => c.dataset.glyph).join('');
      const glyphs = window.motionCalls.filter(c => c.id === 'glyph' && e.contains(c.target));
      const range = document.createRange(); range.selectNodeContents(e); const s = getSelection(); s.removeAllRanges(); s.addRange(range);
      return { text: e.textContent, chars, selected: s.toString(), width: e.offsetWidth, height: e.offsetHeight,
        ariaHidden: layer.getAttribute('aria-hidden'), timings: glyphs.map(c => ({ delay: c.delay, duration: c.duration })) };
    });
    assert.equal(during.text, before.text); assert.equal(during.selected, before.rendered);
    assert.equal(during.chars, before.text.replace(/\s/g, '')); assert.equal(during.ariaHidden, 'true');
    assert.equal(during.width, before.width); assert.equal(during.height, before.height);
    during.timings.forEach((t, i) => { assert.equal(t.duration, 720); assert.equal(t.delay, i * 24); });
    assert.match(await h.ariaSnapshot(), /Kỹ năng & công cụ/);
    await finish(p); assert.equal(await h.innerHTML(), before.html);
  });
  await test('Cards stagger by 100ms; existing skill data/widths preserved; light line lasts 1300ms', async () => {
    const p = await page();
    const levels = await p.locator('.skill-card').evaluateAll(es => es.map(e => e.style.getPropertyValue('--level')));
    await replaySkills(p);
    const r = await p.evaluate(() => ({ cards: motionCalls.filter(c => c.kind === 'card' && c.target.closest('.skills-grid')).map(c => ({ delay: c.delay, duration: c.duration, y: c.frames[0].transform })),
      lines: motionCalls.filter(c => c.kind === 'line').map(c => c.duration), bars: motionCalls.filter(c => c.id === 'progress').map(c => c.frames) }));
    assert.ok(r.cards.length >= 3); r.cards.forEach((c, i) => { assert.equal(c.delay, i * 100); assert.equal(c.duration, 740); assert.match(c.y, /28px/); });
    assert.ok(r.lines.includes(1300)); assert.ok(r.bars.length >= 3);
    await finish(p);
    assert.deepEqual(await p.locator('.skill-card').evaluateAll(es => es.map(e => e.style.getPropertyValue('--level'))), levels);
    assert.ok(await p.locator('.progress>span').evaluateAll(es => es.every(e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).transform === 'none')));
  });
  for (const width of [375, 768, 1440]) await test(`${width}px: 10 up/down cycles, stable layout, replay and no horizontal overflow`, async () => {
    const p = await page({ viewport: { width, height: 900 }, isMobile: width === 375, hasTouch: width === 375 });
    // Resolve lazy media before comparing stable heading layout.
    for (const selector of ['#skills', '#projects', '#memories', '#contact', '#home']) { await jump(p, selector); await p.waitForTimeout(100); }
    const headings = await p.locator('main h1,main h2').evaluateAll(es => es.map(e => ({ text: e.textContent, width: e.offsetWidth, height: e.offsetHeight })));
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    for (let i = 0; i < 10; i++) {
      for (const selector of ['#skills', '#memories', '#contact', '#memories', '#skills', '#home']) {
        await jump(p, selector); await p.waitForTimeout(75);
        assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
    }
    await finish(p);
    assert.deepEqual(await p.locator('main h1,main h2').evaluateAll(es => es.map(e => ({ text: e.textContent, width: e.offsetWidth, height: e.offsetHeight }))), headings);
    assert.ok(await p.evaluate(() => motionCalls.filter(c => c.kind === 'image' && c.target.closest('#memories')).length >= 10));
    assert.equal(await p.locator('.nt-kinetic-source,.nt-kinetic-layer').count(), 0);
    assert.equal(await p.locator('.page-progress').count(), 1);
    await p.screenshot({ path: `${out}/scroll-${width}.png` });
  });
  await test('Slow boundary oscillation does not retrigger; full exit rearms in either direction', async () => {
    const p = await page(); await replaySkills(p); await finish(p);
    const count = () => p.evaluate(() => motionCalls.filter(c => c.id === 'glyph' && c.target.dataset.glyph === 'K').length);
    const before = await count();
    const y = await p.locator('#skills h2').evaluate(e => e.getBoundingClientRect().bottom + scrollY);
    for (let i = 0; i < 12; i++) { await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y + (i % 2 ? 4 : -4)); await p.waitForTimeout(45); }
    assert.equal(await count(), before);
    await jump(p, '#contact'); await p.waitForTimeout(200); await jump(p, '#skills'); await p.waitForTimeout(200);
    assert.ok(await count() > before);
  });
  await test('Reduced motion and in-site calm mode stop running animation and restore original text', async () => {
    const p = await page(); assert.equal(await p.evaluate(() => motionCalls.length), 0);
    await replaySkills(p); await p.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await p.locator('.nt-kinetic-layer,.nt-kinetic-source').count(), 0);
    assert.equal(await p.evaluate(() => document.getAnimations().filter(a => a.id.startsWith('nt-scroll-')).length), 0);
    await replaySkills(p); await p.evaluate(() => document.documentElement.dataset.fx = 'calm');
    await p.waitForFunction(() => !document.querySelector('.nt-kinetic-layer'));
    await p.evaluate(() => motionCalls.length = 0); await jump(p, '#contact'); await jump(p, '#skills');
    assert.equal(await p.evaluate(() => motionCalls.length), 0);
  });
  await test('Resize, font completion and tab hiding cancel stale glyph coordinates safely', async () => {
    const p = await page();
    for (const action of ['resize', 'font', 'hidden']) {
      await replaySkills(p);
      if (action === 'resize') await p.setViewportSize({ width: 768, height: 900 });
      if (action === 'font') await p.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')));
      if (action === 'hidden') await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await p.waitForFunction(() => !document.querySelector('.nt-kinetic-layer'));
      assert.equal(await p.locator('.nt-kinetic-source').count(), 0);
    }
  });
  await test('Fail-open: disabled JS, blocked main script, unavailable IO and animation exception leave content visible', async () => {
    for (const mode of ['no-js', 'blocked', 'no-io', 'throw']) {
      let p;
      if (mode === 'blocked') {
        p = await browser.newPage(); await p.route('**/script.js*', r => r.abort()); await p.goto(base + '/?intro=off');
      } else p = await page(mode === 'no-js' ? { javaScriptEnabled: false } : mode === 'throw' ? { reducedMotion: 'no-preference' } : {}, mode === 'no-io' ? () => { delete window.IntersectionObserver; } : mode === 'throw' ? () => { Element.prototype.animate = () => { throw new Error('Injected animation failure'); }; } : undefined);
      await p.waitForTimeout(200);
      await jump(p, '#skills');
      assert.ok(await p.locator('#skills h2').evaluate(e => getComputedStyle(e).opacity === '1' && e.textContent.includes('Kỹ năng')));
      assert.ok(await p.locator('.skill-card').first().evaluate(e => getComputedStyle(e).opacity === '1'));
      assert.equal(await p.locator('.nt-kinetic-layer').count(), 0);
      await p.close();
    }
  });
  await test('No uncaught JavaScript errors or leftover legacy scroll engine', async () => {
    const p = await page();
    assert.deepEqual(errors, []);
    assert.equal(await p.locator('.scroll-text,.js-reveal,.nt-reveal-ready').count(), 0);
    assert.equal(await p.evaluate(() => typeof window.ntScrollUpBound), 'undefined');
  });
  await browser.close();
  fs.writeFileSync(out + '/scroll-motion-results.json', JSON.stringify({ date: new Date().toISOString(), results, errors }, null, 2));
  console.log(`${results.filter(r => r.pass).length}/${results.length} passed`);
  if (results.some(r => !r.pass)) process.exitCode = 1;
})();
