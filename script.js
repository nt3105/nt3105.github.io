'use strict';
// Respect section URLs and native browser scroll restoration.
const initialSection = location.hash;
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

// Menu trên điện thoại; hỗ trợ Escape và đóng khi chọn mục.
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#nav-links');
const header = document.querySelector('#header');
function closeMenu() {
  menu.classList.remove('open');
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Mở menu');
  if (!document.body.classList.contains('menu-lock')) return;
  const y = menuScrollY;
  const root = document.documentElement;
  root.style.scrollBehavior = 'auto';
  document.body.classList.remove('menu-lock');
  document.body.style.top = '';
  window.scrollTo(0, y);
  root.style.scrollBehavior = '';
}
let menuScrollY = 0;
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  if (open) {
    menuScrollY = window.scrollY;
    document.body.classList.add('menu-lock');
    document.body.style.top = `-${menuScrollY}px`;
  }
  menu.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
  if (!open) closeMenu();
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) { closeMenu(); menuButton.focus(); }
});
document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

// Scroll nhẹ: gom cập nhật vào một frame, không chạy hiệu ứng nặng.
const backTop = document.querySelector('#back-top');
const sections = [...document.querySelectorAll('main section[id]')];
let scrollQueued = false;
function updateScroll() {
  header.classList.toggle('scrolled', window.scrollY > 24);
  backTop.hidden = window.scrollY < 600;
  let current = 'home';
  sections.forEach(section => { if (section.getBoundingClientRect().top <= 170) current = section.id; });
  menu.querySelectorAll('a').forEach(link => {
    const active = link.getAttribute('href') === `#${current}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
updateScroll();
backTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
  document.querySelector('.brand').focus({ preventScroll: true });
});

// Vỏ ngoài giữ scroll-reveal. Card bên trong chỉ để nghiêng 3D, tránh ghi đè transform.
document.querySelectorAll('.skill-card, .project-card, .life-card, .social-card, .memory-photo, .hero-visual').forEach(card => {
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

// Hiện nội dung một lần khi cuộn tới; không có JS vẫn đọc được trang.
if ('IntersectionObserver' in window && !reducedMotion) {
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
if ('IntersectionObserver' in window && !reducedMotion) {
  const progressObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      progressObserver.unobserve(entry.target);
    });
  }, { threshold: 0.28 });
  document.querySelectorAll('.skill-card').forEach(card => progressObserver.observe(card));
}

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

// Liên hệ: kiểm tra thông tin và mở bản nháp; người dùng xác nhận gửi trong hộp thư.
const form = document.querySelector('#contact-form');
const feedback = document.querySelector('#form-feedback');
function setError(field, message) {
  document.querySelector(`#${field.id}-error`).textContent = message;
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;
  setError(name, name.value.trim().length < 2 ? 'Vui lòng nhập họ tên, ít nhất 2 ký tự.' : '');
  setError(email, !email.value.trim() || !email.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? 'Vui lòng nhập địa chỉ email hợp lệ.' : '');
  setError(message, message.value.trim().length < 10 ? 'Vui lòng nhập nội dung ít nhất 10 ký tự.' : '');
  const invalid = form.querySelector('[aria-invalid="true"]');
  if (invalid) { feedback.hidden = true; invalid.focus(); return; }
  const subject = 'Liên hệ Ngân Tú — ' + name.value.trim();
  const body = 'Họ tên: ' + name.value.trim() + '\nEmail liên hệ: ' + email.value.trim() + '\n\n' + message.value.trim();
  if (event.submitter?.value === 'copy') {
    const text = subject + '\n\n' + body;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      feedback.textContent = 'Đã sao chép lời nhắn. Mở Telegram hoặc email và dán nội dung để gửi.';
    } catch {
      const copyField = document.createElement('textarea');
      copyField.value = text;
      copyField.readOnly = true;
      copyField.setAttribute('aria-label', 'Lời nhắn để sao chép');
      feedback.replaceChildren(copyField);
      const note = document.createElement('p');
      note.textContent = 'Trình duyệt chưa cho phép sao chép tự động. Chọn nội dung bên dưới để sao chép.';
      feedback.prepend(note);
      feedback.hidden = false;
      copyField.focus();
      copyField.select();
      return;
    }
    feedback.hidden = false;
    return;
  }
  const recipient = SOCIAL_LINKS.email;
  const mailto = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  const gmail = 'https://mail.google.com/mail/?' + new URLSearchParams({view:'cm', fs:'1', to:recipient, su:subject, body}).toString();
  feedback.replaceChildren();
  const note = document.createElement('p');
  note.textContent = 'Nội dung đã sẵn sàng. Tin nhắn chưa được gửi: hãy bấm Gửi trong Gmail hoặc ứng dụng Mail. Nếu hộp thư chưa mở, bấm liên kết bên dưới.';
  const fallback = document.createElement('a');
  const useMail = event.submitter && event.submitter.value === 'mail';
  fallback.href = useMail ? mailto : gmail;
  fallback.textContent = useMail ? 'Mở lại ứng dụng Mail' : 'Mở bản nháp Gmail';
  fallback.className = 'accent';
  if (!useMail) { fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; }
  feedback.append(note, fallback);
  feedback.hidden = false;
  if (useMail) window.location.href = mailto;
  else window.open(gmail, '_blank', 'noopener,noreferrer');
});
form.querySelectorAll('input, textarea').forEach(field => field.addEventListener('input', () => {
  setError(field, '');
  feedback.hidden = true;
}));

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
donationForm.addEventListener('submit', event => {
  event.preventDefault();
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
});

