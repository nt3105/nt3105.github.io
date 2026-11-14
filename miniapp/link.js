const code=location.hash.slice(1);history.replaceState(null,'',location.pathname);
const base=['127.0.0.1','localhost'].includes(location.hostname)?location.origin:'https://key.nt3105.io.vn';
const target=document.querySelector('#target'),button=document.querySelector('#confirm'),result=document.querySelector('#result');
async function post(path,body){
 const response=await fetch(base+'/api/shop/telegram/pairing/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
 const value=await response.json();if(!response.ok)throw new Error(value.detail||'Chưa liên kết được.');return value;
}
(async()=>{
 try{
  if(!/^[a-f0-9]{64}$/.test(code))throw new Error('Mở liên kết từ Mini App NTJR.');
  const profile=await post('target',{code});
  target.textContent='Liên kết với '+profile.first_name+(profile.username?' (@'+profile.username+')':'')+' trên Telegram.';
  button.disabled=false;
 }catch(error){target.textContent=error.message;}
})();
button.onclick=async()=>{
 button.disabled=true;
 try{
  const {accessToken}=await import('/shop/access-store.js?v=current-key-v1');
  const webToken=await accessToken();
  await post('confirm',{code,web_access_token:webToken});
  result.textContent='Đã liên kết. Quay lại Telegram và làm mới danh sách key.';
 }catch(error){result.textContent=error.message;button.disabled=false;}
};
