export const $=selector=>document.querySelector(selector);
export const e=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const money=value=>new Intl.NumberFormat('vi-VN').format(value)+'đ';
export const date=value=>value?new Date(value*1000).toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'}):'—';
export const duration=plan=>plan.never_expires?'Vĩnh viễn':plan.hours%24===0?(plan.hours/24)+' ngày':plan.hours+' giờ';
export function artwork(product){return './assets/'+(/android/i.test(product.id)?'racing-v2.png':/pubg/i.test(product.id)?'pubg-menu-v3.jpg':'zsm-ios-20261114-2.jpg');}
export function groups(products){
 const result=new Map();
 for(const p of products){const id=/zsm|zingspeed/i.test(p.id)?'zsm':/pubg/i.test(p.id)?'pubg':p.id;let row=result.get(id);
  if(!row){row={id,name:id==='zsm'?'ZingSpeed Mobile':id==='pubg'?'PUBG Mobile':p.name,products:[]};result.set(id,row);}row.products.push(p);
 }
 return [...result.values()];
}
export function cards(items){return items.map(g=>'<button class="game-row" data-group="'+e(g.id)+'"><img class="game-thumb" src="'+artwork(g.products.find(p=>!/android/i.test(p.id))||g.products[0])+'" alt="" width="62" height="62"><span class="game-info"><strong class="game-name">'+e(g.name)+'</strong><small>'+g.products.length+' lựa chọn · '+e([...new Set(g.products.flatMap(p=>p.plans.map(x=>x.platform==='android'?'Android':'iOS')))].join(' / '))+'</small></span><span class="choose">Chọn →</span></button>').join('');}
export function empty(title,text){return '<div class="empty"><h2>'+e(title)+'</h2><p>'+e(text)+'</p><button class="primary" data-pair>Liên kết lịch sử web</button></div>';}
export function keyState(item){
 if(item.key_status==='disabled')return 'Đã khóa';
 if(item.key_status==='expired')return 'Hết hạn';
 if(item.key_status==='removed')return 'Không còn hoạt động';
 if(item.activation_pending)return 'Chờ kích hoạt';
 if(item.clock_paused)return 'Đang tạm dừng';
 if(item.license_never_expires)return 'Vĩnh viễn';
 return item.key_expires?'Hết hạn '+date(item.key_expires):'Đang cập nhật';
}
export function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{$('#toast').hidden=true},3000);}
export function safeOpen(url,telegram=false){
 const target=new URL(url);if(target.protocol!=='https:')return;
 const app=window.Telegram?.WebApp;
 if(telegram&&target.hostname==='t.me'&&app?.openTelegramLink)app.openTelegramLink(target.href);
 else if(app?.openLink)app.openLink(target.href);
 else window.open(target.href,'_blank','noopener,noreferrer');
}
