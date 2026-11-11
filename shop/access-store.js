const local=['127.0.0.1','localhost'].includes(location.hostname);
export const BASE=local?location.origin:'https://key.nt3105.io.vn';
const STORAGE='ntjr-shop-access-v1';
const valid=value=>/^[a-f0-9]{64}$/.test(value||'');
let memoryToken='',pending=null,restoring=null,generation=0;
function readLocal(){try{const value=localStorage.getItem(STORAGE);return valid(value)?value:'';}catch{return '';}}
function database(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('ntjr-purchases',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('access');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('Storage is busy'));
  });
}
async function savedToken(){
  try{
    const db=await database();
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('access','readonly'),req=tx.objectStore('access').get('owner');
      req.onsuccess=()=>resolve(valid(req.result)?req.result:'');req.onerror=()=>reject(req.error);
      tx.oncomplete=()=>db.close();tx.onabort=()=>{db.close();reject(tx.error);};
    });
  }catch{return '';}
}
async function saveToken(token){
  try{localStorage.setItem(STORAGE,token);}catch{}
  try{
    const db=await database();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('access','readwrite');tx.objectStore('access').put(token,'owner');
      tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }catch{}
}
async function session(token){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(BASE+'/api/shop/access/session',{method:'POST',credentials:'include',cache:'no-store',
      signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token||null})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!valid(data.access_token))throw new Error('Chưa lưu được phiên mua hàng. Kiểm tra mạng rồi thử lại.');
    return data.access_token;
  }catch(error){throw new Error('Chưa kết nối được phiên mua hàng. Thử lại; không cần tạo đơn hay chuyển tiền lại.');}
  finally{clearTimeout(timer);}
}
export async function accessToken(){
  if(restoring)return restoring;
  if(memoryToken)return memoryToken;
  if(!pending){
    const begin=generation;
    const initialize=async()=>{
      const existing=readLocal()||await savedToken();
      const token=await session(existing);
      if(begin!==generation)return restoring||memoryToken;
      await saveToken(token);memoryToken=token;return token;
    };
    pending=(navigator.locks?navigator.locks.request('ntjr-purchase-history',initialize):initialize())
      .finally(()=>{pending=null;});
  }
  return pending;
}
export async function restoreAccess(value){
  const token=value.trim().toLowerCase();
  if(!valid(token))throw new Error('Mã khôi phục cần đúng 64 ký tự.');
  generation++;
  restoring=(async()=>{const saved=await session(token);await saveToken(saved);memoryToken=saved;return saved;})()
    .finally(()=>{restoring=null;});
  return restoring;
}

// Compatibility for tabs opened before automatic-history UI.
export async function downloadRecovery(order=null){
  const token=await accessToken();
  const lines=['MA KHOI PHUC DON HANG NTJR','Giu rieng tu: ma nay cho phep xem key cua ban.','',
    ...(order?['Ma don: '+order.id,'Noi dung chuyen khoan: '+order.memo,'Key: '+(order.key||'Chua cap'),'']:[]),
    'MA KHOI PHUC:',token,'','Mo cua hang > Lich su > Toi da co ma de khoi phuc.'];
  const blob=new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;
  link.download=order?'NTJR-key-va-khoi-phuc-'+order.memo+'.txt':'NTJR-ma-khoi-phuc.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
