'use strict';
// Tải lại trang thì về đầu, không giữ chỗ đang xem.
const reloaded = performance.getEntriesByType('navigation')[0]?.type === 'reload';
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (reloaded) window.scrollTo(0, 0);
const initialSection = reloaded ? '' : location.hash;
function restoreInitialSection() {
  if (!initialSection) return;
  let id;
  try { id = decodeURIComponent(initialSection.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
}
if (initialSection) {
  requestAnimationFrame(() => requestAnimationFrame(restoreInitialSection));
  window.addEventListener('load', restoreInitialSection, { once: true });
}

/* =====================================================
   SỬA LINK CỦA BẠN TẠI ĐÂY.
   Giữ dấu nháy. Ví dụ: facebook: 'https://facebook.com/tenban'
   Chỉ cần sửa ở đây, tất cả nút mạng xã hội tự cập nhật.
   ===================================================== */
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/bolantokk',
  tiktok: 'https://www.tiktok.com/@nt31055',
  github: 'https://github.com/nt3105',
  email: 'kienngantu3105@gmail.com',
  telegram: 'https://t.me/neverdierrr'
};
// Điền URL thật của dự án / kho mã nguồn khi đã có.
// Để trống: nút sẽ thông báo chưa có liên kết, không mở trang lỗi.
const PROJECT_LINKS = {
  snake: { demo: '', source: '' },
  portfolio: { demo: '#home', source: '' },
  exercises: { demo: '', source: '' },
  next: { demo: '', source: '' }
};
const ROLES = ['Đang học C', 'C Learner', 'Telegram Seller', 'Game Hack Developer'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Thông báo dùng chung. textContent giúp nội dung không bị hiểu là HTML.
const toast = document.querySelector('#toast');
let toastTimer;
function notify(message) {
  document.querySelector('#toast-message').textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
}
window.ntNotify = notify;
document.querySelector('#toast-close').addEventListener('click', () => { toast.hidden = true; });

// Chỉ mở liên kết web hợp lệ.
function isWebUrl(value) {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); }
  catch { return false; }
}
document.querySelectorAll('[data-social]').forEach(link => {
  const key = link.dataset.social;
  const value = SOCIAL_LINKS[key];
  const valid = key === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : isWebUrl(value);
  if (valid) {
    link.href = key === 'email' ? `mailto:${value}` : value;
    if (key !== 'email') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  } else {
    link.href = '#social';
    link.addEventListener('click', event => {
      event.preventDefault();
      notify('Liên kết này chưa được cập nhật. Bạn có thể quay lại sau nhé!');
    });
  }
});
document.querySelectorAll('[data-project], [data-source]').forEach(link => {
  const isSource = link.hasAttribute('data-source');
  const key = isSource ? link.dataset.source : link.dataset.project;
  const value = PROJECT_LINKS[key][isSource ? 'source' : 'demo'];
  if (value === '#home' || isWebUrl(value)) {
    link.href = value;
    if (isWebUrl(value)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  } else {
    link.addEventListener('click', event => {
      event.preventDefault();
      notify(isSource ? 'Mã nguồn chưa được chia sẻ. Mình sẽ cập nhật liên kết khi sẵn sàng.' : 'Dự án chưa có bản xem trực tuyến. Mình sẽ cập nhật khi sẵn sàng.');
    });
  }
});

// Ảnh chưa có: giữ placeholder phía dưới, không hiện biểu tượng ảnh lỗi.
document.querySelectorAll('.optional-image').forEach(img => {
  const show = () => {
    if (img.naturalWidth > 0) {
      img.classList.add('loaded');
      img.hidden = false;
    }
  };
  img.addEventListener('load', show);
  img.addEventListener('error', () => { img.hidden = true; });
  if (img.complete) show();
});

// Shared desktop/mobile navigation; mobile exposes four primary links directly.
const menu = document.querySelector('#nav-links');
const header = document.querySelector('#header');

// One persistent selection layer; native anchor links stay intact on desktop and mobile.
const backTop = document.querySelector('#back-top');
const navItems = [...menu.querySelectorAll('a[href^="#"]')];
const navSections = navItems.map(link => ({ link, section: document.getElementById(link.hash.slice(1)) })).filter(item => item.section);
const navSelection = document.createElement('span');
navSelection.className = 'nav-selection';
navSelection.setAttribute('aria-hidden', 'true');
menu.prepend(navSelection);
menu.classList.add('pill-nav-ready');
let navWidth = 0, navHeight = 0;
let selectedNav = null, navFrame = 0, navSnap = true, navPainted = false;
let navPending = null, navPendingTimer = 0, scrollQueued = false;
const navMotion = matchMedia('(prefers-reduced-motion: reduce)');
let navAnchorOffset = 0;
function measureNavAnchorOffset() {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margins = navSections.map(item => parseFloat(getComputedStyle(item.section).scrollMarginTop) || 0);
  navAnchorOffset = padding + Math.max(0, ...margins);
}
measureNavAnchorOffset();

function queueNavSelection(snap = false) {
  navSnap = navSnap || snap;
  if (!navFrame) navFrame = requestAnimationFrame(paintNavSelection);
}
function paintNavSelection() {
  navFrame = 0;
  // Hidden mobile links have no geometry; the visible selection is measured next frame.
  if (!selectedNav || !menu.clientWidth || !selectedNav.getClientRects().length) { navSnap = true; return; }
  const outer = menu.getBoundingClientRect(), item = selectedNav.getBoundingClientRect();
  const x = item.left - outer.left - menu.clientLeft + menu.scrollLeft;
  const y = item.top - outer.top - menu.clientTop + menu.scrollTop;
  const snap = navSnap || !navPainted || navMotion.matches;
  navSnap = false;
  if (snap) navSelection.style.transition = 'none';
  if (navWidth !== item.width) { navWidth = item.width; navSelection.style.width = navWidth + 'px'; }
  if (navHeight !== item.height) { navHeight = item.height; navSelection.style.height = navHeight + 'px'; }
  navSelection.style.transform = `translate3d(${x}px,${y}px,0)`;
  navSelection.classList.add('is-positioned');
  navPainted = true;
  if (snap) {
    // Flush only after layout changes, never on an ordinary tab transition.
    navSelection.getBoundingClientRect();
    navSelection.style.removeProperty('transition');
  }
}
function selectNav(link) {
  if (!link || selectedNav === link) return;
  selectedNav = link;
  navItems.forEach(item => {
    const active = item === link;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'location'); else item.removeAttribute('aria-current');
  });
  queueNavSelection();
}
function queueNavScroll() {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
}
function releaseNavTarget(interrupt = false) {
  const stopScroll = interrupt && navPending;
  navPending = null;
  clearTimeout(navPendingTimer);
  if (stopScroll) window.scrollTo({ top: scrollY, behavior: 'instant' });
  queueNavScroll();
}
function finishNavTarget() {
  if (navPending && navPending.link.getClientRects().length) {
    // Lazy content above an anchor can shift after native scrolling completes.
    // Correct once at settlement; explicit user interaction cancels this intent.
    const target = navPending.section;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, scrollY + target.getBoundingClientRect().top - padding - margin));
    if (Math.abs(top - scrollY) > 2) window.scrollTo({ top, behavior: 'instant' });
  }
  releaseNavTarget();
}
navItems.forEach(link => link.addEventListener('click', event => {
  if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  navPending = navSections.find(item => item.link === link) || null;
  clearTimeout(navPendingTimer);
  selectNav(link);
  // Native anchor scrolling/history is retained. Avoid selecting intermediate sections.
  navPendingTimer = setTimeout(finishNavTarget, 1800);
}));
window.addEventListener('wheel', () => releaseNavTarget(true), { passive: true });
window.addEventListener('pointerdown', event => { if (!header.contains(event.target)) releaseNavTarget(true); }, { passive: true });
window.addEventListener('touchstart', event => { if (!header.contains(event.target)) releaseNavTarget(true); }, { passive: true });
window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key) && !event.target.closest('input,textarea,select')) releaseNavTarget(true);
});
window.addEventListener('hashchange', () => { if (navPending?.link.hash !== location.hash) releaseNavTarget(); });
function updateScroll() {
  scrollQueued = false;
  header.classList.toggle('scrolled', window.scrollY > 24);
  backTop.hidden = window.scrollY < 600;
  const marker = Math.min(innerHeight - 1, Math.max(Math.min(220, Math.round(innerHeight * 0.34)), navAnchorOffset + 2));
  const visibleSections = navSections.filter(item => item.link.getClientRects().length);
  let current = visibleSections[0]?.link;
  for (const item of visibleSections) {
    if (item.section.getBoundingClientRect().top <= marker) current = item.link;
  }
  if (navPending && !navPending.link.getClientRects().length) { navPending = null; clearTimeout(navPendingTimer); }
  if (navPending) current = navPending.link;
  selectNav(current);
}
window.addEventListener('scroll', queueNavScroll, { passive: true });
const navResize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => queueNavSelection(true)) : null;
navResize?.observe(menu);
navItems.forEach(link => navResize?.observe(link));
window.addEventListener('resize', () => { measureNavAnchorOffset(); queueNavSelection(true); queueNavScroll(); }, { passive: true });
window.addEventListener('pageshow', () => { queueNavSelection(true); queueNavScroll(); });
navMotion.addEventListener('change', () => queueNavSelection(true));
document.fonts?.ready.then(() => queueNavSelection(true));
document.fonts?.addEventListener('loadingdone', () => queueNavSelection(true));
window.addEventListener('pagehide', event => {
  clearTimeout(navPendingTimer); navPending = null;
  if (!event.persisted) navResize?.disconnect();
});
updateScroll();
backTop.addEventListener('click', () => {
  releaseNavTarget(true);
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  navItems[0]?.focus({ preventScroll: true });
});

