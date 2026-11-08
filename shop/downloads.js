import { $, escapeHtml as e, icon, copy } from './ui.js?v=download-even-v1';
import { BASE } from './api.js?v=download-even-v1';

export function downloadHref(item) {
  try {
    if(item.local_only && /^\/api\/shop\/downloads\/[a-zA-Z0-9_-]+$/.test(item.url)
      && ['127.0.0.1','localhost'].includes(new URL(BASE).hostname))return new URL(item.url,BASE).href;
    const url=new URL(item.url);
    return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';
  }catch{return '';}
}
export function downloadFor(productId,catalog){return (catalog.downloads||[]).find(item=>item.product_id===productId&&item.enabled!==false);}
export function detailDownload(productId,catalog){
  const item=downloadFor(productId,catalog);
  if(!item)return '';
  const href=downloadHref(item);
  return `<div class="detail-download"><div><strong>Tải IPA</strong></div>${href?`<a class="secondary" href="${e(href)}" target="_blank" rel="noopener noreferrer">Lấy IPA ${icon('arrow')}</a>`:'<span class="download-pending">Đang cập nhật link</span>'}</div>`;
}
export function renderDownloads(catalog){
  const items=catalog.downloads||[];
  $('#ipa-downloads').innerHTML=items.map(item=>{
    const artwork=new URL('./assets/'+(/pubg/i.test(item.product_id)?'pubg-menu-v3.jpg':'zingspeed-menu-v3.jpg'),import.meta.url).href;
    const href=downloadHref(item);
    return `<article class="download-card"><img class="download-cover" src="${artwork}" alt="Ảnh menu ${e(item.title)}" width="1280" height="589"><div class="download-content"><div class="download-title"><h2>${e(item.title)}</h2><span>iOS · IPA</span></div><dl><div><dt>Phiên bản</dt><dd>${e(item.version||'Đang cập nhật')}</dd></div><div><dt>Tệp</dt><dd>${e(item.filename||'Đang cập nhật')}</dd></div></dl><div class="download-actions">${href?`<a class="direct-buy" href="${e(href)}" target="_blank" rel="noopener noreferrer">Lấy IPA ${icon('arrow')}</a><button class="secondary" data-copy-ipa="${e(item.product_id)}" aria-label="Sao chép link ${e(item.title)}">${icon('copy')}</button>`:'<button class="direct-buy" disabled>Đang cập nhật link tải</button>'}</div></div></article>`;
  }).join('')||'<div class="empty"><h2>Đang cập nhật IPA</h2><p>Liên hệ NTJR nếu cần hỗ trợ lấy tệp.</p></div>';
  $('#ipa-downloads').onclick=event=>{
    const button=event.target.closest('[data-copy-ipa]');
    const item=button&&items.find(value=>value.product_id===button.dataset.copyIpa);
    const href=item&&downloadHref(item);
    if(href)copy(href);
  };
}
