'use strict';
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
let src=fs.readFileSync('cms-public-v3.js','utf8');
assert(src.trimEnd().endsWith('})();'),'Unexpected CMS module shape');
src=src.replace(/\}\)\(\);\s*$/, 'window.__applyV6={apply,safeUrl};\n})();');
const registry=new Map();
function el(id) {
 const node={tagName:'DIV',textContent:'',innerHTML:'',hidden:false,src:'',href:'',dataset:{},attrs:{},
 style:{properties:{},setProperty(key,value){this.properties[key]=value}},
 classList:{add(){},remove(){},toggle(){}},
 setAttribute(key,value){this.attrs[key]=value},
 getAttribute(key){return this.attrs[key]},
 querySelector(){return null},
 replaceChildren(...nodes){this.children=nodes;this.textContent=nodes.map(n=>n.textContent).join('')},
 append(){},appendChild(){},prepend(){},
 firstChild:{textContent:''}
 };
 registry.set(id,node);return node;
}
const nodes={hero:el('hero'),brand:el('brand'),nav:el('nav'),social:el('social'),contact:el('contact')};
nodes.hero.innerHTML='<span>Old</span>';
const map=new Map([
 ['#hero-title',nodes.hero],['#home .hero-description',el('subtitle')],
 ['#contact .contact-copy h2',el('contact-title')],
 ['#contact .contact-email',nodes.contact],
 ['#about .section-heading h2',el('about')],
 ['#code-heading',el('code')],['#donate .donate-copy h2',el('donate')]
]);
const document={
 readyState:'loading',addEventListener(){},
 querySelector(selector){return map.get(selector)||null},
 querySelectorAll(selector){
  if(selector==='.brand-wordmark strong,.logo')return [nodes.brand];
  if(selector.includes('#nav-links a[href='))return [nodes.nav];
  if(selector.includes('[data-social='))return [nodes.social];
  return [];
 },
 getElementById(){return null},
 createElement(tag){const n=el('new-'+tag);n.tagName=tag.toUpperCase();return n},
 documentElement:{style:{setProperty(){}},classList:{toggle(){},add(){}}}
};
const window={addEventListener(){},dispatchEvent(){},ntSocialLinks:{}};
const ctx={document,window,location:{search:''},URL,URLSearchParams,
 console,CustomEvent:class CustomEvent{},setTimeout(){},clearTimeout(){}};
vm.runInNewContext(src,ctx,{filename:'cms-public-v3.js'});
const {apply}=window.__applyV6;
assert(typeof apply==='function');
const content={
 hero:{visible:true,title:'Demo thay đổi',subtitle:'Mô tả mới'},
 brand:{logoText:'NT TEST'},
 navigation:{about:'Giới thiệu'},
 socials:{telegram:'https://t.me/example'},
 contact:{email:'test@example.com',title:'Liên hệ mới'},
 theme:{accent:'#123abc'},
 skills:[],projects:[],gallery:[],
 code:{title:'Code editor'},donate:{title:'Ủng hộ mới'},
 footer:{text:'NT3105'}
};
assert.doesNotThrow(()=>apply(content,null),'CMS must apply full content without crashing');
assert.equal(nodes.hero.textContent,'Demo thay đổi');
assert.equal(nodes.brand.textContent,'NT TEST');
assert.equal(nodes.nav.textContent,'Giới thiệu');
assert.equal(nodes.social.href,'https://t.me/example');
assert.equal(window.ntSocialLinks.telegram,'https://t.me/example');
assert.equal(nodes.contact.href,'mailto:test%40example.com');
assert.equal(map.get('#code-heading').textContent,'Code editor');
assert.equal(map.get('#donate .donate-copy h2').textContent,'Ủng hộ mới');
console.log('CMS V6 apply smoke test passed: hero, brand, navigation, socials, contact, extra sections');
