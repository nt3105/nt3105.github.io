'use strict';
// Mỗi lần mở/tải lại trang đều bắt đầu ở lời chào, không khôi phục vị trí cũ.
try {
  history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
} catch { /* Một số chế độ mở file giới hạn History API. */ }
function startAtHome() {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  requestAnimationFrame(() => { root.style.scrollBehavior = previous; });
}
startAtHome();
window.addEventListener('pageshow', startAtHome);

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
const ROLES = ['Sinh viên CNTT', 'C Learner', 'Telegram Seller', 'Game Hack Developer'];
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
  const updateImage = () => {
    if (img.naturalWidth > 0) { img.classList.add('loaded'); img.hidden = false; }
    else { img.hidden = true; }
  };
  img.addEventListener('load', updateImage);
  img.addEventListener('error', () => { img.hidden = true; });
  if (img.complete) updateImage();
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
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
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
form.addEventListener('submit', event => {
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
const originalQR = 'images/qr-techcombank.png';
let qrRequest = 0;
let pendingQR = null;
let qrTimeout;
const moneyFormat = new Intl.NumberFormat('vi-VN');
function parseDonationAmount(raw) {
  // Chấp nhận 50000 hoặc 50.000, không làm tròn hay tự bỏ ký tự sai.
  const value = raw.trim();
  if (!/^(?:[0-9]+|[0-9]{1,3}(?:\.[0-9]{3})+)$/.test(value)) return null;
  const amount = Number(value.replaceAll('.', ''));
  return Number.isSafeInteger(amount) && amount >= 1000 && amount <= 500000000 ? amount : null;
}
function resetQR() {
  qrRequest++;
  clearTimeout(qrTimeout);
  if (pendingQR) { pendingQR.onload = null; pendingQR.onerror = null; pendingQR = null; }
  qrImage.parentElement.classList.add('qr-static');
  qrImage.src = originalQR;
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
function amountChanged() {
  resetQR();
  amountError.textContent = '';
  amountInput.removeAttribute('aria-invalid');
  const amount = parseDonationAmount(amountInput.value);
  document.querySelectorAll('[data-amount]').forEach(button => {
    const selected = Number(button.dataset.amount) === amount;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
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
  resetQR();
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
  const request = qrRequest;
  const url = new URL('https://img.vietqr.io/image/techcombank-19076415749012-compact2.png');
  url.search = new URLSearchParams({ amount: String(amount), addInfo: 'Ung ho Ngan Tu', accountName: 'KIEN NGAN TU' }).toString();
  generateButton.disabled = true;
  generateButton.textContent = 'Đang tạo QR…';
  donationForm.setAttribute('aria-busy', 'true');
  qrStatus.textContent = 'Đang tạo QR cho ' + moneyFormat.format(amount) + 'đ…';
  qrImage.closest('figure').classList.add('pending');
  qrOpen.hidden = true;
  const candidate = new Image();
  pendingQR = candidate;
  candidate.referrerPolicy = 'no-referrer';
  function fail() {
    if (request !== qrRequest) return;
    resetQR();
    qrStatus.textContent = 'Chưa tạo được QR theo số tiền';
    qrCaption.textContent = 'Mã bên dưới là QR tài khoản gốc, chưa có số tiền. Bạn có thể quét và tự nhập tiền.';
    amountError.textContent = 'Không tải được QR. Kiểm tra Internet rồi thử lại nhé.';
  }
  candidate.onload = () => {
    if (request !== qrRequest) return;
    clearTimeout(qrTimeout);
    qrImage.parentElement.classList.remove('qr-static');
    qrImage.src = url.href;
    qrImage.alt = 'QR ủng hộ ' + moneyFormat.format(amount) + ' đồng cho KIEN NGAN TU tại Techcombank';
    qrOpen.href = url.href;
    qrOpen.hidden = false;
    qrImage.closest('figure').classList.remove('pending');
    qrStatus.textContent = moneyFormat.format(amount) + 'đ · Ngân Tú';
    qrCaption.textContent = 'Quét mã và kiểm tra thông tin trong ứng dụng ngân hàng. Website không xác nhận giao dịch.';
    generateButton.disabled = false;
    generateButton.textContent = 'Tạo QR ủng hộ';
    donationForm.setAttribute('aria-busy', 'false');
    pendingQR = null;
  };
  candidate.onerror = fail;
  qrTimeout = setTimeout(fail, 15000);
  candidate.src = url.href;
});

// Thanh tiến độ cuộn: chỉ cập nhật một lần trong mỗi khung hình.
const readingProgress = document.createElement('div');
readingProgress.className = 'page-progress';
readingProgress.setAttribute('aria-hidden', 'true');
document.body.append(readingProgress);
let progressQueued = false;
function updateReadingProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
  readingProgress.style.transform = `scaleX(${ratio})`;
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
    <div class="viewer-bottom"><p class="viewer-count" aria-live="polite"></p><a class="viewer-original" target="_blank" rel="noopener">Mở ảnh gốc ↗</a><div><button type="button" class="viewer-prev" aria-label="Ảnh trước">←</button><button type="button" class="viewer-next" aria-label="Ảnh tiếp theo">→</button></div></div>`;
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
  <button class="style-toggle" type="button" aria-expanded="false" aria-controls="style-panel"><span aria-hidden="true"></span>Giao diện</button>
  <div class="style-panel" id="style-panel" hidden><div class="style-panel-head"><h3>Màu của bạn</h3><button class="style-close" type="button" aria-label="Đóng bảng màu">×</button></div><p>Chọn bảng màu có sẵn hoặc tự phối.</p>
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
styleControls.insertAdjacentHTML('beforeend', '<label class="glow-option glow-shortcut" title="Bật/tắt ánh sáng theo chuột và chạm"><span aria-hidden="true">✧</span> Ánh sáng<input type="checkbox" id="global-glow-toggle" aria-label="Ánh sáng theo chuột và chạm" checked><span class="glow-switch" aria-hidden="true"></span></label>');
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
try {
  const custom = JSON.parse(localStorage.getItem('ngan-tu-custom-colors') || 'null');
  if (custom) applyTheme(custom);
  else setAccent(localStorage.getItem('ngan-tu-accent') || 'violet');
} catch { setAccent('violet'); }
colorInputs.forEach(input => input.addEventListener('input', () => {
  const colors = colorInputs.map(field => field.value);
  applyTheme(colors);
  try { localStorage.setItem('ngan-tu-custom-colors', JSON.stringify(colors)); } catch {}
}));
function closeStylePanel() {
  stylePanel.hidden = true;
  styleToggle.setAttribute('aria-expanded', 'false');
}
styleToggle.addEventListener('click', () => {
  const opening = stylePanel.hidden;
  stylePanel.hidden = !opening;
  styleToggle.setAttribute('aria-expanded', String(opening));
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
// Ánh sáng theo chuột: chỉ bật trên thiết bị có chuột và cho phép chuyển động.
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.skill-card, .social-card, .coming-panel').forEach(card => {
    card.classList.add('spotlight-card');
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    card.addEventListener('pointermove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${pointerX - rect.left}px`);
        card.style.setProperty('--pointer-y', `${pointerY - rect.top}px`);
        frame = 0;
      });
    }, { passive: true });
  });
}

