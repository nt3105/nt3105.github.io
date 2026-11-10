import { api } from './api.js?v=detail-clean-v1';
import { $, escapeHtml as e, icon, money, showPage } from './ui.js?v=detail-clean-v1';
import { openDetail, initDetails, productArtwork } from './product-detail.js?v=android-b16-download-v1';
import { setAnnouncement } from './announcements.js?v=detail-clean-v1';
import { renderDownloads } from './downloads.js?v=android-b16-download-v1';

let catalog;
let filter = 'all';
let onBuy;
const mark = new URL('./assets/mark.svg', import.meta.url).href;
export function catalogData() { return catalog; }

export async function loadCatalog(buy) {
  if (buy) onBuy = buy;
  $('#catalog-error').hidden = true;
  try {
    catalog = await api('/catalog');
    $('#demo-banner').hidden = !catalog.demo;
    if (catalog.support_url && /^https:\/\//.test(catalog.support_url)) {
      document.querySelectorAll('.contact-link').forEach(link => {link.href=catalog.support_url;});
    }
    $('#product-count').textContent = catalog.products.length;
    $('#pubg-count').textContent = catalog.products.filter(p=>/pubg/i.test(p.id)).length;
    $('#zsm-count').textContent = catalog.products.filter(p=>/zsm|zingspeed/i.test(p.id)).length;
    $('#game-choices').innerHTML=catalog.products.map(product=>`<button data-game="${/pubg/i.test(product.id)?'pubg':'zsm'}"><img src="${productArtwork(product)}" alt="" width="1280" height="589"><span>${e(product.name)}</span>${icon('arrow')}</button>`).join('');
    render();
    renderDownloads(catalog);
    setAnnouncement(catalog);
  } catch (error) {
    $('#catalog-error').hidden = false;
    $('#catalog-error span').textContent = error.message;
    $('#catalog').innerHTML = '';
  }
}

function render() {
  const query = $('#search').value.trim().toLocaleLowerCase('vi');
  const products = catalog.products.filter(p => p.name.toLocaleLowerCase('vi').includes(query)
    && (filter === 'all' || (filter === 'pubg' ? /pubg/i.test(p.id) : /zsm|zingspeed/i.test(p.id))));
  $('#catalog').innerHTML = products.map(product => {
    const pubg=/pubg/i.test(product.id);
    const prices=product.plans.filter(plan=>plan.price>0).map(plan=>plan.price);
    const priceLabel=prices.length?'Từ '+money(Math.min(...prices)):'';
    return `<article class="product-card" data-product="${e(product.id)}"><button class="product-art ${pubg?'pubg':'zsm'}" data-detail="${e(product.id)}" aria-label="Xem ảnh và chi tiết ${e(product.name)}"><img class="product-cover" src="${productArtwork(product)}" alt="Ảnh menu ${e(product.name)}" width="1280" height="589" loading="eager"></button><div class="card-content"><div class="direct-product-title"><img class="product-avatar" src="${mark}" alt="" width="48" height="48"><div><h3><button data-detail="${e(product.id)}">${e(product.name)}</button></h3><p>${pubg?'Key PUBG iOS NTJR':'Key ZingSpeed iOS NTJR'}</p></div>${priceLabel?`<span class="starting-price">${priceLabel}</span>`:""}</div><button class="direct-buy" data-detail="${e(product.id)}">Xem chi tiết ${icon('arrow')}</button></div></article>`;
  }).join('') || '<div class="empty"><h2>Chưa tìm thấy sản phẩm</h2><p>Thử một tên khác hoặc chọn Tất cả.</p></div>';
}

function chooseFilter(value) {
  filter=value;
  document.querySelectorAll('[data-filter]').forEach(button=>{button.classList.toggle('selected',button.dataset.filter===value);button.setAttribute('aria-pressed',String(button.dataset.filter===value));});
  if(catalog)render();
}
export function initCatalog() {
  initDetails();
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
