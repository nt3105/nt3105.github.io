import { api, accessToken, restoreAccess } from './api.js?v=detail-clean-v1';
import { $, escapeHtml as e, icon, money, dateTime, stateLabels, toast, showPage } from './ui.js?v=detail-clean-v1';
import { openOrder } from './checkout.js?v=activation-clock-v1';
let orders = [];
export async function loadOrders() {
  $('#orders').innerHTML = '<div class="loading-card">Đang lấy đơn hàng của bạn…</div>';
  try {
    orders = (await api('/orders')).items;
    $('#orders').innerHTML = orders.length ? orders.map(o => `<article class="order-row"><div><strong>${e(o.plan.title)}</strong><small>${dateTime(o.created_at)} · ${e(o.memo)}</small><div><span class="state-badge ${e(o.state)}">${stateLabels[o.state] || 'Đang xử lý'}</span></div></div><strong class="order-price">${money(o.amount)}</strong><button class="secondary" data-order="${e(o.id)}">${o.state === 'delivered' ? 'Xem key' : 'Xem đơn'} ${icon('arrow')}</button></article>`).join('') : `<div class="empty">${icon('bag')}<h2>Chưa có đơn hàng</h2><p>Key bạn mua sẽ xuất hiện tại đây.</p><button class="primary" id="browse-products">Khám phá cửa hàng ${icon('arrow')}</button></div>`;
    $('#browse-products')?.addEventListener('click', () => showPage('catalog'));
  } catch (error) { $('#orders').innerHTML = `<div class="notice error">${e(error.message)}</div>`; }
}
export function initOrders() {
  $('#refresh-orders').addEventListener('click', loadOrders);
  $('#orders').addEventListener('click', event => {
    const button = event.target.closest('[data-order]');
    const order = button && orders.find(o => o.id === button.dataset.order);
    if (order) openOrder(order);
  });
  $('#export-access').addEventListener('click', () => {
    const token = accessToken();
    const blob = new Blob(['MA KHOI PHUC DON HANG NTJR\nGiu rieng tu: ma nay cho phep xem key cua ban.\n\n' + token + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'NTJR-ma-khoi-phuc.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('#import-access').addEventListener('click', () => { $('#restore-error').textContent = ''; $('#restore-dialog').showModal(); });
  $('#close-restore').addEventListener('click', () => $('#restore-dialog').close());
  $('#restore-form').addEventListener('submit', event => {
    event.preventDefault();
    try { restoreAccess($('#restore-token').value.trim()); $('#restore-token').value = ''; $('#restore-dialog').close(); loadOrders(); toast('Đã khôi phục quyền truy cập'); }
    catch (error) { $('#restore-error').textContent = error.message; }
  });
}
