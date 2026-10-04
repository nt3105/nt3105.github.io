'use strict';

(() => {
  const root = document.documentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => root.dataset.fx === 'calm' || reduce.matches;

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
    px += (tx - px) * 0.08;
    py += (ty - py) * 0.08;
    sy += (targetSy - sy) * 0.08;
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
  if (fine.matches && !reduce.matches) {
    window.addEventListener('pointermove', event => {
      if (calm()) return;
      tx = event.clientX / innerWidth - 0.5;
      ty = event.clientY / innerHeight - 0.5;
      queue();
    }, { passive: true });
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
      const count = fine.matches ? 18 : 8;
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
      if (running || calm() || document.hidden) return;
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

  if (fine.matches && !reduce.matches) {
    document.querySelectorAll('.button, .explore-trigger, .closing-explore').forEach(button => {
      let raf = 0;
      let mx = 0;
      let my = 0;
      let rx = 0;
      let ry = 0;
      function apply() {
        raf = 0;
        rx += (mx - rx) * 0.35;
        ry += (my - ry) * 0.35;
        button.style.setProperty('--mx', rx.toFixed(2) + 'px');
        button.style.setProperty('--my', ry.toFixed(2) + 'px');
        if (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) raf = requestAnimationFrame(apply);
      }
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        mx = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
        my = ((event.clientY - rect.top) / rect.height - 0.5) * 4;
        if (!raf) raf = requestAnimationFrame(apply);
      }, { passive: true });
      button.addEventListener('pointerleave', () => {
        mx = 0;
        my = 0;
        if (!raf) raf = requestAnimationFrame(apply);
      });
    });
  } else {
    document.querySelectorAll('.skill-card, .project-card, .life-card, .social-card, .button').forEach(card => {
      const press = () => card.classList.add('touch-press');
      const release = () => card.classList.remove('touch-press');
      card.addEventListener('pointerdown', press, { passive: true });
      card.addEventListener('pointerup', release, { passive: true });
      card.addEventListener('pointercancel', release, { passive: true });
      card.addEventListener('pointerleave', release, { passive: true });
    });
  }
})();