// Vỏ ngoài giữ scroll-reveal. Card bên trong chỉ để nghiêng 3D, tránh ghi đè transform.
document.querySelectorAll('.skill-card, .project-card, .life-card, .social-card, .memory-photo, .hero-visual, .nt-hero-scene, .nt-memory').forEach(card => {
  if (card.closest('.tilt-shell, .music-widget, .style-controls, dialog')) return;
  const shell = document.createElement('div');
  shell.className = 'tilt-shell reveal-shell';
  const hit = document.createElement('div');
  hit.className = 'tilt-hitbox';
  if (card.classList.contains('reveal')) {
    shell.classList.add('reveal');
    card.classList.remove('reveal');
  }
  card.classList.add('tilt-card');
  card.parentNode.insertBefore(shell, card);
  shell.appendChild(hit);
  hit.appendChild(card);
});

// Typing chỉ dùng một bộ hẹn giờ; tạm dừng khi chuyển sang tab khác.
const typing = document.querySelector('#typing');
let roleIndex = 0;
let character = ROLES[0].length;
let deleting = true;
let typingTimer;
function typeNext() {
  const word = ROLES[roleIndex];
  character += deleting ? -1 : 1;
  typing.textContent = word.slice(0, character);
  let delay = deleting ? 45 : 85;
  if (!deleting && character === word.length) { deleting = true; delay = 1900; }
  else if (deleting && character === 0) { deleting = false; roleIndex = (roleIndex + 1) % ROLES.length; delay = 350; }
  typingTimer = setTimeout(typeNext, delay);
}
if (!reducedMotion) {
  typingTimer = setTimeout(typeNext, 2200);
  document.addEventListener('visibilitychange', () => {
    clearTimeout(typingTimer);
    if (!document.hidden) typingTimer = setTimeout(typeNext, 500);
  });
}

// Form gửi email cũ đã được thay bằng trang đánh giá tại #contact.

// Sao chép số tài khoản; hỗ trợ cả khi mở trực tiếp file HTML.
document.querySelector('#copy-account').addEventListener('click', async () => {
  const account = document.querySelector('#bank-account').textContent.trim();
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(account);
    notify('Đã sao chép số tài khoản: ' + account);
  } catch {
    const field = document.createElement('textarea');
    field.value = account;
    field.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch {}
    field.remove();
    document.querySelector('#copy-account').focus();
    notify(copied ? 'Đã sao chép số tài khoản: ' + account : 'Hãy sao chép thủ công số tài khoản: ' + account);
  }
});

// QR theo số tiền: VietQR Quick Link, không cần backend hoặc API key.
// https://vietqr.io/danh-sach-api/link-tao-ma-nhanh/
const donationForm = document.querySelector('#donate-form');
const amountInput = document.querySelector('#donate-amount');
const qrImage = document.querySelector('#donation-qr');
const qrStatus = document.querySelector('#qr-status');
const qrCaption = document.querySelector('#qr-caption');
const qrOpen = document.querySelector('#qr-open');
const amountError = document.querySelector('#amount-error');
const generateButton = document.querySelector('#generate-qr');
const originalQR = 'images/qr-techcombank-card.png';
let qrRequest = 0;
let pendingQR = null;
let qrTimeout = 0;
let qrDebounce = 0;
const moneyFormat = new Intl.NumberFormat('vi-VN');
qrImage.loading = 'lazy';
qrImage.decoding = 'async';
if (!qrImage.getAttribute('src')) qrImage.src = originalQR;
function parseDonationAmount(raw) {
  const value = raw.trim();
  if (!/^(?:[0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+)$/.test(value)) return null;
  const amount = Number(value.replaceAll('.', ''));
  return Number.isSafeInteger(amount) && amount >= 1000 && amount <= 500000000 ? amount : null;
}
function showDefaultQR() {
  qrRequest += 1;
  clearTimeout(qrTimeout);
  clearTimeout(qrDebounce);
  if (pendingQR) { pendingQR.onload = null; pendingQR.onerror = null; pendingQR = null; }
  qrImage.parentElement.classList.add('qr-static');
  if (qrImage.getAttribute('src') !== originalQR) qrImage.src = originalQR;
  qrImage.alt = 'QR tài khoản Techcombank của KIEN NGAN TU, chưa có số tiền';
  qrImage.closest('figure').classList.remove('pending');
  qrOpen.href = originalQR;
  qrOpen.hidden = false;
  qrStatus.textContent = 'QR tài khoản · Chưa có số tiền';
  qrCaption.textContent = 'Nhập số tiền và bấm tạo QR, hoặc quét mã tài khoản để tự nhập tiền.';
  generateButton.disabled = false;
  generateButton.textContent = 'Tạo QR ủng hộ';
  donationForm.setAttribute('aria-busy', 'false');
}
function paintAmountQR(amount, href) {
  qrImage.parentElement.classList.remove('qr-static');
  qrImage.src = href;
  qrImage.alt = 'QR ủng hộ ' + moneyFormat.format(amount) + ' đồng cho KIEN NGAN TU tại Techcombank';
  qrOpen.href = href;
  qrOpen.hidden = false;
  qrImage.closest('figure').classList.remove('pending');
  qrStatus.textContent = 'QR chuyển khoản · ' + moneyFormat.format(amount) + ' ₫';
  qrCaption.textContent = 'Quét mã và kiểm tra thông tin trong ứng dụng ngân hàng. Website không xác nhận giao dịch.';
  generateButton.disabled = false;
  generateButton.textContent = 'Tạo QR ủng hộ';
  donationForm.setAttribute('aria-busy', 'false');
}
function requestAmountQR(amount) {
  const request = ++qrRequest;
  clearTimeout(qrTimeout);
  if (pendingQR) { pendingQR.onload = null; pendingQR.onerror = null; }
  const url = new URL('https://img.vietqr.io/image/techcombank-19076415749012-compact2.png');
  url.search = new URLSearchParams({ amount: String(amount), addInfo: 'Ung ho Ngan Tu', accountName: 'KIEN NGAN TU' }).toString();
  generateButton.disabled = true;
  generateButton.textContent = 'Đang tạo QR…';
  donationForm.setAttribute('aria-busy', 'true');
  qrStatus.textContent = 'Đang tạo QR cho ' + moneyFormat.format(amount) + 'đ…';
  const candidate = new Image();
  pendingQR = candidate;
  candidate.referrerPolicy = 'no-referrer';
  function fail() {
    if (request !== qrRequest) return;
    clearTimeout(qrTimeout);
    candidate.onload = null;
    candidate.onerror = null;
    pendingQR = null;
    qrImage.closest('figure').classList.remove('pending');
    generateButton.disabled = false;
    generateButton.textContent = 'Tạo QR ủng hộ';
    donationForm.setAttribute('aria-busy', 'false');
    qrOpen.hidden = false;
    if (!qrImage.getAttribute('src')) qrImage.src = originalQR;
    qrStatus.textContent = 'Chưa tạo được QR theo số tiền';
    qrCaption.textContent = 'Mã đang hiện vẫn là QR trước đó. Bạn có thể quét mã tài khoản và tự nhập tiền.';
    amountError.textContent = 'Không tải được QR. Kiểm tra Internet rồi thử lại nhé.';
  }
  candidate.onload = () => {
    if (request !== qrRequest) return;
    clearTimeout(qrTimeout);
    pendingQR = null;
    amountError.textContent = '';
    paintAmountQR(amount, url.href);
  };
  candidate.onerror = fail;
  qrTimeout = setTimeout(fail, 15000);
  candidate.src = url.href;
}
function syncAmountButtons() {
  const amount = parseDonationAmount(amountInput.value);
  document.querySelectorAll('[data-amount]').forEach(button => {
    const selected = Number(button.dataset.amount) === amount;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  return amount;
}
function amountChanged() {
  amountError.textContent = '';
  amountInput.removeAttribute('aria-invalid');
  const amount = syncAmountButtons();
  // Editing the amount invalidates all outstanding responses and the old QR.
  showDefaultQR();
  if (!amountInput.value.trim()) { showDefaultQR(); return; }
  if (amount === null) {
    qrCaption.textContent = 'Nhập số tiền hợp lệ từ 1.000đ đến 500.000.000đ để tạo QR theo số tiền.';
    return;
  }
  qrDebounce = setTimeout(() => requestAmountQR(amount), 320);
}
amountInput.addEventListener('input', amountChanged);
document.querySelectorAll('[data-amount]').forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    amountInput.value = moneyFormat.format(Number(button.dataset.amount));
    amountChanged();
  });
});
function submitDonationAmount(event) {
  if (event) event.preventDefault();
  clearTimeout(qrDebounce);
  const amount = parseDonationAmount(amountInput.value);
  if (amount === null) {
    amountError.textContent = 'Nhập số tiền nguyên từ 1.000đ đến 500.000.000đ, ví dụ 50.000.';
    amountInput.setAttribute('aria-invalid', 'true');
    amountInput.focus();
    return;
  }
  amountError.textContent = '';
  amountInput.removeAttribute('aria-invalid');
  amountInput.value = moneyFormat.format(amount);
  requestAmountQR(amount);
}
generateButton.addEventListener('click', submitDonationAmount);
amountInput.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  submitDonationAmount();
});

