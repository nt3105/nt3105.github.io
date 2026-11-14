import {e,money,duration,keyState,toast} from './ui.js?v=inline-qr-1';

// The server-issued capability is kept in this view only, never in a URL or storage.
export function createCheckoutView({element,load,onBack,onDelivered}){
 let active=false,code='',order=null,generation=0,poll=null,tick=null,request=null;
 const back=()=>onBack();
 const tg=window.Telegram?.WebApp;
 const terminal=status=>[401,403,404,410,422].includes(status);
 const row=(name,value,copy)=>'<div class="data-row"><span>'+name+'</span><strong><span>'+e(value)+'</span>'+(copy?'<button class="bank-copy" data-bank-copy="'+copy+'" aria-label="Sao chép '+name+'">Chép</button>':'')+'</strong></div>';
 function clearTimers(){clearTimeout(poll);clearInterval(tick);poll=tick=null;}
 function expired(){return order?.state==='pending'&&order.pay_by<=Math.floor(Date.now()/1000);}
 function countdown(){
  const el=element.querySelector('[data-countdown]');if(!el||!order)return;
  const seconds=Math.max(0,order.pay_by-Math.floor(Date.now()/1000));
  el.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  const bank=element.querySelector('.bank-grid');if(bank)bank.hidden=seconds===0;
  const note=element.querySelector('[data-deadline-note]');if(note)note.hidden=seconds>0;
 }
 function render(){
  const o=order,p=o.plan;
  let html='<div class="section-head"><h1>Thanh toán QR</h1><button class="secondary" data-bank-back>Quay lại</button></div><p>'+e(p.title)+' · '+e(p.platform.toUpperCase())+' · '+e(duration(p))+'</p><p class="small pay-code">Đơn '+e(o.memo)+'</p><p class="small">Nguồn mua: '+e(o.purchase_source_label||'Telegram')+'</p><p class="pay-amount">'+money(o.amount)+'</p>';
  if(o.state==='pending'){
   html+='<section class="pay-status" role="status"><strong>Chờ ngân hàng xác nhận</strong><p>Thời gian còn <b data-countdown></b></p><p data-deadline-note hidden>Đã hết thời gian. Không chuyển thêm tiền vào đơn này; đang kiểm tra trạng thái.</p></section><section class="panel bank-grid"><div class="qr-wrap"><img class="bank-qr" src="'+e(o.qr_url)+'" alt="Mã QR chuyển khoản đúng số tiền và nội dung"></div><div class="bank-details">'+row('Ngân hàng',o.bank.name)+row('Số tài khoản',o.bank.account,'account')+row('Chủ tài khoản',o.bank.owner)+row('Số tiền',money(o.amount),'amount')+row('Nội dung',o.memo,'memo')+'</div></section><p class="pay-note">Chuyển đúng số tiền và nội dung. Key sẽ tự hiện tại đây khi ngân hàng xác nhận. Nếu đã trừ tiền, không chuyển lại.</p>';
  }else if(o.state==='paid'){
   html+='<section class="pay-status" role="status"><strong>Đã nhận tiền, đang cấp key…</strong><p>Không chuyển thêm tiền. Key sẽ tự hiện khi xử lý xong.</p></section>';
  }else if(o.state==='delivered'){
   html+='<section class="pay-status" role="status"><strong>Đã nhận tiền và cấp key</strong><p>Đơn và key đã lưu theo tài khoản Telegram.</p></section><section class="key-card"><h2>Key của bạn</h2><p>'+e(keyState(o))+'</p>'+(o.key?'<code class="key-code">'+e(o.key)+'</code><button class="primary" data-bank-copy="key">Sao chép key</button>':'<p>'+e(o.key_message||'Liên hệ hỗ trợ để kiểm tra key.')+'</p>')+'<div class="actions"><button class="secondary" data-route="keys">Xem key đã mua</button></div></section>';
  }else{
   html+='<section class="pay-status bad" role="status"><strong>'+(o.state==='expired'?'Đơn đã hết thời gian thanh toán':'Đơn cần được kiểm tra')+'</strong><p>Không chuyển vào mã cũ. Nếu đã bị trừ tiền, liên hệ hỗ trợ kèm mã đơn.</p></section>';
  }
  element.innerHTML='<section class="inline-payment">'+html+'<p class="small" data-bank-connection role="status"></p><div class="actions"><button class="secondary" data-bank-refresh>Kiểm tra lại</button><button class="secondary" data-support>Liên hệ hỗ trợ</button></div></section>';
  countdown();
 }
 function validQR(value){
  if(value.state!=='pending')return;
  const u=new URL(value.qr_url);
  const fixture=['localhost','127.0.0.1'].includes(location.hostname)&&value.demo&&u.protocol==='data:';
  if(!fixture&&(u.origin!=='https://vietqr.app'||u.username||u.password))throw Object.assign(Error('Địa chỉ QR không hợp lệ.'),{status:422});
 }
 async function refresh(){
  if(!active||request||document.hidden)return;
  clearTimeout(poll);const current=generation,controller=new AbortController();request=controller;
  try{
   const value=await load(code,controller.signal);
   if(!active||current!==generation||controller.signal.aborted)return;
   validQR(value);const delivered=value.state==='delivered'&&order?.state!=='delivered';
   if(JSON.stringify(value)!==JSON.stringify(order)){order=value;render();}
   element.querySelector('[data-bank-connection]').textContent='';
   if(delivered)onDelivered?.();
   if(['pending','paid'].includes(order.state))poll=setTimeout(refresh,5000);
  }catch(error){
   if(!active||current!==generation||controller.signal.aborted)return;
   if(terminal(error.status)){
    clearTimers();order=null;
    element.innerHTML='<section class="inline-payment"><h1>Chưa mở được thanh toán</h1><p>'+e(error.message)+'</p><button class="secondary" data-bank-back>Về đơn hàng</button></section>';
   }else{
    const el=element.querySelector('[data-bank-connection]');if(el)el.textContent=error.message+' Đang thử lại…';
    poll=setTimeout(refresh,10000);
   }
  }finally{if(request===controller)request=null;}
 }
 async function click(event){
  if(event.target.closest('[data-bank-back]'))return back();
  if(event.target.closest('[data-bank-refresh]'))return refresh();
  const button=event.target.closest('[data-bank-copy]');if(!button||!order)return;
  if(expired()&&button.dataset.bankCopy!=='key')return toast('Đơn đã hết thời gian thanh toán.');
  const value={key:order.key,account:order.bank?.account,amount:String(order.amount),memo:order.memo}[button.dataset.bankCopy];
  if(value)try{await navigator.clipboard.writeText(value);toast('Đã sao chép.');}catch{toast('Chạm giữ nội dung để sao chép.');}
 }
 function visibility(){
  if(!active)return;clearTimers();request?.abort();request=null;
  if(!document.hidden){countdown();tick=setInterval(countdown,1000);refresh();}
 }
 function close(){
  active=false;generation++;clearTimers();request?.abort();request=null;order=null;code='';
  element.removeEventListener('click',click);document.removeEventListener('visibilitychange',visibility);
  try{tg?.BackButton?.offClick(back);tg?.BackButton?.hide();}catch{}
 }
 function open(value){
  close();if(!/^[a-f0-9]{64}$/.test(value))throw Error('Thông tin thanh toán không hợp lệ.');
  active=true;code=value;
  element.innerHTML='<section class="inline-payment"><h1>Thanh toán QR</h1><p class="loading">Đang tải mã QR…</p><p data-bank-connection role="status"></p><button class="secondary" data-bank-back>Về đơn hàng</button></section>';
  element.addEventListener('click',click);document.addEventListener('visibilitychange',visibility);
  try{tg?.BackButton?.onClick(back);tg?.BackButton?.show();}catch{}
  tick=setInterval(countdown,1000);refresh();
 }
 return {open,close};
}
