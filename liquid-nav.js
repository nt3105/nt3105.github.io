/* Soft Liquid Menu. Existing click/scroll handlers continue to own navigation. */
(() => {
  'use strict';
  const nav = document.getElementById('nav-links');
  if (!nav || nav.dataset.liquidNav === '1') return;
  nav.dataset.liquidNav = '1';
  const links = Array.from(nav.querySelectorAll(':scope > a'));
  if (!links.length) return;
  const desktop = matchMedia('(min-width: 761px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduce.matches || document.documentElement.dataset.fx === 'calm';
  const animated = () => desktop.matches && fine.matches && !calm();
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('vi', { granularity: 'grapheme' }) : null;
  const pill = document.createElement('span');
  pill.className = 'lg-pill';
  pill.setAttribute('aria-hidden', 'true');
  nav.prepend(pill);
  const models = links.map(link => {
    const label = Array.from(link.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const word = document.createElement('span');
    word.className = 'lg-word';
    word.setAttribute('aria-hidden', 'true');
    const chars = segmenter ? Array.from(segmenter.segment(label), s => s.segment) : Array.from(label);
    const letters = chars.map((char, i) => {
      const el = document.createElement('span');
      el.className = 'lg-letter';
      el.textContent = char === ' ' ? '\u00a0' : char;
      word.append(el);
      return { el, i, y: 0, v: 0, delay: 0 };
    });
    link.setAttribute('aria-label', label);
    link.replaceChildren(word);
    if (link.classList.contains('nav-contact')) {
      const arrow = document.createElement('span');
      arrow.className = 'lg-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      link.append(arrow);
    }
    return { link, word, letters, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, tx: 0, ty: 0, tr: 0 };
  });
  let hovered = null, focused = null, frame = 0, last = 0, ready = false;
  const p = { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, vw: 0, vh: 0, tx: 0, ty: 0, tw: 0, th: 0 };
  function wake() {
    if (!frame && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); }
  }
  function sync() {
    const target = hovered || focused || links.find(a => a.classList.contains('active'));
    if (!desktop.matches || !target || !nav.offsetWidth) {
      pill.style.opacity = '0';
      ready = false;
      return;
    }
    p.tx = target.offsetLeft; p.ty = target.offsetTop;
    p.tw = target.offsetWidth; p.th = target.offsetHeight;
    if (!ready || !animated()) {
      p.x = p.tx; p.y = p.ty; p.w = p.tw; p.h = p.th;
      p.vx = p.vy = p.vw = p.vh = 0; ready = true;
    }
    pill.style.opacity = '1'; wake();
  }
  function bounce(model) {
    if (!animated()) return;
    model.letters.forEach(l => { l.v = -.85; l.delay = l.i * 1.35; }); wake();
  }
  models.forEach(m => {
    m.link.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch' || !desktop.matches) return;
      hovered = m.link; sync(); bounce(m);
    });
    m.link.addEventListener('pointermove', e => {
      if (!animated() || e.pointerType === 'touch') return;
      const b = m.link.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (e.clientX - b.left - b.width / 2) / (b.width / 2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - b.top - b.height / 2) / (b.height / 2)));
      m.tx = nx * 2.5; m.ty = ny * 2; m.tr = nx * 1.2; wake();
    });
    m.link.addEventListener('pointerleave', () => {
      if (hovered === m.link) hovered = null;
      m.tx = m.ty = m.tr = 0; sync(); wake();
    });
    m.link.addEventListener('focus', () => { focused = m.link; sync(); });
    m.link.addEventListener('blur', () => { focused = null; sync(); });
    // No preventDefault: anchor links, modified clicks and the mobile close handler stay native.
    m.link.addEventListener('click', () => bounce(m));
  });
  function reset() {
    hovered = focused = null;
    models.forEach(m => {
      m.x = m.y = m.r = m.vx = m.vy = m.vr = m.tx = m.ty = m.tr = 0;
      m.word.style.transform = '';
      m.letters.forEach(l => { l.y = l.v = l.delay = 0; l.el.style.transform = ''; });
    });
    ready = false; sync();
  }
  nav.addEventListener('pointercancel', reset);
  function spring(o, k, v, t, dt, stiffness, damping) {
    if (!animated()) { o[k] = o[t]; o[v] = 0; return false; }
    o[v] = (o[v] + (o[t] - o[k]) * stiffness * dt) * Math.pow(damping, dt);
    o[k] += o[v] * dt;
    if (Math.abs(o[t] - o[k]) + Math.abs(o[v]) < .025) { o[k] = o[t]; o[v] = 0; return false; }
    return true;
  }
  function tick(now) {
    const dt = (last ? Math.min((now - last) / 16.667, 1.5) : 1) * .75;
    last = now; let moving = false;
    [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['w', 'vw', 'tw'], ['h', 'vh', 'th']].forEach(a => {
      if (spring(p, ...a, dt, .09, .70)) moving = true;
    });
    pill.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0)`;
    pill.style.width = `${Math.max(0, p.w).toFixed(2)}px`;
    pill.style.height = `${Math.max(0, p.h).toFixed(2)}px`;
    models.forEach(m => {
      [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['r', 'vr', 'tr']].forEach(a => {
        if (spring(m, ...a, dt, .10, .70)) moving = true;
      });
      m.word.style.transform = animated() ? `translate3d(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px,0) rotate(${m.r.toFixed(2)}deg)` : '';
      m.letters.forEach(l => {
        if (!animated()) l.y = l.v = l.delay = 0;
        if (l.delay > 0) { l.delay -= dt; moving = true; return; }
        l.v = (l.v - l.y * .16 * dt) * Math.pow(.77, dt); l.y += l.v * dt;
        if (Math.abs(l.v) + Math.abs(l.y) > .025) moving = true; else l.y = l.v = 0;
        l.el.style.transform = l.y ? `translateY(${l.y.toFixed(2)}px)` : '';
      });
    });
    frame = moving && !document.hidden ? requestAnimationFrame(tick) : 0;
  }
  const activeObserver = new MutationObserver(sync);
  links.forEach(a => activeObserver.observe(a, { attributes: true, attributeFilter: ['class'] }));
  new MutationObserver(reset).observe(document.documentElement, { attributes: true, attributeFilter: ['data-fx'] });
  new ResizeObserver(sync).observe(nav);
  [desktop, fine, reduce].forEach(query => query.addEventListener('change', reset));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    else reset();
  });
  document.fonts?.ready.then(sync);
  window.addEventListener('pageshow', reset);
  sync();
})();