// Xem ảnh lớn bằng dialog: hỗ trợ điện thoại, bàn phím và Escape.
const memoryLinks = [...document.querySelectorAll('.nt-memory')];
if (memoryLinks.length && typeof HTMLDialogElement !== 'undefined') {
  const viewer = document.createElement('dialog');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-label', 'Bộ ảnh của Ngân Tú');
  viewer.innerHTML = `
    <div class="viewer-top"><strong>NGÂN TÚ / KHOẢNH KHẮC</strong><button type="button" class="viewer-close" aria-label="Đóng ảnh">×</button></div>
    <img class="viewer-image" alt="">
    <div class="viewer-bottom"><p class="viewer-count" aria-live="polite"></p><a class="viewer-original" target="_blank" rel="noopener">Mở ảnh gốc <span class="go" aria-hidden="true"></span></a><div><button type="button" class="viewer-prev" aria-label="Ảnh trước">←</button><button type="button" class="viewer-next" aria-label="Ảnh tiếp theo">→</button></div></div>`;
  document.body.append(viewer);
  let photoIndex = 0;
  let previousOverflow = '';
  let opener;
  function showPhoto(index) {
    photoIndex = (index + memoryLinks.length) % memoryLinks.length;
    const link = memoryLinks[photoIndex];
    const photo = viewer.querySelector('.viewer-image');
    photo.src = link.href;
    photo.alt = link.querySelector('img').alt;
    viewer.querySelector('.viewer-original').href = link.href;
    viewer.querySelector('.viewer-count').textContent = `${link.querySelector('img').alt || 'Khoảnh khắc'} · ${photoIndex + 1}/${memoryLinks.length}`;
  }
  memoryLinks.forEach((link, index) => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    showPhoto(index);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
  }));
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.querySelector('.viewer-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
  viewer.querySelector('.viewer-next').addEventListener('click', () => showPhoto(photoIndex + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  viewer.addEventListener('click', event => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  });
  let photoSwipe = null;
  viewer.addEventListener('pointerdown', event => {
    if (event.target.closest('button, a')) return;
    photoSwipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  viewer.addEventListener('pointerup', event => {
    if (!photoSwipe || photoSwipe.id !== event.pointerId) return;
    const dx = event.clientX - photoSwipe.x;
    const dy = event.clientY - photoSwipe.y;
    photoSwipe = null;
    if (Math.abs(dx) < 48 && Math.abs(dy) < 64) return;
    if (dy > 72 && Math.abs(dy) > Math.abs(dx)) viewer.close();
    else if (Math.abs(dx) > Math.abs(dy)) showPhoto(photoIndex + (dx < 0 ? 1 : -1));
  });
  viewer.addEventListener('pointercancel', () => { photoSwipe = null; });
}

// Bảng đổi màu nhấn, không gửi dữ liệu ra ngoài.
const styleControls = document.createElement('aside');
styleControls.className = 'style-controls';
styleControls.setAttribute('aria-label', 'Tùy chỉnh giao diện');
styleControls.innerHTML = `
  <button class="style-toggle" type="button" aria-expanded="false" aria-controls="style-panel" aria-label="Tùy chỉnh giao diện"><span aria-hidden="true"></span></button>
  <div class="style-panel" id="style-panel" hidden><div class="style-panel-head"><p class="eyebrow">GIAO DIỆN</p><h3>Tinh chỉnh</h3><button class="style-close" type="button" aria-label="Đóng bảng màu">×</button></div><p class="style-lead">Màu, ánh sáng và nhịp chuyển động. Lưu ngay trên máy bạn.</p><h4 class="fx-label">Màu nhấn</h4>
    <div class="accent-options" role="group" aria-label="Màu nhấn">
      <button type="button" data-accent-choice="violet" aria-pressed="true"><i style="--swatch:linear-gradient(135deg,#7ee8ee,#bb8cff)" aria-hidden="true"></i>Tím</button>
      <button type="button" data-accent-choice="ice" aria-pressed="false"><i style="--swatch:linear-gradient(135deg,#9bf7e6,#66cfff)" aria-hidden="true"></i>Xanh băng</button>
      <button type="button" data-accent-choice="rose" aria-pressed="false"><i style="--swatch:linear-gradient(135deg,#ffc1de,#d99aff)" aria-hidden="true"></i>Hồng</button>
    </div>
  </div>`;
document.body.append(styleControls);
const styleToggle = styleControls.querySelector('.style-toggle');
const stylePanel = styleControls.querySelector('.style-panel');
const accentButtons = [...styleControls.querySelectorAll('[data-accent-choice]')];
const themePresets = {
  violet: ['#7ee8ee', '#bb8cff', '#18112e'],
  ice: ['#9bf7e6', '#66cfff', '#0b2530'],
  rose: ['#ffc1de', '#d99aff', '#301329']
};
stylePanel.insertAdjacentHTML('beforeend', `
  <div class="custom-colors"><p>Phối màu của bạn</p>
    <label>Màu chính<input type="color" id="theme-first" value="#7ee8ee"></label>
    <label>Màu phụ<input type="color" id="theme-second" value="#bb8cff"></label>
    <label>Sắc nền tối<input type="color" id="theme-base" value="#18112e"></label>
    <small>Dùng nút mặt trời trên thanh điều hướng để chuyển nền trắng. Sắc nền ở đây áp dụng cho chế độ tối.</small>
  </div>`);
stylePanel.insertAdjacentHTML('beforeend', '<h4 class="fx-label">Ánh sáng</h4><label class="glow-option glow-shortcut" title="Bật/tắt ánh sáng theo chuột"><span aria-hidden="true">✧</span> Ánh sáng theo chuột<input type="checkbox" id="global-glow-toggle" aria-label="Ánh sáng theo chuột"><span class="glow-switch" aria-hidden="true"></span></label>');
styleControls.querySelector('.style-close').addEventListener('click', () => { closeStylePanel(); styleToggle.focus({ preventScroll: true }); });
const colorInputs = ['theme-first', 'theme-second', 'theme-base'].map(id => document.getElementById(id));
function hexRGB(hex) { return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)); }
function applyTheme(colors, choice = 'custom') {
  if (!Array.isArray(colors) || colors.length !== 3 || !colors.every(color => /^#[0-9a-f]{6}$/i.test(color))) return;
  const root = document.documentElement;
  const first = hexRGB(colors[0]);
  const second = hexRGB(colors[1]);
  const base = hexRGB(colors[2]).map(value => Math.round(7 + value * .12));
  const readable = values => values.map(value => Math.round(150 + value * .41));
  root.dataset.accent = choice;
  root.style.setProperty('--cyan', `rgb(${readable(first).join(',')})`);
  root.style.setProperty('--purple', `rgb(${readable(second).join(',')})`);
  root.style.setProperty('--gradient', `linear-gradient(110deg,rgb(${readable(first)}),rgb(${readable(second)}))`);
  root.style.setProperty('--glow-rgb', second.join(','));
  root.style.setProperty('--first-rgb', first.join(','));
  root.style.setProperty('--theme-bg', `rgb(${base.join(',')})`);
  root.style.setProperty('--theme-surface', `rgb(${base.map(value => value + 7).join(',')})`);
  colorInputs.forEach((input, index) => { input.value = colors[index]; });
  accentButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.accentChoice === choice)));
}
function setAccent(choice) {
  if (!themePresets[choice]) return;
  applyTheme(themePresets[choice], choice);
  try { localStorage.removeItem('ngan-tu-custom-colors'); localStorage.setItem('ngan-tu-accent', choice); } catch {}
}
function pickVisitAccent() {
  try {
    const custom = JSON.parse(localStorage.getItem('ngan-tu-custom-colors') || 'null');
    if (Array.isArray(custom) && custom.length === 3 && custom.every(color => /^#[0-9a-f]{6}$/i.test(color))) return { custom };
    const saved = localStorage.getItem('ngan-tu-accent');
    if (themePresets[saved]) return { choice: saved };
  } catch {}
  return { choice: 'violet' };
}
const visitAccent = pickVisitAccent();
if (visitAccent.custom) applyTheme(visitAccent.custom, 'custom');
else applyTheme(themePresets[visitAccent.choice], visitAccent.choice);
colorInputs.forEach(input => input.addEventListener('input', () => {
  const colors = colorInputs.map(field => field.value);
  applyTheme(colors);
  try { localStorage.setItem('ngan-tu-custom-colors', JSON.stringify(colors)); } catch {}
}));
let styleCloseTimer = 0;
function closeStylePanel() {
  stylePanel.classList.remove('is-open');
  styleToggle.setAttribute('aria-expanded', 'false');
  clearTimeout(styleCloseTimer);
  styleCloseTimer = setTimeout(() => {
    if (!stylePanel.classList.contains('is-open')) stylePanel.hidden = true;
  }, 220);
}
styleToggle.addEventListener('click', () => {
  const opening = stylePanel.hidden || !stylePanel.classList.contains('is-open');
  if (opening) {
    clearTimeout(styleCloseTimer);
    stylePanel.hidden = false;
    styleToggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => stylePanel.classList.add('is-open'));
  } else closeStylePanel();
});
accentButtons.forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.accentChoice;
  setAccent(choice);
  try { localStorage.setItem('ngan-tu-accent', choice); } catch { /* Không bắt buộc phải lưu. */ }
}));
document.addEventListener('click', event => {
  if (!styleControls.contains(event.target)) closeStylePanel();
});
styleControls.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeStylePanel(); styleToggle.focus({ preventScroll: true }); }
});
// Ánh sáng từng card do enhance.js cập nhật cùng tilt, một lần mỗi frame.


