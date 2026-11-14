import { escapeHtml as e } from './ui.js?v=detail-clean-v1';
const zsmIOS = new Set(['ntjr-zsm-v14-155-finish', 'ntjr-zsm-v58-online']);
const asset = name => new URL('./assets/' + name, import.meta.url).href;

export function productImages(product) {
  if (!zsmIOS.has(product.id)) return [];
  return [1, 2, 3].map(number => ({
    src: asset('zsm-ios-20261114-' + number + '.jpg'),
    alt: 'ZingSpeed Mobile iOS · ảnh ' + number,
    number
  }));
}
export function productArtwork(product) {
  const images = productImages(product);
  if (images.length) return images[1].src;
  return asset(/pubg/i.test(product.id) ? 'pubg-menu-v3.jpg' : /zsm|zingspeed/i.test(product.id) ? 'zingspeed-menu-v3.jpg' : 'hero-gaming-v2.png');
}
export function galleryMarkup(images, selected) {
  const image = images[selected];
  return '<div class="detail-art has-gallery"><img class="detail-gallery-image" src="' + e(image.src) +
    '" alt="' + e(image.alt) + '" width="1280" height="590"><div class="detail-thumbnails" role="group" aria-label="Chọn ảnh ZingSpeed iOS">' +
    images.map((item, index) => '<button type="button" data-detail-image="' + index + '" aria-label="Xem ảnh ' + item.number +
      '" aria-pressed="' + (index === selected) + '"><img src="' + e(item.src) + '" alt="" width="1280" height="590"><span>Ảnh ' +
      item.number + '</span></button>').join('') + '</div></div>';
}
export function bindGallery(container, images, onSelect) {
  const main = container.querySelector('.detail-gallery-image');
  if (!main) return;
  container.querySelectorAll('[data-detail-image]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.detailImage), image = images[index];
    if (!image) return;
    main.src = image.src; main.alt = image.alt;
    container.querySelectorAll('[data-detail-image]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    onSelect(index);
  }));
}
