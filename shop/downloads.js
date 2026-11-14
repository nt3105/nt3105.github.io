import { $, escapeHtml as e, icon, copy } from './ui.js?v=detail-clean-v1';
import { BASE } from './api.js?v=current-key-v1';
import { productArtwork } from './product-gallery.js?v=ios-gallery-20261114';

export function downloadHref(item) {
  try {
    if(item.local_only && /^\/api\/shop\/downloads\/[a-zA-Z0-9_-]+$/.test(item.url)
      && ['127.0.0.1','localhost'].includes(new URL(BASE).hostname))return new URL(item.url,BASE).href;
    const url=new URL(item.url);
    return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';
  }catch{return '';}
}
function fileKind(item){const match=/\.(xapk|apk|ipa)$/i.exec(item.filename||'');return match?match[1].toUpperCase():'IPA';}
export function downloadFor(productId,catalog){return (catalog.downloads||[]).find(item=>item.product_id===productId&&item.enabled!==false);}
export function detailDownload(productId,catalog){
  const item=downloadFor(productId,catalog);
  if(!item)return '';
  const href=downloadHref(item),kind=fileKind(item);
  return `<div class="detail-download"><div><strong>Tải ${kind}</strong></div>${href?`<a class="secondary" href="${e(href)}" target="_blank" rel="noopener noreferrer">Tải ${kind} ${icon('arrow')}</a>`:'<span class="download-pending">Đang cập nhật link</span>'}</div>`;
}
export function renderDownloads(catalog){
  const items=catalog.downloads||[];
  $('#ipa-downloads').innerHTML=items.map(item=>{
    const kind=fileKind(item),android=kind!=='IPA';
    const artwork=android?new URL('./assets/racing-v2.png',import.meta.url).href:productArtwork({id:item.product_id});
    const href=downloadHref(item);
    return `<article class="download-card"><img class="download-cover" src="${artwork}" alt="${e(item.title)}" width="1280" height="589"><div class="download-content"><div class="download-title"><h2>${e(item.title)}</h2><span>${android?'Android':'iOS'} · ${kind}</span></div><dl><div><dt>Phiên bản</dt><dd>${e(item.version||'Đang cập nhật')}</dd></div><div><dt>Tệp</dt><dd>${e(item.filename||'Đang cập nhật')}</dd></div></dl>${android?'<p>Gói Android 64-bit. Cài theo hướng dẫn đi kèm bản tải; dùng key ZINGSPEED MOBILE ADR.</p>':''}<div class="download-actions">${href?`<a class="direct-buy" href="${e(href)}" target="_blank" rel="noopener noreferrer">Tải ${kind} ${icon('arrow')}</a><button class="secondary" data-copy-ipa="${e(item.product_id)}" aria-label="Sao chép link ${e(item.title)}">${icon('copy')}</button>`:'<button class="direct-buy" disabled>Đang cập nhật link tải</button>'}</div></div></article>`;
  }).join('')||'<div class="empty"><h2>Đang cập nhật ứng dụng</h2><p>Liên hệ NTJR nếu cần hỗ trợ lấy tệp.</p></div>';
  $('#ipa-downloads').onclick=event=>{
    const button=event.target.closest('[data-copy-ipa]');
    const item=button&&items.find(value=>value.product_id===button.dataset.copyIpa);
    const href=item&&downloadHref(item);
    if(href)copy(href);
  };
}
