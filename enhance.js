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
    if (document.hidden || calm()) return;
    let beta = event.beta;
    let gamma = event.gamma;
    if (beta == null || gamma == null) return;
    const angle = (screen.orientation && screen.orientation.angle) || Number(window.orientation) || 0;
    if (angle === 90) {
      const swap = gamma;
      gamma = beta;
      beta = -swap;
    } else if (angle === -90 || angle === 270) {
      const swap = gamma;
      gamma = -beta;
      beta = swap;
    }
    gotOrient = true;
    targetRy = clamp(gamma * 0.55, -14, 14);
    targetRx = clamp((beta - 45) * 0.35, -10, 10);
    if (!orientFrame) orientFrame = requestAnimationFrame(stepOrient);
  }

  function onMotion(event) {
    if (gotOrient || document.hidden || calm()) return;
    const g = event.accelerationIncludingGravity;
    if (!g) return;
    const gx = clamp((g.x || 0) / 9.8, -1, 1);
    const gy = clamp(-(g.y || 0) / 9.8, -1, 1);
    onOrient({
      gamma: Math.asin(gx) * 180 / Math.PI,
      beta: Math.asin(gy) * 180 / Math.PI
    });
    gotOrient = false;
  }

  function startOrientation() {
    if (orientOn) return;
    orientOn = true;
    window.addEventListener('deviceorientation', onOrient, listen);
    window.addEventListener('deviceorientationabsolute', onOrient, listen);
    window.addEventListener('devicemotion', onMotion, listen);
  }

  // One notification per document, including the DOMParser intro handoff.
  function bootPhoneTilt() {
    if (window.ntMotionNoticeBooted || !document.getElementById('main')) return;
    window.ntMotionNoticeBooted = true;
    const key = 'nt-motion-choice-v1';
    const remember = value => { try { sessionStorage.setItem(key, value); } catch {} };
    let saved;
    try { saved = sessionStorage.getItem(key); } catch {}
    const ua = navigator.userAgent || '';
    const platform = navigator.userAgentData?.platform || navigator.platform || '';
    const device = /Android/i.test(ua + platform) ? 'Android'
      : /iPhone|iPad|iPod/i.test(ua) || (/Mac/i.test(platform) && navigator.maxTouchPoints > 1) ? 'iOS'
      : /Mobi|Tablet/i.test(ua) ? 'Điện thoại' : 'PC';
    const desktop = device === 'PC';
    const orientationAPI = window.DeviceOrientationEvent;
    const motionAPI = window.DeviceMotionEvent;
    const supported = window.isSecureContext && Boolean(orientationAPI || motionAPI);
    const asks = [orientationAPI, motionAPI].filter(api => typeof api?.requestPermission === 'function');
    const chose = () => window.dispatchEvent(new Event('nt-motion-choice'));
    if (saved) {
      // Adding listeners never requests permission. The browser retains control.
      if (saved === 'enabled' && !desktop && supported) startOrientation();
      chose();
      return;
    }

    const note = document.createElement('section');
    note.id = 'nt-motion-notice';
    note.className = 'nt-motion-notice';
    note.dataset.device = desktop ? 'pc' : 'mobile';
    note.setAttribute('aria-label', 'Khám phá hiệu ứng 3D');
    note.innerHTML = `
      <div class="nt-motion-glass">
        <div class="nt-motion-top"><span class="nt-motion-brand"><i></i> NGÂN TÚ DEV</span><span class="nt-motion-device">THIẾT BỊ · ${device}</span></div>
        <div class="nt-motion-content">
          <div class="nt-motion-art" aria-hidden="true">${desktop
            ? '<div class="nt-motion-monitor"><i></i><i></i><i></i></div><svg class="nt-motion-cursor" viewBox="0 0 64 78"><path d="M9 6L55 42 35 45 26 65Z" fill="#d4f4ff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M30 46L42 67" stroke="#bdb5f9" stroke-width="8" stroke-linecap="round"/></svg>'
            : '<div class="nt-motion-phone"><div class="nt-motion-screen"><b>&lt;/&gt;</b></div></div>'}</div>
          <div class="nt-motion-copy"><h2>${desktop ? 'Khám phá chiều sâu 3D' : 'Khám phá chuyển động 3D'}</h2><p>${desktop
            ? 'Di chuyển chuột để cảm nhận ánh sáng và hiệu ứng 3D theo từng chuyển động.'
            : `Nghiêng ${device === 'iOS' ? 'thiết bị iOS' : device === 'Android' ? 'điện thoại Android' : 'điện thoại'} để cảm nhận hiệu ứng tương tác sống động.`}</p></div>
        </div>
        <div class="nt-motion-actions"><button type="button" class="nt-motion-enable">${desktop ? 'Khám phá ngay' : 'Bật hiệu ứng'}</button><button type="button" class="nt-motion-later">Để sau</button></div>
        <p class="nt-motion-status" role="status" aria-live="polite" aria-atomic="true"></p>
      </div>`;
    const title = note.querySelector('h2');
    const copy = note.querySelector('.nt-motion-copy p');
    const status = note.querySelector('.nt-motion-status');
    const enable = note.querySelector('.nt-motion-enable');
    const later = note.querySelector('.nt-motion-later');
    const glass = note.querySelector('.nt-motion-glass');
    const header = document.getElementById('header');
    const menu = document.querySelector('.menu-toggle');
    const events = new AbortController();
    const options = { passive: true, signal: events.signal };
    let phase = 'shown', sensorTimer = 0, finishTimer = 0, paintFrame = 0;
    let stopProbe = () => {}, decision = '', light = { x: 0, y: 0 };
    const place = () => {
      const bottom = header?.getBoundingClientRect().bottom || 64;
      note.style.setProperty('--nt-motion-top', Math.max(12, bottom + 12) + 'px');
    };
    const syncMenu = () => {
      const open = menu?.getAttribute('aria-expanded') === 'true' || header?.classList.contains('menu-open');
      note.classList.toggle('is-obscured', Boolean(open));
      note.inert = Boolean(open);
      note.setAttribute('aria-hidden', String(Boolean(open)));
    };
    const observer = new MutationObserver(syncMenu);
    if (menu) observer.observe(menu, { attributes: true, attributeFilter: ['aria-expanded'] });
    if (header) observer.observe(header, { attributes: true, attributeFilter: ['class'] });
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    if (header) resize?.observe(header);
    window.addEventListener('resize', place, options);
    window.visualViewport?.addEventListener('resize', place, options);
    const close = choice => {
      if (phase === 'closed') return;
      if (choice) remember(decision || choice);
      chose();
      phase = 'closed';
      clearTimeout(sensorTimer); clearTimeout(finishTimer); stopProbe();
      cancelAnimationFrame(paintFrame);
      observer.disconnect(); resize?.disconnect(); events.abort();
      if (note.contains(document.activeElement)) {
        // Move keyboard focus to an existing page control before removing the card.
        const target = menu && getComputedStyle(menu).display !== 'none' ? menu : header?.querySelector('a');
        target?.focus({ preventScroll: true });
      }
      note.inert = true;
      note.setAttribute('aria-hidden', 'true');
      note.classList.remove('is-in');
      setTimeout(() => note.remove(), reduce.matches ? 0 : 360);
    };
    const fail = denied => {
      if (phase === 'closed') return;
      phase = 'unavailable'; decision = denied ? 'denied' : 'no-data'; remember(decision);
      clearTimeout(sensorTimer); stopProbe();
      title.textContent = denied ? 'Chưa được phép dùng cảm biến' : 'Chưa nhận được chuyển động';
      copy.textContent = denied
        ? 'Bạn vẫn có thể xem trang bình thường. Kiểm tra quyền chuyển động trong trình duyệt khi muốn bật lại.'
        : 'Thiết bị hoặc trình duyệt chưa gửi dữ liệu. Nếu đang dùng Facebook, hãy mở trang bằng Safari hoặc Chrome.';
      status.textContent = 'Không tự hỏi lại trong phiên này.';
      enable.hidden = true; later.textContent = 'Đã hiểu';
    };
    const paint = () => {
      paintFrame = 0;
      if (calm() || document.hidden || note.inert) return;
      glass.style.setProperty('--nt-light-x', light.x.toFixed(1) + 'px');
      glass.style.setProperty('--nt-light-y', light.y.toFixed(1) + 'px');
    };
    const reflect = (x, y) => {
      light = { x, y };
      if (!paintFrame) paintFrame = requestAnimationFrame(paint);
    };
    note.addEventListener('pointermove', event => {
      if (!fine.matches || event.pointerType === 'touch' || calm()) return;
      const rect = note.getBoundingClientRect();
      reflect((event.clientX - rect.left - rect.width / 2) * .2, (event.clientY - rect.top - rect.height / 2) * .2);
    }, options);
    note.addEventListener('pointerleave', () => reflect(0, 0), options);
    const waitForSensor = () => {
      if (phase === 'closed') return;
      phase = 'waiting';
      enable.disabled = true; enable.textContent = 'Đang kiểm tra…';
      status.textContent = 'Nghiêng nhẹ máy để thử cảm biến.';
      const receive = (beta, gamma) => {
        if (!Number.isFinite(beta) || !Number.isFinite(gamma) || document.hidden) return;
        if (phase === 'waiting') {
          clearTimeout(sensorTimer);
          phase = 'active'; decision = 'enabled'; remember(decision);
          startOrientation();
          title.textContent = 'Hiệu ứng đã bật';
          status.textContent = 'Đã nhận được dữ liệu chuyển động.';
          enable.hidden = true; later.textContent = 'Đã hiểu';
          finishTimer = setTimeout(() => close('enabled'), 2400);
        }
        if (phase === 'active') reflect(clamp(gamma, -20, 20), clamp(beta - 45, -14, 14));
      };
      const orient = event => receive(event.beta, event.gamma);
      const motion = event => {
        const g = event.accelerationIncludingGravity;
        if (g && Number.isFinite(g.x) && Number.isFinite(g.y)) receive(45 - g.y * 4, g.x * 5);
      };
      window.addEventListener('deviceorientation', orient, options);
      window.addEventListener('deviceorientationabsolute', orient, options);
      window.addEventListener('devicemotion', motion, options);
      // Only count time while the page is visible: mobile app switching pauses sensors.
      const armSensorTimeout = () => {
        clearTimeout(sensorTimer);
        if (phase !== 'waiting' || document.hidden) return;
        sensorTimer = setTimeout(() => {
          if (phase === 'waiting' && !document.hidden) fail(false);
        }, 6000);
      };
      document.addEventListener('visibilitychange', armSensorTimeout, options);
      stopProbe = () => {
        document.removeEventListener('visibilitychange', armSensorTimeout);
        window.removeEventListener('deviceorientation', orient);
        window.removeEventListener('deviceorientationabsolute', orient);
        window.removeEventListener('devicemotion', motion);
      };
      armSensorTimeout();
    };
    enable.addEventListener('click', () => {
      if (phase !== 'shown') return;
      if (desktop) {
        decision = 'pointer'; remember(decision);
        close('pointer');
        return;
      }
      phase = 'requesting'; enable.disabled = true;
      enable.textContent = 'Đang kiểm tra…';
      // No await, timer or promise callback before these native calls: retain iOS user activation.
      const jobs = asks.map(api => {
        try { return Promise.resolve(api.requestPermission()); }
        catch (error) { return Promise.reject(error); }
      });
      chose();
      if (!jobs.length) { waitForSensor(); return; }
      Promise.allSettled(jobs).then(results => {
        if (phase === 'closed') return;
        if (results.some(result => result.status === 'fulfilled' && result.value === 'granted')) waitForSensor();
        else fail(true);
      });
    }, { signal: events.signal });
    later.addEventListener('click', () => close('later'), { signal: events.signal });
    note.addEventListener('keydown', event => { if (event.key === 'Escape') close('later'); }, { signal: events.signal });
    if (calm()) {
      enable.hidden = true; later.textContent = 'Đã hiểu';
      status.textContent = 'Chế độ giảm chuyển động đang bật. Website giữ nguyên tùy chọn của bạn.';
    } else if (!desktop && !supported) {
      title.textContent = 'Chuyển động chưa khả dụng';
      copy.textContent = 'Trình duyệt này chưa cung cấp cảm biến. Thử mở trang bằng Safari hoặc Chrome qua HTTPS.';
      enable.hidden = true; later.textContent = 'Đã hiểu';
    } else if (!desktop && !asks.length) {
      status.textContent = 'Không cần xin quyền · Bấm để bật hiệu ứng.';
    }
    document.body.append(note);
    place(); syncMenu();
    requestAnimationFrame(() => { if (phase !== 'closed') note.classList.add('is-in'); });
  }

  function scheduleMotionNotice() {
    if (window.ntMainLoading) {
      window.addEventListener('nt-main-ready', bootPhoneTilt, { once: true });
    } else if (document.readyState !== 'complete') {
      document.addEventListener('DOMContentLoaded', bootPhoneTilt, { once: true });
    } else {
      requestAnimationFrame(bootPhoneTilt);
    }
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
  } else if (!reduce.matches && root.dataset.tiltTouch !== '1') {
    root.dataset.tiltTouch = '1';
    let touch = null;
    const endTouch = event => {
      if (!touch || (event && event.pointerId !== touch.id)) return;
      release(touch.box.card);
      if (touchBox && touchBox.card === touch.box.card) touchBox = null;
      touch = null;
    };
    window.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch' || calm() || scrolling) return;
      if (event.target.closest('.ntjr, .music-widget, .style-controls, .snake-dock, .header, button, a, input, textarea')) return;
      boxesDirty = true;
      const box = hitAt(event.clientX, event.clientY);
      if (!box) return;
      touch = { id: event.pointerId, box, x: event.clientX, y: event.clientY, locked: false };
      touchBox = box;
    }, listen);
    window.addEventListener('pointermove', event => {
      if (!touch || event.pointerId !== touch.id || calm() || scrolling) return;
      const dx = event.clientX - touch.x;
      const dy = event.clientY - touch.y;
      if (!touch.locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.35) {
          touch = null;
          return;
        }
        touch.locked = true;
      }
      const nx = clamp(dx / 90, -1, 1);
      const ny = clamp(dy / 110, -1, 1);
      writeTilt(touch.box.card, -ny * 5, nx * 5);
      glowVars(touch.box.card, nx, ny);
    }, { passive: true, signal: tiltEvents.signal });
    window.addEventListener('pointerup', endTouch, listen);
    window.addEventListener('pointercancel', endTouch, listen);
  }

  scheduleMotionNotice();

  window.addEventListener('blur', resetTilts);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) resetTilts();
  });
  reduce.addEventListener('change', resetTilts);
  window.addEventListener('pagehide', event => {
    // A cached document resumes with its existing listeners on Back/Forward.
    if (!event.persisted) tiltEvents.abort();
  });

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

