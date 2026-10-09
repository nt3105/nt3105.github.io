(() => {
  'use strict';
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
  grab(document.querySelector('#share-dialog'), () => document.querySelector('#share-dialog')?.close());
  grab(document.querySelector('#style-panel'), () => document.querySelector('.style-close')?.click());
})();
