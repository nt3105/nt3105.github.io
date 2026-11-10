import { $, escapeHtml as e, icon, money, duration } from './ui.js?v=detail-clean-v1';
import { detailDownload } from './downloads.js?v=android-b16-download-v1';
let returnContext=null;
export function productArtwork(product) {
  return new URL('./assets/' + (/pubg/i.test(product.id) ? 'pubg-menu-v3.jpg' : /zsm|zingspeed/i.test(product.id) ? 'zingspeed-menu-v3.jpg' : 'hero-gaming-v2.png'), import.meta.url).href;
}
export function openDetail(product,selected,catalog,onBuy,trigger=document.activeElement) {
  const dialog=$('#product-detail');
  if(!dialog.open){
    returnContext={x:window.scrollX,y:window.scrollY,page:document.body.dataset.page,trigger};
    document.documentElement.classList.add('detail-open');
  }
  $('#product-detail').classList.toggle('screenshot-detail',/pubg|zsm|zingspeed/i.test(product.id));
  let plan = selected;
  function render() {
    const canBuy = catalog.sales_enabled && plan.enabled && plan.price > 0;
    $('#detail-content').innerHTML = `<div class="detail-art"><img src="${productArtwork(product)}" alt="" width="1672" height="941"><span>NTJR DIGITAL COLLECTION</span></div><div class="detail-body"><p class="eyebrow">THÔNG TIN SẢN PHẨM</p><h2 id="detail-title">${e(product.name)}</h2><p class="detail-intro">Kiểm tra thông tin gói trước khi tiếp tục thanh toán.</p><dl class="detail-specs"><div><dt>Nền tảng</dt><dd>${e(plan.platform === 'both' ? 'iOS & Android' : plan.platform === 'ios' ? 'iOS' : 'Android')}</dd></div><div><dt>Giới hạn thiết bị</dt><dd>${plan.max_devices} thiết bị</dd></div><div><dt>Thời hạn</dt><dd>${duration(plan,true)}</dd></div></dl><div class="plans detail-plans" role="group" aria-label="Chọn gói trong chi tiết">${product.plans.map(p=>`<button class="plan-button ${p.sku===plan.sku?'selected':''}" data-detail-plan="${e(p.sku)}" aria-pressed="${p.sku===plan.sku}">${duration(p)}<small>${p.price?money(p.price):"Chưa đặt giá"}</small></button>`).join('')}</div><p class="detail-note">Thời hạn bắt đầu khi nhập key và xác thực thành công lần đầu. Chưa dùng thì chưa tính giờ. Key được lưu trong đơn sau khi giao dịch được xác nhận.${catalog.demo ? ' Đây là bản thử thanh toán, không chuyển tiền thật.' : ''}</p><div class="purchase-row"><div><p class="price-label">GIÁ GÓI</p><div class="price">${plan.price ? money(plan.price) : 'Chưa đặt giá'}</div></div><button class="primary" id="detail-buy" ${canBuy?'':'disabled'}>Tiếp tục thanh toán ${icon('arrow')}</button></div></div>`;
    $('#detail-content .detail-body').insertAdjacentHTML('beforeend',detailDownload(product.id,catalog));
    $('#detail-buy').addEventListener('click',()=>{ $('#product-detail').close(); onBuy(plan.sku); });
    $('#detail-content').querySelectorAll('[data-detail-plan]').forEach(button=>button.addEventListener('click',()=>{
      const sku=button.dataset.detailPlan;
      plan=product.plans.find(p=>p.sku===sku); render();
      $(`[data-detail-plan="${CSS.escape(sku)}"]`)?.focus({preventScroll:true});
    }));
  }
  render();
  dialog.scrollTop=0;
  if(!dialog.open)dialog.showModal();
}
export function initDetails() {
  const dialog=$('#product-detail');
  $('#close-detail').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    if(dialog.open)return;
    const context=returnContext;
    returnContext=null;
    document.documentElement.classList.remove('detail-open');
    if(!context)return;
    const canRestore=()=>document.body.dataset.page===context.page&&!document.querySelector('dialog[open]');
    if(!canRestore())return;
    if(context.trigger instanceof HTMLElement&&context.trigger.isConnected)context.trigger.focus({preventScroll:true});
    window.scrollTo({left:context.x,top:context.y,behavior:'instant'});
    requestAnimationFrame(()=>{
      if(canRestore())window.scrollTo({left:context.x,top:context.y,behavior:'instant'});
    });
  });
}
