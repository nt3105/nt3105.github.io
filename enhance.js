'use strict';

(() => {
  const root = document.documentElement;
  if (root.classList.contains('from-intro')) {
    try { sessionStorage.removeItem('nt-from-intro'); } catch (error) {}
    requestAnimationFrame(() => root.classList.add('is-in'));
  }
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => root.dataset.fx === 'calm' || reduce.matches;
  let resetTilts = () => {};

  const panel = document.getElementById('style-panel');
  if (panel) {
    const group = document.createElement('section');
    group.className = 'fx-group';
    group.innerHTML = '<h4 class="fx-label">Chuyển động</h4><label class="fx-row glow-shortcut"><span>Nền, hạt sáng và parallax</span><input type="checkbox" id="fx-motion-toggle" aria-label="Bật hiệu ứng nền và parallax"><span class="glow-switch" aria-hidden="true"></span></label>';
    panel.append(group);
    const toggle = group.querySelector('input');
    let on = true;
    try { on = localStorage.getItem('ngan-tu-fx') !== 'calm'; } catch { /* Giữ mặc định. */ }
    toggle.checked = on;
    if (!on) root.dataset.fx = 'calm';
    toggle.addEventListener('change', () => {
      if (toggle.checked) delete root.dataset.fx;
      else root.dataset.fx = 'calm';
      try { localStorage.setItem('ngan-tu-fx', toggle.checked ? 'full' : 'calm'); } catch { /* Không bắt buộc phải lưu. */ }
      if (!calm()) startSparks();
      resetTilts();
    });
  }

  let tx = 0;
  let ty = 0;
  let px = 0;
  let py = 0;
  let sy = 0;
  let targetSy = 0;
  let frame = 0;
  function tick() {
    frame = 0;
    if (document.hidden || calm() || !fine.matches) {
      root.style.setProperty('--px', '0');
      root.style.setProperty('--py', '0');
      return;
    }
    px += (tx - px) * 0.22;
    py += (ty - py) * 0.22;
    sy += (targetSy - sy) * 0.18;
    root.style.setProperty('--px', px.toFixed(3));
    root.style.setProperty('--py', py.toFixed(3));
    root.style.setProperty('--scroll', sy.toFixed(1));
    if (Math.abs(tx - px) > 0.002 || Math.abs(ty - py) > 0.002 || Math.abs(targetSy - sy) > 0.2) {
      frame = requestAnimationFrame(tick);
    }
  }
  function queue() {
    if (!frame) frame = requestAnimationFrame(tick);
  }
  window.addEventListener('scroll', () => {
    targetSy = Math.min(window.scrollY, 2400) * 0.035;
    if (!calm()) queue();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queue(); });

  const canvas = document.getElementById('spark-field');
  let startSparks = () => {};
  if (canvas && canvas.getContext && !reduce.matches) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const dots = [];
    let width = 0;
    let height = 0;
    let running = false;
    let last = 0;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = innerWidth;
      height = innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      dots.length = 0;
      const count = fine.matches ? 16 : 0;
      for (let index = 0; index < count; index += 1) {
        dots.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.3 + 0.4,
          s: Math.random() * 0.2 + 0.04,
          a: Math.random() * 0.28 + 0.08
        });
      }
    }
    function draw(now) {
      if (document.hidden || calm()) { running = false; return; }
      const delta = Math.min(34, now - last);
      last = now;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#d5ecff';
      for (const dot of dots) {
        dot.y -= dot.s * delta * 0.06;
        if (dot.y < -4) { dot.y = height + 4; dot.x = Math.random() * width; }
        ctx.globalAlpha = dot.a;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    startSparks = () => {
      if (running || calm() || document.hidden || !fine.matches || dots.length === 0) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(draw);
    };
    resize();
    seed();
    startSparks();
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); seed(); }, 160);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) startSparks(); });
  }

  const tiltEvents = new AbortController();
  const listen = { passive: true, signal: tiltEvents.signal };
  const hitboxes = [...document.querySelectorAll('.tilt-hitbox')];
  let boxes = [];
  let boxesDirty = true;
  let active = null;
  let queued = null;
  let glowPoint = null;
  let tiltFrame = 0;
  let scrolling = false;
  let scrollTimer = 0;
  let orientFrame = 0;
  let orientOn = false;
  let gotOrient = false;
  let baseBeta = null;
  let baseGamma = null;
  let targetRx = 0;
  let targetRy = 0;
  let smoothRx = 0;
  let smoothRy = 0;
  let touchBox = null;
  const flat = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function glowVars(card, nx, ny) {
    const lx = ((nx + 1) * 50).toFixed(1) + '%';
    const ly = ((ny + 1) * 50).toFixed(1) + '%';
    card.style.setProperty('--lx', lx);
    card.style.setProperty('--ly', ly);
    card.style.setProperty('--pointer-x', lx);
    card.style.setProperty('--pointer-y', ly);
    card.style.setProperty('--layer-x', (nx * 6).toFixed(1) + 'px');
    card.style.setProperty('--layer-y', (ny * 6).toFixed(1) + 'px');
  }

  function writeTilt(card, rx, ry) {
    card.style.transition = 'none';
    card.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    card.classList.add('is-tilting');
  }

  function release(card) {
    if (!card) return;
    card.classList.remove('is-tilting');
    card.style.transition = 'transform 400ms cubic-bezier(.16, 1, .3, 1)';
    card.style.transform = flat;
    glowVars(card, 0, 0);
  }

  resetTilts = () => {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.classList.remove('is-tilting');
      card.style.transition = '';
      card.style.transform = '';
      glowVars(card, 0, 0);
    });
    active = null;
    queued = null;
    touchBox = null;
    targetRx = targetRy = smoothRx = smoothRy = 0;
  };

  function measureBoxes() {
    boxes = hitboxes.map(hit => {
      const rect = hit.getBoundingClientRect();
      return {
        hit,
        card: hit.querySelector('.tilt-card'),
        l: rect.left,
        t: rect.top,
        r: rect.right,
        b: rect.bottom,
        w: rect.width,
        h: rect.height
      };
    }).filter(box => box.card && box.w > 2 && box.h > 2);
    boxesDirty = false;
  }

  function hitAt(x, y) {
    if (boxesDirty) measureBoxes();
    let found = null;
    for (const box of boxes) {
      if (x >= box.l && x <= box.r && y >= box.t && y <= box.b) found = box;
    }
    return found;
  }

  function flushTilt() {
    tiltFrame = 0;
    if (glowPoint) {
      root.style.setProperty('--mouse-x', glowPoint.x.toFixed(1) + 'px');
      root.style.setProperty('--mouse-y', glowPoint.y.toFixed(1) + 'px');
      if (typeof window.applyPointerGlow === 'function') window.applyPointerGlow(glowPoint.x, glowPoint.y);
    }
    const job = queued;
    queued = null;
    if (!job || scrolling) return;
    const box = job.box;
    if (box.w < 2 || box.h < 2) return;
    const nx = clamp(((job.x - box.l) / box.w) * 2 - 1, -1, 1);
    const ny = clamp(((job.y - box.t) / box.h) * 2 - 1, -1, 1);
    writeTilt(box.card, -ny * 5, nx * 5);
    glowVars(box.card, nx, ny);
  }

  function visibleBoxes() {
    if (boxesDirty) measureBoxes();
    const viewBottom = window.innerHeight;
    return boxes.filter(box => box.b > 0 && box.t < viewBottom);
  }

  function stepOrient() {
    orientFrame = 0;
    if (document.hidden || calm() || scrolling) return;
    smoothRx += (targetRx - smoothRx) * 0.2;
    smoothRy += (targetRy - smoothRy) * 0.2;
    for (const box of visibleBoxes()) {
      if (touchBox && touchBox.card === box.card) continue;
      writeTilt(box.card, smoothRx, smoothRy);
      glowVars(box.card, smoothRy / 4, -smoothRx / 4);
    }
    if (Math.abs(targetRx - smoothRx) > 0.04 || Math.abs(targetRy - smoothRy) > 0.04) {
      orientFrame = requestAnimationFrame(stepOrient);
    }
  }

  function onOrient(event) {
    if (document.hidden || calm() || reduce.matches || event.beta == null || event.gamma == null) return;
    gotOrient = true;
    if (baseBeta == null) { baseBeta = event.beta; baseGamma = event.gamma; }
    const deltaBeta = clamp((event.beta - baseBeta) / 18, -1, 1);
    const deltaGamma = clamp((event.gamma - baseGamma) / 18, -1, 1);
    targetRx = deltaBeta * 4;
    targetRy = deltaGamma * 4;
    if (!orientFrame) orientFrame = requestAnimationFrame(stepOrient);
  }

  function startOrientation() {
    if (orientOn) return;
    orientOn = true;
    window.addEventListener('deviceorientation', onOrient, listen);
  }

  document.querySelectorAll('.tilt-card').forEach(card => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';
    card.classList.add('depth-card', 'spotlight-card');
    if (!card.querySelector(':scope > .depth-shine')) {
      const shine = document.createElement('span');
      shine.className = 'depth-shine';
      shine.setAttribute('aria-hidden', 'true');
      card.append(shine);
    }
    card.addEventListener('transitionend', event => {
      if (event.propertyName !== 'transform' || card.classList.contains('is-tilting')) return;
      card.style.transition = '';
      card.style.transform = '';
    });
  });

  window.addEventListener('scroll', () => {
    boxesDirty = true;
    scrolling = true;
    clearTimeout(scrollTimer);
    if (active) { release(active.card); active = null; queued = null; }
    scrollTimer = setTimeout(() => {
      scrolling = false;
      boxesDirty = true;
      measureBoxes();
      if (orientOn && !orientFrame) orientFrame = requestAnimationFrame(stepOrient);
    }, 160);
  }, listen);
  window.addEventListener('resize', () => { boxesDirty = true; }, listen);

  if (!reduce.matches && fine.matches) {
    window.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || calm()) return;
      const x = event.clientX;
      const y = event.clientY;
      tx = x / innerWidth - 0.5;
      ty = y / innerHeight - 0.5;
      queue();
      glowPoint = { x, y };
      const box = hitAt(x, y);
      if (!box) {
        if (active) release(active.card);
        active = null;
        queued = null;
      } else {
        if (active && active.card !== box.card) release(active.card);
        active = box;
        queued = { box, x, y };
      }
      if (!tiltFrame) tiltFrame = requestAnimationFrame(flushTilt);
    }, listen);
    window.addEventListener('pointerleave', () => {
      if (active) release(active.card);
      active = null;
    }, listen);
  } else if (!reduce.matches) {
    window.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || calm()) return;
      boxesDirty = true;
    }, listen);
  }

  window.addEventListener('blur', resetTilts);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) resetTilts();
  });
  reduce.addEventListener('change', resetTilts);
  window.addEventListener('pagehide', () => tiltEvents.abort(), { once: true });

  if (fine.matches && !reduce.matches) {
    document.querySelectorAll('.button, .explore-trigger, .closing-explore').forEach(button => {
      button.addEventListener('pointermove', event => {
        if (calm()) return;
        const rect = button.getBoundingClientRect();
        const mx = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
        const my = ((event.clientY - rect.top) / rect.height - 0.5) * 4;
        button.style.setProperty('--mx', Math.max(-3, Math.min(3, mx)).toFixed(2) + 'px');
        button.style.setProperty('--my', Math.max(-3, Math.min(3, my)).toFixed(2) + 'px');
      }, listen);
      button.addEventListener('pointerleave', () => {
        button.style.setProperty('--mx', '0px');
        button.style.setProperty('--my', '0px');
      }, listen);
    });
  }

})();