// NHẠC NỀN: thêm bài mới vào danh sách này, đặt file trong thư mục audio.
const musicPlaylist = [
  { title: 'Preah Thorng — ព្រះថោង Remix', artist: 'AI Remix ft. All3rgy', src: 'audio/preah-thorng.mp3', cover: 'images/cover-preah-thorng.jpg' },
  { title: 'នារី High Show V2', artist: 'Thanz', src: 'audio/high-show-v2.mp3', cover: 'images/cover-high-show-v2.jpg' },
  { title: 'កំរ (Kom ro)', artist: 'MUT PHEARIN, YCN TOMIE', src: 'audio/kom-ro.mp3', cover: 'images/cover-kom-ro.jpg' },
  { title: 'Thiên đường với người thương', artist: 'Phương Mỹ Chi × DTAP', src: 'audio/thien-duong-voi-nguoi-thuong.mp3', cover: 'images/cover-thien-duong.jpg' },
  { title: 'យ៉ាប់នេះយ៉ាប់ (La Mii Remix)', artist: 'ព្រាប សុវត្ថិ · La Mii Remix', src: 'audio/yab-nih-yab.mp3', cover: 'images/cover-yab-nih-yab.jpg' },
  { title: 'សូរិយា (អេតាស៊ីវិល)', artist: 'All3rgy & Jenna Norodom', src: 'audio/soriya.mp3', cover: 'images/cover-soriya.jpg' }
];
const introBgm = window.ntBgm instanceof HTMLAudioElement ? window.ntBgm : null;
const musicAudio = introBgm || new Audio();
const defaultVolume = 0.5;
musicAudio.preload = 'metadata';
musicAudio.playsInline = true;
musicAudio.setAttribute('playsinline', '');
musicAudio.volume = defaultVolume;
let musicIndex = 3;
try {
  const storedTrack = sessionStorage.getItem('nt-visit-track');
  const saved = storedTrack === null ? NaN : Number(storedTrack);
  if (Number.isInteger(saved) && saved >= 0 && saved < musicPlaylist.length) musicIndex = saved;
  else {
    localStorage.setItem('nt-last-track', String(musicIndex));
    sessionStorage.setItem('nt-visit-track', String(musicIndex));
  }
} catch (error) {}
let shuffleMusic = false;
function nextMusicIndex() {
  if (!shuffleMusic || musicPlaylist.length < 2) return (musicIndex + 1) % musicPlaylist.length;
  return (musicIndex + 1 + Math.floor(Math.random() * (musicPlaylist.length - 1))) % musicPlaylist.length;
}
let musicRequest = 0;
const musicWidget = document.createElement('aside');
musicWidget.className = 'music-widget compact';
musicWidget.setAttribute('aria-label', 'Trình phát nhạc');
musicWidget.innerHTML = `
 <button class="hamster-mascot" type="button" aria-label="Bấm vào để chỉnh nhạc" aria-expanded="false" aria-controls="music-shell"><span class="hamster-dance" aria-hidden="true"></span><span class="hamster-tip">Bấm vào để chỉnh nhạc</span></button>
 <div class="music-mini"><img class="ios-mini-cover" alt="" width="44" height="44"><div class="music-mini-label"><strong></strong><span>Nhạc cùng Ngân Tú</span></div><div class="music-mini-actions"><button class="mini-play" type="button">Bật nhạc</button><button class="music-expand" type="button" aria-label="Mở trình phát nhạc" aria-expanded="false" aria-controls="music-shell"><span class="go" aria-hidden="true"></span></button></div></div>
 <div class="music-shell" id="music-shell" hidden>
  <div class="music-head"><span>NGÂN TÚ / MUSIC</span><div><button class="music-close" type="button" aria-label="Đóng menu nhạc">×</button></div></div>
  <div class="music-track"><div class="music-cover" aria-hidden="true"><div class="music-disc"></div><img class="music-cover-image" alt="" hidden></div><div class="music-info"><h3 class="music-title"></h3><p class="music-artist"></p></div></div>
  <p class="music-status" role="status" aria-live="polite">Bấm bật nhạc để nghe</p>
  <input class="music-seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="Tua bài hát" disabled>
  <div class="music-times"><span class="music-current">0:00</span><span class="music-duration">0:00</span></div>
  <div class="music-controls"><button class="music-prev" type="button" aria-label="Bài trước">❮</button><button class="music-play" type="button">Bật nhạc</button><button class="music-next" type="button" aria-label="Bài tiếp theo">❯</button></div>
  <div class="music-volume"><label for="music-volume">Âm lượng</label><input id="music-volume" type="range" min="0" max="1" step="0.01" value="0.5"></div>
  <div class="playlist-heading"><span>Danh sách phát</span><span>${String(musicPlaylist.length).padStart(2, '0')} BÀI</span></div><div class="music-playlist" role="group" aria-label="Chọn bài hát"></div>
  <div class="music-footer"><span>Tự chuyển bài · Lặp danh sách</span><button class="music-off" type="button">Tắt nhạc</button></div>
 </div>`;
