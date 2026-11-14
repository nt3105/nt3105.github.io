const local=['127.0.0.1','localhost'].includes(location.hostname);
export const PREVIEW=local&&new URL(location.href).searchParams.get('preview')==='1';
const BASE=local?location.origin:'https://key.nt3105.io.vn';
let token='';
export async function call(path,body,{signal}={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 try{
  const response=await fetch(BASE+'/api/shop'+path,{method:body?'POST':'GET',signal:controller.signal,cache:'no-store',
   headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const value=await response.json();
  if(!response.ok)throw Object.assign(new Error(typeof value.detail==='string'?value.detail:'Chưa xử lý được yêu cầu.'),{status:response.status});
  return value;
 }catch(error){if(error.name==='AbortError'&&!signal?.aborted)throw new Error('Kết nối chậm. Thử lại sau.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function login(){
 const initData=PREVIEW?'preview-only':window.Telegram?.WebApp?.initData;
 if(!initData)throw new Error('Mở Mini App từ nút “Mở cửa hàng” trong bot Telegram NTJR.');
 const value=await call('/telegram/session',{init_data:initData});token=value.access_token;return value;
}
export const catalog=()=>call('/catalog');
export const account=()=>call('/telegram/me');
export const orders=(page=1,keysOnly=false)=>call('/telegram/orders?page='+page+'&keys_only='+keysOnly);
export const pairing=()=>call('/telegram/pairing',{});
export const checkout=(sku,request_id,expected_price)=>call('/telegram/checkout',{sku,request_id,expected_price});
export const resumeCheckout=order_id=>call('/telegram/checkout/resume',{order_id});
export const payment=(code,signal)=>call('/telegram/checkout/open',{code},{signal});
