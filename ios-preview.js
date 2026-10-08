(() => {
  'use strict';
  const phone = () => matchMedia('(max-width: 820px)').matches;
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
  const tabs = [
    ['home', 'Trang chủ', 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z', '#home'],
    ['explore', 'Khám phá', 'M11 5a6 6 0 1 0 3.9 10.6L20 20.7', 'explore'],
    ['music', 'Nhạc', 'M9 18V6l10-2v12', 'music'],
    ['contact', 'Liên hệ', 'M4 6h16v12H4z M4 7l8 6 8-6', 'contact']
  ];
  const bar = document.createElement('nav');
  bar.className = 'ios-tabbar';
  bar.setAttribute('aria-label', 'Điều hướng nhanh');
  tabs.forEach(([id, label, path, action]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.tab = id;
    button.dataset.action = action;
    button.innerHTML = icon(path) + label;
    bar.append(button);
  });
  document.body.append(bar);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  function openMusic() {
    const shell = document.querySelector('#music-shell');
    if (shell?.hidden) document.querySelector('.hamster-mascot')?.click();
  }
  const contact = document.querySelector('#contact');
  let contactOpener = null;
  function closeContact() {
    document.body.classList.remove('ios-contact-open');
    contactOpener?.focus();
    contactOpener = null;
  }
  function openContact(opener) {
    if (!phone()) { go('#contact'); return; }
    contactOpener = opener;
    document.body.classList.add('ios-contact-open');
    contact.querySelector('#name')?.focus();
  }
  bar.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'explore') document.querySelector('[data-open-explorer]')?.click();
    else if (action === 'music') openMusic();
    else if (action === 'contact') openContact(button);
    else go('#home');
    mark();
  });
  document.querySelector('.music-expand')?.addEventListener('click', openMusic);
  function mark() {
    const y = window.scrollY + 140;
    let current = 'home';
    if (document.querySelector('#contact')?.offsetTop < y) current = 'contact';
    bar.querySelectorAll('button').forEach(button => {
      const on = button.dataset.tab === current || (current === 'home' && button.dataset.tab === 'home');
      if (on) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
  mark();
  function grab(host, close) {
    if (!host || host.querySelector('.ios-grab')) return;
    const handle = document.createElement('div');
    handle.className = 'ios-grab';
    handle.setAttribute('aria-hidden', 'true');
    host.prepend(handle);
    let start = null;
    handle.addEventListener('pointerdown', event => { start = { id: event.pointerId, y: event.clientY }; });
    handle.addEventListener('pointerup', event => {
      if (!start || start.id !== event.pointerId) return;
      if (event.clientY - start.y > 48) close();
      start = null;
    });
  }
  const share = document.querySelector('#share-dialog');
  grab(share, () => share.close());
  const stylePanel = document.querySelector('#style-panel');
  grab(stylePanel, () => document.querySelector('.style-close')?.click());
  grab(contact, closeContact);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('ios-contact-open')) closeContact();
  });
  document.addEventListener('click', event => {
    if (!document.body.classList.contains('ios-contact-open')) return;
    if (event.target === document.body) closeContact();
  });
  const watch = ['#code-status', '#share-status', '#form-feedback', '#amount-error', '.music-status'];
  watch.forEach(selector => {
    const node = document.querySelector(selector);
    if (!node) return;
    let last = '';
    const ping = () => {
      const text = node.textContent.trim();
      if (!text || text === last) return;
      last = text;
      if (/sao chép|không|lỗi|chưa|sẵn sàng|đã chạy/i.test(text)) window.ntNotify?.(text);
    };
    new MutationObserver(ping).observe(node, { childList: true, characterData: true, subtree: true });
  });
})();
