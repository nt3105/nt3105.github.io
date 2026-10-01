'use strict';
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

// FORM DEMO: chỉ xác thực, không gửi, không lưu thông tin cá nhân.
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
  feedback.textContent = '✓ Nội dung hợp lệ. Tin nhắn CHƯA được gửi vì form chưa kết nối dịch vụ gửi. Nội dung vẫn được giữ trong form; bạn có thể sao chép và gửi đến kienngantu3105@gmail.com hoặc liên hệ Telegram @neverdierrr.';
  feedback.hidden = false;
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
  url.search = new URLSearchParams({ amount: String(amount), addInfo: 'Ung ho Ngan Tu Dev', accountName: 'KIEN NGAN TU' }).toString();
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
    qrImage.src = url.href;
    qrImage.alt = 'QR ủng hộ ' + moneyFormat.format(amount) + ' đồng cho KIEN NGAN TU tại Techcombank';
    qrOpen.href = url.href;
    qrOpen.hidden = false;
    qrImage.closest('figure').classList.remove('pending');
    qrStatus.textContent = moneyFormat.format(amount) + 'đ · Ngân Tú Dev';
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