// Thanh tiến độ cuộn: chỉ cập nhật một lần trong mỗi khung hình.
const readingProgress = document.createElement('div');
readingProgress.className = 'page-progress';
readingProgress.setAttribute('aria-hidden', 'true');
readingProgress.innerHTML = '<span></span>';
document.body.append(readingProgress);
let progressQueued = false;
function updateReadingProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
  readingProgress.querySelector('span').style.transform = `scaleX(${ratio})`;
  progressQueued = false;
}
function queueReadingProgress() {
  if (!progressQueued) {
    progressQueued = true;
    requestAnimationFrame(updateReadingProgress);
  }
}
window.addEventListener('scroll', queueReadingProgress, { passive: true });
window.addEventListener('resize', queueReadingProgress);
window.addEventListener('load', queueReadingProgress);
updateReadingProgress();

// Xem ảnh lớn bằng dialog: hỗ trợ điện thoại, bàn phím và Escape.
const memoryLinks = [...document.querySelectorAll('.memory-photo')];
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
    viewer.querySelector('.viewer-count').textContent = `Ảnh ${photoIndex + 1} / ${memoryLinks.length}`;
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
    <label>Nền<input type="color" id="theme-base" value="#18112e"></label>
    <small>Nền tự cân chỉnh tối để chữ luôn dễ đọc.</small>
  </div>`);
stylePanel.insertAdjacentHTML('beforeend', '<h4 class="fx-label">Ánh sáng</h4><label class="glow-option glow-shortcut" title="Bật/tắt ánh sáng theo chuột"><span aria-hidden="true">✧</span> Ánh sáng theo chuột<input type="checkbox" id="global-glow-toggle" aria-label="Ánh sáng theo chuột" checked><span class="glow-switch" aria-hidden="true"></span></label>');
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
  try { localStorage.removeItem('ngan-tu-custom-colors'); } catch {}
}
const accentNames = Object.keys(themePresets);
let visitAccent = accentNames[Math.floor(Math.random() * accentNames.length)];
try {
  const last = localStorage.getItem('ngan-tu-accent');
  if (accentNames.length > 1 && last === visitAccent) {
    const rest = accentNames.filter(name => name !== last);
    visitAccent = rest[Math.floor(Math.random() * rest.length)];
  }
  localStorage.setItem('ngan-tu-accent', visitAccent);
} catch {}
setAccent(visitAccent);
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
if (!introBgm) {
  musicAudio.preload = 'metadata';
  musicAudio.volume = 0.35;
}
let musicIndex = Math.random() < 0.65 ? 0 : 1 + Math.floor(Math.random() * (musicPlaylist.length - 1));
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
 <div class="music-mini"><div class="music-mini-label"><strong></strong><span>Nhạc cùng Ngân Tú</span></div><div class="music-mini-actions"><button class="mini-play" type="button">Bật nhạc</button><button class="music-expand" type="button" aria-label="Mở trình phát nhạc" aria-expanded="false" aria-controls="music-shell"><span class="go" aria-hidden="true"></span></button></div></div>
 <div class="music-shell" id="music-shell" hidden>
  <div class="music-head"><span>NGÂN TÚ / MUSIC</span><div><button class="music-close" type="button" aria-label="Đóng menu nhạc">×</button></div></div>
  <div class="music-track"><div class="music-cover" aria-hidden="true"><div class="music-disc"></div><img class="music-cover-image" alt="" hidden></div><div class="music-info"><h3 class="music-title"></h3><p class="music-artist"></p></div></div>
  <p class="music-status" role="status" aria-live="polite">Bấm bật nhạc để nghe</p>
  <input class="music-seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="Tua bài hát" disabled>
  <div class="music-times"><span class="music-current">0:00</span><span class="music-duration">0:00</span></div>
  <div class="music-controls"><button class="music-prev" type="button" aria-label="Bài trước">❮</button><button class="music-play" type="button">Bật nhạc</button><button class="music-next" type="button" aria-label="Bài tiếp theo">❯</button></div>
  <div class="music-volume"><label for="music-volume">Âm lượng</label><input id="music-volume" type="range" min="0" max="1" step="0.01" value="0.35"></div>
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
  if (!Number.isFinite(seconds)) return '0:00';
  return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
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
function syncMusicClock() {
  const duration = musicAudio.duration;
  const ready = Number.isFinite(duration) && duration > 0;
  const seek = musicEl('.music-seek');
  musicEl('.music-duration').textContent = musicTime(ready ? duration : 0);
  musicEl('.music-current').textContent = musicTime(musicAudio.currentTime || 0);
  seek.disabled = !ready;
  if (ready && document.activeElement !== seek) seek.value = String(musicAudio.currentTime / duration * 100);
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
  musicWidget.querySelectorAll('.playlist-track').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === musicIndex));
  });
  if (!sameTrack && musicAudio.readyState < 1) {
    musicEl('.music-seek').value = 0;
    musicEl('.music-seek').disabled = true;
    musicEl('.music-current').textContent = '0:00';
    musicEl('.music-duration').textContent = '0:00';
  }
  syncMusicClock();
  musicButtons();
}
let musicByUser = false;
async function playMusic() {
  const request = ++musicRequest;
  musicStatus('Đang mở nhạc…');
  try {
    if (musicAudio.paused) {
      musicAudio.muted = true;
      await musicAudio.play();
      musicAudio.muted = false;
      // Keep the volume chosen by the listener, including zero.
      if (musicAudio.paused) await musicAudio.play();
    } else {
      await musicAudio.play();
    }
  } catch (error) {
    if (request !== musicRequest || error.name === 'AbortError') return;
    if (error.name === 'NotAllowedError') {
      musicAudio.muted = false;
      musicStatus('Bấm nút phát để nghe nhạc');
      musicButtons();
      return;
    }
    musicButtons();
  }
}
function toggleMusic() {
  if (musicAudio.paused) { autoKick = false; musicByUser = true; playMusic(); }
  else { autoKick = false; musicByUser = false; musicRequest++; musicAudio.pause(); musicStatus('Đã tạm dừng'); }
}
function stopMusic() {
  autoKick = false;
  musicByUser = false;
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
musicEl('#music-volume').addEventListener('input', event => { musicAudio.volume = Number(event.target.value); });
musicEl('.music-seek').addEventListener('input', event => {
  if (Number.isFinite(musicAudio.duration)) musicAudio.currentTime = musicAudio.duration * Number(event.target.value) / 100;
});
musicAudio.addEventListener('loadedmetadata', syncMusicClock);
musicAudio.addEventListener('durationchange', syncMusicClock);
musicAudio.addEventListener('timeupdate', syncMusicClock);
musicAudio.addEventListener('playing', () => { musicButtons(); musicStatus('Đang phát · ' + (musicIndex + 1) + '/' + musicPlaylist.length); });
musicAudio.addEventListener('pause', musicButtons);
musicAudio.addEventListener('waiting', () => { if (!musicAudio.paused) musicStatus('Đang tải nhạc…'); });
musicAudio.addEventListener('ended', () => { loadMusic(nextMusicIndex()); playMusic(); });
musicAudio.addEventListener('error', () => { musicButtons(); musicStatus('Không tải được bài · Hãy thử chuyển bài'); });
if (introBgm) loadMusic(musicIndex, true);
else loadMusic(musicIndex);
let autoKick = true;
function bootMusic() {
  if (!musicAudio.paused) {
    autoKick = false;
    musicByUser = true;
    musicButtons();
    musicStatus('Đang phát · ' + (musicIndex + 1) + '/' + musicPlaylist.length);
    return;
  }
  musicByUser = true;
  playMusic();
}
bootMusic();
function nudgeMusic() {
  if (!autoKick || !musicAudio.paused) return;
  bootMusic();
}
['pointerdown', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, nudgeMusic, { passive: true }));
window.addEventListener('scroll', nudgeMusic, { passive: true });
musicAudio.addEventListener('playing', () => { autoKick = false; }, { once: true });


// Quầng sáng toàn trang: chuột, bút cảm ứng và thao tác vuốt trên điện thoại.
const globalGlow = document.createElement('div');
globalGlow.className = 'global-pointer-glow';
globalGlow.setAttribute('aria-hidden', 'true');
document.body.append(globalGlow);
const glowToggle = document.getElementById('global-glow-toggle');
const glowMotion = matchMedia('(prefers-reduced-motion: reduce)');
let glowEnabled = true;
try { glowEnabled = localStorage.getItem('ngan-tu-global-glow') !== 'off'; } catch {}
glowToggle.checked = glowEnabled;
let glowTimer;
let glowX = innerWidth / 2;
let glowY = innerHeight * .65;
function hideGlobalGlow() { globalGlow.classList.remove('shown'); }
function moveGlobalGlow(x, y) {
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


// Tiêu đề và lời giới thiệu hiện theo nhịp khi cuộn, không tách nhỏ câu chữ.
if ('IntersectionObserver' in window && !reducedMotion) {
  const scrollText = document.querySelectorAll('main section h2, .about-statement > p, .about-content > p, .journey-intro > p:not(.eyebrow), .memories-heading h3, .contact-copy > p:not(.eyebrow)');
  const textObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('text-in-view');
      textObserver.unobserve(entry.target);
    });
  }, { threshold: .1 });
  scrollText.forEach((element, index) => {
    element.classList.add('scroll-text');
    element.style.setProperty('--text-delay', `${(index % 3) * 70}ms`);
    textObserver.observe(element);
  });
}

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
  const anchor = styleControls.getBoundingClientRect();
  const panel = stylePanel.getBoundingClientRect();
  const width = window.visualViewport?.width || innerWidth;
  const height = window.visualViewport?.height || innerHeight;
  const top = anchor.top - panel.height - 10;
  stylePanel.style.left = Math.max(8, Math.min(anchor.left, width - panel.width - 8)) + 'px';
  stylePanel.style.top = Math.max(8, Math.min(top >= 8 ? top : anchor.bottom + 10, height - panel.height - 8)) + 'px';
}
styleToggle.addEventListener('click', positionColorPanel);
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
    ['✧', 'Về mình', 'Một chút về Ngân Tú', '#about'],
    ['⌨', 'Góc code', 'Ví dụ C, Objective-C và Swift', '#code-corner'],
    ['★', 'Bảng điểm', 'Thành tích game rắn trên máy này', '#game-scores'],
    ['⌘', 'Dự án', 'Website cá nhân & game con sâu', '#projects'],
    ['♫', 'Âm nhạc', 'Mở playlist của mình', 'music'],
    ['▧', 'Khoảnh khắc', 'Bộ ảnh và kỷ niệm', '#memories'],
    ['◇', 'Góc riêng', 'Code, game và những điều mình thích', '#personal-space'],
    ['♡', 'Ủng hộ', 'Góp gió thành bão', '#donate'],
    ['go', 'Liên hệ', 'Gửi mình một lời chào', '#contact']
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


document.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !menu.classList.contains('open')) return;
  const items = [menuButton, ...menu.querySelectorAll('a[href]')];
  const first = items[0], last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
window.addEventListener('offline', () => notify('Bạn đang ngoại tuyến. Nội dung đã tải vẫn xem được; liên kết và QR mới cần Internet.'));
