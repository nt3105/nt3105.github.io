(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const calm = () => reduced.matches || root.dataset.fx === 'calm';
  const selector = '.button,.launch-card,.code-tabs button,.journal-filters button,.share-actions button,.explorer-item,.ntjr-presets button,#ntjr-done,.ios-menu-trigger,.closing-explore,.explore-trigger,#nt-menu-done,#nt-hero-play,#nt-gallery-prev,#nt-gallery-next,#nt-theme-toggle';
  const markControls = () => document.querySelectorAll(selector).forEach(button => button.classList.add('ios-tactile'));
  markControls();
  document.querySelector('#explorer-query')?.addEventListener('input', markControls);
  document.querySelectorAll('[data-open-explorer]').forEach(button => button.addEventListener('click', markControls));
  // A click, rather than pointerdown, avoids flashing while the user scrolls.
  document.addEventListener('click', event => {
    if (calm()) return;
    const control = event.target.closest(selector);
    if (!control || control.disabled) return;
    control.querySelector('.ios-tap-wave')?.remove();
    const bounds = control.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = 'ios-tap-wave'; wave.setAttribute('aria-hidden', 'true');
    const size = Math.max(bounds.width, bounds.height) * 2;
    wave.style.width = wave.style.height = size + 'px';
    wave.style.left = (event.detail ? event.clientX - bounds.left : bounds.width / 2) + 'px';
    wave.style.top = (event.detail ? event.clientY - bounds.top : bounds.height / 2) + 'px';
    control.append(wave);
    const timer = setTimeout(() => wave.remove(), 760);
    wave.addEventListener('animationend', () => { clearTimeout(timer); wave.remove(); }, {once:true});
  });
  let active = null, activeRect = null, frame = 0, pointX = 0, pointY = 0;
  const reflective = '.launch-card,.journal-entry,.score-card,.code-workbench,.donate-panel,.contact-panel,.timeline';
  function clearReflection() {
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (active) ['--glass-x','--glass-y','--glass-visible'].forEach(prop => active.style.removeProperty(prop));
    active = null;
    activeRect = null;
  }
  const depthOn = () => root.dataset.depth === 'on';
  function paintReflection() {
    frame = 0;
    if (!active || !depthOn() || calm() || !fine.matches) return;
    if (!activeRect) activeRect = active.getBoundingClientRect();
    active.style.setProperty('--glass-x', (pointX - activeRect.left).toFixed(1) + 'px');
    active.style.setProperty('--glass-y', (pointY - activeRect.top).toFixed(1) + 'px');
    active.style.setProperty('--glass-visible', '1');
  }
  document.addEventListener('pointermove', event => {
    if (!depthOn()) { clearReflection(); return; }
    if (!fine.matches || calm() || event.pointerType === 'touch') return;
    const card = event.target.closest(reflective);
    if (card !== active) {
      if (active) ['--glass-x','--glass-y','--glass-visible'].forEach(prop => active.style.removeProperty(prop));
      active = card;
      activeRect = card ? card.getBoundingClientRect() : null;
    }
    if (!card) return;
    pointX = event.clientX; pointY = event.clientY;
    if (!frame) frame = requestAnimationFrame(paintReflection);
  }, {passive:true});
  document.addEventListener('pointerleave', clearReflection);
  window.addEventListener('blur', clearReflection);
  document.addEventListener('scroll', clearReflection, {passive:true,capture:true});
  window.addEventListener('resize', () => { activeRect = null; }, {passive:true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearReflection(); });
  document.querySelector('#fx-motion-toggle')?.addEventListener('change', clearReflection);
  reduced.addEventListener('change', clearReflection);
  fine.addEventListener('change', clearReflection);
  function animateContent(element) {
    if (calm() || !element) return;
    element.classList.remove('ios-content-in');
    requestAnimationFrame(() => { if (!calm()) element.classList.add('ios-content-in'); });
  }
  document.querySelectorAll('[data-code-language]').forEach(button => button.addEventListener('click', () => animateContent(document.querySelector('#code-content')?.parentElement)));
  document.querySelectorAll('[data-journal-filter]').forEach(button => button.addEventListener('click', () => animateContent(document.querySelector('#journal-list'))));
})();
