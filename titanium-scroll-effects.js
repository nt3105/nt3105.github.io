/* Titanium Motion — one event-driven scroll choreography engine.
   Resting content is always visible. Finite CSS animations own temporary entrance poses;
   observers only trigger/rearm them, and never leave content in a hidden waiting state. */
(() => {
  'use strict';
  const root = document.querySelector('[data-tsm-root]') || document.documentElement;
  if (root.dataset.tsmInitialized === 'yes') return;
  root.dataset.tsmInitialized = 'yes';
  const scroller = root.querySelector('[data-tsm-scroll-container]');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '[data-tsm-reveal],[data-tsm-kinetic],[data-tsm-line],.tsm-sweep,.tsm-meter';
  const targets = [...root.querySelectorAll(selector)];
  const states = new Map();
  const pending = new Set();
  let enterObserver;
  let exitObserver;
  let frame = 0;
  let enabled = false;
  let requestedMotion = true;
  let destroyed = false;
  let scrollDirection = 'down';
  const scrollPosition = () => Math.max(0, scroller ? scroller.scrollTop : window.scrollY);
  let directionAnchor = scrollPosition();
  function trackDirection() {
    const position = scrollPosition();
    const delta = position - directionAnchor;
    // Accumulate tiny steps; ignore finger jitter and top-edge elastic overscroll.
    if (Math.abs(delta) < 6) return;
    scrollDirection = delta < 0 ? 'up' : 'down';
    directionAnchor = position;
  }
  (scroller || window).addEventListener('scroll', trackDirection, { passive: true });

  function milliseconds(value, fallback = 0) {
    const number = parseFloat(value);
    if (!Number.isFinite(number)) return fallback;
    return value.trim().endsWith('ms') ? number : value.trim().endsWith('s') ? number * 1000 : number;
  }
  function settle(element) {
    const state = states.get(element);
    if (!state) return;
    clearTimeout(state.timer);
    state.timer = 0;
    state.running = false;
    element.classList.remove('tsm-entering');
    element.classList.add('tsm-settled');
    document.dispatchEvent(new CustomEvent('tsm:settled', { detail: { target: element } }));
  }
  function clearPending() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pending.clear();
  }
  function settleAll() {
    clearPending();
    states.forEach((state, element) => {
      if (state.running) settle(element);
    });
  }
  function failOpen() {
    enabled = false;
    clearPending();
    enterObserver?.disconnect();
    exitObserver?.disconnect();
    states.forEach((state, element) => {
      clearTimeout(state.timer);
      element.classList.remove('tsm-entering');
      element.classList.add('tsm-settled');
    });
    root.classList.add('tsm-no-motion');
  }

  try {
    // Split graphemes, not UTF-16 units: Vietnamese accents and combined symbols stay intact.
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('vi', { granularity: 'grapheme' }) : null;
    const headingOffsets = new WeakMap();
    function graphemes(text) {
      if (segmenter) return [...segmenter.segment(text)].map(part => part.segment);
      return Array.from(text).reduce((letters, character) => {
        if (letters.length && /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\uFE20-\uFE2F\uFE0F]/u.test(character)) letters[letters.length - 1] += character;
        else letters.push(character);
        return letters;
      }, []);
    }
    targets.filter(element => element.hasAttribute('data-tsm-kinetic')).forEach(element => {
      if (element.dataset.tsmSplit === 'yes') return;
      const original = element.textContent;
      const letters = graphemes(original);
      const heading = element.closest('h1,h2,h3') || element;
      const offset = headingOffsets.get(heading) || 0;
      const fragment = document.createDocumentFragment();
      let word;
      let maximumDelay = 0;
      letters.forEach((character, index) => {
        if (/^\s+$/u.test(character)) {
          word = null;
          fragment.append(document.createTextNode(character));
          return;
        }
        if (!word) {
          word = document.createElement('tsm-word');
          word.className = 'tsm-word';
          fragment.append(word);
        }
        const letter = document.createElement('span');
        letter.className = 'tsm-letter';
        letter.setAttribute('aria-hidden', 'true');
        letter.textContent = character;
        maximumDelay = Math.min((offset + index) * 18, 360);
        letter.style.setProperty('--letterdelay', `${maximumDelay}ms`);
        letter.style.setProperty('--letterx', `${Math.max(-8, Math.min(8, (index - (letters.length - 1) / 2) * 0.8))}px`);
        word.append(letter);
      });
      // Only replace once the complete fragment is ready: an interruption leaves readable text.
      if (!element.hasAttribute('aria-hidden') && !element.hasAttribute('aria-label')) element.setAttribute('aria-label', original);
      element.replaceChildren(fragment);
      element.dataset.tsmSplit = 'yes';
      element.dataset.tsmLetterDelay = String(maximumDelay);
      headingOffsets.set(heading, offset + letters.length);
    });
    document.dispatchEvent(new Event('tsm:split-ready'));

    targets.forEach(element => {
      const nestedContent = element.matches('[data-tsm-reveal],[data-tsm-kinetic]') && element.parentElement?.closest('[data-tsm-reveal]');
      // Decorative skill bars can animate inside a card, but content never receives two entrances.
      if (nestedContent) return;
      const css = getComputedStyle(element);
      const stagger = milliseconds(css.getPropertyValue('--stagger'));
      let duration = milliseconds(css.getPropertyValue('--tsm-duration'), 1150) + stagger;
      if (element.hasAttribute('data-tsm-kinetic')) duration = milliseconds(css.getPropertyValue('--tsm-letter-duration'), 1100) + Number(element.dataset.tsmLetterDelay || 0) + stagger;
      else if (element.matches('[data-tsm-line],.tsm-drawline')) duration = 1500 + stagger;
      else if (element.classList.contains('tsm-sweep')) duration = 1100 + stagger;
      else if (element.classList.contains('tsm-meter')) duration = 1360 + stagger;
      const returnDelay = Math.min(stagger, 110);
      element.style.setProperty('--tsm-return-delay', `${returnDelay}ms`);
      let returnDuration = milliseconds(css.getPropertyValue('--tsm-return-duration'), 900) + returnDelay;
      if (element.hasAttribute('data-tsm-kinetic')) returnDuration = milliseconds(css.getPropertyValue('--tsm-return-letter-duration'), 900) + Number(element.dataset.tsmLetterDelay || 0) * .55 + returnDelay;
      else if (element.matches('[data-tsm-line],.tsm-drawline')) returnDuration = 1500 + returnDelay;
      else if (element.classList.contains('tsm-sweep')) returnDuration = 1100 + returnDelay;
      else if (element.classList.contains('tsm-meter')) returnDuration = 1360 + returnDelay;
      states.set(element, { played: false, armed: true, inView: false, running: false, timer: 0, deadline: 0, duration, returnDuration });
    });

    function flushEntrances() {
      frame = 0;
      if (!enabled || document.hidden) { pending.clear(); return; }
      const now = performance.now();
      trackDirection();
      pending.forEach(element => {
        const state = states.get(element);
        if (!state || !state.armed || !state.inView || !element.isConnected) return;
        state.armed = false;
        if (element.contains(document.activeElement)) { settle(element); return; }
        state.running = true;
        state.played = true;
        // Latch direction per entrance. Reversing the finger mid-animation must not restart it.
        element.dataset.tsmDirection = scrollDirection;
        const duration = scrollDirection === 'up' ? state.returnDuration : state.duration;
        state.deadline = now + duration;
        element.classList.remove('tsm-settled');
        element.classList.add('tsm-entering');
        // Backstop for interrupted animations, unsupported effects and browser throttling.
        state.timer = window.setTimeout(() => settle(element), duration + 120);
      });
      pending.clear();
    }
    function scheduleEntrance(element) {
      pending.add(element);
      if (!frame) frame = requestAnimationFrame(flushEntrances);
    }
    function disconnect() {
      enterObserver?.disconnect();
      exitObserver?.disconnect();
    }
    // Observe stationary snap slots, not the animated photo layer: its entrance
    // transform must not trigger its own exit/re-entry and restart the animation.
    const observedVisuals = new Map();
    states.forEach((state, element) => {
      const slot = element.matches('[data-tsm-photo]')
        ? element.closest('.nt-gallery > .tilt-shell') : null;
      observedVisuals.set(slot || element, element);
    });
    function observe() {
      disconnect();
      if (!enabled) return;
      enterObserver = new IntersectionObserver(entries => {
        if (!enabled) return;
        entries.forEach(entry => {
          const element = observedVisuals.get(entry.target);
          const state = states.get(element);
          state.inView = entry.isIntersecting;
          if (entry.isIntersecting && state.armed) scheduleEntrance(element);
          else if (!entry.isIntersecting) pending.delete(element);
        });
      }, { root: scroller || null, rootMargin: '-72px 0px -12% 0px', threshold: 0 });
      // Replay only after a complete exit beyond 48px, preventing threshold-edge flicker.
      exitObserver = new IntersectionObserver(entries => {
        if (!enabled) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) return;
          const element = observedVisuals.get(entry.target);
          const state = states.get(element);
          pending.delete(element);
          if (state.running) settle(element);
          state.armed = element.dataset.tsmOnce !== 'yes' || !state.played;
          state.inView = false;
        });
      }, { root: scroller || null, rootMargin: '48px 0px 48px 0px', threshold: 0 });
      observedVisuals.forEach((element, observed) => {
        enterObserver.observe(observed);
        exitObserver.observe(observed);
      });
    }
    function updateMotion() {
      const next = requestedMotion && !motionQuery.matches && root.dataset.fx !== 'calm' && !document.hidden && 'IntersectionObserver' in window;
      root.classList.toggle('tsm-no-motion', !next);
      if (next !== enabled) {
        enabled = next;
        if (enabled) observe();
        else {
          disconnect();
          settleAll();
          // Keep not-yet-played targets armed when a tab is backgrounded.
          // Otherwise returning to the tab silently loses their entrance.
        }
      }
      const toggle = root.querySelector('[data-tsm-toggle]');
      if (toggle) toggle.setAttribute('aria-pressed', String(requestedMotion && !motionQuery.matches && root.dataset.fx !== 'calm'));
    }
    root.addEventListener('animationend', event => {
      if (!event.animationName.startsWith('tsm-')) return;
      const element = event.target.closest('.tsm-entering');
      const state = states.get(element);
      // Early letters bubble too: the last delayed glyph must finish before removing the class.
      if (state?.running && performance.now() >= state.deadline - 24) settle(element);
    });
    document.addEventListener('focusin', event => {
      states.forEach((state, element) => {
        if (!element.contains(event.target)) return;
        pending.delete(element);
        state.armed = false;
        settle(element);
      });
    });
    motionQuery.addEventListener('change', updateMotion);
    const preferenceObserver = new MutationObserver(() => {
      // Re-enabling effects should also animate content already on screen.
      if (root.dataset.fx !== 'calm') states.forEach((state, element) => { state.armed = element.dataset.tsmOnce !== 'yes' || !state.played; });
      updateMotion();
    });
    preferenceObserver.observe(root, { attributes: true, attributeFilter: ['data-fx'] });
    document.addEventListener('visibilitychange', updateMotion);
    root.querySelector('[data-tsm-toggle]')?.addEventListener('click', () => {
      requestedMotion = !requestedMotion;
      updateMotion();
    });
    let layoutWidth = window.innerWidth;
    let layoutHeight = window.innerHeight;
    window.addEventListener('resize', () => {
      // Safari's address bar resizing must not cancel every entrance while scrolling.
      if (window.innerWidth !== layoutWidth || Math.abs(window.innerHeight - layoutHeight) > 120) settleAll();
      layoutWidth = window.innerWidth;
      layoutHeight = window.innerHeight;
    }, { passive: true });
    window.addEventListener('pagehide', event => {
      disconnect();
      settleAll();
      if (!event.persisted) { destroyed = true; preferenceObserver.disconnect(); }
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted && !destroyed) { enabled = false; updateMotion(); }
    });
    root.classList.add('tsm-ready');
    // During the intro handoff scripts still load sequentially. Begin at handoff completion.
    if (window.ntMainLoading) window.addEventListener('nt-main-ready', updateMotion, { once: true });
    else updateMotion();
  } catch (_) {
    failOpen();
  }

  // One transform-only progress strip. Scroll/layout events request one frame; no idle loop.
  const progress = document.querySelector('.tsm-scroll-progress > span');
  if (!progress) return;
  let progressFrame = 0;
  function updateProgress() {
    progressFrame = 0;
    const doc = document.documentElement;
    const position = scroller ? scroller.scrollTop : window.scrollY;
    const maximum = scroller ? scroller.scrollHeight - scroller.clientHeight : doc.scrollHeight - window.innerHeight;
    const fraction = maximum > 0 ? Math.min(1, Math.max(0, position / maximum)) : 0;
    progress.style.transform = `scaleX(${fraction})`;
  }
  function queueProgress() {
    if (!progressFrame && !document.hidden) progressFrame = requestAnimationFrame(updateProgress);
  }
  (scroller || window).addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  window.addEventListener('pageshow', queueProgress);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && progressFrame) { cancelAnimationFrame(progressFrame); progressFrame = 0; }
    else queueProgress();
  });
  let sizeObserver;
  if ('ResizeObserver' in window) {
    sizeObserver = new ResizeObserver(queueProgress);
    sizeObserver.observe(scroller || document.documentElement);
    if (document.body) sizeObserver.observe(document.body);
  }
  document.fonts?.ready.then(queueProgress);
  window.addEventListener('load', queueProgress, { once: true });
  window.addEventListener('pagehide', event => {
    if (progressFrame) cancelAnimationFrame(progressFrame);
    progressFrame = 0;
    if (!event.persisted) sizeObserver?.disconnect();
  });
  queueProgress();
})();