// Giữ hàng nút đóng ở ngoài vùng cuộn để luôn bấm được.
const playerShell = musicWidget.querySelector('.music-shell');
const playerBody = document.createElement('div');
playerBody.className = 'music-body';
[...playerShell.children].forEach(child => {
  if (!child.classList.contains('music-head')) playerBody.append(child);
});
playerShell.append(playerBody);
const playerBars = document.createElement('span');
playerBars.className = 'music-bars';
playerBars.setAttribute('aria-hidden', 'true');
playerBars.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
musicWidget.querySelector('.music-head > span').append(playerBars);
document.body.append(musicWidget);
musicWidget.style.left = '78px';
musicWidget.style.right = 'auto';
musicWidget.style.bottom = '14px';
const musicEl = selector => musicWidget.querySelector(selector);
musicPlaylist.forEach((track, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'playlist-track';
  button.dataset.track = index;
  button.setAttribute('aria-label', `Phát ${track.title} — ${track.artist}`);
  button.setAttribute('aria-pressed', 'false');
  const image = document.createElement('img');
  image.src = track.cover;
  image.alt = '';
  image.loading = 'lazy';
  const details = document.createElement('span');
  details.className = 'playlist-details';
  const title = document.createElement('strong');
  title.textContent = track.title;
  const artist = document.createElement('small');
  artist.textContent = track.artist;
  details.append(title, artist);
  const indicator = document.createElement('span');
  indicator.className = 'playlist-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.textContent = '▷';
  button.append(image, details, indicator);
  button.addEventListener('click', () => {
    if (musicIndex === index) toggleMusic();
    else { musicByUser = true; loadMusic(index); playMusic(); }
  });
  musicEl('.music-playlist').append(button);
});
const musicCoverImage = musicEl('.music-cover-image');
musicCoverImage.addEventListener('error', () => { musicCoverImage.hidden = true; });
function musicTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}
function musicStatus(message) {
  musicEl('.music-status').textContent = message;
  musicEl('.music-mini-label span').textContent = message;
}
function musicButtons() {
  const playing = !musicAudio.paused && !musicAudio.ended;
  musicWidget.classList.toggle('is-playing', playing);
  musicWidget.querySelectorAll('.playlist-track').forEach((button, index) => {
    button.querySelector('.playlist-indicator').textContent = index === musicIndex && playing ? 'Ⅱ' : '▷';
    button.setAttribute('aria-label', `${index === musicIndex && playing ? 'Tạm dừng' : 'Phát'} ${musicPlaylist[index].title} — ${musicPlaylist[index].artist}`);
  });
  musicEl('.music-play').textContent = playing ? 'Tạm dừng' : 'Phát nhạc';
  musicEl('.mini-play').textContent = playing ? 'Dừng' : 'Bật nhạc';
  musicEl('.mini-play').setAttribute('aria-label', playing ? 'Tạm dừng nhạc' : 'Phát nhạc');
}
let probedDuration = 0;
const probedDurations = new Map();
function findAscii(bytes, text, from = 0) {
  const start = Math.max(0, from);
  for (let i = start; i <= bytes.length - text.length; i++) {
    let matched = true;
    for (let j = 0; j < text.length; j++) {
      if (bytes[i + j] !== text.charCodeAt(j)) { matched = false; break; }
    }
    if (matched) return i;
  }
  return -1;
}
function readU32(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}
function mp3DurationFromHeader(bytes, totalBytes) {
  let offset = 0;
  if (bytes.length > 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    offset = 10 + (((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f));
  }
  let sampleRate = 44100;
  let bitrate = 0;
  if (offset + 3 < bytes.length && bytes[offset] === 0xff && (bytes[offset + 1] & 0xe0) === 0xe0) {
    const mpeg1 = ((bytes[offset + 1] >> 3) & 3) === 3;
    const layer3 = ((bytes[offset + 1] >> 1) & 3) === 1;
    const brIndex = (bytes[offset + 2] >> 4) & 0xf;
    const srIndex = (bytes[offset + 2] >> 2) & 3;
    const brTable = mpeg1 && layer3
      ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
      : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
    const srTable = mpeg1 ? [44100, 48000, 32000] : [22050, 24000, 16000];
    bitrate = (brTable[brIndex] || 0) * 1000;
    sampleRate = srTable[srIndex] || sampleRate;
  }
  const tagAt = Math.max(findAscii(bytes, 'Xing', offset), findAscii(bytes, 'Info', offset));
  if (tagAt >= 0 && tagAt + 16 <= bytes.length) {
    const flags = readU32(bytes, tagAt + 4);
    if ((flags & 1) && tagAt + 12 <= bytes.length) {
      const frames = readU32(bytes, tagAt + 8);
      if (frames > 0 && sampleRate) return frames * 1152 / sampleRate;
    }
  }
  if (bitrate > 0 && totalBytes > 0) return totalBytes * 8 / bitrate;
  return 0;
}
function knownDuration() {
  const duration = musicAudio.duration;
  if (Number.isFinite(duration) && duration > 0) return duration;
  return probedDuration || 0;
}
function rememberDuration(src, seconds) {
  if (!(seconds > 1)) return;
  probedDurations.set(src, seconds);
  if (musicPlaylist[musicIndex] && musicAudio.src.endsWith(musicPlaylist[musicIndex].src) && src.endsWith(musicPlaylist[musicIndex].src)) {
    probedDuration = seconds;
    syncMusicClock();
  }
}
function probeTrackDuration(src) {
  const absolute = new URL(src, location.href).href;
  if (probedDurations.has(absolute)) return Promise.resolve(probedDurations.get(absolute));
  return fetch(absolute, { headers: { Range: 'bytes=0-65535' } })
    .then(response => Promise.all([
      response.arrayBuffer(),
      response.headers.get('content-range') || '',
      Number(response.headers.get('content-length')) || 0
    ]))
    .then(([buffer, range, length]) => {
      const total = Number((range.match(/\/(\d+)\s*$/) || [])[1]) || length;
      const seconds = mp3DurationFromHeader(new Uint8Array(buffer), total);
      if (seconds > 1) probedDurations.set(absolute, seconds);
      return seconds;
    })
    .catch(() => 0);
}
function armMusicLoad() {
  musicAudio.preload = 'metadata';
  musicAudio.playsInline = true;
  if (!musicAudio.isConnected) {
    musicAudio.hidden = true;
    musicAudio.setAttribute('aria-hidden', 'true');
    document.body.append(musicAudio);
  }
  const waiting = musicAudio.paused && musicAudio.readyState < 1 && musicAudio.networkState !== HTMLMediaElement.NETWORK_LOADING;
  if (waiting) {
    try { musicAudio.load(); } catch (error) {}
  }
}
function syncMusicClock() {
  const duration = knownDuration();
  const ready = duration > 0;
  const seek = musicEl('.music-seek');
  musicEl('.music-duration').textContent = musicTime(ready ? duration : 0);
  const current = musicAudio.currentTime;
  musicEl('.music-current').textContent = musicTime(Number.isFinite(current) ? current : 0);
  seek.disabled = !ready;
  if (ready && document.activeElement !== seek) seek.value = String(Math.min(100, (current || 0) / duration * 100));
}
function loadMusic(index, keepTime) {
  musicRequest++;
  musicIndex = (index + musicPlaylist.length) % musicPlaylist.length;
  const track = musicPlaylist[musicIndex];
  const sameTrack = keepTime && musicAudio.src && musicAudio.src.endsWith(track.src);
  if (!sameTrack) musicAudio.src = track.src;
  musicEl('.music-title').textContent = track.title;
  musicEl('.music-mini-label strong').textContent = track.title;
  musicEl('.music-artist').textContent = track.artist;
  musicEl('.music-cover').dataset.cover = String(musicIndex);
  musicCoverImage.hidden = false;
  musicCoverImage.src = track.cover;
  const miniCover = musicEl('.ios-mini-cover');
  if (miniCover) miniCover.src = track.cover;
  musicWidget.querySelectorAll('.playlist-track').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === musicIndex));
  });
  if (!sameTrack && musicAudio.readyState < 1) {
    musicEl('.music-seek').value = 0;
    musicEl('.music-seek').disabled = true;
    musicEl('.music-current').textContent = '0:00';
    musicEl('.music-duration').textContent = '0:00';
    probedDuration = 0;
  }
  syncMusicClock();
  musicButtons();
  armMusicLoad();
  const trackSrc = track.src;
  probeTrackDuration(trackSrc).then(seconds => rememberDuration(trackSrc, seconds));
}
let musicByUser = false;
async function playMusic() {
  const request = ++musicRequest;
  musicStatus('Đang mở nhạc…');
  window.ntUserHeldMusic = false;
  try {
    musicAudio.muted = false;
    if (!musicAudio.volume) musicAudio.volume = defaultVolume;
    await musicAudio.play();
    phoneAuto = false;
  } catch (error) {
    if (request !== musicRequest || error.name === 'AbortError') return;
    if (error.name === 'NotAllowedError') {
      musicStatus('Bấm nút phát để nghe nhạc');
      musicButtons();
      return;
    }
    musicButtons();
    musicStatus('Không tải được bài · Hãy thử chuyển bài');
  }
}
function toggleMusic() {
  if (musicAudio.paused) { musicByUser = true; playMusic(); }
  else { phoneAuto = false; window.ntUserHeldMusic = true; musicByUser = false; musicRequest++; musicAudio.pause(); musicStatus('Đã tạm dừng'); }
}
function stopMusic() {
  musicByUser = false;
  phoneAuto = false;
  window.ntUserHeldMusic = true;
  musicRequest++;
  musicAudio.pause();
  musicAudio.currentTime = 0;
  musicStatus('Đã tắt nhạc');
  musicButtons();
}
let pinMusic = null;
let ignoreMusicConstrain = false;
function musicMenuWidth() {
  return Math.min(292, window.innerWidth - 24);
}
function compactMusic(compact) {
  const hamster = musicEl('.hamster-mascot');
  ignoreMusicConstrain = true;
  const anchor = document.querySelector('.style-toggle') || document.querySelector('.style-controls');
  const bar = anchor ? anchor.getBoundingClientRect() : null;
  const hamSize = hamster.offsetWidth || 68;
  musicWidget.classList.remove('flip-left', 'is-settling');
  if (!compact && bar) {
    const hamRight = bar.right + 8 + hamSize;
    const spaceRight = window.innerWidth - hamRight - 12;
    const spaceLeft = bar.right + 8 - 12;
    const menuW = musicMenuWidth();
    musicWidget.classList.toggle('flip-left', menuW > spaceRight && spaceLeft >= spaceRight);
  }
  musicWidget.classList.toggle('compact', compact);
  musicEl('.music-mini').hidden = !compact;
  musicEl('.music-shell').hidden = compact;
  hamster.setAttribute('aria-expanded', String(!compact));
  hamster.setAttribute('aria-label', 'Bấm vào để chỉnh nhạc');
  if (pinMusic) pinMusic();
  requestAnimationFrame(() => {
    if (pinMusic) pinMusic();
    ignoreMusicConstrain = false;
  });
}
musicEl('.music-play').addEventListener('click', toggleMusic);
musicEl('.mini-play').addEventListener('click', toggleMusic);
musicEl('.music-next').addEventListener('click', () => { musicByUser = true; loadMusic(nextMusicIndex()); playMusic(); });
musicEl('.music-prev').addEventListener('click', () => { musicByUser = true; loadMusic(musicIndex - 1); playMusic(); });
musicEl('.music-off').addEventListener('click', stopMusic);
musicEl('.music-close').addEventListener('click', () => compactMusic(true));
musicEl('.hamster-mascot').addEventListener('click', () => compactMusic(!musicEl('.music-shell').hidden));
let hamsterHolding = false;
let hamsterIntro = true;
let hamsterHintTimer = 0;
const hamsterTip = musicEl('.hamster-tip');
function scheduleHamsterHint(delay) {
  clearTimeout(hamsterHintTimer);
  hamsterHintTimer = setTimeout(() => {
    hamsterIntro = false;
    if (!hamsterHolding && hamsterTip) hamsterTip.classList.remove('is-on');
  }, delay);
}
if (hamsterTip) hamsterTip.classList.add('is-on');
if (matchMedia('(hover: hover) and (pointer: fine)').matches) scheduleHamsterHint(5000);
else window.addEventListener('nt-motion-choice', () => scheduleHamsterHint(3000), { once: true });
musicEl('.hamster-mascot').addEventListener('pointerdown', () => {
  hamsterHolding = true;
  if (hamsterIntro) return;
  clearTimeout(hamsterHintTimer);
  if (hamsterTip) hamsterTip.classList.add('is-on');
});
function hideHamsterHint() {
  if (!hamsterHolding) return;
  hamsterHolding = false;
  if (hamsterIntro || !hamsterTip) return;
  hamsterTip.classList.remove('is-on');
}
window.addEventListener('pointerup', hideHamsterHint);
window.addEventListener('pointercancel', hideHamsterHint);
musicWidget.addEventListener('keydown', event => { if (event.key === 'Escape' && !musicEl('.music-shell').hidden) compactMusic(true); });
function bindPhoneRange(input, onValue) {
  const valueAt = clientX => {
    const rect = input.getBoundingClientRect();
    const span = Number(input.max) - Number(input.min) || 1;
    const ratio = rect.width ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
    return Number(input.min) + ratio * span;
  };
  const apply = clientX => {
    if (input.disabled) return;
    const value = valueAt(clientX);
    input.value = String(value);
    onValue(value);
  };
  const track = event => {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    apply(event.touches[0].clientX);
  };
  input.addEventListener('touchstart', track, { passive: false });
  input.addEventListener('touchmove', track, { passive: false });
}
const volumeInput = musicEl('#music-volume');
volumeInput.value = String(defaultVolume);
volumeInput.addEventListener('input', event => { musicAudio.volume = Number(event.target.value); });
bindPhoneRange(volumeInput, value => { musicAudio.volume = value; });
const seekInput = musicEl('.music-seek');
seekInput.addEventListener('input', event => {
  const duration = knownDuration();
  if (duration > 0) musicAudio.currentTime = duration * Number(event.target.value) / 100;
});
bindPhoneRange(seekInput, value => {
  const duration = knownDuration();
  if (duration > 0) musicAudio.currentTime = duration * value / 100;
});
musicAudio.addEventListener('loadedmetadata', syncMusicClock);
musicAudio.addEventListener('durationchange', syncMusicClock);
musicAudio.addEventListener('timeupdate', syncMusicClock);
musicAudio.addEventListener('playing', () => { musicButtons(); musicStatus('Đang phát · ' + (musicIndex + 1) + '/' + musicPlaylist.length); });
musicAudio.addEventListener('pause', musicButtons);
musicAudio.addEventListener('waiting', () => { if (!musicAudio.paused) musicStatus('Đang tải nhạc…'); });
musicAudio.addEventListener('ended', () => {
  if (window.ntUserHeldMusic) return;
  loadMusic(nextMusicIndex());
  playMusic();
});
musicAudio.addEventListener('error', () => { musicButtons(); musicStatus('Không tải được bài · Hãy thử chuyển bài'); });
if (introBgm) loadMusic(musicIndex, true);
else loadMusic(musicIndex);
musicButtons();
// Playback starts only through a music control, never from unrelated taps.
// Restore the original visit autoplay, with gesture fallback for browser policy.
let phoneAuto = !window.ntUserHeldMusic;
let musicStarting = false;
const musicAutoEvents = new AbortController();
const musicGestureSelector = '.music-widget, .nt-music-float, [data-music-action]';
function startPhoneMusic(event) {
  if (window.ntUserHeldMusic || !phoneAuto || musicStarting) return;
  if (!musicAudio.paused && !musicAudio.muted) { phoneAuto = false; musicAutoEvents.abort(); return; }
  if (event?.target?.closest?.(musicGestureSelector)) return;
  musicStarting = true;
  musicByUser = true;
  playMusic().finally(() => { musicStarting = false; });
}
['pointerdown', 'pointerup', 'touchstart', 'touchend', 'click', 'keydown', 'wheel', 'scroll'].forEach(type => {
  window.addEventListener(type, startPhoneMusic, { capture: true, passive: true, signal: musicAutoEvents.signal });
});
musicAudio.addEventListener('playing', () => { phoneAuto = false; musicAutoEvents.abort(); }, { once: true });
startPhoneMusic();

