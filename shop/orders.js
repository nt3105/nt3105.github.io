import { api, restoreAccess } from './api.js?v=auto-history-v3';
import { $, escapeHtml as e, icon, money, dateTime, stateLabels, toast, showPage } from './ui.js?v=detail-clean-v1';
import { openOrder } from './checkout.js?v=auto-history-v3';
let orders=[],page=1,sequence=0,loading=false;
export async function loadOrders(next=1){
  page=Number.isInteger(next)?next:1;const current=++sequence;loading=true;
  $('#orders').innerHTML='<div class="loading-card">Đang lấy lịch sử đã lưu của bạn…</div>';
  try{
    const data=await api('/orders?page='+page);if(current!==sequence)return;
    orders=data.items;
    const total=data.total??orders.length,size=data.page_size??50;
    if(!orders.length&&page>1)return loadOrders(Math.max(1,Math.ceil(total/size)));
    $('#history-status').textContent='Đơn và key được ghi nhớ tự động. Mở lại bằng trình duyệt này để xem; không cần tải file hay bấm lưu.';
    $('#orders').innerHTML=orders.length?orders.map(o=>`<article class="order-row"><div><strong>${e(o.plan.title)}</strong><small>${dateTime(o.created_at)} · ${e(o.memo)}</small><div><span class="state-badge ${e(o.state)}">${stateLabels[o.state]||'Đang xử lý'}</span></div></div><strong class="order-price">${money(o.amount)}</strong><button class="secondary" data-order="${e(o.id)}">${o.state==='delivered'?'Lấy lại key':'Xem đơn'} ${icon('arrow')}</button></article>`).join(''):`<div class="empty">${icon('bag')}<h2>Chưa có đơn hàng</h2><p>Key bạn mua sẽ tự xuất hiện tại đây.</p><button class="primary" id="browse-products">Khám phá cửa hàng ${icon('arrow')}</button></div>`;
    $('#browse-products')?.addEventListener('click',()=>showPage('catalog'));
    $('#history-pages').hidden=total<=size;
    $('#history-pages').innerHTML='<button class="secondary" data-prev '+(page===1?'disabled':'')+'>← Trước</button><span>'+total+' đơn · Trang '+page+'/'+Math.max(1,Math.ceil(total/size))+'</span><button class="secondary" data-next '+(page*size>=total?'disabled':'')+'>Sau →</button>';
    $('#history-pages [data-prev]').onclick=()=>loadOrders(page-1);$('#history-pages [data-next]').onclick=()=>loadOrders(page+1);
  }catch(error){if(current===sequence){$('#orders').innerHTML='<div class="notice error">'+e(error.message)+'</div>';$('#history-pages').hidden=true;}}
  finally{if(current===sequence)loading=false;}
}
export function initOrders(){
  $('#refresh-orders').addEventListener('click',()=>loadOrders(page));
  $('#orders').addEventListener('click',event=>{
    const b=event.target.closest('[data-order]'),order=b&&orders.find(o=>o.id===b.dataset.order);
    if(order)openOrder(order);
  });
  $('#import-access').addEventListener('click',()=>{$('#restore-error').textContent='';$('#restore-dialog').showModal();});
  $('#close-restore').addEventListener('click',()=>$('#restore-dialog').close());
  $('#restore-form').addEventListener('submit',async event=>{
    event.preventDefault();
    try{await restoreAccess($('#restore-token').value.trim());$('#restore-token').value='';$('#restore-dialog').close();await loadOrders(1);toast('Đã khôi phục lịch sử và tự ghi nhớ.');}
    catch(error){$('#restore-error').textContent=error.message;}
  });
  setInterval(()=>{if(!document.hidden&&!$('#page-orders').hidden&&!$('#checkout').open&&!loading&&orders.some(o=>['pending','paid'].includes(o.state)))loadOrders(page);},15000);
}
