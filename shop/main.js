import { $ , showPage } from './ui.js?v=detail-clean-v1';
import { initCatalog, loadCatalog } from './catalog.js?v=ios-gallery-20261114';
import { initCheckout, purchase } from './checkout.js?v=current-key-v1';
import { initOrders, loadOrders } from './orders.js?v=current-key-v1';
import { initAnnouncements } from './announcements.js?v=detail-clean-v1';
import { initCarousel } from './carousel.js?v=detail-clean-v1';
import { accessToken } from './api.js?v=current-key-v1';
function navigate(page) { showPage(page); if (page === 'orders') loadOrders(); }
initAnnouncements(); initCarousel(); initCatalog(); initCheckout(); initOrders();
// Refresh the persistent purchase identity automatically on every visit.
accessToken().catch(error=>{$('#history-status').textContent=error.message;});
window.addEventListener('ntjr-open-history',()=>navigate('orders'));
document.querySelectorAll('.main-nav button[data-page]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
document.querySelectorAll('[data-open-orders]').forEach(button => button.addEventListener('click', () => navigate('orders')));
document.querySelectorAll('[data-open-guide]').forEach(button => button.addEventListener('click', () => navigate('guide')));
document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => navigate('home')));
document.querySelectorAll('[data-shop]').forEach(button => button.addEventListener('click', () => navigate('catalog')));
document.querySelectorAll('[data-page-link]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.pageLink)));
document.querySelectorAll('[data-restore]').forEach(button => button.addEventListener('click', () => {navigate('orders');$('#import-access').click();}));
loadCatalog(purchase);
const route=location.hash.slice(1);
navigate(['catalog','orders','guide','certificates','games','downloads','contact','policy','terms'].includes(route)?route:'home');
