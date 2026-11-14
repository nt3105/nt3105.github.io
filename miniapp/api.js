const local=['127.0.0.1','localhost'].includes(location.hostname);
export const PREVIEW=local&&new URL(location.href).searchParams.get('preview')==='1';
const BASE=local?location.origin:'https://key.nt3105.io.vn';
let token='';
export async function call(path,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(BASE+'/api/shop'+path,{method:body?'POST':'GET',signal:controller.signal,cache:'no-store',
   headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const value=await response.json();
  if(!response.ok)throw new Error(typeof value.detail==='string'?value.detail:'Chưa xử lý được yêu cầu.');
  return value;
 }catch(error){throw new Error(error.name==='AbortError'?'Kết nối chậm. Thử lại sau.':error.message);}
 finally{clearTimeout(timer);}
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
