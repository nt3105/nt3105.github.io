import { api } from './api.js?v=detail-clean-v1';
import { $, escapeHtml as e, icon, money, duration, dateTime, toast, copy } from './ui.js?v=detail-clean-v1';
let activeOrder;
let polling;
let generation = 0;
let requests = new Map();
export async function purchase(sku, button) {
  if (button) button.disabled = true;
  const requestId = requests.get(sku) || crypto.randomUUID();
  requests.set(sku, requestId);
  try {
    const order = await api('/orders', { sku, request_id: requestId });
    requests.delete(sku);
    openOrder(order);
  } catch (error) { toast(error.message); }
  finally { if (button?.isConnected) button.disabled = false; }
}
export function openOrder(order) {
  generation++;
  clearTimeout(polling);
  activeOrder = order;
  render(order);
  if (!$('#checkout').open) $('#checkout').showModal();
  if (['pending', 'paid', 'expired'].includes(order.state)) schedule(generation);
}
function schedule(version) {
  polling = setTimeout(async () => {
    if (!$('#checkout').open || version !== generation) return;
    try {
      const order = await api('/orders/' + activeOrder.id);
      if (version !== generation) return;
      const changed = order.state !== activeOrder.state;
      activeOrder = order;
      if (changed) render(order); else updateCountdown();
      if (!['pending', 'paid', 'expired'].includes(order.state)) return;
      $('#poll-error')?.setAttribute('hidden', '');
    } catch (error) {
      const label = $('#poll-error');
      if (label) { label.hidden = false; label.textContent = error.message + ' Trang sẽ tiếp tục kiểm tra, không cần chuyển tiền lại.'; }
    }
    if (version === generation) schedule(version);
  }, 2000);
}
function updateCountdown() {
  const el = $('#countdown');
  if (!el || !activeOrder) return;
  const remaining = Math.max(0, activeOrder.pay_by - Math.floor(Date.now() / 1000));
  el.textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
}
function copyRow(label, value, name) { return `<div class="transfer-row"><span>${label}</span><strong>${e(value)}</strong><button class="icon-button" data-copy="${name}" aria-label="Sao chép ${label.toLocaleLowerCase('vi')}">${icon('copy')}</button></div>`; }
function render(order) {
  const done = order.state === 'delivered';
  $('#checkout-title').textContent = done ? 'Key của bạn đã sẵn sàng' : order.state === 'review' ? 'Giao dịch cần kiểm tra' : order.state === 'expired' ? 'Đơn đã hết hạn' : 'Thanh toán QR';
  const steps = `<div class="checkout-steps"><span class="complete">${icon('check')}Chọn gói</span><i></i><span class="${done ? 'complete' : 'current'}">${done ? icon('check') : '<b>02</b>'}Thanh toán</span><i></i><span class="${done ? 'complete' : ''}"><b>03</b>Nhận key</span></div>`;
  const summary = `<div class="checkout-summary"><div><strong>${e(order.plan.title)}</strong><span>${duration(order.plan,true)} · ${order.plan.max_devices} thiết bị · ${e(order.plan.platform)}</span></div><strong>${money(order.amount)}</strong></div>`;
  let content;
  if (done) {
    content = `<div class="success-panel"><div class="success-icon">${icon('check')}</div><h3>Đã cấp key thành công</h3><p>${order.demo ? 'Đây là key thử nghiệm, không dùng trong game thật.' : 'Sao chép key và nhập vào ứng dụng của bạn.'}</p><div class="key-field"><code>${e(order.key)}</code><button class="icon-button" data-copy="key" aria-label="Sao chép key">${icon('copy')}</button></div><div class="key-details"><span>Thời hạn</span><strong>${order.plan.never_expires ? 'Vĩnh viễn' : dateTime(order.key_expires)}</strong></div><p class="small">Thời hạn bắt đầu từ lúc server cấp key.</p>${order.license_enabled === false ? '<p class="field-error">Key đã bị khóa. Liên hệ hỗ trợ để kiểm tra.</p>' : ''}<button class="primary" id="done-checkout">Đã lưu key ${icon('check')}</button></div>`;
  } else if (order.state === 'review' || order.state === 'expired') {
    content = `<div class="waiting-panel">${icon('help')}<h3>${order.state === 'review' ? 'Thông tin chuyển khoản chưa khớp' : 'Không chuyển tiền vào đơn này nữa'}</h3><p>${order.state === 'review' ? 'Hệ thống đã ghi nhận giao dịch. Gửi mã đơn cho hỗ trợ để kiểm tra số tiền và thời gian nhận.' : 'Bạn có thể tạo một đơn mới. Nếu đã chuyển tiền, liên hệ hỗ trợ và gửi mã đơn này.'}</p></div>`;
  } else if (order.state === 'paid') {
    content = `<div class="waiting-panel">${icon('key')}<h3>Đã nhận tiền, đang cấp key</h3><p>Đơn đã được lưu. Bạn có thể giữ trang này mở hoặc xem lại trong Đơn đã mua.</p></div>`;
  } else {
    content = `<div class="payment-grid"><div class="qr-column"><div class="qr-frame"><img src="${e(order.qr_url)}" width="240" height="240" alt="${order.demo ? 'QR minh họa, không dùng chuyển tiền' : 'QR chuyển khoản của đơn ' + order.memo}" id="payment-qr"></div><p class="qr-fallback" id="qr-fallback" hidden>Không tải được QR. Dùng thông tin chuyển khoản ở bên cạnh.</p><strong>${order.demo ? 'QR MINH HỌA' : 'Quét bằng ứng dụng ngân hàng'}</strong><p>${order.demo ? 'Không chuyển tiền trong bản thử.' : 'Kiểm tra thông tin trước khi xác nhận.'}</p></div><div class="transfer-details"><div class="transfer-title">THÔNG TIN CHUYỂN KHOẢN</div>${copyRow('Ngân hàng', order.bank.name, 'bank')}${copyRow('Chủ tài khoản', order.bank.owner, 'owner')}${copyRow('Số tài khoản', order.bank.account, 'account')}${copyRow('Số tiền', money(order.amount), 'amount')}${copyRow('Nội dung', order.memo, 'memo')}<div class="payment-notice">Giữ nguyên số tiền và nội dung để hệ thống tự xác nhận đúng đơn.</div></div></div><div class="pending-status"><span class="pending-dot"></span><span>Đang chờ xác nhận chuyển khoản</span><strong id="countdown"></strong></div>${order.demo ? '<button class="secondary demo-confirm" id="demo-confirm">Thử xác nhận tiền vào (mô phỏng)</button>' : ''}`;
  }
  $('#checkout-content').innerHTML = steps + summary + content + `<p class="poll-error" id="poll-error" role="status" hidden></p><div class="order-code"><span>Mã đơn <code>${e(order.id)}</code></span><button class="text-button" data-copy="id">Sao chép mã đơn</button></div>`;
  updateCountdown();
  $('#payment-qr')?.addEventListener('error', () => { $('#qr-fallback').hidden = false; $('#payment-qr').hidden = true; });
  $('#done-checkout')?.addEventListener('click', () => $('#checkout').close());
  $('#demo-confirm')?.addEventListener('click', async event => {
    event.currentTarget.disabled = true;
    try { openOrder(await api('/demo/confirm/' + order.id, {})); } catch (error) { toast(error.message); event.target.disabled = false; }
  });
}
export function initCheckout() {
  $('#close-checkout').addEventListener('click', () => $('#checkout').close());
  $('#checkout').addEventListener('close', () => { generation++; clearTimeout(polling); });
  $('#checkout-content').addEventListener('click', event => {
    const button = event.target.closest('[data-copy]');
    if (!button || !activeOrder) return;
    const o = activeOrder;
    const values = { key: o.key, id: o.id, memo: o.memo, account: o.bank.account, owner: o.bank.owner, bank: o.bank.name, amount: String(o.amount) };
    copy(values[button.dataset.copy]);
  });
}