/* V9 scroll depth: only two visible regions are measured, in a read phase.
   Native scrolling stays untouched. Frames stop as soon as the depth catches up. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !CSS.supports('translate', '0 1px')) return;
  const regions = [...document.querySelectorAll('[data-tsm-depth]')];
  if (!regions.length) return;
  const states = new Map(regions.map(element => [element, {
    y: 0, x: 0, targetY: 0, targetX: 0, initialized: false
  }]));
  const active = new Set();
  let enabled = false;
  let dirty = true;
  let frame = 0;
  let lastTime = 0;
  let destroyed = false;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function queue() {
    if (enabled && !frame && active.size) frame = requestAnimationFrame(tick);
  }
  function invalidate() { dirty = true; queue(); }
  function tick(time) {
    frame = 0;
    if (!enabled || document.hidden) return;
    const delta = lastTime ? Math.min(40, time - lastTime) : 16.67;
    lastTime = time;
    const blend = 1 - Math.exp(-delta / 90);
    // Read all geometry before writing any style. Entry transforms live on children.
    if (dirty) {
      const viewport = window.innerHeight;
      active.forEach(element => {
        const state = states.get(element);
        const rect = element.getBoundingClientRect();
        if (element.dataset.tsmDepth === 'hero') {
          state.targetY = clamp(-rect.top / Math.max(1, rect.height), 0, 1);
        } else {
          state.targetY = clamp((viewport - rect.top) / Math.max(1, viewport + rect.height), 0, 1) * 2 - 1;
          const range = element.scrollWidth - element.clientWidth;
          state.targetX = range > 1 ? clamp(element.scrollLeft / range, 0, 1) * 2 - 1 : 0;
        }
        if (!state.initialized) {
          state.y = state.targetY;
          state.x = state.targetX;
          state.initialized = true;
        }
      });
      dirty = false;
    }
    let unsettled = false;
    active.forEach(element => {
      const state = states.get(element);
      state.y += (state.targetY - state.y) * blend;
      state.x += (state.targetX - state.x) * blend;
      const moving = Math.abs(state.targetY - state.y) + Math.abs(state.targetX - state.x) > .001;
      if (!moving) { state.y = state.targetY; state.x = state.targetX; }
      unsettled ||= moving;
      element.style.setProperty('--tsm-depth', state.y.toFixed(4));
      element.style.setProperty('--tsm-pan', state.x.toFixed(4));
      element.classList.add('tsm-depth-active');
    });
    if (unsettled) queue();
    else lastTime = 0;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) active.add(entry.target);
      else {
        active.delete(entry.target);
        states.get(entry.target).initialized = false;
      }
    });
    invalidate();
  }, { rootMargin: '80px 0px', threshold: 0 });

  function update() {
    const next = !destroyed && !window.ntMainLoading && !document.hidden && !reduced.matches && root.dataset.fx !== 'calm' && !root.classList.contains('tsm-no-motion');
    if (next === enabled) return;
    enabled = next;
    if (enabled) {
      regions.forEach(element => observer.observe(element));
      invalidate();
    } else {
      observer.disconnect();
      active.clear();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      regions.forEach(element => {
        element.classList.remove('tsm-depth-active');
        element.style.removeProperty('--tsm-depth');
        element.style.removeProperty('--tsm-pan');
        states.get(element).initialized = false;
      });
    }
  }
  const preferences = new MutationObserver(update);
  preferences.observe(root, { attributes: true, attributeFilter: ['data-fx', 'class'] });
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  document.addEventListener('scroll', invalidate, { capture: true, passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('load', invalidate, { once: true });
  window.addEventListener('nt-main-ready', update, { once: true });
  window.addEventListener('pageshow', update);
  document.fonts?.ready.then(invalidate);
  const sizeObserver = 'ResizeObserver' in window ? new ResizeObserver(invalidate) : null;
  regions.forEach(element => sizeObserver?.observe(element));
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { destroyed = true; preferences.disconnect(); sizeObserver?.disconnect(); }
    // Suspend even if the browser has not delivered visibilitychange yet.
    observer.disconnect();
    active.clear();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    enabled = false;
  });
  update();
})();
