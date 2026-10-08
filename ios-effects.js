(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const calm = () => reduced.matches || root.dataset.fx === 'calm';
  const selector = '.button,.launch-card,.code-tabs button,.journal-filters button,.share-actions button,.explorer-item,.ntjr-presets button,#ntjr-done,.ios-menu-trigger';
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
    const timer = setTimeout(() => wave.remove(), 650);
    wave.addEventListener('animationend', () => { clearTimeout(timer); wave.remove(); }, {once:true});
  });
  let active = null, pending = null, frame = 0;
  const reflective = '.launch-card,.journal-entry,.score-card,.code-workbench';
  function clearReflection() {
    if (active) active.style.removeProperty('--glass-visible');
    active = null; pending = null;
    cancelAnimationFrame(frame); frame = 0;
  }
  function paint() {
    frame = 0;
    if (!pending || calm() || document.hidden) { clearReflection(); return; }
    const {card,x,y} = pending;
    if (active && active !== card) active.style.removeProperty('--glass-visible');
    active = card;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--glass-x', (x-box.left)+'px');
    card.style.setProperty('--glass-y', (y-box.top)+'px');
    card.style.setProperty('--glass-visible', '1');
  }
  document.addEventListener('pointermove', event => {
    if (!fine.matches || calm() || event.pointerType === 'touch') return;
    const card = event.target.closest(reflective);
    if (!card) { clearReflection(); return; }
    pending = {card,x:event.clientX,y:event.clientY};
    if (!frame) frame = requestAnimationFrame(paint);
  }, {passive:true});
  document.addEventListener('pointerleave', clearReflection);
  window.addEventListener('blur', clearReflection);
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