// Quầng sáng toàn trang: chuột, bút cảm ứng và thao tác vuốt trên điện thoại.
const globalGlow = document.createElement('div');
globalGlow.className = 'global-pointer-glow';
globalGlow.setAttribute('aria-hidden', 'true');
document.body.append(globalGlow);
const glowToggle = document.getElementById('global-glow-toggle');
const glowMotion = matchMedia('(prefers-reduced-motion: reduce)');
let glowEnabled = false;
try { glowEnabled = localStorage.getItem('ngan-tu-global-glow') === 'on'; } catch {}
glowToggle.checked = glowEnabled;
let glowTimer;
let glowX = innerWidth / 2;
let glowY = innerHeight * .65;
function hideGlobalGlow() { globalGlow.classList.remove('shown'); }
function moveGlobalGlow(x, y) {
  if (document.documentElement.dataset.depth === 'off') { hideGlobalGlow(); return; }
  if (!glowEnabled || glowMotion.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  glowX = x;
  glowY = y;
  clearTimeout(glowTimer);
  globalGlow.style.transform = `translate3d(${glowX}px,${glowY}px,0) translate(-50%,-50%)`;
  globalGlow.classList.add('shown');
  glowTimer = setTimeout(hideGlobalGlow, 900);
}
window.applyPointerGlow = moveGlobalGlow;
window.addEventListener('blur', hideGlobalGlow);
glowToggle.addEventListener('change', () => {
  glowEnabled = glowToggle.checked;
  if (!glowEnabled) hideGlobalGlow();
  try { localStorage.setItem('ngan-tu-global-glow', glowEnabled ? 'on' : 'off'); } catch {}
});


// Kéo các tiện ích bằng tay nắm; không cản nút bấm, thanh tua hoặc cuộn trang.
function makeWidgetDraggable(widget) {
  let drag = null;
  let moved = false;
  let preferred = null;
  const storageKey = widget.classList.contains('music-widget') ? null : null;
  function persistPosition() {
    if (!storageKey || !preferred) return;
    try { localStorage.setItem(storageKey, JSON.stringify(preferred)); } catch { /* Không bắt buộc phải lưu. */ }
  }
  function bounds() {
    const viewport = window.visualViewport;
    const margin = 12;
    return {
      left: (viewport?.offsetLeft || 0) + margin,
      top: (viewport?.offsetTop || 0) + margin,
      width: (viewport?.width || innerWidth) - margin * 2,
      height: (viewport?.height || innerHeight) - margin * 2
    };
  }
  function clampMusic(left, top, rect) {
    const b = bounds();
    const maxLeft = Math.max(b.left, b.left + b.width - rect.width);
    const maxTop = Math.max(b.top, b.top + b.height - rect.height);
    return {
      left: Math.min(Math.max(left, b.left), maxLeft),
      top: Math.min(Math.max(top, b.top), maxTop)
    };
  }
  function place(left, top, remember = true) {
    const rect = widget.getBoundingClientRect();
    let next = widget.classList.contains('music-widget')
      ? clampMusic(left, top, rect)
      : (() => {
        const b = bounds();
        return {
          left: Math.min(Math.max(left, b.left), Math.max(b.left, b.left + b.width - rect.width)),
          top: Math.min(Math.max(top, b.top), Math.max(b.top, b.top + b.height - rect.height))
        };
      })();
    if (remember) preferred = next;
    widget.style.left = next.left + 'px';
    widget.style.top = next.top + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    moved = true;
    positionColorPanel();
  }
  function snapMusic(left, top) {
    const rect = widget.getBoundingClientRect();
    const b = bounds();
    const maxLeft = Math.max(b.left, b.left + b.width - rect.width);
    const maxTop = Math.max(b.top, b.top + b.height - rect.height);
    const pull = 32;
    if (left - b.left < pull) left = b.left;
    else if (maxLeft - left < pull) left = maxLeft;
    if (top - b.top < pull) top = b.top;
    else if (maxTop - top < pull) top = maxTop;
    return clampMusic(left, top, rect);
  }
  function dockHamster() {
    const anchor = document.querySelector('.style-toggle') || document.querySelector('.style-controls');
    const hamster = widget.querySelector('.hamster-mascot');
    if (!anchor || !hamster) return;
    const bar = anchor.getBoundingClientRect();
    const ham = hamster.getBoundingClientRect();
    const box = widget.getBoundingClientRect();
    const hamLeft = bar.right + 8;
    const left = widget.classList.contains('flip-left') && !widget.classList.contains('compact')
      ? hamLeft + ham.width - box.width
      : hamLeft - (ham.left - box.left);
    const top = bar.top + (bar.height - ham.height) / 2 - (ham.top - box.top);
    widget.style.left = left + 'px';
    widget.style.top = top + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  }
  function constrain() {
    if (widget.classList.contains('music-widget')) {
      if (!ignoreMusicConstrain) dockHamster();
      return;
    }
    if (ignoreMusicConstrain) return;
    if (!moved) { positionColorPanel(); return; }
    const rect = widget.getBoundingClientRect();
    place(preferred ? preferred.left : rect.left, preferred ? preferred.top : rect.top, false);
  }
  // Kéo trên toàn bộ bề mặt; chạm nhẹ vẫn bấm nút bình thường.
  let suppressClick = false;
  widget.addEventListener('pointerdown', event => {
    if (widget.classList.contains('music-widget')) return;
    if (event.button !== 0) return;
    if (event.target.closest('button, a, input, select, textarea, label, .style-panel, .music-controls, .music-volume, .music-playlist') && !event.target.closest('.hamster-mascot')) return;
    const rect = widget.getBoundingClientRect();
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      x: event.clientX - rect.left, y: event.clientY - rect.top, active: false };
  });
  widget.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 7) return;
    if (!drag.active) {
      drag.active = true;
      widget.setPointerCapture(event.pointerId);
      widget.classList.add('widget-dragging');
      widget.classList.remove('is-settling');
      suppressClick = true;
    }
    event.preventDefault();
    place(event.clientX - drag.x, event.clientY - drag.y);
  }, { passive: false });
  function release() {
    const dragged = Boolean(drag && drag.active);
    drag = null;
    widget.classList.remove('widget-dragging');
    if (dragged) persistPosition();
    setTimeout(() => { suppressClick = false; }, 0);
  }
  widget.addEventListener('pointerup', release);
  widget.addEventListener('pointercancel', release);
  widget.addEventListener('lostpointercapture', release);
  widget.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  widget.addEventListener('dragstart', event => event.preventDefault());
  widget.tabIndex = 0;
  widget.title = 'Kéo để di chuyển · Khi chọn bảng, dùng phím mũi tên để di chuyển';
  widget.addEventListener('keydown', event => {
    if (event.target !== widget || widget.classList.contains('music-widget')) return;
    if (event.key === 'Home') {
      event.preventDefault(); moved = false; preferred = null;
      ['top', 'left', 'right', 'bottom'].forEach(key => widget.style.removeProperty(key));
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* Giữ vị trí mặc định. */ } }
      positionColorPanel(); return;
    }
    const steps = { ArrowLeft: [-20,0], ArrowRight: [20,0], ArrowUp: [0,-20], ArrowDown: [0,20] };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const rect = widget.getBoundingClientRect(); place(rect.left + step[0], rect.top + step[1]);
    persistPosition();
  });
  window.addEventListener('resize', constrain);
  window.visualViewport?.addEventListener('resize', constrain);
  if ('ResizeObserver' in window) new ResizeObserver(constrain).observe(widget);
  if (widget.classList.contains('music-widget')) {
    pinMusic = dockHamster;
    widget.title = 'Bấm để mở nhạc';
    try {
      localStorage.removeItem('ngan-tu-hamster-pos');
      localStorage.removeItem('ngan-tu-hamster-pos-v2');
      localStorage.removeItem('ngan-tu-player-pos');
    } catch { /* Không cần nhớ vị trí cũ. */ }
    requestAnimationFrame(dockHamster);
  } else if (storageKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        requestAnimationFrame(() => place(saved.left, saved.top));
      } else requestAnimationFrame(alignHamsterToTheme);
    } catch { requestAnimationFrame(alignHamsterToTheme); }
  }
  function alignHamsterToTheme() {
    const controls = document.querySelector('.style-controls');
    if (!controls) return;
    const bar = controls.getBoundingClientRect();
    const ham = widget.getBoundingClientRect();
    place(bar.right + 8, bar.top + (bar.height - ham.height) / 2);
  }
}
function positionColorPanel() {
  if (stylePanel.hidden) return;
  if (window.matchMedia('(max-width: 820px)').matches) {
    ['left', 'top', 'right', 'bottom', 'width'].forEach(key => stylePanel.style.removeProperty(key));
    return;
  }
  const anchor = styleControls.getBoundingClientRect();
  const panel = stylePanel.getBoundingClientRect();
  const width = window.visualViewport?.width || innerWidth;
  const height = window.visualViewport?.height || innerHeight;
  const top = anchor.top - panel.height - 10;
  stylePanel.style.left = Math.max(8, Math.min(anchor.left, width - panel.width - 8)) + 'px';
  stylePanel.style.top = Math.max(8, Math.min(top >= 8 ? top : anchor.bottom + 10, height - panel.height - 8)) + 'px';
}
styleToggle.addEventListener('click', positionColorPanel);
window.addEventListener('resize', positionColorPanel);
makeWidgetDraggable(musicWidget);


