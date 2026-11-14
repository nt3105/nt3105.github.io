import * as api from './api.js?v=compact-2';
import {$,e,money,date,duration,artwork,groups,cards,empty,keyState,toast,safeOpen} from './ui.js?v=compact-2';
const state={route:'home',catalog:null,me:null,query:'',page:1,items:[],busy:false,serial:0};
const tg=window.Telegram?.WebApp;
try{tg?.ready();tg?.expand();tg?.setHeaderColor('#0b1220');tg?.setBackgroundColor('#0b1220');}catch{}
if(api.PREVIEW)$('#preview').hidden=false;
function identity(){
 const u=state.me.user;$('#avatar').textContent=Array.from(u.first_name)[0]||'N';
 $('#account-name').textContent=u.first_name;
 $('#account-id').textContent=(u.username?'@'+u.username+' · ':'')+'ID: '+u.id;
}
function nav(route){
 state.route=route;state.page=1;
 document.querySelectorAll('.bottom [data-route]').forEach(b=>{if(b.dataset.route===route)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 render();window.scrollTo(0,0);
}
function renderList(){
 const query=state.query.toLocaleLowerCase('vi').trim();
 const items=groups(state.catalog.products).filter(g=>(g.name+' '+g.products.map(p=>p.name).join(' ')).toLocaleLowerCase('vi').includes(query));
 $('#game-list').innerHTML=items.length?cards(items):'<p class="muted">Không tìm thấy sản phẩm.</p>';
}
function home(){
 $('#content').innerHTML='<div class="section-head"><div><h1>Cửa hàng</h1><p class="small">Chọn game để xem các gói hiện có.</p></div><span class="tag">NTJR</span></div><div class="toolbar"><input id="search" type="search" aria-label="Tìm sản phẩm" placeholder="Tìm trò chơi…" value="'+e(state.query)+'"><button class="secondary" data-refresh>Làm mới</button></div><div id="game-list" class="products"></div><p class="helper">Đơn hàng và key được lưu theo tài khoản Telegram của bạn.</p>';
 renderList();$('#search').addEventListener('input',event=>{state.query=event.target.value;renderList()});
}
function profile(){
 const u=state.me.user;
 $('#content').innerHTML='<h1>Tài khoản</h1><p class="profile-id">'+e(u.username?'@'+u.username:u.first_name)+' · ID: '+u.id+'</p><section class="panel"><p class="panel-label">ĐÃ LƯU THEO TELEGRAM</p><div class="data-row"><span>Đơn hàng</span><strong>'+state.me.orders_total+'</strong></div><div class="data-row"><span>Key đã mua</span><strong>'+state.me.keys_total+'</strong></div><div class="data-row"><span>Lịch sử web đã liên kết</span><strong>'+state.me.linked_histories+'</strong></div><div class="actions"><button class="primary" data-pair>Liên kết website</button><button class="secondary" data-route="orders">Xem đơn</button></div><p class="helper">Dùng cùng tài khoản Telegram để xem lại đơn và key trên thiết bị khác.</p></section><section class="panel"><h2>Tùy chọn</h2><div class="actions"><button class="secondary" data-theme>Đổi sáng / tối</button><button class="secondary" data-support>Liên hệ hỗ trợ</button><button class="secondary" data-close>Đóng Mini App</button></div></section>';
}
async function render(){
 const serial=++state.serial;
 if(state.route==='home')return home();
 if(state.route==='profile')return profile();
 const keys=state.route==='keys';$('#content').innerHTML='<h1>'+(keys?'Key của tôi':'Lịch sử đơn')+'</h1><p class="loading">Đang tải…</p>';
 try{
  const result=await api.orders(state.page,keys);if(serial!==state.serial)return;state.items=result.items;
  const labels={pending:'Chờ thanh toán',paid:'Đang cấp key',delivered:'Đã giao key',expired:'Hết hạn',review:'Cần kiểm tra'};
  $('#content').innerHTML='<div class="section-head"><h1>'+(keys?'Key của tôi':'Lịch sử đơn')+'</h1><button class="text-button" data-refresh>Làm mới ↻</button></div>'+
  (result.items.length?result.items.map(item=>keys?
   '<article class="key-card"><div class="row"><h3>'+e(item.plan.title)+'</h3><span class="tag">'+e(item.plan.platform.toUpperCase())+'</span></div><span class="status '+(['expired','disabled','removed'].includes(item.key_status)?'bad':'')+'">'+e(keyState(item))+'</span>'+
   (item.key?'<code class="key-code">'+e(item.key)+'</code><button class="secondary" data-copy="'+e(item.id)+'">Sao chép key</button>':'<p>'+e(item.key_message||'Key đang được cập nhật.')+'</p>')+'</article>':
   '<article class="order"><div class="row"><h3>'+e(item.memo)+'</h3><span class="status '+(item.state==='expired'?'bad':'')+'">'+e(labels[item.state]||'Cần kiểm tra')+'</span></div><p class="small">'+e(date(item.created_at))+'</p><div class="data-row"><span>Sản phẩm</span><strong>'+e(item.plan.title)+'</strong></div><div class="data-row"><span>Gói</span><strong>'+e(duration(item.plan))+'</strong></div><div class="data-row"><span>Số tiền</span><strong>'+money(item.amount)+'</strong></div></article>').join(''):
   empty(keys?'Chưa có key':'Chưa có đơn hàng','Đã mua trên website? Liên kết một lần để xem lịch sử tại đây.'))+
   (result.total>30?'<div class="pagination"><button class="secondary" data-page="-1" '+(result.page<=1?'disabled':'')+'>← Trước</button><span>Trang '+result.page+'</span><button class="secondary" data-page="1" '+(result.page*30>=result.total?'disabled':'')+'>Tiếp →</button></div>':'');
 }catch(error){if(serial===state.serial)$('#content').innerHTML=empty('Chưa tải được',error.message);}
}
function chooseGroup(id){
 const g=groups(state.catalog.products).find(x=>x.id===id);if(!g)return;
 if(g.products.length===1)return detail(g.products[0].id);
 $('#product-body').innerHTML='<div class="detail-info"><span class="tag">CHỌN PHIÊN BẢN</span><h2 id="product-name">'+e(g.name)+'</h2>'+g.products.map(p=>'<button class="variant-row" data-product="'+e(p.id)+'"><span><strong>'+e(p.plans.every(x=>x.platform==='android')?'Android':'iOS')+'</strong><small>'+p.plans.length+' gói hiện có</small></span><span class="choose">Xem →</span></button>').join('')+'</div>';
 $('#product-dialog').showModal();
}
function detail(id){
 const p=state.catalog.products.find(p=>p.id===id);if(!p)return;
 $('#product-body').innerHTML='<img class="detail-image" src="'+artwork(p)+'" alt="'+e(p.name)+'" width="1280" height="590"><div class="detail-info"><span class="tag">THÔNG TIN SẢN PHẨM</span><h2 id="product-name">'+e(p.name)+'</h2>'+
 p.plans.map(x=>'<div class="plan-row"><span>'+duration(x)+'<small class="small"><br>'+e(x.platform.toUpperCase())+' · '+x.max_devices+' thiết bị</small></span><strong>'+money(x.price)+'</strong></div>').join('')+
 '<p class="detail-note">Giá hiển thị là giá trên website. Thanh toán trong Telegram chưa mở.</p></div>';
 if(!$('#product-dialog').open)$('#product-dialog').showModal();
}
async function pair(){
 if(!state.me)return toast('Mở Mini App từ bot Telegram để liên kết.');
 if(api.PREVIEW)return toast('Bản xem trước: liên kết thật mở trong trình duyệt đã mua key.');
 if(state.busy)return;state.busy=true;
 try{const value=await api.pairing();safeOpen('https://nt3105.io.vn/miniapp/link.html#'+value.code);toast('Xác nhận trong trình duyệt rồi quay lại làm mới.');}
 catch(error){toast(error.message)}finally{state.busy=false;}
}
function theme(){document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light'}
document.addEventListener('click',async event=>{
 const route=event.target.closest('[data-route]');if(route&&state.me)return nav(route.dataset.route);
 if(event.target.closest('[data-pair]'))return pair();
 const group=event.target.closest('[data-group]');if(group)return chooseGroup(group.dataset.group);
 const product=event.target.closest('[data-product]');if(product)return detail(product.dataset.product);
 if(event.target.closest('button[data-theme]'))return theme();
 if(event.target.closest('[data-support]'))return safeOpen('https://t.me/neverdierrr',true);
 if(event.target.closest('[data-close]')){if(tg?.initData)tg.close();else toast('Bản xem trước đang mở trên trình duyệt.');return;}
 const page=event.target.closest('[data-page]');if(page){state.page+=Number(page.dataset.page);return render();}
 if(event.target.closest('[data-refresh]')&&!state.busy){state.busy=true;try{[state.me,state.catalog]=await Promise.all([api.account(),api.catalog()]);identity();render()}catch(error){toast(error.message)}finally{state.busy=false}}
 const copy=event.target.closest('[data-copy]');
 if(copy){const item=state.items.find(x=>x.id===copy.dataset.copy);if(item?.key){try{await navigator.clipboard.writeText(item.key);toast('Đã sao chép key.')}catch{toast('Chạm giữ vào key để sao chép.')}}}
});
$('#close-product').onclick=()=>$('#product-dialog').close();$('#theme').onclick=theme;
window.addEventListener('focus',async()=>{if(state.me&&!state.busy){try{state.me=await api.account();identity();if(state.route==='profile')profile()}catch{}}});
(async()=>{
 try{await api.login();[state.catalog,state.me]=await Promise.all([api.catalog(),api.account()]);identity();nav('home');}
 catch(error){$('#content').innerHTML='<section class="gate"><span class="tag">NTJR TELEGRAM SHOP</span><h1>Mở cửa hàng trong Telegram</h1><p>'+e(error.message)+'</p><p><a class="primary" href="https://t.me/ntjr3105_shop_bot">Mở bot NTJR Key Shop ↗</a></p><p class="small">Nếu đã mở từ bot, đóng cửa sổ rồi bấm “Mở cửa hàng” để nhận phiên mới.</p></section>';}
})();
