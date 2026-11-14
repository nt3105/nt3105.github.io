import { $, escapeHtml as e, icon, money, duration, toast } from './ui.js?v=detail-clean-v1';
import { detailDownload } from './downloads.js?v=ios-gallery-20261114';
import { productArtwork, productImages, galleryMarkup, bindGallery } from './product-gallery.js?v=ios-gallery-20261114';
export { productArtwork };
let returnContext=null;
let current=null;
export function syncDetail(catalog){
  if(!current||!$('#product-detail').open)return;
  const product=catalog.products.find(p=>p.id===current.product);
  if(!product||!product.plans.length){
    $('#product-detail').close();toast('Gói của game này đã tạm ngừng bán.');return;
  }
  const plan=product.plans.find(p=>p.sku===current.sku)||product.plans[0],scroll=$('#product-detail').scrollTop;
  openDetail(product,plan,catalog,current.onBuy);
  $('#product-detail').scrollTop=scroll;
}
export function openDetail(product,selected,catalog,onBuy,trigger=document.activeElement) {
  if(!product||!selected)return;
  const imageIndex=current?.product===product.id&&$('#product-detail').open?current.imageIndex:1;
  current={product:product.id,sku:selected.sku,onBuy,imageIndex};
  const dialog=$('#product-detail');
  if(!dialog.open){
    returnContext={x:window.scrollX,y:window.scrollY,page:document.body.dataset.page,trigger};
    document.documentElement.classList.add('detail-open');
  }
  $('#product-detail').classList.toggle('screenshot-detail',/pubg|zsm|zingspeed/i.test(product.id));
  let plan = selected;
  const images=productImages(product);
  function render() {
    const canBuy = catalog.sales_enabled && plan.enabled && plan.price > 0;
    $('#detail-content').innerHTML = `${images.length?galleryMarkup(images,current.imageIndex):`<div class="detail-art"><img src="${productArtwork(product)}" alt="" width="1672" height="941"><span>NTJR DIGITAL COLLECTION</span></div>`}<div class="detail-body"><p class="eyebrow">THÔNG TIN SẢN PHẨM</p><h2 id="detail-title">${e(product.name)}</h2><p class="detail-intro">Kiểm tra thông tin gói trước khi tiếp tục thanh toán.</p><dl class="detail-specs"><div><dt>Nền tảng</dt><dd>${e(plan.platform === 'both' ? 'iOS & Android' : plan.platform === 'ios' ? 'iOS' : 'Android')}</dd></div><div><dt>Giới hạn thiết bị</dt><dd>${plan.max_devices} thiết bị</dd></div><div><dt>Thời hạn</dt><dd>${duration(plan,true)}</dd></div></dl><div class="plans detail-plans" role="group" aria-label="Chọn gói trong chi tiết">${product.plans.map(p=>`<button class="plan-button ${p.sku===plan.sku?'selected':''}" data-detail-plan="${e(p.sku)}" aria-pressed="${p.sku===plan.sku}">${duration(p)}<small>${p.price?money(p.price):"Chưa đặt giá"}</small></button>`).join('')}</div><p class="detail-note">Thời hạn bắt đầu khi nhập key và xác thực thành công lần đầu. Chưa dùng thì chưa tính giờ. Key được lưu trong đơn sau khi giao dịch được xác nhận.${catalog.demo ? ' Đây là bản thử thanh toán, không chuyển tiền thật.' : ''}</p><div class="purchase-row"><div><p class="price-label">GIÁ GÓI</p><div class="price">${plan.price ? money(plan.price) : 'Chưa đặt giá'}</div></div><button class="primary" id="detail-buy" ${canBuy?'':'disabled'}>Tiếp tục thanh toán ${icon('arrow')}</button></div></div>`;
    bindGallery($('#detail-content'),images,index=>{current.imageIndex=index;});
    $('#detail-content .detail-body').insertAdjacentHTML('beforeend',detailDownload(product.id,catalog));
    $('#detail-buy').addEventListener('click',()=>{ $('#product-detail').close(); onBuy(plan.sku); });
    $('#detail-content').querySelectorAll('[data-detail-plan]').forEach(button=>button.addEventListener('click',()=>{
      const sku=button.dataset.detailPlan;
      plan=product.plans.find(p=>p.sku===sku); render();
      current.sku=plan.sku;
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
    current=null;
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