// Góc riêng: đồng bộ bài hát hiện tại và chế độ phát ngẫu nhiên.
function syncLifeMusic() {
  const track = musicPlaylist[musicIndex];
  document.getElementById('life-song-title').textContent = track.title;
  document.getElementById('life-song-artist').textContent = track.artist;
  document.getElementById('life-song-cover').src = track.cover;
  document.getElementById('life-song-state').textContent = musicAudio.paused ? 'Đang chọn · Bấm mở để nghe' : 'Đang phát trên trang này';
}
['playing', 'pause', 'loadstart', 'loadedmetadata'].forEach(event => musicAudio.addEventListener(event, syncLifeMusic));
syncLifeMusic();
document.getElementById('life-open-music').addEventListener('click', () => compactMusic(false));
const shuffleButton = document.createElement('button');
shuffleButton.className = 'shuffle-button';
shuffleButton.type = 'button';
shuffleButton.textContent = '⇄ Ngẫu nhiên';
shuffleButton.setAttribute('aria-pressed', 'false');
musicEl('.playlist-heading').after(shuffleButton);
shuffleButton.addEventListener('click', () => {
  shuffleMusic = !shuffleMusic;
  shuffleButton.setAttribute('aria-pressed', String(shuffleMusic));
  musicEl('.music-footer span').textContent = shuffleMusic ? 'Ngẫu nhiên · Lặp danh sách' : 'Tự chuyển bài · Lặp danh sách';
});


