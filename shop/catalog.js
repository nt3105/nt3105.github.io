import { api } from './api.js?v=current-key-v1';
import { $, escapeHtml as e, icon, money, showPage } from './ui.js?v=detail-clean-v1';
import { openDetail, initDetails, productArtwork, syncDetail } from './product-detail.js?v=ios-gallery-20261114';
import { setAnnouncement } from './announcements.js?v=detail-clean-v1';
import { renderDownloads } from './downloads.js?v=ios-gallery-20261114';

let catalog;
let filter = 'all';
let onBuy;
let loading=false,lastSignature='';
const mark = new URL('./assets/mark.svg', import.meta.url).href;
export function catalogData() { return catalog; }

export async function loadCatalog(buy,{silent=false}={}) {
  if (buy) onBuy = buy;
  if(loading)return;
  loading=true;
  if(!silent)$('#catalog-error').hidden = true;
  try {
    const latest=await api('/catalog');
    // Defence for older cached API responses: never render a disabled plan.
    latest.products=latest.products.map(p=>({...p,plans:p.plans.filter(x=>x.enabled&&x.price>=1000)})).filter(p=>p.plans.length);
    const signature=JSON.stringify(latest);
    if(silent&&signature===lastSignature)return;
    catalog=latest;lastSignature=signature;
    $('#catalog-error').hidden=true;
    $('#demo-banner').hidden = !catalog.demo;
    if (catalog.support_url && /^https:\/\//.test(catalog.support_url)) {
      document.querySelectorAll('.contact-link').forEach(link => {link.href=catalog.support_url;});
    }
    $('#product-count').textContent = catalog.products.length;
    $('#pubg-count').textContent = catalog.products.filter(p=>/pubg/i.test(p.id)).length;
    $('#zsm-count').textContent = catalog.products.filter(p=>/zsm|zingspeed/i.test(p.id)).length;
    $('#game-choices').innerHTML=catalog.products.map(product=>`<button data-game="${/pubg/i.test(product.id)?'pubg':'zsm'}"><img src="${productArtwork(product)}" alt="" width="1280" height="589"><span>${e(product.name)}</span>${icon('arrow')}</button>`).join('');
    render();
    syncDetail(catalog);
    renderDownloads(catalog);
    setAnnouncement(catalog);
  } catch (error) {
    if(!silent||!catalog){
      $('#catalog-error').hidden = false;
      $('#catalog-error span').textContent = error.message;
      if(!catalog)$('#catalog').innerHTML = '';
    }
  }finally{loading=false;}
}

function render() {
  const query = $('#search').value.trim().toLocaleLowerCase('vi');
  const products = catalog.products.filter(p => p.name.toLocaleLowerCase('vi').includes(query)
    && (filter === 'all' || (filter === 'pubg' ? /pubg/i.test(p.id) : /zsm|zingspeed/i.test(p.id))));
  $('#catalog').innerHTML = products.map(product => {
    const pubg=/pubg/i.test(product.id),android=product.plans.every(plan=>plan.platform==='android');
    const prices=product.plans.filter(plan=>plan.price>0).map(plan=>plan.price);
    const priceLabel=prices.length?'Từ '+money(Math.min(...prices)):'';
    return `<article class="product-card" data-product="${e(product.id)}"><button class="product-art ${pubg?'pubg':'zsm'}" data-detail="${e(product.id)}" aria-label="Xem ảnh và chi tiết ${e(product.name)}"><img class="product-cover" src="${productArtwork(product)}" alt="Ảnh menu ${e(product.name)}" width="1280" height="589" loading="eager"></button><div class="card-content"><div class="direct-product-title"><img class="product-avatar" src="${mark}" alt="" width="48" height="48"><div><h3><button data-detail="${e(product.id)}">${e(product.name)}</button></h3><p>${pubg?'Key PUBG iOS NTJR':android?'Key ZingSpeed Android NTJR':'Key ZingSpeed iOS NTJR'}</p></div>${priceLabel?`<span class="starting-price">${priceLabel}</span>`:""}</div><button class="direct-buy" data-detail="${e(product.id)}">Xem chi tiết ${icon('arrow')}</button></div></article>`;
  }).join('') || '<div class="empty"><h2>Chưa tìm thấy sản phẩm</h2><p>Thử một tên khác hoặc chọn Tất cả.</p></div>';
}

function chooseFilter(value) {
  filter=value;
  document.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('selected',button.dataset.filter===value);button.setAttribute('aria-pressed',String(button.dataset.filter===value));});
  if(catalog)render();
}
export function initCatalog() {
  initDetails();
  const refresh=()=>{if(!document.hidden&&!$('#checkout').open)loadCatalog(null,{silent:true});};
  setInterval(refresh,15000);
  document.addEventListener('visibilitychange',refresh);
  window.addEventListener('focus',refresh);
  $('#search').addEventListener('input', () => { if (catalog) render(); });
  $('#retry-catalog').addEventListener('click', () => loadCatalog());
  $('#show-all-products').addEventListener('click',()=>{$('#search').value='';chooseFilter('all');});
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',()=>chooseFilter(button.dataset.filter)));
  $('#game-choices').addEventListener('click',event=>{const button=event.target.closest('[data-game]');if(button){$('#search').value='';showPage('catalog');chooseFilter(button.dataset.game);}});
  $('#catalog').addEventListener('click', event => {
    const detail=event.target.closest('[data-detail]');
    if(!detail)return;
    const product=catalog.products.find(p=>p.id===detail.dataset.detail);
    const plan=product.plans.find(p=>p.hours===168)||product.plans[0];
    openDetail(product,plan,catalog,onBuy,detail);
  });
}
