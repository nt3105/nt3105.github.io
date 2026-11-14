import {e,money,duration,keyState,toast} from './ui.js?v=bank-1';
const main=document.querySelector('#payment'),connection=document.querySelector('#connection');
const base=['localhost','127.0.0.1'].includes(location.hostname)?location.origin:'https://key.nt3105.io.vn';
let code=location.hash.slice(1),order=null,busy=false,timer=null;
if(code){history.replaceState(null,'',location.pathname);if(/^[a-f0-9]{64}$/.test(code))try{sessionStorage.setItem('ntjr-payment-link',code)}catch{}}
else try{code=sessionStorage.getItem('ntjr-payment-link')||''}catch{}
function row(name,value,copy){return '<div class="data-row"><span>'+name+'</span><strong>'+e(value)+(copy?'<button class="bank-copy" data-copy="'+copy+'" aria-label="Sao chép '+name+'">Chép</button>':'')+'</strong></div>'}
function render(){
 const o=order,p=o.plan;
 let body='<h1>Thanh toán chuyển khoản</h1><p>'+e(p.title)+' · '+e(p.platform.toUpperCase())+' · '+e(duration(p))+'</p><p class="small">Đơn <span class="pay-code">'+e(o.memo)+'</span></p>'+
 (o.telegram_account?'<p class="helper">Đơn lưu vào Telegram '+e(o.telegram_account)+'.</p>':'')+'<p class="pay-amount">'+money(o.amount)+'</p>';
 if(o.state==='delivered'){
  body+='<section class="pay-status"><strong>Đã nhận tiền và cấp key</strong><p>Đơn hàng và key đã được lưu. Mở tab Key trong bot để xem lại.</p></section><section class="key-card"><h2>Key của bạn</h2><p>'+e(keyState(o))+'</p>'+(o.key?'<code class="key-code">'+e(o.key)+'</code><button class="primary" data-copy="key">Sao chép key</button>':'<p>'+e(o.key_message||'Liên hệ hỗ trợ để kiểm tra key.')+'</p>')+'</section>';
 }else if(o.state==='pending'){
  body+='<div class="pay-status"><strong>Chờ ngân hàng xác nhận</strong><p>Thời gian thanh toán còn <b id="countdown"></b>.</p></div><section class="panel bank-grid"><div class="qr-wrap"><img class="bank-qr" src="'+e(o.qr_url)+'" alt="Mã QR chuyển khoản đúng số tiền và nội dung"></div><div class="bank-details">'+row('Ngân hàng',o.bank.name)+row('Số tài khoản',o.bank.account,'account')+row('Chủ tài khoản',o.bank.owner)+row('Số tiền',money(o.amount),'amount')+row('Nội dung',o.memo,'memo')+'</div></section><p class="pay-note">Chuyển đúng số tiền và nội dung ở trên. Hệ thống tự kiểm tra và cấp key sau khi nhận tiền; không cần bấm xác nhận đã chuyển. Không chuyển lại nếu ngân hàng đã trừ tiền.</p>';
 }else if(o.state==='paid')body+='<section class="pay-status"><strong>Đã nhận tiền, đang cấp key…</strong><p>Đơn đang được xử lý tự động. Không chuyển thêm tiền.</p></section>';
 else body+='<section class="pay-status bad"><strong>'+(o.state==='expired'?'Đơn đã hết thời gian thanh toán':'Đơn cần được kiểm tra')+'</strong><p>'+(o.state==='expired'?'Không chuyển tiền vào mã cũ. Quay lại bot để tạo đơn mới. Nếu đã chuyển, liên hệ hỗ trợ kèm mã đơn.':'Nếu ngân hàng đã trừ tiền, không chuyển lại. Gửi mã đơn cho hỗ trợ để đối soát.')+'</p></section>';
 body+='<div class="actions"><button class="secondary pay-refresh" id="refresh">Kiểm tra lại</button><a class="secondary" href="https://t.me/neverdierrr" rel="noopener noreferrer" target="_blank">Liên hệ hỗ trợ</a></div>';
 main.innerHTML=body;countdown();
}
function countdown(){const el=document.querySelector('#countdown');if(!el||!order)return;const left=Math.max(0,order.pay_by-Math.floor(Date.now()/1000));el.textContent=left?Math.floor(left/60)+':'+String(left%60).padStart(2,'0'):'đang kiểm tra';}
async function load(){
 if(busy)return;busy=true;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const r=await fetch(base+'/api/shop/telegram/checkout/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code}),signal:controller.signal,cache:'no-store'});
  const value=await r.json();if(!r.ok){const error=Error(value.detail||'Chưa tải được đơn hàng.');error.terminal=[401,403,410,422].includes(r.status);throw error;}
  if(value.qr_url&&!value.demo){const url=new URL(value.qr_url);if(url.origin!=='https://vietqr.app')throw Error('Địa chỉ QR không hợp lệ.');}
  if(JSON.stringify(order)!==JSON.stringify(value)){order=value;render();}connection.textContent='';
  clearTimeout(timer);if(['pending','paid'].includes(order.state))timer=setTimeout(load,5000);
 }catch(error){connection.textContent=error.name==='AbortError'?'Kết nối chậm, đang thử lại…':error.message;if(!order)main.innerHTML='<h1>Thanh toán chuyển khoản</h1><p>Mở link thanh toán từ đơn hàng trong bot NTJR.</p>';clearTimeout(timer);if(!error.terminal)timer=setTimeout(load,10000);}
 finally{busy=false;clearTimeout(timeout);}
}
document.addEventListener('click',async event=>{
 if(event.target.closest('#refresh'))return load();
 const button=event.target.closest('[data-copy]');if(!button||!order)return;
 const value={key:order.key,account:order.bank.account,amount:String(order.amount),memo:order.memo}[button.dataset.copy];
 if(value)try{await navigator.clipboard.writeText(value);toast('Đã sao chép.')}catch{toast('Chạm giữ nội dung để sao chép.');}
});
if(/^[a-f0-9]{64}$/.test(code)){load();setInterval(countdown,1000);}else{main.innerHTML='<h1>Link thanh toán không hợp lệ</h1><p>Mở bot NTJR, chọn gói hoặc đơn hàng để lấy link thanh toán.</p>';}
