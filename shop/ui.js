export const $ = (selector, root = document) => root.querySelector(selector);
export const money = value => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
export const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
export const duration = (plan, full = false) => plan.never_expires ? 'Vĩnh viễn' : plan.hours === 168 ? '1 tuần' : plan.hours === 720 ? (full ? '1 tháng (30 ngày)' : '1 tháng') : plan.hours % 24 ? plan.hours + ' giờ' : plan.hours / 24 + ' ngày';
export const dateTime = stamp => new Date(stamp * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
export const stateLabels = { pending: 'Chờ thanh toán', paid: 'Đang cấp key', delivered: 'Đã nhận key', review: 'Cần kiểm tra', expired: 'Hết hạn thanh toán' };
let toastTimer;
export function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
export async function copy(value) { try { await navigator.clipboard.writeText(value); toast('Đã sao chép'); } catch { toast('Chưa sao chép được. Hãy chọn và sao chép nội dung trực tiếp.'); } }
export function showPage(name) {
  const target=name==='home'?'catalog':name;
  for (const page of document.querySelectorAll('.page')) page.hidden = page.id !== 'page-' + target;
  $('#home-carousel').hidden=name!=='home';
  document.body.dataset.page=name;
  for (const button of document.querySelectorAll('.main-nav button[data-page]')) {
    button.classList.toggle('active', button.dataset.page === name);
    if (button.dataset.page === name) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  }
  history.replaceState(null, '', name === 'home' ? location.pathname : '#' + name);
  window.scrollTo({ top: 0, behavior: 'instant' });
}
