/* Reusable, dependency-free AppIcon enhancement. Static SVG markup works without JS. */
(() => {
  'use strict';
  if (window.NTAppIcon) return;
  const brands = new Set(['telegram','facebook','github','tiktok','email','gmail','c','cpp','html','css','javascript','git','swift','objectivec']);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const root = document.documentElement;
  const calm = () => reduced.matches || root.dataset.fx === 'calm';
  const icons = new Set();
  const timers = new Map();
  let active = null, pressed = null, pending = null, frame = 0;

  function reveal(icon) {
    if (icon.dataset.appSeen) return;
    icon.dataset.appSeen = 'yes';
    if (!calm()) {
      icon.classList.add('nt-app-enter');
      timers.set(icon, setTimeout(() => {
        icon.classList.remove('nt-app-enter'); timers.delete(icon);
      }, 650));
    }
    observer?.unobserve(icon);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
  }, { threshold:.15 }) : null;

  function enhance(icon) {
    if (icon.dataset.appReady || !brands.has(icon.dataset.appIcon)) return icon;
    const img = icon.querySelector('img');
    if (!img) return icon;
    const face = document.createElement('span'); face.className = 'nt-app-face';
    const motion = document.createElement('span'); motion.className = 'nt-app-reveal';
    face.append(img); motion.append(face); icon.append(motion);
    icon.dataset.appReady = 'yes';
    icon.setAttribute('aria-hidden', 'true');
    const host = icon.closest('a,button,.skill-card') || icon;
    host.setAttribute('data-app-host','');
    const shell = icon.closest('.social-card,.skill-card')?.closest('.tilt-shell');
    if (shell) { shell.dataset.tsmOnce = 'yes'; shell.classList.add('nt-app-card-shell'); }
    icons.add(icon);
    if (observer) observer.observe(icon); else reveal(icon);
    return icon;
  }
  function refresh(scope = document) {
    if (scope.matches?.('.nt-app-icon[data-app-icon]')) enhance(scope);
    scope.querySelectorAll('.nt-app-icon[data-app-icon]').forEach(enhance);
  }
  function create(brand, size = '') {
    if (!brands.has(brand)) throw new TypeError('Unknown AppIcon brand');
    const icon = document.createElement('span');
    icon.className = 'nt-app-icon' + (['xs','sm'].includes(size) ? ' nt-app-icon--' + size : '');
    icon.dataset.appIcon = brand;
    const img = document.createElement('img'); img.src = 'images/app-icons/' + brand + '.svg';
    img.alt = ''; img.width = 36; img.height = 36; img.draggable = false; img.decoding = 'async';
    icon.append(img);
    return icon;
  }
  function hostFor(target) { return target instanceof Element ? target.closest('[data-app-host]') : null; }
  function forIcons(host, callback) {
    if (!host) return;
    if (host.matches('.nt-app-icon')) callback(host);
    else host.querySelectorAll('.nt-app-icon').forEach(callback);
  }
  function clearHover() {
    forIcons(active, icon => {
      icon.classList.remove('is-app-hover');
      ['--app-rx','--app-ry','--app-light-x','--app-light-y'].forEach(name => icon.style.removeProperty(name));
    });
    active = null; pending = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function release() {
    forIcons(pressed?.host, icon => icon.classList.remove('is-app-pressed'));
    pressed = null;
  }
  function paint() {
    frame = 0;
    if (!pending || calm() || !fine.matches || document.hidden || root.dataset.depth !== 'on') { clearHover(); return; }
    const {host,x,y} = pending;
    if (!host.isConnected) { clearHover(); return; }
    if (active !== host) { clearHover(); active = host; }
    const rect = host.getBoundingClientRect();
    const nx = Math.max(0,Math.min(1,(x-rect.left)/Math.max(rect.width,1)));
    const ny = Math.max(0,Math.min(1,(y-rect.top)/Math.max(rect.height,1)));
    forIcons(host, icon => {
      icon.style.setProperty('--app-rx',((.5-ny)*8).toFixed(2)+'deg');
      icon.style.setProperty('--app-ry',((nx-.5)*8).toFixed(2)+'deg');
      icon.style.setProperty('--app-light-x',(nx*100).toFixed(1)+'%');
      icon.style.setProperty('--app-light-y',(ny*100).toFixed(1)+'%');
      icon.classList.add('is-app-hover');
    });
  }
  document.addEventListener('pointermove', event => {
    if (pressed && Math.hypot(event.clientX-pressed.x,event.clientY-pressed.y)>10) release();
    if (event.pointerType==='touch' || !fine.matches || calm() || root.dataset.depth !== 'on') return;
    const host = hostFor(event.target);
    if (!host) { clearHover(); return; }
    pending = {host,x:event.clientX,y:event.clientY};
    if (!frame) frame = requestAnimationFrame(paint);
  }, {passive:true});
  document.addEventListener('pointerout', event => {
    if (active && !active.contains(event.relatedTarget)) clearHover();
  }, {passive:true});
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const host = hostFor(event.target); if (!host || host.matches(':disabled')) return;
    release(); pressed = {host,x:event.clientX,y:event.clientY};
    forIcons(host, icon => icon.classList.add('is-app-pressed'));
  }, {passive:true});
  document.addEventListener('pointerup',release,{passive:true});
  document.addEventListener('pointercancel',release,{passive:true});
  document.addEventListener('keydown',event => {
    if (!['Enter',' '].includes(event.key) || event.repeat) return;
    const host = hostFor(event.target); if (!host?.matches('a,button') || host.matches(':disabled')) return;
    release(); pressed={host,x:0,y:0}; forIcons(host, icon=>icon.classList.add('is-app-pressed'));
  });
  document.addEventListener('keyup',release);
  document.addEventListener('focusout',release);
  function reset() { clearHover(); release(); }
  function preferenceChanged() {
    reset();
    if (calm()) timers.forEach((timer,icon) => { clearTimeout(timer); icon.classList.remove('nt-app-enter'); timers.delete(icon); });
  }
  reduced.addEventListener('change',preferenceChanged);
  fine.addEventListener('change',reset);
  const preferences = new MutationObserver(preferenceChanged);
  preferences.observe(root,{attributes:true,attributeFilter:['data-fx','data-depth']});
  document.addEventListener('scroll',reset,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  window.addEventListener('blur',reset);
  window.addEventListener('pagehide',event=>{
    reset(); observer?.disconnect();
    timers.forEach((timer,icon)=>{clearTimeout(timer);icon.classList.remove('nt-app-enter');}); timers.clear();
    if(!event.persisted)preferences.disconnect();
  });
  window.addEventListener('pageshow',()=>icons.forEach(icon=>{if(!icon.dataset.appSeen)observer?.observe(icon);}));
  window.NTAppIcon = Object.freeze({create,refresh});
  refresh();
})();