// NHẠC NỀN: thêm bài mới vào danh sách này, đặt file trong thư mục audio.
const musicPlaylist = [
  { title: 'នារី High Show V2', artist: 'Thanz', src: 'audio/high-show-v2.mp3', cover: 'images/cover-high-show-v2.png' },
  { title: 'កំរ (Kom ro)', artist: 'MUT PHEARIN, YCN TOMIE', src: 'audio/kom-ro.mp3', cover: 'images/cover-kom-ro.png' },
  { title: 'Thiên đường với người thương', artist: 'Phương Mỹ Chi × DTAP', src: 'audio/thien-duong-voi-nguoi-thuong.mp3', cover: 'images/cover-thien-duong.png' },
  { title: 'Preah Thorng — ព្រះថោង Remix', artist: 'AI Remix ft. All3rgy', src: 'audio/preah-thorng.mp3', cover: 'images/cover-preah-thorng.png' },
  { title: 'យ៉ាប់នេះយ៉ាប់ (La Mii Remix)', artist: 'ព្រាប សុវត្ថិ · La Mii Remix', src: 'audio/yab-nih-yab.mp3', cover: 'images/cover-yab-nih-yab.png' },
  { title: 'សូរិយា (អេតាស៊ីវិល)', artist: 'All3rgy & Jenna Norodom', src: 'audio/soriya.mp3', cover: 'images/cover-soriya.png' }
];
const musicAudio = new Audio();
musicAudio.preload = 'metadata';
musicAudio.volume = 0.35;
let musicIndex = 0;
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
 <div class="music-mini"><div class="music-mini-label"><strong></strong><span>Nhạc cùng Ngân Tú</span></div><div class="music-mini-actions"><button class="mini-play" type="button">Bật nhạc</button><button class="music-expand" type="button" aria-label="Mở trình phát nhạc" aria-expanded="false" aria-controls="music-shell">↗</button></div></div>
 <div class="music-shell" id="music-shell" hidden>
  <div class="music-head"><span>NGÂN TÚ / MUSIC</span><div><button class="music-collapse" type="button" aria-label="Thu gọn trình phát">−</button><button class="music-close" type="button" aria-label="Tắt nhạc và thu gọn">×</button></div></div>
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
    else { loadMusic(index); playMusic(); }
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
function loadMusic(index) {
  musicRequest++;
  musicIndex = (index + musicPlaylist.length) % musicPlaylist.length;
  const track = musicPlaylist[musicIndex];
  musicAudio.src = track.src;
  musicEl('.music-title').textContent = track.title;
  musicEl('.music-mini-label strong').textContent = track.title;
  musicEl('.music-artist').textContent = track.artist;
  musicEl('.music-cover').dataset.cover = String(musicIndex);
  musicCoverImage.hidden = false;
  musicCoverImage.src = track.cover;
  musicWidget.querySelectorAll('.playlist-track').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === musicIndex));
  });
  musicEl('.music-seek').value = 0;
  musicEl('.music-seek').disabled = true;
  musicEl('.music-current').textContent = '0:00';
  musicEl('.music-duration').textContent = '0:00';
  musicButtons();
}
async function playMusic() {
  const request = ++musicRequest;
  musicStatus('Đang mở nhạc…');
  try {
    await musicAudio.play();
  } catch (error) {
    if (request !== musicRequest) return;
    musicStatus(error.name === 'NotAllowedError' ? 'Bấm Bật nhạc để nghe' : 'Chưa phát được · Bấm để thử lại');
    musicButtons();
  }
}
function toggleMusic() {
  if (musicAudio.paused) playMusic();
  else { musicRequest++; musicAudio.pause(); musicStatus('Đã tạm dừng'); }
}
function stopMusic() {
  musicRequest++;
  musicAudio.pause();
  musicAudio.currentTime = 0;
  musicStatus('Đã tắt nhạc');
  musicButtons();
}
function compactMusic(compact) {
  musicWidget.classList.toggle('compact', compact);
  musicEl('.music-mini').hidden = !compact;
  musicEl('.music-shell').hidden = compact;
  musicEl('.music-expand').setAttribute('aria-expanded', String(!compact));
  musicEl(compact ? '.music-expand' : '.music-collapse').focus({ preventScroll: true });
}
musicEl('.music-play').addEventListener('click', toggleMusic);
musicEl('.mini-play').addEventListener('click', toggleMusic);
musicEl('.music-next').addEventListener('click', () => { loadMusic(nextMusicIndex()); playMusic(); });
musicEl('.music-prev').addEventListener('click', () => { loadMusic(musicIndex - 1); playMusic(); });
musicEl('.music-off').addEventListener('click', stopMusic);
musicEl('.music-close').addEventListener('click', () => { stopMusic(); compactMusic(true); });
musicEl('.music-collapse').addEventListener('click', () => compactMusic(true));
musicEl('.music-expand').addEventListener('click', () => compactMusic(false));
musicWidget.addEventListener('keydown', event => { if (event.key === 'Escape' && !musicEl('.music-shell').hidden) compactMusic(true); });
musicEl('#music-volume').addEventListener('input', event => { musicAudio.volume = Number(event.target.value); });
musicEl('.music-seek').addEventListener('input', event => {
  if (Number.isFinite(musicAudio.duration)) musicAudio.currentTime = musicAudio.duration * Number(event.target.value) / 100;
});
musicAudio.addEventListener('loadedmetadata', () => {
  musicEl('.music-duration').textContent = musicTime(musicAudio.duration);
  musicEl('.music-seek').disabled = !Number.isFinite(musicAudio.duration);
});
musicAudio.addEventListener('timeupdate', () => {
  musicEl('.music-current').textContent = musicTime(musicAudio.currentTime);
  if (musicAudio.duration > 0) musicEl('.music-seek').value = musicAudio.currentTime / musicAudio.duration * 100;
});
musicAudio.addEventListener('playing', () => { musicButtons(); musicStatus('Đang phát · ' + (musicIndex + 1) + '/' + musicPlaylist.length); });
musicAudio.addEventListener('pause', musicButtons);
musicAudio.addEventListener('waiting', () => { if (!musicAudio.paused) musicStatus('Đang tải nhạc…'); });
musicAudio.addEventListener('ended', () => { loadMusic(nextMusicIndex()); playMusic(); });
musicAudio.addEventListener('error', () => { musicButtons(); musicStatus('Không tải được bài · Hãy thử chuyển bài'); });
loadMusic(0);
// Trình duyệt quyết định có cho tự phát hay không; nếu chặn, hiển thị nút bật nhạc.
playMusic();


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
let glowFrame = 0;
let glowTimer;
let glowX = innerWidth / 2;
let glowY = innerHeight * .65;
function hideGlobalGlow() { globalGlow.classList.remove('shown'); }
function moveGlobalGlow(x, y) {
  if (!glowEnabled || glowMotion.matches) return;
  glowX = x; glowY = y;
  clearTimeout(glowTimer);
  if (!glowFrame) glowFrame = requestAnimationFrame(() => {
    globalGlow.style.transform = `translate3d(${glowX}px,${glowY}px,0) translate(-50%,-50%)`;
    globalGlow.classList.add('shown');
    glowFrame = 0;
  });
  glowTimer = setTimeout(hideGlobalGlow, 1100);
}
window.addEventListener('pointermove', event => moveGlobalGlow(event.clientX, event.clientY), { passive: true });
window.addEventListener('pointerdown', event => moveGlobalGlow(event.clientX, event.clientY), { passive: true });
// touchmove vẫn nhận tọa độ khi trình duyệt chuyển pointer sang cuộn trang.
window.addEventListener('touchmove', event => {
  const touch = event.touches[0];
  if (touch) moveGlobalGlow(touch.clientX, touch.clientY);
}, { passive: true });
window.addEventListener('scroll', () => {
  if (matchMedia('(pointer: coarse)').matches) moveGlobalGlow(glowX, glowY);
}, { passive: true });
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
function makeWidgetDraggable(widget, handleParents) {
  let drag = null;
  let moved = false;
  let preferred = null;
  function bounds() {
    const viewport = window.visualViewport;
    return { left: (viewport?.offsetLeft || 0) + 8, top: (viewport?.offsetTop || 0) + 8,
      width: viewport?.width || innerWidth, height: viewport?.height || innerHeight };
  }
  function place(left, top, remember = true) {
    if (remember) preferred = { left, top };
    const b = bounds();
    const rect = widget.getBoundingClientRect();
    widget.style.left = Math.max(b.left, Math.min(left, b.left + b.width - rect.width - 16)) + 'px';
    widget.style.top = Math.max(b.top, Math.min(top, b.top + b.height - rect.height - 16)) + 'px';
    widget.style.right = 'auto'; widget.style.bottom = 'auto';
    moved = true;
    positionColorPanel();
  }
  function constrain() {
    if (!moved) { positionColorPanel(); return; }
    if (preferred) place(preferred.left, preferred.top, false);
  }
  handleParents.forEach(parent => {
    const handle = document.createElement('button');
    handle.type = 'button'; handle.className = 'widget-drag-handle';
    handle.textContent = '⠿';
    handle.setAttribute('aria-label', 'Di chuyển bảng: kéo hoặc dùng phím mũi tên; Home để đặt lại');
    handle.title = 'Kéo để di chuyển · Nhấn đúp để đặt lại';
    parent.prepend(handle);
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const rect = widget.getBoundingClientRect();
      drag = { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top };
      handle.setPointerCapture(event.pointerId);
      widget.classList.add('widget-dragging');
    });
    handle.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      place(event.clientX - drag.x, event.clientY - drag.y);
    });
    function release() { drag = null; widget.classList.remove('widget-dragging'); }
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);
    handle.addEventListener('lostpointercapture', release);
    function reset() {
      moved = false;
      preferred = null;
      ['top', 'left', 'right', 'bottom'].forEach(key => widget.style.removeProperty(key));
      positionColorPanel();
    }
    handle.addEventListener('dblclick', reset);
    handle.addEventListener('keydown', event => {
      if (event.key === 'Home') { event.preventDefault(); reset(); return; }
      const steps = { ArrowLeft: [-20,0], ArrowRight: [20,0], ArrowUp: [0,-20], ArrowDown: [0,20] };
      const step = steps[event.key];
      if (!step) return;
      event.preventDefault();
      const rect = widget.getBoundingClientRect(); place(rect.left + step[0], rect.top + step[1]);
    });
  });
  window.addEventListener('resize', constrain);
  window.visualViewport?.addEventListener('resize', constrain);
  if ('ResizeObserver' in window) new ResizeObserver(constrain).observe(widget);
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
makeWidgetDraggable(musicWidget, [musicEl('.music-head'), musicEl('.music-mini')]);
makeWidgetDraggable(styleControls, [styleControls]);


// Góc cá nhân: đồng hồ Việt Nam, bài hát hiện tại và liên hệ nhanh.
const vnClock = document.getElementById('vietnam-clock');
const vnDate = document.getElementById('vietnam-date');
function updateVietnamClock() {
  const now = new Date();
  vnClock.textContent = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  vnClock.dateTime = now.toISOString();
  vnDate.textContent = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit' }).format(now) + ' · Việt Nam';
}
updateVietnamClock();
setInterval(() => { if (!document.hidden) updateVietnamClock(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateVietnamClock(); });
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
document.getElementById('copy-contact-email').addEventListener('click', async () => {
  const status = document.getElementById('copy-email-status');
  try {
    await navigator.clipboard.writeText('kienngantu3105@gmail.com');
    status.textContent = 'Đã sao chép email.';
  } catch { status.textContent = 'Bạn có thể sao chép: kienngantu3105@gmail.com'; }
});
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