// Điều hướng nhanh: chạy cục bộ, tìm tiếng Việt có hoặc không dấu.
(() => {
  const dialog = document.getElementById('explorer');
  const query = document.getElementById('explorer-query');
  const results = document.getElementById('explorer-results');
  const destinations = [
    ['⌨', 'Góc code', 'Python Studio tự chạy ba chương trình', '#code-corner'],
    ['★', 'Bảng điểm', 'Thành tích game rắn trên máy này', 'snake-scores'],
    ['⌘', 'Dự án', 'Website cá nhân & game con sâu', '#projects'],
    ['♫', 'Âm nhạc', 'Mở playlist của mình', 'music'],
    ['▧', 'Khoảnh khắc', 'Bộ ảnh và kỷ niệm', '#memories'],
    ['◇', 'Góc riêng', 'Code, game và những điều mình thích', '#personal-space'],
    ['♡', 'Ủng hộ', 'Góp gió thành bão', '#donate'],
    ['go', 'Đánh giá', 'Đọc và gửi nhận xét về website', '#contact']
  ];
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  let opener = null;
  let oldOverflow = '';
  function render() {
    results.replaceChildren();
    destinations.filter(item => normalize(item[1] + ' ' + item[2]).includes(normalize(query.value.trim()))).forEach(item => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'explorer-item';
      const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true');
      if (item[0] === 'go') icon.className = 'go';
      else icon.textContent = item[0];
      const text = document.createElement('div');
      const title = document.createElement('strong'); title.textContent = item[1];
      const description = document.createElement('small'); description.textContent = item[2];
      const arrow = document.createElement('span'); arrow.className = 'go'; arrow.textContent = ''; arrow.setAttribute('aria-hidden', 'true');
      text.append(title, description); button.append(icon, text, arrow);
      button.addEventListener('click', () => {
        dialog.close();
        if (item[3] === 'music') { compactMusic(false); musicEl('.music-head button')?.focus({preventScroll:true}); }
        else if (item[3] === 'snake-scores') { setTimeout(()=>document.querySelector('[data-show-scores]').click(),0); }
        else document.querySelector(item[3])?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      });
      results.append(button);
    });
    document.getElementById('explorer-empty').hidden = results.childElementCount > 0;
  }
  function open() {
    if (dialog.open || document.querySelector('dialog[open]')) return;
    opener = document.activeElement; oldOverflow = document.body.style.overflow;
    query.value = ''; render(); dialog.showModal(); document.body.style.overflow = 'hidden'; query.focus();
  }
  document.querySelectorAll('[data-open-explorer]').forEach(button => button.addEventListener('click', open));
  query.addEventListener('input', render);
  query.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('button')?.focus(); } });
  document.getElementById('explorer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if(event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = oldOverflow; opener?.focus({preventScroll:true}); });
  document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); dialog.open ? dialog.close() : open(); } });
  const back = document.getElementById('back-top');
  const percent = document.createElement('small'); percent.setAttribute('aria-hidden', 'true'); back.append(percent);
  let scheduled = false;
  function progress() {
    const total = document.documentElement.scrollHeight - innerHeight;
    const value = Math.max(0,Math.min(100,Math.round(scrollY / Math.max(1,total) * 100)));
    back.style.setProperty('--read-progress', value + '%'); percent.textContent = value + '%'; scheduled = false;
  }
  addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(progress); } }, {passive:true});
  addEventListener('resize', progress); progress();
})();


window.addEventListener('offline', () => notify('Bạn đang ngoại tuyến. Nội dung đã tải vẫn xem được; liên kết và QR mới cần Internet.'));


// Selected hero cards share the existing audio instance and controls.
window.ntSelectedMusic = {
  open() { compactMusic(false); musicEl('.music-play').focus({ preventScroll: true }); },
  toggle: toggleMusic,
  audio: musicAudio,
  current: () => ({ ...musicPlaylist[musicIndex], playing: !musicAudio.paused && !musicAudio.ended })
};
